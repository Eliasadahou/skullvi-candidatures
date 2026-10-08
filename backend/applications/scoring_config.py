"""Barème du scoring : tout ce qui est modifiable est ici."""

SCORING_VERSION = "v1"

# --- C1 : compétences clés ---
KEY_SKILLS = [
    "python", "django", "javascript", "react", "html",
    "css", "sql", "git", "api rest", "docker",
]
SKILL_ALIASES = {
    "js": "javascript",
    "reactjs": "react",
    "react.js": "react",
    "html5": "html",
    "css3": "css",
    "rest": "api rest",
}
POINTS_PER_SKILL = 5
MAX_SKILLS_POINTS = 30

# --- C2 : expérience (années minimum, points) ---
EXPERIENCE_POINTS = [(5, 20), (3, 16), (2, 12), (1, 8), (0, 0)]

# --- C3 : études ---
EDUCATION_POINTS = {"bac": 4, "bac2": 8, "bac3": 11, "bac5": 15, "other": 4}

# --- C4 : preuves de travail ---
LINKS_POINTS = {"github": 5, "portfolio": 4, "projects": 6}
PROJECTS_MIN_CHARS = 80
GITHUB_URL_PATTERN = r"^https://github\.com/[A-Za-z0-9-]+(/[A-Za-z0-9._-]+)?/?$"

# --- C5 : disponibilité ---
AVAILABILITY_POINTS = {"immediate": 10, "one_month": 7, "three_months": 3, "later": 0}

# --- C6 : motivation (longueur minimum, points) ---
MOTIVATION_POINTS = [(200, 10), (50, 5), (0, 0)]

# --- Seuils de catégories ---
THRESHOLD_PRIORITY = 70
THRESHOLD_REVIEW = 40
MIN_KEY_SKILLS_FOR_PRIORITY = 3

# --- Maximums (déduits du barème, pour ne jamais les désynchroniser) ---
MAX_EXPERIENCE_POINTS = max(p for _, p in EXPERIENCE_POINTS)
MAX_EDUCATION_POINTS = max(EDUCATION_POINTS.values())
MAX_AVAILABILITY_POINTS = max(AVAILABILITY_POINTS.values())
MAX_MOTIVATION_POINTS = max(p for _, p in MOTIVATION_POINTS)
MAX_LINKS_POINTS = sum(LINKS_POINTS.values())