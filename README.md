# CreditPulse | MSME Financial Health Card

**CreditPulse** is an AI/ML-driven MSME Financial Health Card and credit scoring platform, built for the IDBI Hackathon. It leverages alternative data sources—such as Account Aggregator (AA) bank data, GST records, EPFO data, and UPI transactions—to compute a comprehensive credit score and probability of default for MSME applicants.

🚀 **Live Demo:** [https://idbi-bank-hackathon-fxty.vercel.app](https://idbi-bank-hackathon-fxty.vercel.app)

## 🌟 Application Features

- **Comprehensive Business Registration**: A robust signup flow allowing MSMEs to input granular business details (GSTIN, Region, Years in Business). Features "Quick Demo Signups" to instantly populate the form with realistic profiles, leveraging an ephemeral session system that safely cleans up the database upon logout.
- **Bank / Loan Officer Dashboard**: A comprehensive view for loan officers to evaluate MSME applicants, track credit scores, and review probabilities of default.
- **Detailed Applicant Profiling (`/applicant/:id`)**: Deep-dive into an applicant's financial health, displaying key metrics like Cashflow Health, Banking Discipline, and Compliance Score. Includes AI-generated, natural language explanations of the applicant's credit profile.
- **AI Credit Committee**: Simulates a multi-agent AI panel (Risk Officer, Growth Officer, Compliance Officer, and Chair) that debates an applicant's profile and reaches a consensus-driven final decision.
- **Time Machine & Monte Carlo Projections**: Rewinds an applicant's historical credit score and runs probabilistic Monte Carlo simulations to project future credit trajectories (Median, P90, P10).
- **MSME Owner View (`/my-score/:id`)**: A dedicated portal for business owners to view their own Financial Health Card. It provides actionable, AI-driven tips on how to improve their credit score over time.
- **Interactive "What-If" Analysis**: Allows users to simulate changes (e.g., "What if I reduce my EMI bounces?") and see the potential impact on their credit score instantly.
- **Admin Panel**: For managing platform configurations and viewing high-level system analytics.
- **Alternative Data Scoring Engine**: Evaluates non-traditional data (GST filings, EPFO trends, UPI transactions) to score MSMEs that might lack formal credit histories.
- **Progressive Web App (PWA)**: Installable directly to your device (desktop or mobile) for a native app-like experience, complete with an "Install App" button.

## 🚀 Technical Implementation Completed So Far

### 1. Data Generation & Synthetic Data (`/data_generation`)
- Synthetic dataset generation scripts for MSME applicants (`generate.py`).
- Generates realistic alternative data footprints including:
  - Account Aggregator (AA) bank transactions
  - EPFO (Employee Provident Fund) compliance records
  - GST filing records and turnover
  - UPI transaction inflows and outflows
- Stores generated records efficiently in a local SQLite database (`creditpulse.db`) and CSV files.

### 2. Machine Learning & Scoring Engine (`/ml`)
- **Feature Engineering**: Scripts (`feature_engineering.py`) to process raw alternative data and extract predictive features (e.g., revenue stability, cash flow health, banking discipline, compliance score).
- **Model Training**: A machine learning pipeline (`train_model.py`) using **XGBoost** and **Scikit-Learn** to predict the probability of default based on the engineered features.
- **Scoring Engine**: Evaluates an MSME profile to generate a normalized credit score (0-1000 scale) and determines feature importance (`scoring_engine.py`).
- Model artifacts and weights are saved for fast inference.

### 3. Backend API (`/backend`)
- Developed using **FastAPI** (`main.py`) for high performance.
- Exposes RESTful endpoints to query applicant profiles, trigger score computation, handle authentication, and create/cleanup ephemeral session users.
- Integrates seamlessly with the SQLite database via direct queries.
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
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic, SQLite
- **Machine Learning**: Pandas, NumPy, Scikit-Learn, XGBoost, Joblib, SciPy
- **AI/LLM**: `google-generativeai`, `openai`, `anthropic` (plug-and-play depending on config)

## 📦 Setup & Installation

Follow these steps to run the complete application locally.

### 1. Backend & ML Setup
Open a terminal in the root directory of the project:
1. Install Python dependencies: 
   ```bash
   pip install -r requirements.txt
   ```
2. Set up your environment variables:
   Copy `.env.example` to `.env` and fill in your API keys (e.g., `GEMINI_API_KEY`, `OPENAI_API_KEY`).
3. (Optional) Run the database check to ensure your mock data is ready: 
   ```bash
   python check_db.py
   ```
4. Start the backend FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
   *(The backend runs on `http://localhost:8000`)*

### 2. Frontend Setup
Open a new terminal and navigate to the `frontend` directory:
1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install Node dependencies: 
   ```bash
   npm install
   ```
3. Start the Vite development server: 
   ```bash
   npm run dev
   ```
   *(The frontend runs on `http://localhost:5173`)*

---

*Project developed for the IDBI Hackathon.*
