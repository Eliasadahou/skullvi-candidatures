from applications.models import Application
from applications.scoring import compute_score, normalize_skills


def valid_payload(**overrides):
    data = {
        "full_name": "Aicha Dossou",
        "email": "aicha@example.com",
        "phone": "",
        "education_level": "bac3",
        "years_experience": 3,
        "skills": ["Python", "Django", "React"],
        "availability": "immediate",
        "github_url": "https://github.com/aicha",
        "portfolio_url": "",
        "projects_description": "",
        "motivation": "Je souhaite rejoindre le programme pour progresser.",
    }
    data.update(overrides)
    return data


def make_application(**overrides):
    """Crée une candidature en base avec son score calculé (sans passer par l'API)."""
    data = valid_payload(**overrides)
    data["skills"] = normalize_skills(data["skills"])
    result = compute_score(data)
    return Application.objects.create(
        **data,
        score=result["score"],
        category=result["category"],
        score_details=result["details"],
        scoring_version=result["version"],
    )