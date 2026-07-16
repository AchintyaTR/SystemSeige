import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

import secrets
import logging

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    logging.warning("JWT_SECRET environment variable is missing! Generating a temporary random secret key for this session. (All users will be logged out if the server restarts).")
    SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# We use custom cookie extraction, so oauth2_scheme is just for swagger docs if needed
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Extract token from httpOnly cookie
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization header for testing/swagger if cookie missing
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token_data = schemas.TokenData(user_id=user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user
