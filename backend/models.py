import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    preferred_language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("FinancialProfile", back_populates="user", uselist=False)
    loan_analyses = relationship("LoanAnalysis", back_populates="user")
    chat_history = relationship("ChatHistory", back_populates="user")

class FinancialProfile(Base):
    __tablename__ = "financial_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    monthly_income = Column(Float, default=0.0)
    total_debt = Column(Float, default=0.0)
    savings = Column(Float, default=0.0)
    stock_holdings_value = Column(Float, default=0.0)
    average_return_pct = Column(Float, default=0.0)
    financial_health_score = Column(Integer, default=0)
    emi_amount = Column(Float, default=0.0)
    last_emi_deduction_date = Column(DateTime, default=datetime.utcnow)
    
    # Monthly Expenses
    expense_rent = Column(Float, default=0.0)
    expense_food = Column(Float, default=0.0)
    expense_transport = Column(Float, default=0.0)
    expense_medical = Column(Float, default=0.0)
    expense_other = Column(Float, default=0.0)

    user = relationship("User", back_populates="profile")

class LoanAnalysis(Base):
    __tablename__ = "loan_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    document_s3_url = Column(String, nullable=True) # local path in our case
    extracted_text = Column(Text, nullable=True)
    
    principal = Column(Float, nullable=True)
    annual_interest_rate = Column(Float, nullable=True)
    tenure_months = Column(Integer, nullable=True)
    stated_emi = Column(Float, nullable=True)
    verified_emi = Column(Float, nullable=True)
    emi_deviation_pct = Column(Float, nullable=True)
    fairness_score = Column(Float, nullable=True)
    extraction_confidence = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="loan_analyses")
    fee_flags = relationship("FeeFlag", back_populates="loan_analysis")
    compliance_flags = relationship("ComplianceFlag", back_populates="loan_analysis")

class FeeFlag(Base):
    __tablename__ = "fee_flags"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    loan_analysis_id = Column(String, ForeignKey("loan_analyses.id"), nullable=False)
    fee_type = Column(String, nullable=False)
    found_pct = Column(Float, nullable=False)
    severity = Column(String, nullable=False)

    loan_analysis = relationship("LoanAnalysis", back_populates="fee_flags")

class ComplianceFlag(Base):
    __tablename__ = "compliance_flags"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    loan_analysis_id = Column(String, ForeignKey("loan_analyses.id"), nullable=False)
    rule_violated = Column(String, nullable=False)
    severity = Column(String, nullable=False)

    loan_analysis = relationship("LoanAnalysis", back_populates="compliance_flags")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    board_response = Column(JSON, nullable=False)
    language = Column(String, default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_history")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False) # e.g. Emergency, Leisure, Family, etc.
    description = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

class FinancialGoal(Base):
    __tablename__ = "financial_goals"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    status = Column(String, default="in_progress")
    llm_advice_json = Column(JSON, nullable=True) # Specialized LLM advice
    created_at = Column(DateTime, default=datetime.utcnow)

class OngoingLoan(Base):
    __tablename__ = "ongoing_loans"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    principal_amount = Column(Float, nullable=False)
    tenure_years = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)
    remaining_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
