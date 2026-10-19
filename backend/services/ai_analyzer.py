"""DeepSeek V3 AI analysis service (mock)."""


def analyze_fund(code, fund_data):
    return {
        "conclusion": fund_data.get("ai_analysis", "暂无分析数据"),
        "risk_level": "中等",
        "recommendation": "持有",
        "confidence": 0.78,
        "key_factors": [
            {"factor": "估值水平", "score": 75, "detail": "当前估值处于历史中位数"},
            {"factor": "业绩趋势", "score": 82, "detail": "近一年业绩排名同类前30%"},
            {"factor": "基金经理", "score": 85, "detail": "基金经理任职超过5年，经验丰富"},
            {"factor": "风险控制", "score": 70, "detail": "最大回撤控制在同类平均水平"},
        ],
    }


def analyze_stock(code, stock_data):
    return {
        "conclusion": stock_data.get("ai_analysis", "暂无分析数据"),
        "valuation": {
            "pe": stock_data.get("pe", 0),
            "pe_percentile": stock_data.get("pe_percentile", 50),
            "pb": stock_data.get("pb", 0),
            "pb_percentile": stock_data.get("pb_percentile", 50),
            "dividend_yield": stock_data.get("dividend_yield", 0),
        },
        "moat": stock_data.get("moat", {}),
        "recommendation": "买入" if stock_data.get("pe", 100) < 10 else "持有",
        "buy_price": stock_data.get("buy_price", 0),
        "sell_price": stock_data.get("sell_price", 0),
        "stop_loss": stock_data.get("stop_loss", 0),
        "recovery_plan": stock_data.get("recovery_plan", ""),
    }