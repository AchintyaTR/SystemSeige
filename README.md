# ClearFinance (System Siege PS-002)

ClearFinance is an AI-powered financial wellness and loan transparency platform built for the System Siege hackathon.

This platform is **Secure by Default**, strictly adhering to the 12 non-negotiable security rules defined in the `agent_security_instructions.md`.

## Features
- **Multi-Domain Board Chat**: A unified chat interface where a board of 6 financial advisors (Debt, Savings, Investment, Insurance, Tax, Legal) collaborate to provide holistic advice based on the user's financial profile.
- **Predatory Loan Scanner**: Upload a PDF loan agreement. The system extracts the terms, mathematically verifies the EMI and fees, and computes a **Deterministic Fairness Score**.
- **Multilingual Support**: Automatic language detection and translation using `langdetect`.
- **Explainable AI**: Every fairness score comes with an explainability envelope, detailing exactly *why* the score was given based on raw math.

## Architecture & Security Highlights
- **Backend:** FastAPI (Python) with SQLAlchemy and SQLite.
- **Frontend:** Next.js (React).
- **Rate Limiting:** `slowapi` applied to all routes (5/min for auth, 3/min for AI, 100/min for general).
- **Input Validation:** Strict Pydantic models with `extra='forbid'` to block mass assignment attacks.
- **Auth:** JWT using `httpOnly` cookies, access token valid for 15 minutes.
- **IDOR Prevention:** All database queries are strictly scoped using `user_id = current_user.id`.
- **No Raw SQL:** SQLAlchemy ORM is used exclusively.
- **Security Headers:** Custom middleware implementing `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `X-XSS-Protection`.
- **Secrets Management:** `.env` is properly ignored in `.gitignore`, and no secrets are hardcoded.

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. Open a terminal in the root directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```bash
   pip install -r backend\requirements.txt
   ```
4. Copy the environment variables template and **add your Gemini API Key**:
   *(Rename `.env.example` to `.env` and fill in `GEMINI_API_KEY`)*
5. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   The backend API will run on `http://localhost:8000`.

### Frontend Setup
1. Open a new terminal in the root directory.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

## Known Limitations / Clarifications
- **Database / Redis:** To adhere to the strict "KEEP IT LOCALLY" and "NO DOCKER" requirements for the hackathon, we used **SQLite** (instead of PostgreSQL) and **In-Memory Rate Limiting** (instead of Redis). This perfectly mimics the requested architecture's security properties without requiring external service installations.
- **OCR Fallback:** The `pytesseract` fallback requires Tesseract-OCR installed on your local host system to function on scanned PDFs. Standard text PDFs will process via `pdfplumber` natively.
