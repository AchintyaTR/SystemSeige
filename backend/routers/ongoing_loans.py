from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from main import limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ongoing-loans", tags=["ongoing-loans"])

@router.post("", response_model=schemas.OngoingLoanResponse)
@limiter.limit("10/minute")
def create_ongoing_loan(request: Request, payload: schemas.OngoingLoanCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        new_loan = models.OngoingLoan(
            user_id=current_user.id,
            name=payload.name,
            principal_amount=payload.principal_amount,
            tenure_years=payload.tenure_years,
            interest_rate=payload.interest_rate,
            remaining_amount=payload.remaining_amount
        )
        db.add(new_loan)
        db.commit()
        db.refresh(new_loan)
        return new_loan
    except Exception as e:
        logger.error(f"[ERROR] create_ongoing_loan: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("", response_model=list[schemas.OngoingLoanResponse])
@limiter.limit("100/minute")
def get_ongoing_loans(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        loans = db.query(models.OngoingLoan).filter(models.OngoingLoan.user_id == current_user.id).all()
        return loans
    except Exception as e:
        logger.error(f"[ERROR] get_ongoing_loans: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{loan_id}", status_code=204)
@limiter.limit("20/minute")
def delete_ongoing_loan(request: Request, loan_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        loan = db.query(models.OngoingLoan).filter(
            models.OngoingLoan.id == loan_id,
            models.OngoingLoan.user_id == current_user.id
        ).first()
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        db.delete(loan)
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] delete_ongoing_loan: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
