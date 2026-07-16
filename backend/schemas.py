from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class BaseSchema(BaseModel):
    model_config = ConfigDict(extra='forbid')

# Auth Schemas
class RegisterSchema(BaseSchema):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginSchema(BaseSchema):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: str

# Profile Schemas
class ProfileUpdateSchema(BaseSchema):
    monthly_income: Optional[float] = Field(None, ge=0)
    total_debt: Optional[float] = Field(None, ge=0)
    savings: Optional[float] = Field(None, ge=0)
    stock_holdings_value: Optional[float] = Field(None, ge=0)
    average_return_pct: Optional[float] = Field(None)
    emi_amount: Optional[float] = Field(None, ge=0)
    preferred_language: Optional[str] = None
    
    # Expenses
    expense_rent: Optional[float] = Field(None, ge=0)
    expense_food: Optional[float] = Field(None, ge=0)
    expense_transport: Optional[float] = Field(None, ge=0)
    expense_medical: Optional[float] = Field(None, ge=0)
    expense_other: Optional[float] = Field(None, ge=0)

class ProfileResponse(BaseModel):
    id: str
    monthly_income: float
    total_debt: float
    savings: float
    stock_holdings_value: float
    average_return_pct: float
    emi_amount: float
    financial_health_score: int
    
    # Expenses
    expense_rent: float
    expense_food: float
    expense_transport: float
    expense_medical: float
    expense_other: float

# Loan Analyzer Schemas
class FeeFlagResponse(BaseModel):
    fee_type: str
    found_pct: float
    severity: str

class ComplianceFlagResponse(BaseModel):
    rule_violated: str
    severity: str

class LoanAnalysisResponse(BaseModel):
    id: str
    principal: Optional[float]
    annual_interest_rate: Optional[float]
    tenure_months: Optional[int]
    stated_emi: Optional[float]
    verified_emi: Optional[float]
    emi_deviation_pct: Optional[float]
    fairness_score: Optional[float]
    extraction_confidence: Optional[float]
    explanation: Optional[str]
    fee_flags: List[FeeFlagResponse] = []
    compliance_flags: List[ComplianceFlagResponse] = []
    created_at: datetime

# Chat Schemas
class ChatRequestSchema(BaseSchema):
    message: str
    language: Optional[str] = None

class ChatHistoryResponse(BaseModel):
    id: str
    message: str
    board_response: Dict[str, Any]
    language: str
    created_at: datetime

# Expense Schemas
class ExpenseCreate(BaseSchema):
    amount: float = Field(..., gt=0)
    category: str
    description: Optional[str] = None
    date: Optional[datetime] = None
    loan_id: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    amount: float
    category: str
    description: Optional[str]
    date: datetime

# Goal Schemas
class GoalCreate(BaseSchema):
    name: str
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(0.0, ge=0)

class GoalUpdate(BaseSchema):
    name: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)

class GoalResponse(BaseModel):
    id: str
    name: str
    target_amount: float
    current_amount: float
    status: str
    llm_advice_json: Optional[Dict[str, Any]]
    created_at: datetime

# Ongoing Loan Schemas
class OngoingLoanCreate(BaseSchema):
    name: str
    principal_amount: float = Field(..., gt=0)
    tenure_years: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0)
    remaining_amount: Optional[float] = Field(None, ge=0)

class OngoingLoanResponse(BaseModel):
    id: str
    name: str
    principal_amount: float
    tenure_years: float
    interest_rate: float
    remaining_amount: Optional[float]
    created_at: datetime
