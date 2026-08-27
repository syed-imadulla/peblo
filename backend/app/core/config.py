from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://peblo:peblopassword@localhost:5432/peblo_tv"
    DATA_DIR: str = "data"
    
    class Config:
        env_file = ".env"

settings = Settings()
