from django.db.models import Count, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Ticket
from .serializers import TicketSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "description"]

    def get_queryset(self):
        queryset = super().get_queryset()
        ticket_status = self.request.query_params.get("status")
        if ticket_status and ticket_status != "all":
            if ticket_status not in Ticket.Status.values:
                return queryset.none()
            queryset = queryset.filter(status=ticket_status)
        return queryset

    @action(detail=False, methods=["get"])
    def summary(self, request):
        counts = Ticket.objects.aggregate(
            total=Count("id"),
            open=Count("id", filter=Q(status=Ticket.Status.OPEN)),
            in_progress=Count(
                "id", filter=Q(status=Ticket.Status.IN_PROGRESS)
            ),
            resolved=Count("id", filter=Q(status=Ticket.Status.RESOLVED)),
        )
        return Response(counts, status=status.HTTP_200_OK)
