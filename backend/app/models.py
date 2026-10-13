import enum
from datetime import datetime

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, utcnow


class LeadStatus(enum.StrEnum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    won = "won"
    lost = "lost"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    company: Mapped[str | None]
    phone: Mapped[str | None]
    status: Mapped[LeadStatus] = mapped_column(default=LeadStatus.new, index=True)
    next_follow_up_at: Mapped[datetime | None] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    notes: Mapped[list["Note"]] = relationship(order_by="Note.created_at.desc()")


class Note(Base):
    __tablename__ = "notes"
    __table_args__ = (Index("ix_notes_lead_created", "lead_id", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"))
    body: Mapped[str] = mapped_column(Text)
    follow_up_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
