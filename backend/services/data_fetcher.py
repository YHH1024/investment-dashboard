import random
from datetime import datetime, timedelta


def generate_nav_series(code, base_price, days=365, volatility=0.015):
    """Generate realistic NAV series for a fund/stock."""
    data = []
    price = base_price
    start_date = datetime.now() - timedelta(days=days)
    for i in range(days):
        date = start_date + timedelta(days=i)
        if date.weekday() >= 5:
            continue
        change = random.gauss(0.0002, volatility)
        price = price * (1 + change)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(price, 4),
            "volume": random.randint(100000, 5000000),
        })
    return data


def generate_prediction_series(last_price, days=30, scenarios=None):
    """Generate predicted prices for 3 scenarios."""
    if scenarios is None:
        scenarios = [
            {"name": "乐观", "drift": 0.002, "vol": 0.012},
            {"name": "基准", "drift": 0.0005, "vol": 0.015},
            {"name": "悲观", "drift": -0.001, "vol": 0.018},
        ]
    results = {}
    start_date = datetime.now()
    for scenario in scenarios:
        data = []
        price = last_price
        for i in range(1, days + 1):
            date = start_date + timedelta(days=i)
            change = random.gauss(scenario["drift"], scenario["vol"])
            price = price * (1 + change)
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "price": round(price, 4),
            })
        results[scenario["name"]] = data
    return results


# Mock fund data
FUNDS_DB = {
    "000311": {
        "code": "000311",
        "name": "景顺长城沪深300指数增强A",
        "type": "混合型",
        "manager": "黎海威",
        "company": "景顺长城基金",
        "establish_date": "2013-09-27",
        "nav": 2.56,
        "daily_return": 0.82,
        "total_return": 118.56,
        "size": 45.2,
        "fee_rate": 0.12,
        "top10_holdings": [
            {"name": "贵州茅台", "pct": 5.2},
            {"name": "宁德时代", "pct": 4.1},
            {"name": "招商银行", "pct": 3.5},
            {"name": "中国平安", "pct": 3.2},
            {"name": "隆基绿能", "pct": 2.8},
            {"name": "五粮液", "pct": 2.5},
            {"name": "比亚迪", "pct": 2.3},
            {"name": "美的集团", "pct": 2.1},
            {"name": "中信证券", "pct": 1.9},
            {"name": "恒瑞医药", "pct": 1.7},
        ],
        "performance": {"1m": 3.2, "3m": 8.5, "6m": 12.3, "1y": 18.7, "3y": 45.2},
        "benchmark": {"1m": 2.8, "3m": 7.2, "6m": 10.1, "1y": 15.3, "3y": 38.6},
        "ai_analysis": "该基金为沪深300指数增强型基金，近一年超额收益达3.4%，基金经理黎海威量化选股能力突出。当前市场估值处于历史中位数偏下，建议逢低加仓。风险提示：量化策略在极端市场环境下可能失效。",
        "predictions": {"乐观": 2.35, "基准": 2.28, "悲观": 2.10},
    },
    "110011": {
        "code": "110011",
        "name": "易方达中小盘混合",
        "type": "混合型",
        "manager": "张坤",
        "company": "易方达基金",
        "establish_date": "2008-06-19",
        "nav": 6.8234,
        "daily_return": -0.45,
        "total_return": 582.34,
        "size": 312.5,
        "fee_rate": 0.15,
        "top10_holdings": [
            {"name": "贵州茅台", "pct": 9.8},
            {"name": "泸州老窖", "pct": 7.2},
            {"name": "五粮液", "pct": 6.5},
            {"name": "洋河股份", "pct": 5.1},
            {"name": "腾讯控股", "pct": 4.8},
            {"name": "招商银行", "pct": 4.2},
            {"name": "药明康德", "pct": 3.5},
            {"name": "海康威视", "pct": 3.1},
            {"name": "伊利股份", "pct": 2.8},
            {"name": "中国中免", "pct": 2.3},
        ],
        "performance": {"1m": -1.2, "3m": 4.5, "6m": 8.1, "1y": 12.3, "3y": 32.1},
        "benchmark": {"1m": 0.5, "3m": 5.8, "6m": 9.2, "1y": 14.5, "3y": 35.8},
        "ai_analysis": "张坤管理的易方达中小盘长期业绩优异，但近三年受消费板块调整影响回撤较大。当前重仓白酒和消费龙头，估值已回归合理区间。建议持有观望，等待消费复苏信号。",
        "predictions": {"乐观": 7.50, "基准": 7.10, "悲观": 6.20},
    },
    "161725": {
        "code": "161725",
        "name": "招商中证白酒指数(LOF)",
        "type": "指数型",
        "manager": "侯昊",
        "company": "招商基金",
        "establish_date": "2015-05-27",
        "nav": 1.4523,
        "daily_return": 1.23,
        "total_return": 45.23,
        "size": 280.3,
        "fee_rate": 0.10,
        "top10_holdings": [
            {"name": "贵州茅台", "pct": 18.5},
            {"name": "五粮液", "pct": 15.2},
            {"name": "泸州老窖", "pct": 12.8},
            {"name": "山西汾酒", "pct": 8.5},
            {"name": "洋河股份", "pct": 7.2},
            {"name": "古井贡酒", "pct": 5.1},
            {"name": "今世缘", "pct": 3.8},
            {"name": "口子窖", "pct": 2.5},
            {"name": "老白干酒", "pct": 2.1},
            {"name": "水井坊", "pct": 1.9},
        ],
        "performance": {"1m": 5.1, "3m": 12.3, "6m": 8.7, "1y": 15.2, "3y": 28.5},
        "benchmark": {"1m": 4.8, "3m": 11.5, "6m": 8.2, "1y": 14.8, "3y": 27.1},
        "ai_analysis": "白酒指数基金紧密跟踪中证白酒指数，当前白酒板块估值处于近5年低位，具备配置价值。但需注意消费复苏不及预期的风险。建议定投布局，不建议一次性大额买入。",
        "predictions": {"乐观": 1.65, "基准": 1.55, "悲观": 1.30},
    },
    "001156": {
        "code": "001156",
        "name": "申万菱信新能源汽车主题灵活配置混合",
        "type": "混合型",
        "manager": "付娟",
        "company": "申万菱信基金",
        "nav": 1.978,
        "daily_return": -1.54,
        "total_return": -5.2,
        "size": 15.8,
        "fee_rate": 0.15,
        "top10_holdings": [{"name": "宁德时代", "pct": 8.5}, {"name": "比亚迪", "pct": 6.2}, {"name": "亿纬锂能", "pct": 4.8}, {"name": "天赐材料", "pct": 3.9}, {"name": "璞泰来", "pct": 3.2}, {"name": "恩捷股份", "pct": 2.8}, {"name": "科达利", "pct": 2.5}, {"name": "先导智能", "pct": 2.1}, {"name": "汇川技术", "pct": 1.8}, {"name": "阳光电源", "pct": 1.5}],
        "performance": {"1m": -10.7, "3m": -12.79, "6m": -34.37, "1y": -15.97, "3y": 0},
        "benchmark": {"1m": -8.0, "3m": -10.0, "6m": -25.0, "1y": -10.0, "3y": 0},
        "ai_analysis": "该基金重仓新能源汽车产业链，近一年亏损15.97%。当前估值已处于历史低位，建议观望等待企稳。",
        "predictions": {"乐观": 2.20, "基准": 2.05, "悲观": 1.80},
    },
}

