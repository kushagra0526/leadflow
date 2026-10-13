from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.db import get_db
from app.models import Lead, Note
from app.schemas import LeadCreate, LeadOut, NoteOut

router = APIRouter(prefix="/api/leads", tags=["leads"])


def lead_out(lead: Lead, last_note: Note | None = None) -> LeadOut:
    out = LeadOut.model_validate(lead)
    if last_note:
        out.last_note = NoteOut.model_validate(last_note)
    return out


@router.get("")
def list_leads(db: Session = Depends(get_db)) -> list[LeadOut]:
    n = aliased(Note)
    latest_note_id = (
        select(n.id)
        .where(n.lead_id == Lead.id)
        .order_by(n.created_at.desc(), n.id.desc())
        .limit(1)
        .correlate(Lead)
        .scalar_subquery()
    )
    last_activity = func.coalesce(Note.created_at, Lead.created_at)
    rows = db.execute(
        select(Lead, Note)
        .outerjoin(Note, Note.id == latest_note_id)
        .order_by(last_activity.desc(), Lead.id.desc())
    ).all()
    return [lead_out(lead, note) for lead, note in rows]


@router.post("", status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)) -> LeadOut:
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    return lead_out(lead)
