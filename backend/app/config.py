from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = "sqlite:///./aeon.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    dataforseo_login: str = ""
    dataforseo_password: str = ""
    apify_token: str = ""

    # Langfuse tracing + evals; off when the keys are missing
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "https://cloud.langfuse.com"

    # Supabase: DATABASE_URL points at its Postgres; auth is on when SUPABASE_URL is set
    supabase_url: str = ""
    supabase_anon_key: str = ""
    database_url: str = DEFAULT_DATABASE_URL

    demo_mode: bool = False

    model_fast: str = "claude-haiku-4-5"
    model_smart: str = "claude-opus-5"
    model_engine_claude: str = "claude-opus-5"
    engine_effort: str = "low"  # scan answers: speed matters more than depth
    accuracy_effort: str = "medium"
    draft_effort: str = "medium"  # "Fix this" is interactive
    agent_effort: str = "medium"

    prompts_per_product: int = 10
    claude_samples: int = 3  # each question asked 3x; a check is a majority vote
    fix_max_rounds: int = 3
    scan_concurrency: int = 8
    job_concurrency: int = 4
    weekly_scan_check_seconds: int = 300
    cors_origins: list[str] = ["*"]

    @field_validator("database_url", mode="before")
    @classmethod
    def _default_db(cls, v: str | None) -> str:
        return v or DEFAULT_DATABASE_URL  # an empty DATABASE_URL= line means "use the default"

    @property
    def auth_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def dataforseo_enabled(self) -> bool:
        return bool(self.dataforseo_login and self.dataforseo_password)

    @property
    def langfuse_enabled(self) -> bool:
        return bool(self.langfuse_public_key and self.langfuse_secret_key)


settings = Settings()
