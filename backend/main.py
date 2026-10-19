from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import holdings, funds, stocks, news, skills, alerts, watchlist, dca, settings, transactions

from db_storage import init_db
init_db()

app = FastAPI(title="Investment Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(holdings.router)
app.include_router(funds.router)
app.include_router(stocks.router)
app.include_router(news.router)
app.include_router(skills.router)
app.include_router(alerts.router)
app.include_router(watchlist.router)
app.include_router(dca.router)
app.include_router(settings.router)
app.include_router(transactions.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Investment Dashboard API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)