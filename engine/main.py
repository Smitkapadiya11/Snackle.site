"""
FastAPI Application — Inventory Intelligence Engine v2.0
Runs on port 8000. Called by Next.js API routes.
"""

import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.schemas import AnalyzeRequest, AnalyzeResponse
from algorithms.orchestrator import run_full_analysis

app = FastAPI(
    title="Inventory Intelligence Engine",
    description="Advanced inventory forecasting and optimization API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_origin_regex=r"https://(.*\.vercel\.app|.*\.railway\.app|.*\.up\.railway\.app|snackle\.site|.*\.snackle\.site)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "engine_version": "2.0.0"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_inventory(request: AnalyzeRequest):
    """Main endpoint: receives product data + brand context, returns full analysis."""
    start = time.time()

    try:
        result = run_full_analysis(request.products, request.brand_context)
        elapsed_ms = (time.time() - start) * 1000

        return AnalyzeResponse(
            success=True,
            data=result,
            processing_time_ms=round(elapsed_ms, 1),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
