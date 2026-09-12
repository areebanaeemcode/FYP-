from django.urls import path

from . import views


app_name = 'expenses'

urlpatterns = [
    path('api/', views.ExpenseListAPI.as_view(), name='expense-list'),
    path('api/create/', views.ExpenseCreateAPI.as_view(), name='expense-create'),
    path('api/<int:pk>/', views.ExpenseDetailAPI.as_view(), name='expense-detail'),
    path('api/<int:pk>/delete/', views.ExpenseDeleteAPI.as_view(), name='expense-delete'),
    path('api/<int:pk>/receipt/', views.ReceiptUploadAPI.as_view(), name='expense-receipt-upload'),
    path('api/<int:pk>/receipt/verify/', views.ReceiptVerifyAPI.as_view(), name='expense-receipt-verify'),
    path('api/limits/', views.ExpenseLimitAPIView.as_view(), name='expense-limit'),
]
