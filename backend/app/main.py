from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router


app = FastAPI(
    title="AppInsight Analytics API",
    description="Backend API for the AppInsight Analytics platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
# Local frontend + deployed frontend support
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------
app.include_router(router)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------
@app.get("/")
def root():
    return {
        "name": "AppInsight Analytics API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok"
    }