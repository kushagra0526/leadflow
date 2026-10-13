import pytest

from app.seed import SAMPLE_LEADS, seed


def test_seed_adds_sample_leads_and_never_overwrites_silently(client, session_factory):
    with session_factory() as db:
        seed(db)

    leads = client.get("/api/leads").json()
    assert len(leads) == len(SAMPLE_LEADS) >= 5
    assert {lead["status"] for lead in leads} == {"new", "contacted", "qualified", "proposal_sent", "won", "lost"}
    assert sum(lead["next_follow_up_at"] is not None for lead in leads) == 4

    with session_factory() as db, pytest.raises(SystemExit):
        seed(db)

    with session_factory() as db:
        seed(db, reset=True)
    assert len(client.get("/api/leads").json()) == len(SAMPLE_LEADS)
