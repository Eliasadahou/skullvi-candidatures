from django.core.management.base import BaseCommand

from applications.models import Application
from applications.scoring import compute_score, normalize_skills

BASE_TEXT = "Je souhaite rejoindre le programme pour progresser et apprendre. "


def text(length):
    return (BASE_TEXT * 10)[:length].strip()


DEMO = [
    dict(full_name="Aicha Dossou", email="aicha.dossou@example.com", education_level="bac3",
         years_experience=3, skills=["Python", "Django", "React", "JavaScript", "SQL", "Git", "HTML"],
         availability="immediate", github_url="https://github.com/aicha-dossou",
         portfolio_url="https://aicha-dossou.dev", projects_description=text(100), motivation=text(250)),
    dict(full_name="Koffi Mensah", email="koffi.mensah@example.com", education_level="bac5",
         years_experience=5, skills=["Python", "Django", "SQL", "Docker", "Git", "Linux"],
         availability="one_month", github_url="https://github.com/koffi-mensah",
         portfolio_url="", projects_description=text(100), motivation=text(120)),
    dict(full_name="Yanick Hounkpatin", email="yanick.hounkpatin@example.com", education_level="bac5",
         years_experience=6, skills=["Java", "Spring", "Oracle"],
         availability="immediate", github_url="https://github.com/yanick-h",
         portfolio_url="https://yanick-h.dev", projects_description=text(100), motivation=text(230)),
    dict(full_name="Sarah Adjovi", email="sarah.adjovi@example.com", education_level="bac2",
         years_experience=1, skills=["HTML", "CSS", "JavaScript"],
         availability="immediate", github_url="https://github.com/sarah-adjovi",
         portfolio_url="https://sarah-adjovi.dev", projects_description=text(100), motivation=text(210)),
    dict(full_name="Marc Tossou", email="marc.tossou@example.com", education_level="bac",
         years_experience=0, skills=["Excel", "Word"],
         availability="three_months", github_url="", portfolio_url="",
         projects_description="", motivation=text(30)),
]


class Command(BaseCommand):
    help = "Crée 5 candidatures de démonstration (sans doublon si relancée)."

    def handle(self, *args, **options):
        created = 0
        for item in DEMO:
            if Application.objects.filter(email=item["email"]).exists():
                continue
            data = dict(item)
            data["skills"] = normalize_skills(data["skills"])
            result = compute_score(data)
            Application.objects.create(
                **data,
                score=result["score"],
                category=result["category"],
                score_details=result["details"],
                scoring_version=result["version"],
            )
            created += 1
        self.stdout.write(self.style.SUCCESS(f"{created} candidature(s) créée(s)."))