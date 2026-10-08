from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from applications.models import Application

from .factories import make_application, valid_payload

STRONG_SKILLS = ["python", "django", "javascript", "react", "sql", "git"]


class PublicApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # remet à zéro le throttling entre les tests

    def test_ta01_create_application(self):
        response = self.client.post("/api/applications/", valid_payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("score", response.data)
        self.assertEqual(Application.objects.count(), 1)
        self.assertGreater(Application.objects.get().score, 0)

    def test_ta02_invalid_email(self):
        response = self.client.post("/api/applications/", valid_payload(email="abc@"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_ta03_and_tm01_duplicate_email(self):
        self.client.post("/api/applications/", valid_payload(email="Aicha@X.com"), format="json")
        response = self.client.post("/api/applications/", valid_payload(email=" aicha@x.com "), format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Application.objects.count(), 1)

    def test_tm04_score_in_payload_is_ignored(self):
        payload = valid_payload(score=100, category="priority")
        response = self.client.post("/api/applications/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        application = Application.objects.get()
        self.assertNotEqual(application.score, 100)
        self.assertEqual(application.category, "review")

    def test_tm06_out_of_range_values(self):
        too_many = [f"skill{i}" for i in range(16)]
        for overrides in [{"years_experience": -1}, {"years_experience": 41}, {"skills": too_many}]:
            with self.subTest(overrides=overrides):
                response = self.client.post("/api/applications/", valid_payload(**overrides), format="json")
                self.assertEqual(response.status_code, 400)

    def test_skills_are_normalized_when_saved(self):
        payload = valid_payload(skills=["ReactJS", " react ", "JS"])
        self.client.post("/api/applications/", payload, format="json")
        self.assertEqual(Application.objects.get().skills, ["react", "javascript"])


class AdminApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.admin = User.objects.create_user("admin", password="pass12345", is_staff=True)
        self.simple = User.objects.create_user("simple", password="pass12345")
        self.strong = make_application(
            email="strong@example.com", education_level="bac5", years_experience=5,
            skills=STRONG_SKILLS,
        )
        self.weak = make_application(
            email="weak@example.com", education_level="bac", years_experience=0,
            skills=[], availability="later", github_url="", motivation="x" * 20,
        )

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_login_success_and_failures(self):
        ok = self.client.post("/api/auth/login/", {"username": "admin", "password": "pass12345"}, format="json")
        self.assertEqual(ok.status_code, 200)
        self.assertIn("token", ok.data)

        bad = self.client.post("/api/auth/login/", {"username": "admin", "password": "wrong"}, format="json")  # TA-09
        self.assertEqual(bad.status_code, 400)
        self.assertNotIn("token", bad.data)

        not_staff = self.client.post("/api/auth/login/", {"username": "simple", "password": "pass12345"}, format="json")
        self.assertEqual(not_staff.status_code, 400)

    def test_ta04_list_requires_token(self):
        self.assertEqual(self.client.get("/api/admin/applications/").status_code, 401)

    def test_ta05_list_forbidden_for_non_staff(self):
        self.authenticate(self.simple)
        self.assertEqual(self.client.get("/api/admin/applications/").status_code, 403)

    def test_ta06_list_default_order_and_rank(self):
        self.authenticate(self.admin)
        response = self.client.get("/api/admin/applications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        first = response.data["results"][0]
        self.assertEqual(first["id"], self.strong.id)
        self.assertEqual(first["rank"], 1)
        self.assertEqual(response.data["results"][1]["rank"], 2)

    def test_ta07_filters(self):
        self.authenticate(self.admin)
        priority = self.client.get("/api/admin/applications/?category=priority")
        self.assertEqual(priority.data["count"], 1)
        self.assertEqual(self.client.get("/api/admin/applications/?min_score=90").data["count"], 0)
        self.assertEqual(self.client.get("/api/admin/applications/?min_score=80").data["count"], 1)
        # le rang reste global même quand la liste est filtrée
        low = self.client.get("/api/admin/applications/?category=low")
        self.assertEqual(low.data["results"][0]["rank"], 2)

    def test_search(self):
        self.authenticate(self.admin)
        response = self.client.get("/api/admin/applications/?search=weak@")
        self.assertEqual(response.data["count"], 1)

    def test_detail_and_ta08_not_found(self):
        self.authenticate(self.admin)
        detail = self.client.get(f"/api/admin/applications/{self.strong.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertIn("score_details", detail.data)
        self.assertEqual(detail.data["rank"], 1)
        self.assertEqual(self.client.get("/api/admin/applications/9999/").status_code, 404)

    def test_ta10_stats(self):
        self.authenticate(self.admin)
        response = self.client.get("/api/admin/stats/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total"], 2)
        self.assertEqual(response.data["by_category"], {"priority": 1, "review": 0, "low": 1})

    def test_logout_deletes_token(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertFalse(Token.objects.filter(user=self.admin).exists())