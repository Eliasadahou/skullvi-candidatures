from django.contrib.auth import authenticate
from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import generics
from rest_framework.authtoken.models import Token
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Application, Availability, Category, Status
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    ApplicationStatusSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # un vieux token dans l'en-tête ne doit pas bloquer la connexion
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        password = str(request.data.get("password", ""))
        user = authenticate(request=request, username=username, password=password)
        if user is None or not user.is_staff:
            # Message volontairement générique
            return Response({"detail": "Identifiants incorrects."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "username": user.username,
            "is_superuser": user.is_superuser,
        })


class LogoutView(APIView):
    # Permission par défaut : IsAdminUser
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=204)


class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationCreateSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "application_submit"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        # On renvoie la référence (à conserver par le candidat), jamais le score
        return Response(
            {
                "id": application.id,
                "reference": application.reference,
                "message": "Candidature reçue",
            },
            status=201,
        )


class ApplicationStatusLookupView(APIView):
    """Suivi public : identifiant + email. Ne renvoie jamais le score ni les données du candidat."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "status_lookup"

    def post(self, request):
        reference = str(request.data.get("reference", "")).strip().upper()
        email = str(request.data.get("email", "")).strip().lower()

        application = None
        if reference and email:
            application = Application.objects.filter(reference=reference, email=email).first()

        if application is None:
            # Même réponse que l'identifiant soit inconnu ou l'email incorrect
            return Response(
                {"detail": "Aucune candidature ne correspond à ces informations."}, status=404
            )

        return Response({
            "reference": application.reference,
            "status": application.status,
            "status_label": application.get_status_display(),
            "submitted_at": application.created_at,
            "status_updated_at": application.status_updated_at,
        })


class RankedContextMixin:
    """Fournit le rang GLOBAL de chaque candidature (indépendant des filtres)."""

    def get_serializer_context(self):
        context = super().get_serializer_context()
        ids = Application.objects.order_by("-score", "created_at", "id").values_list("pk", flat=True)
        context["ranks"] = {pk: position for position, pk in enumerate(ids, start=1)}
        return context


class ApplicationListView(RankedContextMixin, generics.ListAPIView):
    serializer_class = ApplicationListSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["full_name", "email", "reference"]
    ordering_fields = ["score", "created_at", "years_experience"]
    ordering = ["-score", "created_at", "id"]

    def get_queryset(self):
        queryset = Application.objects.all()
        params = self.request.query_params

        category = params.get("category")
        if category in Category.values:
            queryset = queryset.filter(category=category)

        status = params.get("status")
        if status in Status.values:
            queryset = queryset.filter(status=status)

        availability = params.get("availability")
        if availability in Availability.values:
            queryset = queryset.filter(availability=availability)

        min_score = params.get("min_score", "")
        if min_score.isdigit():
            queryset = queryset.filter(score__gte=int(min_score))

        return queryset

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        # Départage stable (RM-08) quel que soit le tri choisi, y compris pour la pagination
        return queryset.order_by(*queryset.query.order_by, "created_at", "id")


class ApplicationDetailView(RankedContextMixin, generics.RetrieveUpdateAPIView):
    """GET : détail. PATCH : changer UNIQUEMENT le statut (en cours / accepté / rejeté)."""

    queryset = Application.objects.all()
    serializer_class = ApplicationDetailSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ApplicationStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        if new_status != instance.status:
            instance.status = new_status
            instance.status_updated_at = timezone.now()
            instance.save(update_fields=["status", "status_updated_at", "updated_at"])

        return Response(
            ApplicationDetailSerializer(instance, context=self.get_serializer_context()).data
        )


class StatsView(APIView):
    def get(self, request):
        aggregate = Application.objects.aggregate(total=Count("id"), average=Avg("score"))
        counts = dict(
            Application.objects.order_by().values_list("category").annotate(n=Count("id"))
        )
        return Response({
            "total": aggregate["total"],
            "average_score": round(aggregate["average"] or 0, 1),
            "by_category": {
                "priority": counts.get("priority", 0),
                "review": counts.get("review", 0),
                "low": counts.get("low", 0),
            },
        })