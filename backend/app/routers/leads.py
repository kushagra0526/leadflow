from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.db import get_db
from app.models import Lead, LeadStatus, Note
from app.schemas import LeadCreate, LeadDetail, LeadOut, LeadUpdate, NoteCreate, NoteOut

router = APIRouter(prefix="/api/leads", tags=["leads"])


# le: ids are 32-bit INTEGER columns; a bigger number would crash the lookup (500) instead of a 422
def get_lead_or_404(lead_id: Annotated[int, Path(ge=1, le=2_147_483_647)], db: Session = Depends(get_db)) -> Lead:
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
def list_leads(
    status: LeadStatus | None = None,
    q: Annotated[str | None, Query(max_length=100, description="Case-insensitive name search")] = None,
    db: Session = Depends(get_db),
) -> list[LeadOut]:
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
    query = (
        select(Lead, Note)
        .outerjoin(Note, Note.id == latest_note_id)
        .order_by(last_activity.desc(), Lead.id.desc())
    )
    if status:
        query = query.where(Lead.status == status)
    if q and q.strip():
        query = query.where(Lead.name.icontains(q.strip(), autoescape=True))
    return [lead_out(lead, note) for lead, note in db.execute(query).all()]


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


@router.post("/{lead_id}/notes", status_code=201)
def add_note(payload: NoteCreate, lead: Lead = Depends(get_lead_or_404), db: Session = Depends(get_db)) -> NoteOut:
    note = Note(lead_id=lead.id, **payload.model_dump())
    db.add(note)
    if note.follow_up_at:
        lead.next_follow_up_at = note.follow_up_at
    db.commit()
    return NoteOut.model_validate(note)
