from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

from app.models import LeadStatus


class LeadCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    company: Annotated[str, StringConstraints(max_length=120)] | None = None
    phone: Annotated[str, StringConstraints(pattern=r"^\+?[0-9 ()-]{7,20}$")] | None = None

    @field_validator("company", "phone", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        return (v.strip() or None) if isinstance(v, str) else v


class LeadUpdate(BaseModel):
    status: LeadStatus | None = None
    # follow-ups are set by adding a note; PATCH can only clear one ("Mark done")
    next_follow_up_at: None = None

    @field_validator("status")
    @classmethod
    def status_not_null(cls, v):
        if v is None:
            raise ValueError("status cannot be null")
        return v


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    body: str
    follow_up_at: datetime | None
    created_at: datetime


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company: str | None
    phone: str | None
    status: LeadStatus
    next_follow_up_at: datetime | None
    created_at: datetime
    last_note: NoteOut | None = None


class LeadDetail(LeadOut):
    notes: list[NoteOut]