STOCKS_DB = {
    "601933": {
        "code": "601933",
        "name": "永辉超市",
        "industry": "零售",
        "price": 2.87,
        "daily_return": 2.15,
        "pe": 35.2,
        "pb": 1.85,
        "dividend_yield": 1.2,
        "pe_percentile": 42,
        "pb_percentile": 28,
        "market_cap": 538.2,
        "moat": {"品牌": 60, "成本": 75, "网络": 80, "技术": 45, "牌照": 50},
        "ai_analysis": "永辉超市作为国内超市龙头，正在推进数字化转型。当前PE 35倍处于历史中位数附近，PB 1.85倍处于历史低位。短期受消费复苏预期提振，但竞争压力较大。",
        "buy_price": 5.20,
        "sell_price": 7.50,
        "stop_loss": 4.80,
        "recovery_plan": "当前价位距成本价约-15%。建议：1) 若持有超过6个月，可继续持有等待消费复苏；2) 若持有不足3个月，建议在5.5元以下分批补仓，降低成本至5.4元；3) 止损位设在4.8元，跌破后清仓。",
        "predictions": {"乐观": 7.20, "基准": 6.50, "悲观": 4.80},
    },
    "600036": {
        "code": "600036",
        "name": "招商银行",
        "industry": "银行",
        "price": 42.67,
        "daily_return": 0.45,
        "pe": 6.8,
        "pb": 0.95,
        "dividend_yield": 4.5,
        "pe_percentile": 15,
        "pb_percentile": 10,
        "market_cap": 8975.3,
        "moat": {"品牌": 90, "成本": 70, "网络": 95, "技术": 75, "牌照": 95},
        "ai_analysis": "招商银行是国内零售银行龙头，ROE长期保持在15%以上。当前PE仅6.8倍，处于历史极低分位，PB 0.95倍接近破净。高股息率4.5%提供安全垫。建议积极配置，长期持有。",
        "buy_price": 32.00,
        "sell_price": 45.00,
        "stop_loss": 28.00,
        "recovery_plan": "招行基本面扎实，当前估值极具吸引力。建议：1) 35元以下均可加仓；2) 长期持有享受分红；3) 若短期被套，耐心持有，银行股波动较小，回本概率高。",
        "predictions": {"乐观": 42.00, "基准": 38.50, "悲观": 30.00},
    },
}

