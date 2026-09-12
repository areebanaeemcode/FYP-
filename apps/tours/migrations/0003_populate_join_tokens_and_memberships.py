import secrets

from django.db import migrations, models


def populate_join_tokens(apps, schema_editor):
    Tour = apps.get_model("tours", "Tour")
    used = set()
    for tour in Tour.objects.all():
        if tour.join_token:
            used.add(tour.join_token)
            continue
        for _ in range(10):
            token = secrets.token_urlsafe(24)
            if token not in used and not Tour.objects.filter(join_token=token).exists():
                tour.join_token = token
                used.add(token)
                break
        else:
            tour.join_token = f"migrated-{tour.pk}-{secrets.token_urlsafe(16)}"
            used.add(tour.join_token)
        tour.save(update_fields=["join_token"])


def create_creator_memberships(apps, schema_editor):
    Tour = apps.get_model("tours", "Tour")
    TourMember = apps.get_model("tours", "TourMember")
    for tour in Tour.objects.select_related("created_by").all():
        if not tour.created_by_id:
            continue
        TourMember.objects.get_or_create(
            tour_id=tour.pk,
            user_id=tour.created_by_id,
            defaults={"role": "creator"},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tours", "0002_alter_tour_options_tour_join_token_tourmember"),
    ]

    operations = [
        migrations.RunPython(populate_join_tokens, noop_reverse),
        migrations.RunPython(create_creator_memberships, noop_reverse),
        migrations.AlterField(
            model_name="tour",
            name="join_token",
            field=models.CharField(
                db_index=True,
                default=None,
                max_length=64,
                unique=True,
            ),
            preserve_default=False,
        ),
    ]
