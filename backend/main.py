import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

# Ensure docs are hidden in production based on a dummy check
docs_kwargs = {}
if os.getenv("DEBUG") != "True":
    docs_kwargs = {"docs_url": None, "redoc_url": None}

app = FastAPI(**docs_kwargs)

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware (Helmet equivalent)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Explicit CORS Whitelist
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
)

@app.get("/api/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    return {"status": "ok", "message": "ClearFinance API is running securely."}

# DB Init
import database
import models
models.Base.metadata.create_all(bind=database.engine)

# Include Routers
from routers import auth, profile, loans, chat, expenses, goals, ongoing_loans
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(chat.router)
app.include_router(expenses.router)
app.include_router(goals.router)
app.include_router(ongoing_loans.router)
app.include_router(loans.router)

# Added to trigger uvicorn reload after installing email-validator
