# CreditPulse | MSME Financial Health Card

**CreditPulse** is an AI/ML-driven MSME Financial Health Card and credit scoring platform, built for the IDBI Hackathon. It leverages alternative data sources—such as Account Aggregator (AA) bank data, GST records, EPFO data, and UPI transactions—to compute a comprehensive credit score and probability of default for MSME applicants.

## 🌟 Application Features

- **Bank / Loan Officer Dashboard**: A comprehensive view for loan officers to evaluate MSME applicants, track credit scores, and review probabilities of default.
- **Detailed Applicant Profiling (`/applicant/:id`)**: Deep-dive into an applicant's financial health, displaying key metrics like Cashflow Health, Banking Discipline, and Compliance Score. Includes AI-generated, natural language explanations of the applicant's credit profile.
- **AI Credit Committee**: Simulates a multi-agent AI panel (Risk Officer, Growth Officer, Compliance Officer, and Chair) that debates an applicant's profile and reaches a consensus-driven final decision.
- **Time Machine & Monte Carlo Projections**: Rewinds an applicant's historical credit score and runs probabilistic Monte Carlo simulations to project future credit trajectories (Median, P90, P10).
- **MSME Owner View (`/my-score/:id`)**: A dedicated portal for business owners to view their own Financial Health Card. It provides actionable, AI-driven tips on how to improve their credit score over time.
- **Interactive "What-If" Analysis**: Allows users to simulate changes (e.g., "What if I reduce my EMI bounces?") and see the potential impact on their credit score instantly.
- **Admin Panel**: For managing platform configurations and viewing high-level system analytics.
- **Alternative Data Scoring Engine**: Evaluates non-traditional data (GST filings, EPFO trends, UPI transactions) to score MSMEs that might lack formal credit histories.

## 🚀 Technical Implementation Completed So Far

### 1. Data Generation & Synthetic Data (`/data_generation`)
- Synthetic dataset generation scripts for MSME applicants (`generate.py`).
- Generates realistic alternative data footprints including:
  - Account Aggregator (AA) bank transactions
  - EPFO (Employee Provident Fund) compliance records
  - GST filing records and turnover
  - UPI transaction inflows and outflows
- Stores generated records efficiently in a cloud-native **Neon DB (PostgreSQL)** database and CSV files.

### 2. Machine Learning & Scoring Engine (`/ml`)
- **Feature Engineering**: Scripts (`feature_engineering.py`) to process raw alternative data and extract predictive features (e.g., revenue stability, cash flow health, banking discipline, compliance score).
- **Model Training**: A machine learning pipeline (`train_model.py`) using **XGBoost** and **Scikit-Learn** to predict the probability of default based on the engineered features.
- **Scoring Engine**: Evaluates an MSME profile to generate a normalized credit score (0-1000 scale) and determines feature importance (`scoring_engine.py`).
- Model artifacts and weights are saved for fast inference.

### 3. Backend API (`/backend`)
- Developed using **FastAPI** (`main.py`) for high performance.
- Exposes RESTful endpoints to query applicant profiles, trigger score computation, and fetch historical trends.
- Integrates seamlessly with the **PostgreSQL database (Neon DB)** via SQLAlchemy and psycopg2 connectors.
- **LLM Integration** (`llm_service.py`): Leverages Generative AI (OpenAI, Anthropic, or Google Gemini via `.env` configuration) to generate:
  - Natural language explanations of the credit score for loan officers.
  - Actionable improvement tips for the MSME business owner.
  - "What-If" scenario analyses.

### 4. Frontend Dashboard (`/frontend`)
- A modern, interactive React web application built with **Vite** and **Tailwind CSS**.
- **Visualizations**: Uses Recharts to plot revenue trends, score history, and feature importance.
- **Animations**: Incorporates Framer Motion for a smooth, premium user experience.
- Component architecture including:
  - Applicant search and profile viewing.
  - The comprehensive "Financial Health Card" UI.
  - Breakdown of key metrics (banking discipline, compliance, cashflow).
  - AI-generated insights and recommendations panels.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React
- **Backend**: Python 3, FastAPI, Uvicorn, Pydantic, PostgreSQL (Neon DB), psycopg2, SQLAlchemy
- **Machine Learning**: Pandas, NumPy, Scikit-Learn, XGBoost, Joblib, SciPy
- **AI/LLM**: `google-generativeai`, `openai`, `anthropic` (plug-and-play depending on config)

## 📦 Setup & Installation

### Backend & ML
1. Navigate to the `creditpulse` directory.
2. Install Python dependencies: `pip install -r requirements.txt`
3. Set up environment variables by copying `.env.example` to `.env`. Ensure you provide your `DATABASE_URL` (Neon DB Postgres connection string) and LLM API keys.
4. Run the data generation script to seed your Neon DB with mock applicant data: `python data_generation/generate.py`
5. Start the backend server: `uvicorn backend.main:app --reload` (Runs on port 8000)

### Frontend
1. Navigate to the `frontend` directory.
2. Install Node dependencies: `npm install`
3. Start the Vite development server: `npm run dev` (Runs on port 5173)

---

*Project developed for the IDBI Hackathon.*
