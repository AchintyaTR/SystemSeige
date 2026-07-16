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

def compute_health_score(income: float, debt: float, savings: float, expenses: float, emi: float, fixed_expenses: float = 0.0) -> int:
    if income <= 0:
        return 0
    total_outflow = fixed_expenses + expenses + emi
    outflow_ratio = total_outflow / income
    
    # 1. Savings Score (0 to 30 points)
    # Ideally savings >= 3x monthly income (30 points)
    savings_months = savings / income
    savings_score = min(30.0, (savings_months / 3.0) * 30.0)
    
    # 2. Debt Score (0 to 30 points)
    # Ideally debt == 0 (30 points). If debt >= 12x monthly income, 0 points.
    debt_months = debt / income
    debt_score = max(0.0, 30.0 - (debt_months / 12.0) * 30.0)
    
    # 3. Outflow Score (0 to 40 points)
    # Ideally outflow <= 50% of income (40 points). If outflow >= 100%, 0 points.
    if outflow_ratio <= 0.5:
        outflow_score = 40.0
    else:
        outflow_score = max(0.0, 40.0 - ((outflow_ratio - 0.5) / 0.5) * 40.0)
        
    score = savings_score + debt_score + outflow_score
    return max(0, min(100, int(score)))

@router.get("", response_model=schemas.ProfileResponse)
@limiter.limit("100/minute")
def get_profile(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        # Rule 10: IDOR prevention - inherently scoped by current_user.id
        profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        # Dynamically compute health score
        import datetime
        now = datetime.datetime.utcnow()

        expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
        current_month_expenses = sum(e.amount for e in expenses if e.date.month == now.month and e.date.year == now.year and e.category != "EMI")
        
        fixed_expenses = (profile.expense_rent or 0.0) + (profile.expense_food or 0.0) + (profile.expense_transport or 0.0) + (profile.expense_medical or 0.0) + (profile.expense_other or 0.0)
        
        dynamic_score = compute_health_score(
            profile.monthly_income, 
            profile.total_debt, 
            profile.savings, 
            current_month_expenses, 
            profile.emi_amount,
            fixed_expenses
        )
        
        # We don't save to db here on GET to avoid overhead, just return dynamically
        profile.financial_health_score = dynamic_score
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
        if profile_data.emi_amount is not None:
            profile.emi_amount = profile_data.emi_amount
            
        # Expenses
        if profile_data.expense_rent is not None:
            profile.expense_rent = profile_data.expense_rent
        if profile_data.expense_food is not None:
            profile.expense_food = profile_data.expense_food
        if profile_data.expense_transport is not None:
            profile.expense_transport = profile_data.expense_transport
        if profile_data.expense_medical is not None:
            profile.expense_medical = profile_data.expense_medical
        if profile_data.expense_other is not None:
            profile.expense_other = profile_data.expense_other
            
        if profile_data.preferred_language is not None:
            current_user.preferred_language = profile_data.preferred_language
            
        # Recompute score deterministically
        import datetime
        now = datetime.datetime.utcnow()
        expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
        current_month_expenses = sum(e.amount for e in expenses if e.date.month == now.month and e.date.year == now.year and e.category != "EMI")
        
        fixed_expenses = (profile.expense_rent or 0.0) + (profile.expense_food or 0.0) + (profile.expense_transport or 0.0) + (profile.expense_medical or 0.0) + (profile.expense_other or 0.0)
        
        profile.financial_health_score = compute_health_score(
            profile.monthly_income, 
            profile.total_debt, 
            profile.savings, 
            current_month_expenses, 
            profile.emi_amount,
            fixed_expenses
        )
        
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        logger.error(f"[ERROR] update_profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
