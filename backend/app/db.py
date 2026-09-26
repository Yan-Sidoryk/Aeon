from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings


def _url(url: str) -> str:
    # Supabase hands out postgres:// URLs; SQLAlchemy needs the psycopg (v3) driver named.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


IS_SQLITE = settings.database_url.startswith("sqlite")

engine = create_engine(
    _url(settings.database_url),
    connect_args={"check_same_thread": False} if IS_SQLITE else {"prepare_threshold": None},  # pooler-safe
    pool_pre_ping=not IS_SQLITE,
)


def init_db() -> None:
    from app import models  # noqa: F401  register tables

    SQLModel.metadata.create_all(engine)
    if not IS_SQLITE:
        # Supabase exposes the public schema over its REST API with the browser's anon key. The backend
        # connects as the table owner (which bypasses RLS), so RLS with no policies closes that door.
        with engine.begin() as conn:
            for table in inspect(conn).get_table_names(schema="public"):
                if table in SQLModel.metadata.tables:
                    conn.execute(text(f'alter table public."{table}" enable row level security'))


def get_session():
    with Session(engine) as session:
        yield session
