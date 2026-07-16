import os
import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth
from main import limiter
from groq import Groq

router = APIRouter(prefix="/api/goals", tags=["goals"])
logger = logging.getLogger(__name__)

@router.post("", response_model=schemas.GoalResponse)
@limiter.limit("20/minute")
def create_goal(request: Request, goal_data: schemas.GoalCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        goal = models.FinancialGoal(
            user_id=current_user.id,
            name=goal_data.name,
            target_amount=goal_data.target_amount,
            current_amount=goal_data.current_amount
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal
    except Exception as e:
        logger.error(f"[ERROR] create_goal: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("", response_model=list[schemas.GoalResponse])
@limiter.limit("100/minute")
def list_goals(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        goals = db.query(models.FinancialGoal).filter(models.FinancialGoal.user_id == current_user.id).order_by(models.FinancialGoal.created_at.desc()).all()
        return goals
    except Exception as e:
        logger.error(f"[ERROR] list_goals: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{goal_id}", response_model=schemas.GoalResponse)
@limiter.limit("100/minute")
def get_goal(request: Request, goal_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        goal = db.query(models.FinancialGoal).filter(
            models.FinancialGoal.id == goal_id,
            models.FinancialGoal.user_id == current_user.id
        ).first()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        return goal
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] get_goal: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/{goal_id}/advice", response_model=schemas.GoalResponse)
@limiter.limit("10/minute")
def generate_goal_advice(request: Request, goal_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        goal = db.query(models.FinancialGoal).filter(
            models.FinancialGoal.id == goal_id,
            models.FinancialGoal.user_id == current_user.id
        ).first()
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
        expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
        
        profile_data = {
            "monthly_income": profile.monthly_income if profile else 0,
            "total_debt": profile.total_debt if profile else 0,
            "savings": profile.savings if profile else 0,
            "stock_holdings_value": profile.stock_holdings_value if profile else 0,
            "average_return_pct": profile.average_return_pct if profile else 0,
        }
        
        expense_summary = {}
        for exp in expenses:
            expense_summary[exp.category] = expense_summary.get(exp.category, 0) + exp.amount
            
        prompt = f"""
        You are a financial advisor. The user wants to reach a financial goal.
        Goal Name: {goal.name}
        Target Amount: ₹{goal.target_amount}
        Current Amount: ₹{goal.current_amount}
        
        User's Financial Profile:
        {json.dumps(profile_data, indent=2)}
        
        User's Expense Summary:
        {json.dumps(expense_summary, indent=2)}
        
        Provide actionable, step-by-step advice on how to reach this goal.
        Respond ONLY with a JSON object in this exact schema:
        {{
            "summary": "1-2 sentences summarizing the strategy",
            "estimated_months": integer,
            "steps": [
                {{"title": "Step 1", "description": "Actionable advice"}}
            ]
        }}
        """
        
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        advice_json = json.loads(response_text)
        goal.llm_advice_json = advice_json
        
        db.commit()
        db.refresh(goal)
        return goal
        
    except Exception as e:
        logger.error(f"[ERROR] generate_goal_advice: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
