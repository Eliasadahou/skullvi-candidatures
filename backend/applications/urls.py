from django.urls import path

from . import views
from .users import AdminUserDetailView, AdminUserListCreateView

urlpatterns = [
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("applications/", views.ApplicationCreateView.as_view()),
    path("applications/status/", views.ApplicationStatusLookupView.as_view()),
    path("admin/applications/", views.ApplicationListView.as_view()),
    path("admin/applications/<int:pk>/", views.ApplicationDetailView.as_view()),
    path("admin/stats/", views.StatsView.as_view()),
    path("admin/users/", AdminUserListCreateView.as_view()),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view()),
]