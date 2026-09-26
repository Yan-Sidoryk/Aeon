from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    firecrawl_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    perplexity_api_key: str = ""
    serpapi_key: str = ""

    demo_mode: bool = False
    database_url: str = "sqlite:///./pharmapulse.db"

    model_fast: str = "claude-haiku-4-5"
    model_smart: str = "claude-opus-5"
    model_engine_claude: str = "claude-opus-5"
    engine_effort: str = "low"  # scan answers: speed matters more than depth (40 prompts per scan)
    accuracy_effort: str = "medium"
    draft_effort: str = "medium"  # "Fix this" is interactive; high effort took ~3 min per draft

    crawl_page_limit: int = 30
    prompts_per_product: int = 40
    scan_concurrency: int = 16
    cors_origins: list[str] = ["*"]


settings = Settings()
