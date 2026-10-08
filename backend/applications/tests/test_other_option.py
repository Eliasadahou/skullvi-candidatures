from django.core.cache import cache
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from applications.models import Application
from applications.scoring import compute_score

from .factories import valid_payload


class OtherEducationScoringTests(SimpleTestCase):
    def test_other_education_gives_configured_points(self):
        result = compute_score({"education_level": "other", "motivation": "x" * 20})
        self.assertEqual(result["details"]["education"]["points"], 4)


class OtherOptionsApiTests(APITestCase):
    def setUp(self):
        cache.clear()

    def post(self, **overrides):
        return self.client.post("/api/applications/", valid_payload(**overrides), format="json")

    def test_other_education_requires_details(self):
        response = self.post(education_level="other")
        self.assertEqual(response.status_code, 400)
        self.assertIn("education_other", response.data)

    def test_other_education_is_saved(self):
        response = self.post(education_level="other", education_other="  Brevet pro en réseaux  ")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Application.objects.get().education_other, "Brevet pro en réseaux")

    def test_education_other_is_cleared_when_not_other(self):
        response = self.post(education_level="bac3", education_other="Texte inutile")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Application.objects.get().education_other, "")

    def test_extra_skills_are_kept_but_not_scored(self):
        response = self.post(skills=["Python", "Linux", "Figma"])
        self.assertEqual(response.status_code, 201)
        application = Application.objects.get()
        self.assertEqual(application.skills, ["python", "linux", "figma"])
        self.assertEqual(application.score_details["skills"]["points"], 5)
        self.assertEqual(application.score_details["skills"]["matched"], ["python"])