TOP_FUNDS = [
    {"code": "000311", "name": "景顺长城沪深300指数增强A", "type": "混合型", "nav": 2.56, "1y_return": 18.7, "3y_return": 45.2, "fee": 0.12, "size": 45.2},
    {"code": "110011", "name": "易方达中小盘混合", "type": "混合型", "nav": 6.8234, "1y_return": 12.3, "3y_return": 32.1, "fee": 0.15, "size": 312.5},
    {"code": "161725", "name": "招商中证白酒指数(LOF)", "type": "指数型", "nav": 1.4523, "1y_return": 15.2, "3y_return": 28.5, "fee": 0.10, "size": 280.3},
    {"code": "005827", "name": "易方达蓝筹精选混合", "type": "混合型", "nav": 1.8532, "1y_return": 8.5, "3y_return": 22.3, "fee": 0.15, "size": 520.1},
    {"code": "001938", "name": "中欧时代先锋股票A", "type": "股票型", "nav": 2.3456, "1y_return": 22.1, "3y_return": 55.8, "fee": 0.12, "size": 85.3},
    {"code": "007119", "name": "华夏创业板ETF联接A", "type": "指数型", "nav": 1.2345, "1y_return": 15.8, "3y_return": 35.2, "fee": 0.05, "size": 120.5},
    {"code": "519736", "name": "交银定期支付双息平衡混合", "type": "混合型", "nav": 3.4567, "1y_return": 10.2, "3y_return": 25.8, "fee": 0.12, "size": 45.8},
    {"code": "260108", "name": "景顺长城新兴成长混合", "type": "混合型", "nav": 4.1234, "1y_return": 18.5, "3y_return": 42.1, "fee": 0.15, "size": 168.2},
    {"code": "163406", "name": "兴全合润分级混合", "type": "混合型", "nav": 1.9876, "1y_return": 14.2, "3y_return": 38.5, "fee": 0.12, "size": 95.6},
    {"code": "519697", "name": "交银优势行业混合", "type": "混合型", "nav": 5.6789, "1y_return": 16.8, "3y_return": 48.2, "fee": 0.15, "size": 125.3},
    {"code": "000961", "name": "天弘沪深300ETF联接A", "type": "指数型", "nav": 1.4567, "1y_return": 12.5, "3y_return": 30.1, "fee": 0.05, "size": 280.5},
    {"code": "110022", "name": "易方达消费行业股票", "type": "股票型", "nav": 3.7891, "1y_return": 9.8, "3y_return": 18.5, "fee": 0.15, "size": 195.3},
    {"code": "001156", "name": "申万菱信新能源汽车主题灵活配置混合", "type": "混合型", "nav": 2.3456, "1y_return": 25.3, "3y_return": 62.1, "fee": 0.12, "size": 78.5},
    {"code": "005311", "name": "万家行业优选混合(LOF)", "type": "混合型", "nav": 2.1234, "1y_return": 20.1, "3y_return": 48.5, "fee": 0.12, "size": 55.2},
    {"code": "519772", "name": "交银施罗德定期支付双息平衡混合", "type": "混合型", "nav": 1.8976, "1y_return": 11.5, "3y_return": 28.3, "fee": 0.12, "size": 42.1},
    {"code": "001875", "name": "前海开源沪港深优势精选灵活配置混合", "type": "混合型", "nav": 1.5678, "1y_return": 16.2, "3y_return": 35.8, "fee": 0.12, "size": 38.5},
    {"code": "001714", "name": "工银文体产业股票", "type": "股票型", "nav": 2.8912, "1y_return": 19.5, "3y_return": 45.2, "fee": 0.12, "size": 62.3},
    {"code": "003095", "name": "中欧医疗健康混合A", "type": "混合型", "nav": 1.2345, "1y_return": -8.5, "3y_return": -25.2, "fee": 0.15, "size": 280.5},
    {"code": "001104", "name": "华安新丝路主题股票", "type": "股票型", "nav": 2.4567, "1y_return": 21.3, "3y_return": 52.1, "fee": 0.12, "size": 45.8},
    {"code": "001476", "name": "景顺长城环保优势股票", "type": "股票型", "nav": 1.9876, "1y_return": 15.8, "3y_return": 38.5, "fee": 0.12, "size": 35.2},
]

