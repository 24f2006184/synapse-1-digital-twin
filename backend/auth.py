from __future__ import annotations
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.environ.get("JWT_SECRET", "synapse-twin-secret-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

# Hardcoded seed users: {username: {password, role, crew_id}}
SEED_USERS = {
    "ground": {"password": "ground", "role": "GROUND", "crew_id": None},
}
for i in range(1, 13):
    crew_id = f"crew{i:02d}"
    SEED_USERS[crew_id] = {"password": "crew", "role": "CREW", "crew_id": crew_id}


def verify_password(plain: str, hashed: str) -> bool:
    # For demo: direct compare (no bcrypt for speed)
    return plain == hashed


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = SEED_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return {"username": username, **user}


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return decode_token(credentials.credentials)


async def require_ground(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "GROUND":
        raise HTTPException(status_code=403, detail="Ground access required")
    return user


async def require_crew(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "CREW":
        raise HTTPException(status_code=403, detail="Crew access required")
    return user


def get_token_from_query(token: str) -> dict:
    """For WebSocket auth via query param."""
    return decode_token(token)
