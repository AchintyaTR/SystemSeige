import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from main import limiter

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, user: schemas.RegisterSchema, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            return {"message": "Registration processed successfully"}
        
        hashed_password = auth.get_password_hash(user.password)
        new_user = models.User(email=user.email, password_hash=hashed_password)
        db.add(new_user)
        db.flush() # Flush to get new_user.id without committing
        
        # Create empty profile
        profile = models.FinancialProfile(user_id=new_user.id)
        db.add(profile)
        
        db.commit() # Single commit for atomicity
        
        return {"message": "Registration processed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] register: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, response: Response, user: schemas.LoginSchema, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if not db_user or not auth.verify_password(user.password, db_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials" # Generic error
            )
        
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": db_user.id}, expires_delta=access_token_expires
        )
        
        # Set httpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="none",
            secure=True
        )
        
        return {"message": "Login successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="none",
        secure=True
    )
    return {"message": "Logout successful"}

