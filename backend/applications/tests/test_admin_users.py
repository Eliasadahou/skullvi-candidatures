from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()
STRONG = "Tr0ub4dor-x92!"


class AdminUsersApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.boss = User.objects.create_superuser("boss", "boss@example.com", "pass12345")
        self.staff = User.objects.create_user("staff", password="pass12345", is_staff=True)

    def authenticate(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 401)

    def test_simple_admin_cannot_manage_admins(self):
        self.authenticate(self.staff)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)
        payload = {"username": "x1", "password": STRONG}
        self.assertEqual(self.client.post("/api/admin/users/", payload, format="json").status_code, 403)

    def test_superuser_lists_admins_without_password(self):
        self.authenticate(self.boss)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([u["username"] for u in response.data], ["boss", "staff"])
        self.assertNotIn("password", response.data[0])

    def test_superuser_creates_admin(self):
        self.authenticate(self.boss)
        payload = {"username": "newadmin", "email": "new@example.com", "password": STRONG}
        response = self.client.post("/api/admin/users/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("password", response.data)

        created = User.objects.get(username="newadmin")
        self.assertTrue(created.is_staff)
        self.assertFalse(created.is_superuser)
        self.assertTrue(created.check_password(STRONG))  # stocké haché

        # Le nouvel admin se connecte, voit les candidatures, mais ne gère pas les admins
        self.client.credentials()
        login = self.client.post("/api/auth/login/", {"username": "newadmin", "password": STRONG}, format="json")
        self.assertEqual(login.status_code, 200)
        self.assertFalse(login.data["is_superuser"])
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login.data['token']}")
        self.assertEqual(self.client.get("/api/admin/applications/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)

    def test_weak_password_is_rejected(self):
        self.authenticate(self.boss)
        response = self.client.post("/api/admin/users/", {"username": "weak", "password": "123"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="weak").exists())

    def test_duplicate_username_is_rejected(self):
        self.authenticate(self.boss)
        response = self.client.post("/api/admin/users/", {"username": "staff", "password": STRONG}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)

    def test_delete_admin(self):
        self.authenticate(self.boss)
        response = self.client.delete(f"/api/admin/users/{self.staff.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(pk=self.staff.pk).exists())

    def test_cannot_delete_self_or_superuser(self):
        self.authenticate(self.boss)
        self.assertEqual(self.client.delete(f"/api/admin/users/{self.boss.id}/").status_code, 400)
        other = User.objects.create_superuser("boss2", "b2@example.com", "pass12345")
        self.assertEqual(self.client.delete(f"/api/admin/users/{other.id}/").status_code, 400)

    def test_login_returns_superuser_flag(self):
        response = self.client.post("/api/auth/login/", {"username": "boss", "password": "pass12345"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_superuser"])
        self.assertEqual(response.data["username"], "boss")