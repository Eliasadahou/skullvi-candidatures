"""Calcul du score : fonction PURE (aucun accès base de données, aucun réseau)."""
import re

from . import scoring_config as cfg

_HTTP_RE = re.compile(r"^https?://\S+$")


def normalize_skills(skills):
    """Minuscules, espaces nettoyés, alias convertis, doublons supprimés (ordre conservé)."""
    seen = set()
    result = []
    for raw in skills or []:
        skill = " ".join(str(raw).strip().lower().split())
        skill = cfg.SKILL_ALIASES.get(skill, skill)
        if skill and skill not in seen:
            seen.add(skill)
            result.append(skill)
    return result


def _tiered(value, tiers):
    """Points du premier palier atteint (paliers triés du plus grand au plus petit)."""
    for minimum, points in sorted(tiers, reverse=True):
        if value >= minimum:
            return points
    return 0


def categorize(score, key_skills_count):
    if score >= cfg.THRESHOLD_PRIORITY:
        # Règle de plafonnement : sans assez de compétences clés, pas "prioritaire"
        if key_skills_count >= cfg.MIN_KEY_SKILLS_FOR_PRIORITY:
            return "priority"
        return "review"
    if score >= cfg.THRESHOLD_REVIEW:
        return "review"
    return "low"


def compute_score(data):
    """Retourne {"score", "category", "details", "version"} à partir des données d'une candidature."""
    # C1 : compétences clés
    skills = normalize_skills(data.get("skills"))
    matched = [s for s in skills if s in cfg.KEY_SKILLS]
    skills_points = min(len(matched) * cfg.POINTS_PER_SKILL, cfg.MAX_SKILLS_POINTS)

    # C2 : expérience
    years = max(0, int(data.get("years_experience") or 0))
    experience_points = _tiered(years, cfg.EXPERIENCE_POINTS)

    # C3 : études
    education_points = cfg.EDUCATION_POINTS.get(data.get("education_level"), 0)

    # C4 : preuves de travail
    github = (data.get("github_url") or "").strip()
    portfolio = (data.get("portfolio_url") or "").strip()
    projects = (data.get("projects_description") or "").strip()
    links = {
        "github": cfg.LINKS_POINTS["github"] if re.match(cfg.GITHUB_URL_PATTERN, github) else 0,
        "portfolio": cfg.LINKS_POINTS["portfolio"] if _HTTP_RE.match(portfolio) else 0,
        "projects": cfg.LINKS_POINTS["projects"] if len(projects) >= cfg.PROJECTS_MIN_CHARS else 0,
    }

    # C5 : disponibilité
    availability_points = cfg.AVAILABILITY_POINTS.get(data.get("availability"), 0)

    # C6 : motivation
    motivation_points = _tiered(len((data.get("motivation") or "").strip()), cfg.MOTIVATION_POINTS)

    details = {
        "skills": {"points": skills_points, "max": cfg.MAX_SKILLS_POINTS, "matched": matched},
        "experience": {"points": experience_points, "max": cfg.MAX_EXPERIENCE_POINTS},
        "education": {"points": education_points, "max": cfg.MAX_EDUCATION_POINTS},
        "links": {"points": sum(links.values()), "max": cfg.MAX_LINKS_POINTS, "items": links},
        "availability": {"points": availability_points, "max": cfg.MAX_AVAILABILITY_POINTS},
        "motivation": {"points": motivation_points, "max": cfg.MAX_MOTIVATION_POINTS},
    }
    score = sum(block["points"] for block in details.values())

    return {
        "score": score,
        "category": categorize(score, len(matched)),
        "details": details,
        "version": cfg.SCORING_VERSION,
    }