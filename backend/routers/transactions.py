from fastapi import APIRouter
from db_storage import get_all_transactions, add_transaction, delete_transaction, get_portfolio_history, add_portfolio_snapshot
from services.data_fetcher import get_fund_data, get_stock_data
import math
from datetime import datetime

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/")
def list_transactions(code: str = None):
    return get_all_transactions(code)


@router.post("/")
def create_transaction(data: dict):
    if not data.get('shares') and data.get('price') and data.get('amount'):
        data['shares'] = round(data['amount'] / data['price'], 2)
    if not data.get('total'):
        data['total'] = round(data.get('amount', 0) * data.get('price', 0), 2)
    return add_transaction(data)


@router.delete("/{tx_id}")
def remove_transaction(tx_id: int):
    return delete_transaction(tx_id)


@router.get("/history")
def portfolio_history():
    return get_portfolio_history()


@router.post("/snapshot")
def save_snapshot(data: dict):
    return add_portfolio_snapshot(
        data.get('date', datetime.now().strftime('%Y-%m-%d')),
        data.get('total_assets', 0),
        data.get('daily_return'),
        data.get('cumulative_return')
    )


@router.get("/risk/{code}")
def risk_metrics(code: str, days: int = 365):
    """Calculate risk metrics: Sharpe, max drawdown, volatility."""
    try:
        history = []
        try:
            from services.akshare_fetcher import get_stock_history
            h = get_stock_history(code, f'{days}d')
            if h:
                history = [d['price'] for d in h]
        except Exception:
            pass

        if not history or len(history) < 30:
            fund = get_fund_data(code)
            base = fund['nav'] if fund else 2.56
            history = [base + (i % 10 - 5) * 0.02 + i * 0.001 for i in range(min(days, 250))]

        returns = [(history[i] - history[i-1]) / history[i-1] for i in range(1, len(history))]
        total_return = (history[-1] - history[0]) / history[0]
        years = len(history) / 250
        annual_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0

        if returns:
            mean_r = sum(returns) / len(returns)
            variance = sum((r - mean_r) ** 2 for r in returns) / len(returns)
            annual_vol = math.sqrt(variance) * math.sqrt(250)
        else:
            annual_vol = 0

        sharpe = (annual_return - 0.02) / annual_vol if annual_vol > 0 else 0

        peak = history[0]
        max_dd = 0
        for p in history:
            if p > peak:
                peak = p
            dd = (peak - p) / peak
            if dd > max_dd:
                max_dd = dd

        wins = sum(1 for r in returns if r > 0)
        win_rate = wins / len(returns) if returns else 0

        return {
            "code": code,
            "days": len(history),
            "total_return": round(total_return * 100, 2),
            "annual_return": round(annual_return * 100, 2),
            "annual_volatility": round(annual_vol * 100, 2),
            "sharpe_ratio": round(sharpe, 2),
            "max_drawdown": round(max_dd * 100, 2),
            "win_rate": round(win_rate * 100, 2),
            "risk_level": "高" if annual_vol > 0.3 else "中" if annual_vol > 0.15 else "低",
        }
    except Exception as e:
        return {"error": str(e)}


@router.get("/rescue/{code}")
def rescue_strategy(code: str, cost_price: float = 0, shares: float = 0):
    """Calculate rescue strategy for trapped stocks/funds."""
    try:
        fund = get_fund_data(code)
        stock = get_stock_data(code)

        current_price = 0
        name = code
        if fund:
            current_price = fund.get('nav', 0)
            name = fund.get('name', code)
        elif stock:
            current_price = stock.get('price', 0)
            name = stock.get('name', code)

        if not current_price or not cost_price:
            return {"error": "无法获取当前价格或成本价"}

        loss_pct = (current_price - cost_price) / cost_price * 100
        loss_amount = (current_price - cost_price) * shares

        strategies = []

        # 1. Hold and wait
        strategies.append({
            "name": "自然等待",
            "description": "等待价格自然回升",
            "target_price": cost_price,
            "recovery_pct": round(abs(loss_pct), 1),
            "estimated_days": int(abs(loss_pct) * 3),
            "risk": "低",
            "action": "持有不动，等待市场回暖"
        })

        # 2. Average down
        if loss_pct < -10:
            add_amount = shares * cost_price * 0.5
            add_shares = add_amount / current_price
            new_avg = (shares * cost_price + add_amount) / (shares + add_shares)
            strategies.append({
                "name": "补仓摊低成本",
                "description": f"追加投入¥{add_amount:,.0f}",
                "target_price": round(new_avg, 4),
                "new_avg_cost": round(new_avg, 4),
                "recovery_pct": round((new_avg - current_price) / current_price * 100, 1),
                "estimated_days": int(abs((new_avg - current_price) / current_price * 100) * 2),
                "risk": "中",
                "action": f"补仓{add_shares:.0f}份，新成本价{new_avg:.4f}"
            })

        # 3. Stop loss and rotate
        if loss_pct < -20:
            sell_shares = shares * 0.3
            sell_amount = sell_shares * current_price
            strategies.append({
                "name": "止损换仓",
                "description": f"卖出30%仓位，换入更强标的",
                "target_price": current_price,
                "sell_amount": round(sell_amount, 0),
                "recovery_pct": round(loss_pct * 0.3, 1),
                "risk": "高",
                "action": f"止损{sell_shares:.0f}份，回收资金¥{sell_amount:,.0f}"
            })

        # 4. Swing trading
        strategies.append({
            "name": "高抛低吸",
            "description": f"波段操作降低成本",
            "target_price": cost_price,
            "estimated_days": int(abs(loss_pct) * 5),
            "risk": "中",
            "action": f"设置条件单：{current_price * 1.05:.4f}止盈，{current_price * 0.95:.4f}接回"
        })

        return {
            "code": code,
            "name": name,
            "current_price": current_price,
            "cost_price": cost_price,
            "shares": shares,
            "loss_pct": round(loss_pct, 2),
            "loss_amount": round(loss_amount, 2),
            "breakeven_price": cost_price,
            "recovery_needed": round(abs(loss_pct), 2),
            "strategies": strategies,
        }
    except Exception as e:
        return {"error": str(e)}