from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import settings
from routers import auth, strategies, backtest, data, ai, export, public

app = FastAPI(title="BacktestIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
app.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(export.router, prefix="/export", tags=["export"])
app.include_router(public.router, prefix="/public", tags=["public"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok"}
