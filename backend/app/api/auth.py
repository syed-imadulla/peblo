import jwt
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth")
security = HTTPBearer()

SECRET_KEY = os.environ.get("JWT_SECRET", "peblo_secret_do_not_use_in_prod_123")
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    role: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # Dummy auth logic
    if req.username == "admin" and req.password == "admin":
        role = "admin"
    elif req.username == "editor" and req.password == "editor":
        role = "editor"
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    token = create_access_token({"sub": req.username, "role": role})
    return {"access_token": token, "role": role}

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user
