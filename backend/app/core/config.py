from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://peblo:peblopassword@localhost:5432/peblo_tv"
    DATA_DIR: str = "data"
    # Directory served at /assets and used for artwork uploads.
    # Defaults to the challenge fixture assets folder when running locally from backend/.
    ASSETS_DIR: str = "../docs/challenge/assets"
    
    class Config:
        env_file = ".env"

settings = Settings()
