"""Fill the database with sample leads.

Usage: python -m app.seed            (only when the database has no leads)
       python -m app.seed --reset    (deletes all leads and notes first)
"""
import sys
from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine, utcnow
from app.models import Lead, LeadStatus, Note

D = timedelta(days=1)
H = timedelta(hours=1)

# (name, company, phone, status, notes oldest first as (age, body, follow-up offset from now or None))
# Dates are relative to "now" so the Overdue / Today sections always have something in them.
SAMPLE_LEADS = [
    ("Sarah Connor", "Acme Corp", "+91 98765 43210", LeadStatus.proposal_sent, [
        (5 * D, "Intro call. Runs a 50-person firm and wants a retirement plan for her staff.", None),
        (2 * D, "Sent the pricing PDF for the group plan. She'll review it with her CFO.", 0 * D),
    ]),
    ("Bill Lumbergh", "Initech", "+91 99887 76655", LeadStatus.contacted, [
        (9 * D, "Left a voicemail with his assistant.", None),
        (4 * D, "Spoke briefly. Asked us to call back about SIP options early next week.", -2 * D),
    ]),
    ("Tony Stark", "Stark Industries", "+91 91234 56789", LeadStatus.qualified, [
        (3 * D, "Wants a second opinion on diversifying his ESOP holdings.", -1 * D),
    ]),
    ("Priya Sharma", "Sharma Textiles", "+91 90000 12345", LeadStatus.qualified, [
        (6 * D, "Discovery call: large FD portfolio, wants to move part of it into debt funds.", None),
        (1 * D, "Shared the risk-profile questionnaire. Review meeting booked.", 3 * D),
    ]),
    ("Hank Scorpio", "Globex", "+91 93333 44444", LeadStatus.new, [
        (2 * H, "Inbound lead from the website contact form. Interested in tax-saving funds.", None),
    ]),
    ("Rahul Mehta", None, None, LeadStatus.new, []),
    ("Ananya Iyer", "Iyer & Co", "+91 95555 66666", LeadStatus.lost, [
        (12 * D, "Went with her bank's in-house advisor. Revisit next year.", None),
    ]),
    ("Bruce Wayne", "Wayne Enterprises", None, LeadStatus.won, [
        (25 * D, "Contract signed! Sending the welcome kit.", None),
    ]),
]


def seed(db: Session, reset: bool = False) -> None:
    if reset:
        db.execute(delete(Note))
        db.execute(delete(Lead))
    elif db.scalar(select(func.count(Lead.id))):
        raise SystemExit("The database already has leads. Run `python -m app.seed --reset` to replace them.")

    now = utcnow()
    for name, company, phone, status, notes in SAMPLE_LEADS:
        oldest = max((age for age, _, _ in notes), default=H)
        lead = Lead(name=name, company=company, phone=phone, status=status, created_at=now - oldest - H)
        for age, body, follow_up in notes:
            note = Note(body=body, created_at=now - age, follow_up_at=now + follow_up if follow_up is not None else None)
            lead.notes.append(note)
            if note.follow_up_at:
                lead.next_follow_up_at = note.follow_up_at
        db.add(lead)
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db, reset="--reset" in sys.argv[1:])
    print(f"Added {len(SAMPLE_LEADS)} sample leads.")
