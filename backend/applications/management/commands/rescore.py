from django.core.management.base import BaseCommand

from applications.models import Application
from applications.scoring import compute_score

INPUT_FIELDS = [
    "education_level", "years_experience", "skills", "availability",
    "github_url", "portfolio_url", "projects_description", "motivation",
]


class Command(BaseCommand):
    help = "Recalcule score, catégorie et détail de toutes les candidatures avec le barème actuel."

    def handle(self, *args, **options):
        total = 0
        changed = 0
        for application in Application.objects.all().iterator():
            result = compute_score({f: getattr(application, f) for f in INPUT_FIELDS})
            if result["category"] != application.category:
                changed += 1
            application.score = result["score"]
            application.category = result["category"]
            application.score_details = result["details"]
            application.scoring_version = result["version"]
            application.save(
                update_fields=["score", "category", "score_details", "scoring_version", "updated_at"]
            )
            total += 1
        self.stdout.write(
            self.style.SUCCESS(f"{total} candidature(s) recalculée(s), {changed} changement(s) de catégorie.")
        )