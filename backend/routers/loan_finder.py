import os
import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from groq import Groq
from main import limiter
import auth

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/loan-finder", tags=["loan-finder"])

# ----------------- Schemas -----------------

class LoanFinderRequest(BaseModel):
    loan_type: str = Field(..., example="Home Loan")
    amount: float = Field(..., gt=0, example=500000)

class BankRecommendation(BaseModel):
    bank_name: str
    interest_rate: float
    beneficiaries: str
    benefit_reason: str
    hyperlink: str

class LoanFinderResponse(BaseModel):
    banks: List[BankRecommendation]

# ----------------- Prompt -----------------

LOAN_FINDER_PROMPT = """
You are a highly knowledgeable financial loan aggregator.
The user is looking for a {loan_type} of amount {amount}.

Your task is to provide exactly 10 diverse banks (or financial institutions) that offer competitive interest rates for this specific type of loan.
For each bank, provide:
- bank_name: The name of the bank (e.g., SBI, HDFC, ICICI, etc.)
- interest_rate: A realistic annual interest rate (as a float, e.g. 8.5)
- beneficiaries: The target audience or who this loan is best suited for (e.g., "Salaried Professionals", "First-time Homebuyers")
- benefit_reason: A personalized explanation of why choosing this bank will benefit the user specifically.
- hyperlink: A realistic URL to the bank's loan webpage (e.g., "https://www.onlinesbi.sbi/loans")

STRICT RULE: You MUST return exactly 10 banks. Ensure the list is diverse.
Respond ONLY in valid JSON matching the following schema (no extra text):

{
  "banks": [
    {
      "bank_name": "string",
      "interest_rate": 0.0,
      "beneficiaries": "string",
      "benefit_reason": "string",
      "hyperlink": "string"
    }
  ]
}
"""

@router.post("", response_model=LoanFinderResponse)
@limiter.limit("5/minute")
def find_top_loans(
    request: Request,
    payload: LoanFinderRequest,
    current_user=Depends(auth.get_current_user)
):
    try:
        system_prompt = LOAN_FINDER_PROMPT.replace(
            "{loan_type}", payload.loan_type
        ).replace(
            "{amount}", str(payload.amount)
        )
        
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Find me the top 10 banks for a {payload.loan_type}."}
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"},
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
            
        data = json.loads(response_text)
        return data
        
    except json.JSONDecodeError:
        logger.error("[ERROR] Failed to parse AI JSON output for loan finder")
        raise HTTPException(status_code=500, detail="Failed to parse AI output")
    except Exception as e:
        logger.error(f"[ERROR] loan_finder: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
