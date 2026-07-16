import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import auth
from main import limiter
from groq import Groq

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/recommendation", tags=["recommendation"])

RECOMMENDATION_SYSTEM_PROMPT = """
You are a Senior Wealth Manager and expert Personal Financial Advisor.
Based on the user's financial profile, monthly expenses, and current financial health score provided below, provide EXACTLY 3 actionable ways to improve their financial health score. 
Apply the 50:30:20 budgeting rule (50% Needs, 30% Wants, 20% Savings/Investments) where applicable and reference Indian financial instruments (like FDs, PPF, Mutual Funds) if relevant.

STRICT RULE: Expenses categorized as "Recurring Expense" or "EMI" are fixed, mandatory costs. You MUST NOT suggest reducing, cutting, or altering them when giving financial advice or suggesting ways to save money.

Respond ONLY in the following JSON schema (no extra text, exactly 3 items):
{
  "recommendations": [
    {
      "title": "Short title of recommendation (e.g. Optimize 50:30:20 Allocation)",
      "description": "Detailed explanation of what to do and why it improves the score",
      "impact": "High/Medium/Low"
    },
    ... (must have exactly 3)
  ]
}

CRITICAL: Always use Indian Rupees (INR/₹) when referring to currency.
<financial_profile_data>{user_profile_json}</financial_profile_data>
<expenses_summary>{expenses_json}</expenses_summary>
"""

@router.post("", response_model=dict)
@limiter.limit("5/minute")
def get_score_recommendation(request: Request, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    try:
        profile = db.query(models.FinancialProfile).filter(models.FinancialProfile.user_id == current_user.id).first()
        expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
        
        profile_data = {
            "monthly_income": profile.monthly_income if profile else 0,
            "total_debt": profile.total_debt if profile else 0,
            "savings": profile.savings if profile else 0,
            "stock_holdings_value": profile.stock_holdings_value if profile else 0,
            "average_return_pct": profile.average_return_pct if profile else 0,
            "emi_amount": profile.emi_amount if profile else 0,
            "financial_health_score": profile.financial_health_score if profile else 0,
        }
        
        expense_summary = {}
        for exp in expenses:
            expense_summary[exp.category] = expense_summary.get(exp.category, 0) + exp.amount
            
        system_prompt = RECOMMENDATION_SYSTEM_PROMPT.replace(
            "{user_profile_json}", json.dumps(profile_data)
        ).replace(
            "{expenses_json}", json.dumps(expense_summary)
        )
        
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "How can I improve my financial health score?"}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse AI output")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] recommendation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
