from rest_framework.test import APITestCase

from .models import Ticket


class TicketApiTests(APITestCase):
    def test_create_ticket_validates_and_returns_created_ticket(self):
        response = self.client.post(
            "/api/tickets/",
            {
                "title": "  Cannot sign in  ",
                "description": "  The reset link has expired.  ",
                "priority": "high",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["ticket_id"], "TKT-0001")
        self.assertEqual(response.data["title"], "Cannot sign in")
        self.assertEqual(response.data["status"], Ticket.Status.OPEN)
        self.assertEqual(Ticket.objects.count(), 1)

    def test_create_ticket_rejects_invalid_priority_and_blank_fields(self):
        response = self.client.post(
            "/api/tickets/",
            {"title": " ", "description": "", "priority": "urgent"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.data)
        self.assertIn("description", response.data)
        self.assertIn("priority", response.data)
        self.assertEqual(Ticket.objects.count(), 0)

    def test_list_search_and_status_filter(self):
        Ticket.objects.create(
            title="Cannot sign in",
            description="Login page issue",
            status=Ticket.Status.OPEN,
        )
        Ticket.objects.create(
            title="Invoice question",
            description="Need a receipt",
            status=Ticket.Status.RESOLVED,
        )

        response = self.client.get("/api/tickets/?search=login&status=open")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Cannot sign in")

    def test_detail_and_status_update(self):
        ticket = Ticket.objects.create(
            title="Export failed",
            description="CSV export returns an error",
        )

        response = self.client.patch(
            f"/api/tickets/{ticket.pk}/",
            {"status": Ticket.Status.IN_PROGRESS},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], Ticket.Status.IN_PROGRESS)
        self.assertEqual(
            self.client.get(f"/api/tickets/{ticket.pk}/").status_code, 200
        )

    def test_summary_counts_all_statuses(self):
        Ticket.objects.create(
            title="First", description="One", status=Ticket.Status.OPEN
        )
        Ticket.objects.create(
            title="Second", description="Two", status=Ticket.Status.IN_PROGRESS
        )
        Ticket.objects.create(
            title="Third", description="Three", status=Ticket.Status.RESOLVED
        )

        response = self.client.get("/api/tickets/summary/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"total": 3, "open": 1, "in_progress": 1, "resolved": 1},
        )
