import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from main import limiter

router = APIRouter(prefix="/api/profile", tags=["profile"])
logger = logging.getLogger(__name__)

def compute_health_score(income: float, debt: float, savings: float) -> int:
    # A simple deterministic health score for demonstration
    if income == 0:
        return 0
    debt_to_income = (debt / (income * 12)) if income > 0 else 1.0
    savings_ratio = (savings / (income * 12)) if income > 0 else 0.0
    
    score = 100 - (debt_to_income * 50) + (savings_ratio * 50)
    return max(0, min(100, int(score)))

@router.get("", response_model=schemas.ProfileResponse)
@limiter.limit("100/minute")
def get_profile(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        # Rule 10: IDOR prevention - inherently scoped by current_user.id
        profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] get_profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("", response_model=schemas.ProfileResponse)
@limiter.limit("100/minute")
def update_profile(request: Request, profile_data: schemas.ProfileUpdateSchema, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
        if not profile:
            profile = models.FinancialProfile(user_id=current_user.id)
            db.add(profile)
        
        if profile_data.monthly_income is not None:
            profile.monthly_income = profile_data.monthly_income
        if profile_data.total_debt is not None:
            profile.total_debt = profile_data.total_debt
        if profile_data.savings is not None:
            profile.savings = profile_data.savings
        if profile_data.stock_holdings_value is not None:
            profile.stock_holdings_value = profile_data.stock_holdings_value
        if profile_data.average_return_pct is not None:
            profile.average_return_pct = profile_data.average_return_pct
            
        if profile_data.preferred_language is not None:
            current_user.preferred_language = profile_data.preferred_language
            
        # Recompute score deterministically
        profile.financial_health_score = compute_health_score(profile.monthly_income, profile.total_debt, profile.savings)
        
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        logger.error(f"[ERROR] update_profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
