from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.db import get_db
from app.models import Lead, Note
from app.schemas import LeadCreate, LeadDetail, LeadOut, LeadUpdate, NoteOut

router = APIRouter(prefix="/api/leads", tags=["leads"])


def get_lead_or_404(lead_id: int, db: Session = Depends(get_db)) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


def lead_out(lead: Lead, last_note: Note | None = None) -> LeadOut:
    out = LeadOut.model_validate(lead)
    if last_note:
        out.last_note = NoteOut.model_validate(last_note)
    return out


def lead_detail(lead: Lead) -> LeadDetail:
    detail = LeadDetail.model_validate(lead)
    detail.last_note = detail.notes[0] if detail.notes else None
    return detail


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


@router.get("/{lead_id}")
def get_lead(lead: Lead = Depends(get_lead_or_404)) -> LeadDetail:
    return lead_detail(lead)


@router.patch("/{lead_id}")
def update_lead(
    payload: LeadUpdate, lead: Lead = Depends(get_lead_or_404), db: Session = Depends(get_db)
) -> LeadDetail:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    db.commit()
    return lead_detail(lead)
