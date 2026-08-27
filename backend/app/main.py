from fastapi import FastAPI, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.exceptions import ValidationErrorException, validation_exception_handler

app = FastAPI(title="Peblo TV Mini Backend")

app.add_exception_handler(ValidationErrorException, validation_exception_handler)

@app.get("/health")
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "db": "connected"
        }
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"error": "Database disconnected"}
