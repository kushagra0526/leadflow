from datetime import datetime, timedelta, timezone

from app.models import Note


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
