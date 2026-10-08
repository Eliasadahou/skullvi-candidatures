from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from applications import scoring_config as cfg
from applications.models import Application

from .factories import make_application

STRONG_SKILLS = ["python", "django", "javascript", "react", "sql", "git"]


class BusinessRulesTests(TestCase):
    def test_tm02_application_without_github(self):
        application = make_application(github_url="")
        self.assertEqual(application.score_details["links"]["items"]["github"], 0)

    def test_tm03_tie_is_broken_by_seniority(self):
        first = make_application(email="first@example.com")
        second = make_application(email="second@example.com")
        self.assertEqual(first.score, second.score)
        self.assertEqual([a.id for a in Application.objects.all()], [first.id, second.id])

    def test_tm05_rescore_updates_category_and_version(self):
        application = make_application(education_level="bac5", years_experience=5, skills=STRONG_SKILLS)
        self.assertEqual(application.category, "priority")
        with mock.patch.object(cfg, "THRESHOLD_PRIORITY", 95), mock.patch.object(cfg, "SCORING_VERSION", "v2"):
            call_command("rescore", stdout=StringIO())
        application.refresh_from_db()
        self.assertEqual(application.category, "review")
        self.assertEqual(application.scoring_version, "v2")

    def test_seed_demo_creates_expected_scores(self):
        call_command("seed_demo", stdout=StringIO())
        scores = list(Application.objects.values_list("score", flat=True))
        self.assertEqual(scores, [92, 83, 70, 66, 7])
        call_command("seed_demo", stdout=StringIO())  # relancée : aucun doublon
        self.assertEqual(Application.objects.count(), 5)