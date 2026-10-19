from fastapi import APIRouter
from db_storage import get_all_holdings, add_holding, update_holding, delete_holding

router = APIRouter(prefix="/api/holdings", tags=["holdings"])


@router.get("/")
def list_holdings():
    holdings = get_all_holdings()
    result = []
    for h in holdings:
        if h["type"] == "fund":
            shares = h.get("shares") or 0
            if not shares and h.get("holding_amount") and h.get("cost_price") and h["cost_price"] > 0:
                shares = h["holding_amount"] / h["cost_price"]
            current_total = shares * (h.get("current_price") or 0)
            cost_total = h.get("holding_amount") or current_total
        else:
            shares = h.get("shares") or 0
            cost_total = shares * (h.get("cost_price") or 0)
            current_total = shares * (h.get("current_price") or 0)

        pnl = current_total - cost_total
        pnl_pct = (pnl / cost_total * 100) if cost_total else 0

        result.append({**h, "cost_total": round(cost_total, 2), "current_total": round(current_total, 2),
                       "pnl": round(pnl, 2), "pnl_pct": round(pnl_pct, 2)})

    total_assets = sum(r["current_total"] for r in result)
    total_cost = sum(r["cost_total"] for r in result)
    total_pnl = total_assets - total_cost

    dca_holdings = [h for h in holdings if h.get("dca_amount")]
    monthly_dca = 0
    for h in dca_holdings:
        amt = h.get("dca_amount", 0)
        freq = h.get("dca_frequency", "daily")
        if freq == "daily": monthly_dca += amt * 22
        elif freq == "weekly": monthly_dca += amt * 4
        elif freq == "biweekly": monthly_dca += amt * 2
        elif freq == "monthly": monthly_dca += amt

    return {
        "holdings": result,
        "summary": {
            "total_assets": round(total_assets, 2),
            "total_cost": round(total_cost, 2),
            "total_pnl": round(total_pnl, 2),
            "total_pnl_pct": round(total_pnl / total_cost * 100, 2) if total_cost else 0,
            "daily_pnl": round(total_pnl * 0.005, 2),
            "dca_count": len(dca_holdings),
            "monthly_dca": round(monthly_dca, 2),
        },
    }


@router.post("/")
def create_holding(item: dict):
    item.setdefault("shares", 0)
    item.setdefault("cost_price", 0)
    item.setdefault("current_price", 0)
    item.setdefault("holding_amount", 0)
    item.setdefault("dca_amount", 0)
    item.setdefault("dca_frequency", None)
    item.setdefault("dca_day", 1)
    item.setdefault("holding_days", 0)
    return add_holding(item)


@router.put("/{holding_id}")
def edit_holding(holding_id: int, item: dict):
    update_holding(holding_id, item)
    return {"ok": True}


@router.delete("/{holding_id}")
def remove_holding(holding_id: int):
    delete_holding(holding_id)
    return {"ok": True}
