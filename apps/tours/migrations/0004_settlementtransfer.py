from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('tours', '0003_populate_join_tokens_and_memberships')]

    operations = [migrations.CreateModel(
        name='SettlementTransfer',
        fields=[
            ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
            ('paid', models.BooleanField(default=False)),
            ('paid_at', models.DateTimeField(blank=True, null=True)),
            ('created_at', models.DateTimeField(auto_now_add=True)),
            ('updated_at', models.DateTimeField(auto_now=True)),
            ('from_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlement_payments_sent', to=settings.AUTH_USER_MODEL)),
            ('marked_paid_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='marked_settlement_payments', to=settings.AUTH_USER_MODEL)),
            ('to_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlement_payments_received', to=settings.AUTH_USER_MODEL)),
            ('tour', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlement_transfers', to='tours.tour')),
        ],
        options={'unique_together': {('tour', 'from_user', 'to_user', 'amount')}},
    )]
