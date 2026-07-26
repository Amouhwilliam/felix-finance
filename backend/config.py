from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://felix:felix@db:5432/felix"
    sync_database_url: str = "postgresql+psycopg2://felix:felix@db:5432/felix"

    scrape_interval_minutes: int = 3
    scrape_enabled: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:80"]


settings = Settings()
