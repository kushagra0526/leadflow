import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  registers the tables before create_all
from app.db import Base, engine
from app.routers import leads


@asynccontextmanager
async def lifespan(app: FastAPI):
    # shortcut: create_all instead of migrations, add Alembic once the schema has to evolve in prod
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="LeadFlow API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(leads.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
