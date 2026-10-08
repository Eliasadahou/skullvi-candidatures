from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from applications.models import Application

from .factories import make_application, valid_payload

User = get_user_model()


class ReferenceTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_reference_format_is_returned_with_application(self):
        year = timezone.now().year
        response = self.client.post("/api/applications/", valid_payload(email="a@example.com"), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertRegex(response.data["reference"], rf"^SKU{year}-\d{{6}}$")
        self.assertEqual(Application.objects.get().reference, response.data["reference"])
        self.assertNotIn("score", response.data)

    def test_references_are_unique_and_not_sequential(self):
        references = [make_application(email=f"c{i}@example.com").reference for i in range(30)]
        self.assertEqual(len(set(references)), 30)
        numbers = sorted(int(r.rsplit("-", 1)[1]) for r in references)
        # 30 tirages au hasard ne donnent (pratiquement) jamais 30 numéros consécutifs
        self.assertNotEqual(numbers, list(range(numbers[0], numbers[0] + 30)))

    def test_collision_is_retried(self):
        year = timezone.now().year
        existing = make_application(email="old@example.com")
        taken = int(existing.reference.rsplit("-", 1)[1])
        free = (taken + 1) % 10**6
        # Premier tirage = numéro déjà pris, deuxième tirage = numéro libre
        with mock.patch("applications.models.secrets.randbelow", side_effect=[taken, free]):
            reference = Application.generate_reference()
        self.assertEqual(reference, f"SKU{year}-{free:06d}")

    def test_candidate_cannot_choose_reference_or_status(self):
        payload = valid_payload(reference="SKU1999-0001", status="accepted")
        response = self.client.post("/api/applications/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        application = Application.objects.get()
        self.assertNotEqual(application.reference, "SKU1999-0001")
        self.assertEqual(application.status, "pending")


class StatusLookupTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.application = make_application(email="candidate@example.com")

    def lookup(self, reference, email):
        return self.client.post(
            "/api/applications/status/", {"reference": reference, "email": email}, format="json"
        )

    def test_returns_status_without_sensitive_data(self):
        response = self.lookup(self.application.reference, "candidate@example.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["status_label"], "En cours d'évaluation")
        for forbidden in ("score", "category", "email", "score_details"):
            self.assertNotIn(forbidden, response.data)

    def test_reference_and_email_are_normalized(self):
        response = self.lookup(f" {self.application.reference.lower()} ", " Candidate@Example.com ")
        self.assertEqual(response.status_code, 200)

    def test_wrong_email_and_unknown_reference_give_the_same_answer(self):
        wrong_email = self.lookup(self.application.reference, "other@example.com")
        unknown = self.lookup("SKU1999-0001", "candidate@example.com")
        self.assertEqual(wrong_email.status_code, 404)
        self.assertEqual(unknown.status_code, 404)
        self.assertEqual(wrong_email.data, unknown.data)

    def test_missing_fields_give_404(self):
        self.assertEqual(self.lookup("", "").status_code, 404)


class AdminStatusTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user("admin", password="pass12345", is_staff=True)
        self.simple = User.objects.create_user("simple", password="pass12345")
        self.application = make_application(email="c@example.com")
        self.url = f"/api/admin/applications/{self.application.id}/"

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_patch_requires_admin(self):
        self.assertEqual(self.client.patch(self.url, {"status": "accepted"}, format="json").status_code, 401)
        self.authenticate(self.simple)
        self.assertEqual(self.client.patch(self.url, {"status": "accepted"}, format="json").status_code, 403)

    def test_admin_changes_status_and_candidate_sees_it(self):
        self.authenticate(self.admin)
        response = self.client.patch(self.url, {"status": "accepted"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "accepted")
        self.assertIsNotNone(response.data["status_updated_at"])

        self.client.credentials()
        lookup = self.client.post(
            "/api/applications/status/",
            {"reference": self.application.reference, "email": "c@example.com"},
            format="json",
        )
        self.assertEqual(lookup.data["status"], "accepted")

    def test_invalid_status_is_rejected(self):
        self.authenticate(self.admin)
        response = self.client.patch(self.url, {"status": "hired"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_patch_cannot_change_other_fields(self):
        self.authenticate(self.admin)
        score_before = self.application.score
        self.client.patch(self.url, {"status": "rejected", "score": 1, "full_name": "X"}, format="json")
        self.application.refresh_from_db()
        self.assertEqual(self.application.score, score_before)
        self.assertEqual(self.application.full_name, "Aicha Dossou")
        self.assertEqual(self.application.status, "rejected")

    def test_put_is_not_allowed(self):
        self.authenticate(self.admin)
        self.assertEqual(self.client.put(self.url, {"status": "accepted"}, format="json").status_code, 405)

    def test_list_filter_by_status_and_search_by_reference(self):
        other = make_application(email="d@example.com")
        Application.objects.filter(pk=other.pk).update(status="accepted")
        self.authenticate(self.admin)

        accepted = self.client.get("/api/admin/applications/?status=accepted")
        self.assertEqual(accepted.data["count"], 1)
        self.assertEqual(accepted.data["results"][0]["id"], other.id)

        found = self.client.get(f"/api/admin/applications/?search={self.application.reference}")
        self.assertEqual(found.data["count"], 1)
        self.assertEqual(found.data["results"][0]["reference"], self.application.reference)