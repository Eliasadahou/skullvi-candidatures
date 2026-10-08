from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, serializers
from rest_framework.response import Response

from .permissions import IsSuperUser

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Lecture : jamais de mot de passe."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_superuser", "date_joined"]


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_password(self, value):
        validate_password(value)  # règles Django : longueur, mot de passe courant, etc.
        return value

    def create(self, validated_data):
        # Toujours is_staff=True, jamais super admin : le compte est haché par create_user
        return User.objects.create_user(is_staff=True, **validated_data)


class AdminUserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperUser]
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by("username")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminUserCreateSerializer
        return AdminUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=201)


class AdminUserDetailView(generics.DestroyAPIView):
    permission_classes = [IsSuperUser]
    queryset = User.objects.filter(is_staff=True)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response({"detail": "Vous ne pouvez pas supprimer votre propre compte."}, status=400)
        if user.is_superuser:
            return Response({"detail": "Un super administrateur ne peut pas être supprimé ici."}, status=400)
        user.delete()  # ses tokens sont supprimés en cascade
        return Response(status=204)