# ClearFinance (System Siege PS-002)

ClearFinance is an AI-powered financial wellness and loan transparency platform. It was built during a 24-hour hackathon, **System Siege**, where it placed in the **top 10 out of ~80 participants**. 

🏆 **Hackathon Link:** [System Siege on Unstop](https://unstop.com/p/system-siege-amrita-vishwa-vidyapeetham-avv-chennai-1712187?lb=b9YMb8pl)

This platform is **Secure by Default**, strictly adhering to the 12 non-negotiable security rules defined in the `agent_security_instructions.md`.

## 🚀 Live Demo
**Access the fully functional live application here:** [https://sys-rose.vercel.app/](https://sys-rose.vercel.app/)

*(Note: The live demo uses local databases and might be down. For full evaluation, follow the secure local setup instructions below.)*

## Key Features
- **Multi-Domain Board Chat**: A unified chat interface where a conversational AI acts as your personal financial advisor. Features a seamless history clearing option and intelligent, natural conversation flows that prioritize your financial wellness without feeling robotic.
- **Predatory Loan Scanner**: Upload a PDF loan agreement. The system extracts the terms, mathematically verifies the EMI and fees, and computes a **Deterministic Fairness Score** with explainable AI.
- **Unified Debt & EMI Tracking**: Track your total debt seamlessly. Manually log your monthly EMI payments in the tracker, and watch your total debt automatically decrease!
- **Dynamic Financial Health Score**: A mathematically rigorous health score that dynamically updates based on your monthly income versus your combined tracker expenses and fixed EMI obligations.
- **AI Goal Generator**: Set financial goals (like buying a car or saving for a house) and the AI will generate step-by-step actionable advice tailored to your income and fixed expenses.
- **Multilingual Support**: Automatic language detection and translation using `langdetect` built into the AI responses.

## Architecture & Security Highlights
- **Backend:** FastAPI (Python) with SQLAlchemy and SQLite.
- **Frontend:** Next.js (React) with TailwindCSS.
- **Rate Limiting:** `slowapi` applied to all routes (5/min for auth, 3/min for AI, 100/min for general).
- **Input Validation:** Strict Pydantic models with `extra='forbid'` to block mass assignment attacks.
- **Auth:** JWT using `httpOnly` cookies, access token valid for 15 minutes.
- **IDOR Prevention:** All database queries are strictly scoped using `user_id = current_user.id`.
- **Atomic Transactions & DB Rollbacks:** All critical database modifications (like user registration) are wrapped in atomic transactions with explicit `db.rollback()` safety nets. This guarantees the database never reaches an inconsistent or locked state, even during high-concurrency brute-force or load-testing attacks (e.g., Locust).
- **Comprehensive Vulnerability Patching:** Protected against CSRF via wildcard origin removal, proxy rate limit bypasses (using `X-Forwarded-For`), debt inflation exploits, and account enumeration, ensuring the system is completely hardened.
- **No Raw SQL:** SQLAlchemy ORM is used exclusively.
- **Security Headers:** Custom middleware implementing `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `X-XSS-Protection`.
- **Secrets Management:** `.env` is properly ignored in `.gitignore`, and no secrets are hardcoded.

## How To Access The Website (Local Setup)

The easiest way to run the entire stack (Frontend + Backend + Databases) is using Docker Compose.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Setup Instructions
1. Open a terminal in the root directory of this project.
2. Copy the environment variables template and **configure your keys**:
   *(Rename `.env.example` to `.env`. Add your `GROQ_API_KEY` and set your desired `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD`)*
3. Build and spin up the containers:
   ```bash
   docker-compose up -d --build
   ```
4. **Access the Website:**
   - **Frontend UI:** Open your browser and go to `http://localhost:3000`
   - **Backend API Docs:** Open your browser and go to `http://localhost:8000/docs`

5. **To stop the app:**
   ```bash
   docker-compose down
   ```

## Manual Setup (Without Docker)
If you prefer not to use Docker, you can run the components manually:

### Backend
1. Create and activate a Python virtual environment.
2. `pip install -r backend/requirements.txt`
3. Make sure you have Tesseract-OCR and poppler-utils installed on your host machine for the PDF scanner.
4. `cd backend && uvicorn main:app --reload` (Runs on port 8000)

### Frontend
1. Ensure Node.js 18+ is installed.
2. `cd frontend && npm install`
3. `npm run dev` (Runs on port 3000)
