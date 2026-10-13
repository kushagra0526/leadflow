from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator, AwareDatetime, BaseModel, ConfigDict, StringConstraints, field_validator

from app.models import LeadStatus


def storable(text: str) -> str:
    # Postgres rejects NUL and every database rejects broken Unicode; let them through and the save crashes (500)
    if "\x00" in text:
        raise ValueError("text cannot contain NUL characters")
    try:
        text.encode("utf-8")
    except UnicodeEncodeError:
        raise ValueError("text contains invalid characters") from None
    return text


class LeadCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120), AfterValidator(storable)]
    company: Annotated[str, StringConstraints(max_length=120), AfterValidator(storable)] | None = None
    # 7-15 digits, optionally separated by spaces, dashes or brackets
    phone: Annotated[str, StringConstraints(max_length=30, pattern=r"^\+?(?:[ ()-]*[0-9]){7,15}[ ()-]*$")] | None = None

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


class NoteCreate(BaseModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000), AfterValidator(storable)]
    # must carry a timezone offset, otherwise "today" would depend on the server's clock
    follow_up_at: AwareDatetime | None = None

    @field_validator("follow_up_at")
    @classmethod
    def to_utc(cls, v):
        try:
            return v.astimezone(timezone.utc) if v else v
        except OverflowError:  # e.g. 9999-12-31T23:00-05:00 is past year 9999 in UTC
            raise ValueError("date is out of range") from None


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
