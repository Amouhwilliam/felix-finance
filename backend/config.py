from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://felix:felix@db:5432/felix"
    sync_database_url: str = "postgresql+psycopg2://felix:felix@db:5432/felix"

    scrape_interval_minutes: int = 3
    scrape_enabled: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:80"]
    log_level: str = "INFO"   # DEBUG | INFO | WARNING | ERROR

    # AI Insights — set AI_PROVIDER to "bedrock" or "openai"
    ai_provider: str = "bedrock"
    ai_enabled: bool = False          # set to true once credentials are configured

    # AWS Bedrock settings
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "us.deepseek.r1-v1:5"   # override with your deployed model ARN

    # OpenAI-compatible settings (alternative provider)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: Optional[str] = None            # leave None for api.openai.com

    # AI insight cache duration in days
    ai_insight_cache_days: int = 7


settings = Settings()
