import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

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


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> Response:
    # Same body as FastAPI's default 422, but json.dumps escapes non-ASCII: the default writes raw UTF-8
    # and crashes (500) when the echoed input holds broken Unicode.
    body = json.dumps({"detail": jsonable_encoder(exc.errors())})
    return Response(body, status_code=422, media_type="application/json")


@app.get("/api/health")
def health():
    return {"status": "ok"}
