import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from main import limiter

router = APIRouter(prefix="/api/expenses", tags=["expenses"])
logger = logging.getLogger(__name__)

@router.post("", response_model=schemas.ExpenseResponse)
@limiter.limit("50/minute")
def create_expense(request: Request, expense_data: schemas.ExpenseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        expense = models.Expense(
            user_id=current_user.id,
            amount=expense_data.amount,
            category=expense_data.category,
            description=expense_data.description
        )
        if expense_data.date:
            expense.date = expense_data.date
            
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense
    except Exception as e:
        logger.error(f"[ERROR] create_expense: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("", response_model=list[schemas.ExpenseResponse])
@limiter.limit("100/minute")
def list_expenses(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).order_by(models.Expense.date.desc()).all()
        return expenses
    except Exception as e:
        logger.error(f"[ERROR] list_expenses: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
