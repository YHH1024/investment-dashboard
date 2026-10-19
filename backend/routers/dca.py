from fastapi import APIRouter
from services.data_fetcher import get_fund_data, get_nav_history

router = APIRouter(prefix="/api/dca", tags=["dca"])


@router.post("/calculate")
def calculate_dca(params: dict):
    code = params.get("code", "000311")
    amount = params.get("amount", 1000)
    frequency = params.get("frequency", "monthly")

    fund = get_fund_data(code)
    if not fund:
        return {"error": "基金未找到"}

    history = get_nav_history(code, "3y")
    freq_map = {"daily": 1, "weekly": 5, "monthly": 22}
    interval = freq_map.get(frequency, 22)

    total_invested = 0
    total_shares = 0
    chart_data = []

    for i, point in enumerate(history):
        if i % interval == 0:
            shares_bought = amount / point["price"]
            total_invested += amount
            total_shares += shares_bought
        if total_shares > 0:
            current_value = total_shares * point["price"]
            chart_data.append({
                "date": point["date"],
                "invested": round(total_invested, 2),
                "value": round(current_value, 2),
                "return_pct": round((current_value / total_invested - 1) * 100, 2) if total_invested else 0,
            })

    final_value = total_shares * history[-1]["price"] if history else 0
    total_return = (final_value / total_invested - 1) * 100 if total_invested else 0

    # Forward simulation
    forward = {}
    for rate_label, annual_rate in [("乐观", 0.15), ("基准", 0.08), ("悲观", 0.03)]:
        sim_value = final_value
        sim_invested = total_invested
        monthly_add = amount if frequency == "monthly" else amount * 22 if frequency == "daily" else amount * 4.3
        forward_points = []
        for month in range(1, 37):
            sim_invested += monthly_add
            sim_value = sim_value * (1 + annual_rate / 12) + monthly_add
            forward_points.append({
                "month": month,
                "invested": round(sim_invested, 2),
                "value": round(sim_value, 2),
            })
        forward[rate_label] = forward_points

    return {
        "summary": {
            "total_invested": round(total_invested, 2),
            "final_value": round(final_value, 2),
            "total_return": round(total_return, 2),
            "total_shares": round(total_shares, 2),
            "avg_cost": round(total_invested / total_shares, 4) if total_shares else 0,
            "period": f"{history[0]['date']} ~ {history[-1]['date']}" if history else "",
        },
        "chart_data": chart_data[::max(1, len(chart_data) // 100)],
        "forward_simulation": forward,
    }