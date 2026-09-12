from django.db import models
from django.contrib.auth.models import(
    AbstractBaseUser,
    PermissionsMixin, 
)
from .managers import UserManager
# Create your models here.

class User(AbstractBaseUser, PermissionsMixin):

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    phone_number = models.CharField(max_length=15, unique=True)

    profile_image = models.ImageField(upload_to='profile/', null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number']

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        return full or self.email

    def get_short_name(self):
        return self.first_name or self.email
