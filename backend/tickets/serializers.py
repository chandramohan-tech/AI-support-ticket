from rest_framework import serializers

from .models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    ticket_id = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticket_id",
            "title",
            "description",
            "priority",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "ticket_id", "created_at", "updated_at"]

    def get_ticket_id(self, obj):
        return f"TKT-{obj.pk:04d}"

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Description cannot be blank.")
        return value
