"""Main FastAPI Application Entrypoint for TrustBurn AI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router
from backend.app.state import GLOBAL_STATE

app = FastAPI(
    title="TrustBurn AI — Screening & Risk Intelligence Backend",
    description="Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In",
    version="1.0.0-rc"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {
        "system": "TrustBurn AI",
        "subtitle": "Uncertainty-Aware Early Warning & Risk Intelligence for Component Burn-In",
        "tagline": "Every burn-in trajectory becomes an evidence opportunity.",
        "status": "online",
        "docs_url": "/docs",
        "api_health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
