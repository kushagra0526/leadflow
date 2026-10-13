from datetime import datetime, timedelta, timezone

from app.models import Lead, Note


def test_create_lead_defaults_to_new_and_cleans_input(client):
    res = client.post("/api/leads", json={"name": "  Sarah Connor ", "company": "Acme", "phone": ""})
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Sarah Connor"
    assert body["company"] == "Acme"
    assert body["phone"] is None
    assert body["status"] == "new"
    assert body["last_note"] is None


def test_create_lead_rejects_bad_input(client):
    assert client.post("/api/leads", json={}).status_code == 422
    assert client.post("/api/leads", json={"name": "   "}).status_code == 422
    assert client.post("/api/leads", json={"name": "A", "phone": "call me"}).status_code == 422
    assert client.post("/api/leads", json={"name": "A" * 121}).status_code == 422


def test_list_shows_latest_note_and_most_recent_activity_first(client, session_factory):
    old = client.post("/api/leads", json={"name": "Old lead"}).json()
    quiet = client.post("/api/leads", json={"name": "Quiet lead"}).json()

    now = datetime.now(timezone.utc)
    with session_factory() as db:
        db.add_all([
            Note(lead_id=old["id"], body="first call", created_at=now - timedelta(days=3)),
            Note(lead_id=old["id"], body="second call", created_at=now + timedelta(minutes=1)),
        ])
        db.commit()

    leads = client.get("/api/leads").json()
    assert [lead["name"] for lead in leads] == ["Old lead", "Quiet lead"]
    assert leads[0]["last_note"]["body"] == "second call"
    assert leads[1]["last_note"] is None
    assert leads[1]["id"] == quiet["id"]


def test_get_lead_returns_notes_newest_first(client, session_factory):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()
    now = datetime.now(timezone.utc)
    with session_factory() as db:
        db.add_all([
            Note(lead_id=lead["id"], body="older", created_at=now - timedelta(days=2)),
            Note(lead_id=lead["id"], body="newer", created_at=now),
        ])
        db.commit()

    res = client.get(f"/api/leads/{lead['id']}")
    assert res.status_code == 200
    assert [n["body"] for n in res.json()["notes"]] == ["newer", "older"]
    assert res.json()["last_note"]["body"] == "newer"


def test_missing_lead_returns_404(client):
    assert client.get("/api/leads/999").status_code == 404
    assert client.patch("/api/leads/999", json={"status": "won"}).status_code == 404
    assert client.get("/api/leads/not-a-number").status_code == 422


def test_status_change_is_saved(client):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()

    res = client.patch(f"/api/leads/{lead['id']}", json={"status": "proposal_sent"})
    assert res.status_code == 200
    assert client.get(f"/api/leads/{lead['id']}").json()["status"] == "proposal_sent"

    assert client.patch(f"/api/leads/{lead['id']}", json={"status": "maybe"}).status_code == 422
    assert client.patch(f"/api/leads/{lead['id']}", json={"status": None}).status_code == 422


def test_mark_done_clears_follow_up(client, session_factory):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()
    with session_factory() as db:
        db.get(Lead, lead["id"]).next_follow_up_at = datetime.now(timezone.utc)
        db.commit()

    # setting a follow-up goes through notes, so PATCH only accepts null
    assert client.patch(f"/api/leads/{lead['id']}", json={"next_follow_up_at": "2026-10-20T10:00:00Z"}).status_code == 422

    res = client.patch(f"/api/leads/{lead['id']}", json={"next_follow_up_at": None})
    assert res.status_code == 200
    assert res.json()["next_follow_up_at"] is None
    assert res.json()["status"] == "new"


def test_note_with_follow_up_updates_lead(client):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()

    res = client.post(f"/api/leads/{lead['id']}/notes", json={
        "body": "Sent pricing PDF", "follow_up_at": "2026-10-15T14:00:00+05:30",
    })
    assert res.status_code == 201
    assert res.json()["body"] == "Sent pricing PDF"

    detail = client.get(f"/api/leads/{lead['id']}").json()
    due = datetime(2026, 10, 15, 8, 30, tzinfo=timezone.utc)
    assert datetime.fromisoformat(detail["next_follow_up_at"]) == due
    assert datetime.fromisoformat(detail["notes"][0]["follow_up_at"]) == due
    assert client.get("/api/leads").json()[0]["last_note"]["body"] == "Sent pricing PDF"


def test_note_without_follow_up_keeps_existing_one(client):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()
    client.post(f"/api/leads/{lead['id']}/notes", json={"body": "Call Friday", "follow_up_at": "2026-10-16T10:00:00Z"})
    client.post(f"/api/leads/{lead['id']}/notes", json={"body": "Emailed brochure"})

    detail = client.get(f"/api/leads/{lead['id']}").json()
    assert detail["next_follow_up_at"] is not None
    assert [n["body"] for n in detail["notes"]] == ["Emailed brochure", "Call Friday"]


def test_add_note_rejects_bad_input(client):
    lead = client.post("/api/leads", json={"name": "Sarah"}).json()
    url = f"/api/leads/{lead['id']}/notes"
    assert client.post(url, json={"body": "   "}).status_code == 422
    assert client.post(url, json={"body": "x" * 2001}).status_code == 422
    assert client.post(url, json={"body": "ok", "follow_up_at": "2026-10-16T10:00:00"}).status_code == 422
    assert client.post(url, json={"body": "ok", "follow_up_at": "tomorrow"}).status_code == 422
    assert client.post("/api/leads/999/notes", json={"body": "ok"}).status_code == 404


def test_list_filters_by_status_and_searches_name(client):
    sarah = client.post("/api/leads", json={"name": "Sarah Connor"}).json()
    client.post("/api/leads", json={"name": "Hank Scorpio"})
    client.post("/api/leads", json={"name": "100% Real Lead"})
    client.patch(f"/api/leads/{sarah['id']}", json={"status": "won"})

    def names(**params):
        return [lead["name"] for lead in client.get("/api/leads", params=params).json()]

    assert names(status="won") == ["Sarah Connor"]
    assert names(status="new") == ["100% Real Lead", "Hank Scorpio"]
    assert names(q="  conn ") == ["Sarah Connor"]
    assert names(q="%") == ["100% Real Lead"]
    assert names(status="new", q="sarah") == []
    assert client.get("/api/leads", params={"status": "pending"}).status_code == 422
