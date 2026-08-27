from fastapi import Request
from fastapi.responses import JSONResponse

class ValidationErrorException(Exception):
    def __init__(self, message: str, details: list = None):
        self.message = message
        self.details = details or []

async def validation_exception_handler(request: Request, exc: ValidationErrorException):
    return JSONResponse(
        status_code=400,
        content={"error": "Validation Error", "detail": exc.message, "issues": exc.details},
    )
