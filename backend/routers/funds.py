from fastapi import APIRouter
from services.data_fetcher import get_fund_data, get_nav_history, get_predictions, get_top_funds
from services.ai_analyzer import analyze_fund
from services.skill_engine import analyze_fund_with_skill

router = APIRouter(prefix="/api/funds", tags=["funds"])


@router.get("/{code}")
def fund_detail(code: str, ai: bool = False):
    """Get fund detail - try mock first, then AKShare."""
    fund = get_fund_data(code)
    
    # If not in mock data, try to fetch basic info from AKShare
    if not fund:
        try:
            from services.akshare_fetcher import get_fund_realtime
            real = get_fund_realtime(code)
            if real and real.get("nav"):
                fund = {
                    "code": code,
                    "name": real.get("name", f"基金{code}"),
                    "type": "未知",
                    "manager": "未知",
                    "company": "未知",
                    "nav": real["nav"],
                    "daily_return": real.get("daily_return", 0),
                    "size": 0,
                    "fee_rate": 0,
                    "total_return": 0,
                    "top10_holdings": [],
                    "performance": {"1m": real.get("perf_1m", 0), "3m": real.get("perf_3m", 0), "6m": real.get("perf_6m", 0), "1y": real.get("perf_1y", 0), "3y": 0},
                    "benchmark": {"1m": 0, "3m": 0, "6m": 0, "1y": 0, "3y": 0},
                    "ai_analysis": "",
                    "predictions": {"乐观": real["nav"] * 1.1, "基准": real["nav"] * 1.03, "悲观": real["nav"] * 0.9},
                }
        except Exception as e:
            print(f"AKShare fund fetch error: {e}")
            return {"error": "基金未找到"}
    
    if not fund:
        return {"error": "基金未找到"}
    
    analysis = analyze_fund(code, fund)
    
    # Only run AI analysis when explicitly requested
    if ai:
        ai_result = analyze_fund_with_skill(fund)
        if ai_result:
            fund["ai_analysis"] = ai_result.get("ai_analysis", fund.get("ai_analysis", ""))
            fund["predictions"] = ai_result.get("predictions", fund.get("predictions", {}))
            analysis = {
                "conclusion": ai_result.get("ai_analysis", ""),
                "risk_level": ai_result.get("risk_level", "中等"),
                "recommendation": ai_result.get("recommendation", "持有"),
                "confidence": 0.78,
                "key_factors": ai_result.get("key_factors", []),
            }
    
    return {**fund, "analysis": analysis}


@router.get("/{code}/history")
def fund_history(code: str, period: str = "1y"):
    """Get fund NAV history - uses AKShare for real data."""
    from services.akshare_fetcher import get_fund_realtime
    real = get_fund_realtime(code)
    if real and real.get("history"):
        days_map = {"1m": 30, "3m": 90, "6m": 180, "1y": 365, "3y": 1095}
        days = days_map.get(period, 365)
        return real["history"][-days:]
    return get_nav_history(code, period)


@router.get("/{code}/predictions")
def fund_predictions(code: str):
    """Get fund predictions - uses current NAV."""
    from services.akshare_fetcher import get_fund_realtime
    real = get_fund_realtime(code)
    if real and real.get("nav"):
        from services.data_fetcher import generate_prediction_series
        return generate_prediction_series(real["nav"])
    return get_predictions(code)


@router.get("/screener/top")
def top_funds():
    try:
        from services.akshare_fetcher import get_fund_ranking
        ranking = get_fund_ranking()
        if ranking:
            return ranking
    except Exception as e:
        print(f"Fund ranking error: {e}")
    return get_top_funds()
