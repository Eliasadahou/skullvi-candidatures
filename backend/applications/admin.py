from django.contrib import admin

from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("reference", "full_name", "email", "score", "category", "status", "created_at")
    list_filter = ("status", "category", "availability", "education_level")
    search_fields = ("reference", "full_name", "email")
    readonly_fields = (
        "reference", "score", "category", "score_details", "scoring_version",
        "status_updated_at", "created_at", "updated_at",
    )