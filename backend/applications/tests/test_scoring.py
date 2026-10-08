from django.test import SimpleTestCase

from applications import scoring_config as cfg
from applications.scoring import categorize, compute_score, normalize_skills


def data(**overrides):
    base = {
        "education_level": "bac",
        "years_experience": 0,
        "skills": [],
        "availability": "later",
        "github_url": "",
        "portfolio_url": "",
        "projects_description": "",
        "motivation": "x" * 20,
    }
    base.update(overrides)
    return base


def points(result, criterion):
    return result["details"][criterion]["points"]


class ScoringTests(SimpleTestCase):
    def test_total_max_is_100(self):
        total = (
            cfg.MAX_SKILLS_POINTS + cfg.MAX_EXPERIENCE_POINTS + cfg.MAX_EDUCATION_POINTS
            + cfg.MAX_LINKS_POINTS + cfg.MAX_AVAILABILITY_POINTS + cfg.MAX_MOTIVATION_POINTS
        )
        self.assertEqual(total, 100)

    def test_ts01_minimal_candidate(self):
        result = compute_score(data())
        self.assertEqual(result["score"], 4)
        self.assertEqual(result["category"], "low")

    def test_ts02_maximal_candidate(self):
        result = compute_score(data(
            education_level="bac5",
            years_experience=5,
            skills=["python", "django", "javascript", "react", "html", "css"],
            availability="immediate",
            github_url="https://github.com/aicha",
            portfolio_url="https://aicha.dev",
            projects_description="p" * 100,
            motivation="m" * 200,
        ))
        self.assertEqual(result["score"], 100)
        self.assertEqual(result["category"], "priority")

    def test_ts03_skills_are_capped(self):
        result = compute_score(data(skills=list(cfg.KEY_SKILLS)))
        self.assertEqual(points(result, "skills"), 30)

    def test_ts04_skills_normalization(self):
        self.assertEqual(normalize_skills(["ReactJS", " react ", "React"]), ["react"])
        result = compute_score(data(skills=["ReactJS", " react ", "React"]))
        self.assertEqual(points(result, "skills"), 5)
        self.assertEqual(normalize_skills(["JS", "Linux"]), ["javascript", "linux"])

    def test_ts05_motivation_boundaries(self):
        for length, expected in [(49, 0), (50, 5), (199, 5), (200, 10)]:
            with self.subTest(length=length):
                result = compute_score(data(motivation="x" * length))
                self.assertEqual(points(result, "motivation"), expected)

    def test_ts06_projects_boundaries(self):
        for length, expected in [(79, 0), (80, 6)]:
            with self.subTest(length=length):
                result = compute_score(data(projects_description="x" * length))
                self.assertEqual(result["details"]["links"]["items"]["projects"], expected)

    def test_ts07_experience_tiers(self):
        for years, expected in [(0, 0), (1, 8), (2, 12), (3, 16), (4, 16), (5, 20), (12, 20)]:
            with self.subTest(years=years):
                result = compute_score(data(years_experience=years))
                self.assertEqual(points(result, "experience"), expected)

    def test_ts08_to_ts10_category_thresholds(self):
        cases = [
            (69, 3, "review"),    # TS-08
            (70, 3, "priority"),  # TS-08
            (39, 10, "low"),      # TS-09
            (40, 0, "review"),    # TS-09
            (70, 2, "review"),    # TS-10 : plafonnement
            (100, 0, "review"),
        ]
        for score, key_skills, expected in cases:
            with self.subTest(score=score, key_skills=key_skills):
                self.assertEqual(categorize(score, key_skills), expected)

    def test_ts11_invalid_links_give_zero(self):
        result = compute_score(data(github_url="https://gitlab.com/x", portfolio_url="ftp://x"))
        self.assertEqual(result["details"]["links"]["items"]["github"], 0)
        self.assertEqual(result["details"]["links"]["items"]["portfolio"], 0)
        valid = compute_score(data(github_url="https://github.com/aicha"))
        self.assertEqual(valid["details"]["links"]["items"]["github"], 5)

    def test_ts12_determinism(self):
        payload = data(skills=["python", "git"], years_experience=2)
        self.assertEqual(compute_score(payload), compute_score(payload))

    def test_ts13_example_candidates(self):
        projects = "p" * 100
        candidates = [
            ("Aicha", 92, "priority", data(
                education_level="bac3", years_experience=3,
                skills=["Python", "Django", "React", "JavaScript", "SQL", "Git", "HTML"],
                availability="immediate", github_url="https://github.com/aicha",
                portfolio_url="https://aicha.dev", projects_description=projects,
                motivation="m" * 250)),
            ("Koffi", 83, "priority", data(
                education_level="bac5", years_experience=5,
                skills=["Python", "Django", "SQL", "Docker", "Git", "Linux"],
                availability="one_month", github_url="https://github.com/koffi",
                projects_description=projects, motivation="m" * 120)),
            ("Yanick", 70, "review", data(
                education_level="bac5", years_experience=6,
                skills=["Java", "Spring", "Oracle"],
                availability="immediate", github_url="https://github.com/yanick",
                portfolio_url="https://yanick.dev", projects_description=projects,
                motivation="m" * 230)),
            ("Sarah", 66, "review", data(
                education_level="bac2", years_experience=1,
                skills=["HTML", "CSS", "JavaScript"],
                availability="immediate", github_url="https://github.com/sarah",
                portfolio_url="https://sarah.dev", projects_description=projects,
                motivation="m" * 210)),
            ("Marc", 7, "low", data(
                education_level="bac", years_experience=0,
                skills=["Excel", "Word"], availability="three_months",
                motivation="m" * 30)),
        ]
        for name, score, category, payload in candidates:
            with self.subTest(name=name):
                result = compute_score(payload)
                self.assertEqual(result["score"], score)
                self.assertEqual(result["category"], category)