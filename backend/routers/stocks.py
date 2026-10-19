from fastapi import APIRouter
from services.akshare_fetcher import get_stock_realtime, get_stock_history
from services.data_fetcher import get_stock_data, get_predictions
from services.skill_engine import analyze_stock_with_skill

router = APIRouter(prefix="/api/stocks", tags=["stocks"])


@router.get("/{code}")
def stock_detail(code: str, ai: bool = False):
    real = get_stock_realtime(code)
    if real and real.get("price"):
        stock = get_stock_data(code) or {}
        stock.update({
            "code": code,
            "name": real.get("name") or stock.get("name", ""),
            "price": real["price"],
            "daily_return": real["change_pct"],
        })
        
        # Only run AI analysis when explicitly requested
        if ai:
            ai_result = analyze_stock_with_skill(stock)
            if ai_result:
                stock["ai_analysis"] = ai_result.get("analysis", "")
                stock["moat_score"] = ai_result.get("moat_score", {})
                stock["buy_price"] = ai_result.get("buy_price", 0)
                stock["sell_price"] = ai_result.get("sell_price", 0)
                stock["stop_loss"] = ai_result.get("stop_loss", 0)
        
        return stock
    
    # Fallback to mock
    stock = get_stock_data(code)
    if stock:
        # Only run AI analysis when explicitly requested
        if ai:
            ai_result = analyze_stock_with_skill(stock)
            if ai_result:
                stock["ai_analysis"] = ai_result.get("analysis", stock.get("ai_analysis", ""))
                stock["moat_score"] = ai_result.get("moat_score", stock.get("moat_score", {}))
                stock["buy_price"] = ai_result.get("buy_price", stock.get("buy_price", 0))
                stock["sell_price"] = ai_result.get("sell_price", stock.get("sell_price", 0))
                stock["stop_loss"] = ai_result.get("stop_loss", stock.get("stop_loss", 0))
        return stock
    return {"error": "Stock not found"}


@router.get("/{code}/history")
def stock_history(code: str, period: str = "1y"):
    real = get_stock_history(code, period)
    if real:
        return real
    return get_predictions(code)


@router.get("/{code}/predictions")
def stock_predictions(code: str):
    return get_predictions(code)