NEWS_DB = [
    {"id": 1, "url": "https://finance.eastmoney.com/a/202610152889000000.html", "title": "央行宣布降准0.5个百分点 释放长期资金约1万亿元", "date": "2026-10-15", "affected": ["600036", "000311"], "impact": "positive", "reason": "降准释放流动性，利好银行股和大盘", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
    {"id": 2, "url": "https://finance.eastmoney.com/a/202610142888000000.html", "title": "贵州茅台三季度净利润同比增长18% 超市场预期", "date": "2026-10-14", "affected": ["161725", "110011"], "impact": "positive", "reason": "茅台业绩超预期带动白酒板块上涨", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
    {"id": 3, "url": "https://finance.eastmoney.com/a/202610132887000000.html", "title": "国务院发布促消费20条措施", "date": "2026-10-13", "affected": ["601933", "161725"], "impact": "positive", "reason": "消费刺激政策利好零售和白酒板块", "verified": True, "predicted_impact": "positive", "actual_impact": "neutral"},
    {"id": 4, "url": "https://finance.eastmoney.com/a/202610122886000000.html", "title": "美联储暗示可能再次加息 全球市场承压", "date": "2026-10-12", "affected": ["000311", "600036"], "impact": "negative", "reason": "加息预期压制风险资产，外资可能流出", "verified": True, "predicted_impact": "negative", "actual_impact": "negative"},
    {"id": 5, "url": "https://finance.eastmoney.com/a/202610112885000000.html", "title": "永辉超市与美团达成战略合作 布局即时零售", "date": "2026-10-11", "affected": ["601933"], "impact": "positive", "reason": "战略合作打开新增长空间", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
    {"id": 6, "url": "https://finance.eastmoney.com/a/202610102884000000.html", "title": "沪深300指数编制方案调整 新增15只成分股", "date": "2026-10-10", "affected": ["000311"], "impact": "neutral", "reason": "指数调整对跟踪基金有短期调仓影响", "verified": False, "predicted_impact": "neutral", "actual_impact": None},
    {"id": 7, "url": "https://finance.eastmoney.com/a/202610092883000000.html", "title": "银行净息差持续收窄 银行业面临盈利压力", "date": "2026-10-09", "affected": ["600036"], "impact": "negative", "reason": "净息差下降影响银行利润增长", "verified": True, "predicted_impact": "negative", "actual_impact": "negative"},
    {"id": 8, "url": "https://finance.eastmoney.com/a/202610082882000000.html", "title": "北向资金连续5日净买入 累计超200亿元", "date": "2026-10-08", "affected": ["000311", "600036", "601933"], "impact": "positive", "reason": "外资持续流入提振市场信心", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
    {"id": 9, "url": "https://finance.eastmoney.com/a/202610072881000000.html", "title": "中秋国庆假期消费数据出炉 零售额同比增8.5%", "date": "2026-10-07", "affected": ["601933", "161725", "110011"], "impact": "positive", "reason": "假期消费数据超预期", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
    {"id": 10, "url": "https://finance.eastmoney.com/a/202610062880000000.html", "title": "A股两市成交额突破1.2万亿 创近3个月新高", "date": "2026-10-06", "affected": ["000311", "600036", "601933"], "impact": "positive", "reason": "放量上涨显示市场情绪好转", "verified": True, "predicted_impact": "positive", "actual_impact": "positive"},
]

SKILLS_DB = [
    {
        "name": "investment-analysis",
        "display_name": "投资分析",
        "description": "使用stock-analytics-skill框架分析基金、股票、宏观数据",
        "status": "installed",
        "enabled": True,
        "sub_skills": [
            {"name": "fund-analysis", "display_name": "基金分析", "enabled": True, "description": "分析基金历史业绩、持仓、基金经理、风险指标"},
            {"name": "stock-analysis", "display_name": "股票分析", "enabled": True, "description": "分析股票估值、护城河、买卖点位"},
            {"name": "macro-analysis", "display_name": "宏观分析", "enabled": True, "description": "分析宏观经济数据、政策影响"},
            {"name": "portfolio-review", "display_name": "持仓诊断", "enabled": False, "description": "分析持仓风险收益比、行业集中度"},
        ],
        "config": {"api_provider": "eastmoney", "cache_ttl": 3600, "max_tokens": 4096},
        "usage": [
            {"date": "2026-10-15", "sub_skill": "fund-analysis", "tokens": 2048, "cost": 0.02},
            {"date": "2026-10-14", "sub_skill": "stock-analysis", "tokens": 3072, "cost": 0.03},
            {"date": "2026-10-13", "sub_skill": "macro-analysis", "tokens": 1536, "cost": 0.015},
        ],
    },
    {
        "name": "news-monitor",
        "display_name": "新闻监控",
        "description": "实时监控财经新闻，分析对持仓的影响",
        "status": "installed",
        "enabled": True,
        "sub_skills": [
            {"name": "news-fetch", "display_name": "新闻抓取", "enabled": True, "description": "从多个财经源抓取新闻"},
            {"name": "impact-analysis", "display_name": "影响分析", "enabled": True, "description": "分析新闻对持仓的正负面影响"},
            {"name": "alert-trigger", "display_name": "提醒触发", "enabled": True, "description": "重大新闻自动触发提醒"},
        ],
        "config": {"sources": ["eastmoney", "sina", "cls"], "check_interval": 300, "max_tokens": 2048},
        "usage": [
            {"date": "2026-10-15", "sub_skill": "news-fetch", "tokens": 1024, "cost": 0.01},
            {"date": "2026-10-15", "sub_skill": "impact-analysis", "tokens": 2048, "cost": 0.02},
        ],
    },
    {
        "name": "dca-strategy",
        "display_name": "定投策略",
        "description": "定投回测、策略优化、智能定投建议",
        "status": "installed",
        "enabled": True,
        "sub_skills": [
            {"name": "dca-backtest", "display_name": "定投回测", "enabled": True, "description": "历史定投收益回测"},
            {"name": "smart-dca", "display_name": "智能定投", "enabled": True, "description": "根据估值自动调整定投金额"},
        ],
        "config": {"default_frequency": "monthly", "smart_mode": True},
        "usage": [
            {"date": "2026-10-12", "sub_skill": "dca-backtest", "tokens": 4096, "cost": 0.04},
        ],
    },
    {
        "name": "risk-management",
        "display_name": "风险管理",
        "description": "仓位管理、止损策略、风险预警",
        "status": "installed",
        "enabled": False,
        "sub_skills": [
            {"name": "position-sizing", "display_name": "仓位管理", "enabled": True, "description": "根据风险偏好建议仓位"},
            {"name": "stop-loss", "display_name": "止损策略", "enabled": True, "description": "设置和监控止损位"},
        ],
        "config": {"max_drawdown": 15, "risk_tolerance": "moderate"},
        "usage": [],
    },
    {
        "name": "ai-prediction",
        "display_name": "AI预测",
        "description": "基于DeepSeek V3的走势预测",
        "status": "available",
        "enabled": False,
        "sub_skills": [
            {"name": "price-prediction", "display_name": "价格预测", "enabled": False, "description": "30天价格走势预测"},
            {"name": "sentiment-analysis", "display_name": "情绪分析", "enabled": False, "description": "市场情绪指标分析"},
        ],
        "config": {"model": "deepseek-v3", "prediction_days": 30},
        "usage": [],
    },
]


def get_fund_data(code):
    return FUNDS_DB.get(code)


def get_stock_data(code):
    return STOCKS_DB.get(code)


def get_nav_history(code, period="1y"):
    days_map = {"1m": 30, "3m": 90, "6m": 180, "1y": 365, "3y": 1095}
    days = days_map.get(period, 365)
    if code in FUNDS_DB:
        return generate_nav_series(code, FUNDS_DB[code]["nav"] * 0.85, days)
    elif code in STOCKS_DB:
        return generate_nav_series(code, STOCKS_DB[code]["price"] * 0.8, days)
    return generate_nav_series(code, 1.0, days)


def get_predictions(code):
    if code in FUNDS_DB:
        last = FUNDS_DB[code]["nav"]
    elif code in STOCKS_DB:
        last = STOCKS_DB[code]["price"]
    else:
        last = 1.0
    return generate_prediction_series(last)


def get_news(code=None):
    if code:
        return [n for n in NEWS_DB if code in n["affected"]]
    return NEWS_DB


def get_top_funds():
    return TOP_FUNDS