from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.exceptions import APIException

from .models import Application, EducationLevel, Status
from .scoring import compute_score, normalize_skills


class Conflict(APIException):
    status_code = 409
    default_detail = "Une candidature avec cet email a déjà été reçue."
    default_code = "conflict"


class Busy(APIException):
    status_code = 503
    default_detail = "Service momentanément occupé, réessayez dans un instant."
    default_code = "busy"


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Données saisies par le candidat. Score, statut et référence ne sont PAS des champs."""

    skills = serializers.ListField(
        child=serializers.CharField(min_length=2, max_length=30),
        min_length=1,
        max_length=15,
    )

    class Meta:
        model = Application
        fields = [
            "full_name", "email", "phone", "education_level", "education_other",
            "years_experience", "skills", "availability", "github_url", "portfolio_url",
            "projects_description", "motivation",
        ]
        # On gère le doublon nous-mêmes pour renvoyer 409 au lieu de 400
        extra_kwargs = {"email": {"validators": []}}

    def validate_email(self, value):
        email = value.strip().lower()
        if Application.objects.filter(email=email).exists():
            raise Conflict()
        return email

    def validate_skills(self, value):
        return normalize_skills(value)

    def validate(self, attrs):
        # Niveau "Autre" : la précision est obligatoire. Sinon, on ignore tout texte envoyé.
        if attrs.get("education_level") == EducationLevel.OTHER:
            other = (attrs.get("education_other") or "").strip()
            if len(other) < 2:
                raise serializers.ValidationError(
                    {"education_other": "Précisez votre niveau d'études."}
                )
            attrs["education_other"] = other
        else:
            attrs["education_other"] = ""
        return attrs

    def create(self, validated_data):
        result = compute_score(validated_data)
        for _ in range(5):
            try:
                with transaction.atomic():
                    return Application.objects.create(
                        **validated_data,
                        score=result["score"],
                        category=result["category"],
                        score_details=result["details"],
                        scoring_version=result["version"],
                    )
            except IntegrityError:
                # Soit l'email vient d'être pris (envois simultanés), soit deux candidatures
                # ont obtenu le même numéro de référence : dans ce cas on réessaie.
                if Application.objects.filter(email=validated_data["email"]).exists():
                    raise Conflict()
        raise Busy()


class ApplicationListSerializer(serializers.ModelSerializer):
    rank = serializers.SerializerMethodField()
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Application
        fields = [
            "id", "reference", "rank", "full_name", "email", "years_experience",
            "availability", "score", "category", "category_label",
            "status", "status_label", "created_at",
        ]

    def get_rank(self, obj):
        return self.context["ranks"].get(obj.pk)


class ApplicationDetailSerializer(ApplicationListSerializer):
    class Meta:
        model = Application
        fields = [
            "id", "reference", "rank", "full_name", "email", "phone", "education_level",
            "education_other", "years_experience", "skills", "availability", "github_url",
            "portfolio_url", "projects_description", "motivation", "score", "category",
            "category_label", "score_details", "scoring_version",
            "status", "status_label", "status_updated_at", "created_at",
        ]


class ApplicationStatusSerializer(serializers.Serializer):
    """Seul champ qu'un administrateur peut modifier sur une candidature."""

    status = serializers.ChoiceField(choices=Status.choices)