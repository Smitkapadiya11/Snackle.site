# Snackle — Inventory Intelligence Platform

Built by **Smit Kapadiya** (21) · CHARUSAT University · Surat, Gujarat 🇮🇳

> The first AI-powered inventory intelligence model built specifically for Indian D2C brands.

## Snackle 1.0 — 9 Algorithms
- Monte Carlo Simulation (10,000 demand paths)
- Holt-Winters Ensemble Forecasting
- Statistical Safety Stock (lead time variability)
- EOQ + Backorder Optimization
- ABC-XYZ 9-cell Matrix
- Isolation Forest Anomaly Detection
- CUSUM Change Detection
- Price Elasticity Markdown Optimization
- GMROI Profitability Analysis

## Stack
- **Frontend**: Next.js 14 + Tailwind + Anime.js
- **AI Engine**: Python FastAPI + NumPy + SciPy + Statsmodels + Scikit-learn
- **AI Summaries**: DeepSeek R1 via Groq API
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel (frontend) + Railway (engine)

## Local Development

### Frontend
```bash
npm install
npm run dev
```

### Python Engine
```bash
cd engine
pip install -r requirements.txt
python main.py
```

### Environment Variables
Copy `.env.example` → `.env.local` and fill in your keys.

## Deploy
- Frontend → Vercel (auto-deploys from GitHub main branch)
- Engine → Railway (deploy from /engine directory)

---
*Made in India. By Indian. For Indian brands.*
