from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import stocks, news, market

app = FastAPI(
    title="Stock Checker API",
    description="株式スクリーニング・チェッカー API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router)
app.include_router(news.router)
app.include_router(market.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
