from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate


class UserRegistrationSerializer(serializers.ModelSerializer):

    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User

        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone_number',
            'password',
            'confirm_password',
        ]

        extra_kwargs = {
            "password": {
                "write_only": True
            }
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
            if not user.is_active:
                raise serializers.ValidationError("Your account is inactive.")
            attrs["user"] = user
            return attrs

        raise serializers.ValidationError("Email and Password are required.")


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone_number",
            "profile_image",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if rep.get("profile_image"):
            request = self.context.get("request")
            if request is not None and hasattr(instance.profile_image, "url"):
                try:
                    rep["profile_image"] = request.build_absolute_uri(instance.profile_image.url)
                except Exception:
                    pass
        return rep


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "profile_image",
        ]

    def validate_phone_number(self, value):
        qs = User.objects.filter(phone_number=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Phone number already registered.")
        return value

