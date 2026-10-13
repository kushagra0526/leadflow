import os
from datetime import datetime, timezone

from sqlalchemy import DateTime, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.types import TypeDecorator

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./leadflow.db")

# SQLite connections are used from FastAPI's thread pool, so allow cross-thread use
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class UTCDateTime(TypeDecorator):
    """Stores datetimes in UTC and always returns them timezone-aware (SQLite drops the offset)."""

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return value.astimezone(timezone.utc) if value is not None else None

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    type_annotation_map = {datetime: UTCDateTime}


def get_db():
    with SessionLocal() as db:
        yield db
