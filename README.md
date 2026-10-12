# Helpdesk

A responsive support-ticket dashboard built with React, Django REST Framework, and MySQL.

## Features

- Ticket dashboard with live total, open, in-progress, and resolved counts.
- Search tickets by title or description and filter by status.
- Create tickets and update their status from the ticket list.
- REST endpoints for listing, creating, retrieving, and updating tickets.
- MySQL persistence configured through environment variables.

## Requirements

- Python 3.10 or later
- Node.js 20 or later and npm
- MySQL 8.0 or later

## Backend setup

From the project root, create and activate a virtual environment:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Create a MySQL database and a user with access to it:

```sql
CREATE DATABASE support_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'support_user'@'localhost' IDENTIFIED BY 'change-this-password';
GRANT ALL PRIVILEGES ON support_tickets.* TO 'support_user'@'localhost';
```

Set the database environment variables in the same PowerShell session:

```powershell
$env:DB_NAME = "support_tickets"
$env:DB_USER = "support_user"
$env:DB_PASSWORD = "change-this-password"
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
```

Apply migrations and start the API:

```powershell
cd backend
python manage.py migrate
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/api/tickets/`.

## Frontend setup

In a second terminal, from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`). Set `VITE_API_URL` if the API is hosted somewhere other than `http://127.0.0.1:8000/api`.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/tickets/` | List tickets; accepts `?status=open` and `?search=login` |
| POST | `/api/tickets/` | Create a ticket |
| GET | `/api/tickets/{id}/` | Retrieve a ticket |
| PUT/PATCH | `/api/tickets/{id}/` | Update a ticket |
| GET | `/api/tickets/summary/` | Get counts for all ticket statuses |

Ticket creation example:

```json
{
  "title": "Unable to access my account",
  "description": "Password reset is not arriving in my inbox.",
  "priority": "high"
}
```

Valid priorities are `low`, `medium`, and `high`. Valid statuses are `open`, `in_progress`, and `resolved`. Invalid input returns HTTP 400; missing tickets return HTTP 404.

## Running backend tests

The production/default database is MySQL. To run the backend test suite without a local MySQL server, use an in-memory SQLite database:

```powershell
$env:DB_ENGINE = "django.db.backends.sqlite3"
$env:DB_NAME = ":memory:"
cd backend
python manage.py test tickets
```

## Configuration

The backend reads `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT`. The frontend reads `VITE_API_URL`. The frontend development origin is allowed by Django CORS configuration; add your deployed frontend origin to `CORS_ALLOWED_ORIGINS` before deploying.
