"""FastAPI Application Entry Point for VRIDDHI (TRD §5)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Long-Term Investor Research Platform for Indian Stocks",
    version="1.0.0"
)

# CORS Middleware to allow requests from Next.js frontend (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://localhost:{settings.FRONTEND_PORT}",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint per TRD §5."""
    return {"ok": True, "app": settings.APP_NAME, "env": settings.APP_ENV}


# Include Routers (lazily or after they are defined)
from app.routers import search, watchlist, research, charts, news, portfolio, compare, new_listings, admin
app.include_router(search.router, prefix="/api")
app.include_router(watchlist.router, prefix="/api")
app.include_router(research.router, prefix="/api")
app.include_router(charts.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(compare.router, prefix="/api")
app.include_router(new_listings.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
