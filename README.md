# LeadFlow

A small CRM for tracking potential customers ("leads"), logging every conversation with them, and setting follow-up reminders. Everything happens on one screen.

**Stack:** Next.js 16 (TypeScript, Tailwind CSS) · FastAPI · SQLAlchemy 2 · PostgreSQL (SQLite for local dev without Docker)

![Lead list with overdue and today's follow-ups pinned to the top](docs/screenshots/lead-list.png)

| Lead popup | Add lead | Phone |
| --- | --- | --- |
| ![Lead popup with conversation timeline](docs/screenshots/lead-popup.png) | ![Add lead form](docs/screenshots/add-lead.png) | ![Lead list on a phone](docs/screenshots/mobile.png) |

## Features

**Required**
- **Lead list:** each row shows the name, a coloured status tag, the last note and how long ago it was written ("2 days ago").
- **Status filter:** New, Contacted, Qualified, Proposal Sent, Won, Lost.
- **Due today stays on top:** leads with a follow-up due today sit in their own section above the rest.
- **Lead popup** (same page, not a new route):
  - every conversation, newest first
  - a form to add a note with an optional follow-up date and time
  - the list behind the popup updates as soon as you save, with no page refresh
- **Change status** from the popup. It is saved to the database.
- **Add lead:** name is required, company and phone are optional, and status starts as New.

**Bonus**
- Search by name, debounced and case-insensitive.
- Overdue follow-ups are shown in red, in their own section above "Today's follow-ups".
- "Mark done" clears a follow-up once it's handled.
- Docker Compose setup with Postgres.
- Seed script that adds 8 sample leads covering every status, plus overdue, due-today and upcoming follow-ups.
- Works at phone width; the popup is keyboard accessible (native `<dialog>`, Esc to close).

## Quick start (Docker)

Needs Docker Desktop (or Docker Engine with Compose v2).

```bash
git clone https://github.com/kushagra0526/leadflow.git
cd leadflow
docker compose up --build -d
docker compose exec backend python -m app.seed
```

- App: http://localhost:3000
- API docs (Swagger): http://localhost:8000/docs

No `.env` file is needed; every setting has a default. Stop with `docker compose down` (add `-v` to also delete the database volume).

## Run without Docker

The backend falls back to a local SQLite file, so you only need Python and Node.

**Backend** (Python 3.11+, tested on 3.13)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python -m app.seed              # optional: 8 sample leads
uvicorn app.main:app --reload   # http://localhost:8000
```

**Frontend** (Node 22.12+), in a second terminal:

```bash
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

## Configuration

All settings are listed in [`.env.example`](.env.example), and every one has a default. To change one:

- **With Docker:** copy `.env.example` to `.env` in the project root; Docker Compose reads it.
- **Without Docker:** the root `.env` is not read. Set backend variables in your shell before starting `uvicorn` (e.g. `export DATABASE_URL=...`, or `$env:DATABASE_URL="..."` in PowerShell), and put `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

| Variable | Used by | Default | Purpose |
| --- | --- | --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Docker | `leadflow` | Postgres credentials; Compose builds the backend's `DATABASE_URL` from them |
| `DATABASE_URL` | backend | `sqlite:///./leadflow.db` | SQLAlchemy URL, e.g. `postgresql+psycopg://user:pass@host:5432/db` |
| `CORS_ORIGINS` | backend | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated origins allowed to call the API |
| `NEXT_PUBLIC_API_URL` | frontend | `http://localhost:8000` | API base URL, baked into the browser bundle at build time |

## Tests

```bash
cd backend && python -m pytest      # 14 API tests (in-memory SQLite)
cd frontend && npm test             # follow-up date logic (Vitest)
```

## API

| Method | Path | What it does | Success | Errors |
| --- | --- | --- | --- | --- |
| `GET` | `/api/health` | Health check | 200 | |
| `GET` | `/api/leads?status=&q=` | Leads with their latest note, most recent activity first. Optional status filter and name search | 200 | 422 unknown status |
| `POST` | `/api/leads` | Create a lead: `{name, company?, phone?}` | 201 | 422 blank/long name, bad phone |
| `GET` | `/api/leads/{id}` | Lead with all notes, newest first | 200 | 404 not found, 422 non-numeric id |
| `PATCH` | `/api/leads/{id}` | Change `{status}` and/or clear the follow-up with `{next_follow_up_at: null}` | 200 | 404, 422 |
| `POST` | `/api/leads/{id}/notes` | Add a note: `{body, follow_up_at?}`. A follow-up also becomes the lead's next follow-up | 201 | 404, 422 empty body, date without timezone |

Errors use FastAPI's standard shape, `{"detail": ...}`, and the frontend shows that message inline.

## Project structure

```
backend/
  app/
    main.py            FastAPI app, CORS, table creation
    db.py              engine, session, UTC datetime column type
    models.py          Lead, Note, LeadStatus
    schemas.py         request/response models and validation
    routers/leads.py   all lead and note endpoints
    seed.py            sample data (python -m app.seed [--reset])
  tests/               pytest API tests
frontend/
  app/page.tsx         the one screen: list, filters, search, modals
  components/          LeadList, LeadCard, StatusFilter, LeadModal, NoteTimeline, NoteForm, AddLeadModal, Modal, ...
  lib/                 API client, types, status colours, date helpers (+ tests)
docker-compose.yml     Postgres + backend + frontend
```

## Design decisions

- **Timezones:** timestamps are stored in UTC and returned with an offset. The API rejects follow-up dates without a timezone (422), because only the browser knows the user's "today". So "due today" and "overdue" are decided on the frontend, in the user's own timezone.
- **"Overdue" means a past calendar day.** A follow-up at 10:00 today is still "today" at 15:00, which matches how people read "due today".
- **One "next follow-up" per lead.** Adding a note with a follow-up sets it. Adding a note without one leaves it alone. "Mark done" clears it.
- **Latest note in the list comes from a correlated subquery,** so the list is one SQL query, not one per lead.
- **Tables are created on startup** (`create_all`) instead of with migrations. That keeps setup to one command; I'd add Alembic before the schema had to change in production.
- **No UI or state libraries:** Tailwind plus plain React state. The popups use the native `<dialog>` element, so focus trapping, Esc and the backdrop come from the browser.

## How I used AI

I built this with Claude Code (Anthropic's coding assistant) as a pair programmer, and I want to be upfront about the split:

- **Planning:** I used it to turn the brief into a step-by-step plan. I made the product calls: following the wireframes, a separate red "Overdue" section, the "Mark done" button, skipping login, and Next.js + FastAPI + Postgres.
- **Code:** Claude wrote most of the code and tests one feature at a time. I reviewed each step before committing, which is why the history is small, single-feature commits.
- **Verification:** every step was checked with the backend test suite, the frontend type checker and linter, and by clicking through the real app in a browser, including at phone width.

## What I'd do next

- Login and per-user leads
- Pagination for large lead lists
- Alembic migrations
- Editing and deleting leads and notes
- Reminder notifications (email or browser) when a follow-up comes due
