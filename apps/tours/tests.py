from datetime import date
from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.expenses.models import Expense, ExpenseSplit
from apps.tours.models import Tour, TourMember, SettlementTransfer
from apps.tours.settlement_engine import compute_settlement


class SettlementTests(TestCase):
    def setUp(self):
        self.users = [User.objects.create_user(email=f'user{i}@example.com', password='password', first_name=name, last_name='Test', phone_number=f'0300000000{i}') for i, name in enumerate(('Ali', 'Ahmed', 'Sara'), 1)]
        self.tour = Tour.objects.create(created_by=self.users[0], title='Test tour', destination='Lahore', budget='1000.00', start_date=date.today(), end_date=date.today())
        for user in self.users:
            TourMember.objects.get_or_create(tour=self.tour, user=user, defaults={'role': 'creator' if user == self.users[0] else 'member'})

    def expense(self, payer, amount, members=None):
        expense = Expense.objects.create(tour=self.tour, title='Expense', amount=amount, category='food', payment_method='cash', paid_by=payer, created_by=payer)
        members = self.users if members is None else members
        cents, share = Decimal(amount).quantize(Decimal('0.01')), (Decimal(amount) / len(members)).quantize(Decimal('0.01'))
        for index, user in enumerate(members):
            ExpenseSplit.objects.create(expense=expense, user=user, share_amount=share if index < len(members) - 1 else cents - share * (len(members) - 1))

    def balances(self):
        return {item['user']['full_name'].split()[0]: Decimal(str(item['net_balance'])) for item in compute_settlement(self.tour)['per_member']}

    def test_equal_expense_balances(self):
        self.expense(self.users[0], '900.00')
        self.assertEqual(self.balances(), {'Ali': Decimal('600.0'), 'Ahmed': Decimal('-300.0'), 'Sara': Decimal('-300.0')})

    def test_multiple_payers_and_one_person_split(self):
        self.expense(self.users[0], '600.00')
        self.expense(self.users[1], '300.00')
        self.assertEqual(self.balances(), {'Ali': Decimal('300.0'), 'Ahmed': Decimal('0.0'), 'Sara': Decimal('-300.0')})
        self.expense(self.users[0], '100.00', [self.users[0]])
        self.assertEqual(self.balances()['Ali'], Decimal('300.0'))

    def test_everyone_paying_an_equal_share_is_settled(self):
        for user in self.users:
            self.expense(user, '100.00')
        self.assertEqual(set(self.balances().values()), {Decimal('0.0')})

    def test_rounding_and_other_tours_do_not_affect_balances(self):
        self.expense(self.users[0], '100.00')
        other = Tour.objects.create(created_by=self.users[0], title='Other', destination='Karachi', budget='1.00', start_date=date.today(), end_date=date.today())
        TourMember.objects.create(tour=other, user=self.users[0], role='creator')
        Expense.objects.create(tour=other, title='Other expense', amount='999.00', category='food', payment_method='cash', paid_by=self.users[0], created_by=self.users[0])
        data = compute_settlement(self.tour)
        self.assertEqual(Decimal(str(data['summary']['net_zero_difference'])), Decimal('0.0'))
        self.assertEqual(Decimal(str(data['total_expenses'])), Decimal('100.0'))

    def test_debtor_can_persist_current_transfer_only(self):
        self.expense(self.users[0], '900.00')
        self.client.force_login(self.users[1])
        response = self.client.post(f'/client/tours/api/{self.tour.id}/settlement/mark-paid/', {'from_user_id': self.users[1].id, 'to_user_id': self.users[0].id, 'amount': '300.00'}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(SettlementTransfer.objects.get(tour=self.tour, from_user=self.users[1]).paid)
        self.client.force_login(self.users[2])
        denied = self.client.post(f'/client/tours/api/{self.tour.id}/settlement/mark-paid/', {'from_user_id': self.users[1].id, 'to_user_id': self.users[0].id, 'amount': '300.00'}, content_type='application/json')
        self.assertEqual(denied.status_code, 403)
