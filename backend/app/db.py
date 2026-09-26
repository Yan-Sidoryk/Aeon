from sqlalchemy import inspect, text
from sqlalchemy.schema import Column
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
    add_missing_columns()
    if not IS_SQLITE:
        # Supabase exposes the public schema over its REST API with the browser's anon key. The backend
        # connects as the table owner (which bypasses RLS), so RLS with no policies closes that door.
        with engine.begin() as conn:
            for table in inspect(conn).get_table_names(schema="public"):
                if table in SQLModel.metadata.tables:
                    conn.execute(text(f'alter table public."{table}" enable row level security'))


def _default_sql(column: Column) -> str:
    value = column.default.arg if column.default is not None and not callable(column.default.arg) else None
    if isinstance(value, bool):
        return f" DEFAULT {'1' if value else '0'}" if IS_SQLITE else f" DEFAULT {'true' if value else 'false'}"
    if isinstance(value, (int, float)):
        return f" DEFAULT {value}"
    if isinstance(value, str):
        return " DEFAULT '" + value.replace("'", "''") + "'"
    return ""


def add_missing_columns() -> None:
    """create_all() never alters existing tables: add columns that models gained since a table was created.
    Enough for additive changes on a hackathon schema; renames and drops need a real migration."""
    with engine.begin() as conn:
        insp = inspect(conn)
        existing_tables = set(insp.get_table_names())
        for table in SQLModel.metadata.sorted_tables:
            if table.name not in existing_tables:
                continue
            have = {c["name"] for c in insp.get_columns(table.name)}
            for column in table.columns:
                if column.name in have:
                    continue
                ddl = f"{column.type.compile(dialect=engine.dialect)}{_default_sql(column)}"
                conn.execute(text(f'alter table "{table.name}" add column "{column.name}" {ddl}'))


def get_session():
    with Session(engine) as session:
        yield session
