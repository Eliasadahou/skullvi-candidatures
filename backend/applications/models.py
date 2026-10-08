import secrets

from django.core.validators import (
    MaxValueValidator,
    MinLengthValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models
from django.utils import timezone

REFERENCE_PREFIX = "SKU"
REFERENCE_DIGITS = 6  # nombre de chiffres aléatoires de l'identifiant


class EducationLevel(models.TextChoices):
    BAC = "bac", "Baccalauréat"
    BAC2 = "bac2", "Bac+2"
    BAC3 = "bac3", "Bac+3 (Licence)"
    BAC5 = "bac5", "Bac+5 et plus"
    OTHER = "other", "Autre (à préciser)"


class Availability(models.TextChoices):
    IMMEDIATE = "immediate", "Immédiate"
    ONE_MONTH = "one_month", "Sous 1 mois"
    THREE_MONTHS = "three_months", "Sous 3 mois"
    LATER = "later", "Plus tard"


class Category(models.TextChoices):
    PRIORITY = "priority", "Profil prioritaire"
    REVIEW = "review", "À examiner"
    LOW = "low", "Faible priorité"


class Status(models.TextChoices):
    PENDING = "pending", "En cours d'évaluation"
    ACCEPTED = "accepted", "Accepté"
    REJECTED = "rejected", "Rejeté"


phone_validator = RegexValidator(
    r"^\+?[0-9 ]{8,18}$",
    "Numéro de téléphone invalide (chiffres et espaces, avec + optionnel).",
)
github_validator = RegexValidator(
    r"^https://github\.com/[A-Za-z0-9-]+(/[A-Za-z0-9._-]+)?/?$",
    "Le lien GitHub doit commencer par https://github.com/",
)
http_validator = RegexValidator(r"^https?://", "Le lien doit commencer par http:// ou https://")


class Application(models.Model):
    """Une candidature. Score, catégorie et détail sont calculés par le serveur."""

    # --- Identifiant public, donné au candidat pour suivre sa candidature ---
    reference = models.CharField(max_length=20, unique=True, editable=False)

    # --- Saisie par le candidat ---
    full_name = models.CharField(max_length=120, validators=[MinLengthValidator(2)])
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, validators=[phone_validator])
    education_level = models.CharField(max_length=10, choices=EducationLevel.choices)
    education_other = models.CharField(max_length=100, blank=True, default="")
    years_experience = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(40)]
    )
    skills = models.JSONField(default=list)  # liste normalisée de chaînes
    availability = models.CharField(max_length=15, choices=Availability.choices)
    github_url = models.URLField(blank=True, validators=[github_validator])
    portfolio_url = models.URLField(blank=True, validators=[http_validator])
    projects_description = models.TextField(blank=True, max_length=1500)
    motivation = models.TextField(max_length=1500, validators=[MinLengthValidator(20)])

    # --- Calculés par le serveur (jamais saisis) ---
    score = models.PositiveSmallIntegerField(
        default=0, db_index=True, validators=[MaxValueValidator(100)]
    )
    category = models.CharField(
        max_length=10, choices=Category.choices, default=Category.LOW, db_index=True
    )
    score_details = models.JSONField(default=dict, blank=True)
    scoring_version = models.CharField(max_length=10, blank=True)

    # --- Suivi (modifié uniquement par un administrateur) ---
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    status_updated_at = models.DateTimeField(null=True, blank=True)

    # --- Métadonnées ---
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-score", "created_at", "id"]  # départage : plus ancienne d'abord

    @classmethod
    def generate_reference(cls, year=None):
        """Identifiant aléatoire : SKU + année + chiffres au hasard (ex. SKU2026-483920)."""
        year = year or timezone.now().year
        for _ in range(20):
            number = secrets.randbelow(10 ** REFERENCE_DIGITS)
            reference = f"{REFERENCE_PREFIX}{year}-{number:0{REFERENCE_DIGITS}d}"
            if not cls.objects.filter(reference=reference).exists():
                return reference
        raise RuntimeError("Impossible de générer un identifiant unique.")

    def save(self, *args, **kwargs):
        # Double sécurité : l'email est toujours stocké normalisé.
        self.email = self.email.strip().lower()
        if not self.reference:
            self.reference = self.generate_reference()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} {self.full_name} ({self.score})"