import json
import urllib.request

# ========== AI分析接口（可配置） ==========
# 使用方式：设置环境变量 AI_API_KEY 和 AI_BASE_URL
# 支持 DeepSeek / 硅基流动 / OpenAI / 通义千问 等兼容 OpenAI 格式的 API

import os

AI_API_KEY = os.environ.get("AI_API_KEY", "")
AI_BASE_URL = os.environ.get("AI_BASE_URL", "https://api.deepseek.com/v1")
AI_MODEL = os.environ.get("AI_MODEL", "deepseek-chat")


def call_ai(system_prompt, user_prompt, max_tokens=2000):
    """Call AI API (OpenAI-compatible format)."""
    if not AI_API_KEY:
        return None
    
    url = f"{AI_BASE_URL}/chat/completions"
    payload = json.dumps({
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }).encode("utf-8")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AI_API_KEY}",
    }
    
    try:
        req = urllib.request.Request(url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI API error: {e}")
        return None


def analyze_stock(stock_data):
    """Generate AI analysis for a stock. Returns dict with analysis fields."""
    if not AI_API_KEY:
        return None  # Will use mock data
    
    system = """你是专业的股票投资分析师。根据提供的股票数据，给出简洁的分析结论。
请用以下JSON格式输出（不要输出其他内容）：
{
  "ai_analysis": "一段话总结分析结论",
  "moat": {"品牌": 0-100, "成本": 0-100, "网络": 0-100, "技术": 0-100, "牌照": 0-100},
  "buy_price": 数字,
  "sell_price": 数字,
  "stop_loss": 数字,
  "predictions": {"乐观": 数字, "基准": 数字, "悲观": 数字},
  "risk_level": "低/中/高",
  "recommendation": "买入/持有/卖出"
}"""

    user = f"""分析以下股票：
名称：{stock_data.get('name', '')}
代码：{stock_data.get('code', '')}
行业：{stock_data.get('industry', '')}
当前价格：{stock_data.get('price', 0)}
PE：{stock_data.get('pe', 0)}
PB：{stock_data.get('pb', 0)}
股息率：{stock_data.get('dividend_yield', 0)}%
市值：{stock_data.get('market_cap', 0)}亿"""

    result = call_ai(system, user)
    if not result:
        return None
    
    try:
        # Try to extract JSON from response
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(result[start:end])
    except Exception:
        pass
    return None


def analyze_fund(fund_data):
    """Generate AI analysis for a fund. Returns dict with analysis fields."""
    if not AI_API_KEY:
        return None
    
    system = """你是专业的基金投资分析师。根据提供的基金数据，给出简洁的分析结论。
请用以下JSON格式输出（不要输出其他内容）：
{
  "ai_analysis": "一段话总结分析结论",
  "predictions": {"乐观": 数字, "基准": 数字, "悲观": 数字},
  "risk_level": "低/中/高",
  "recommendation": "买入/持有/定投/卖出",
  "key_factors": [
    {"factor": "因素名", "score": 0-100, "detail": "说明"}
  ]
}"""

    user = f"""分析以下基金：
名称：{fund_data.get('name', '')}
代码：{fund_data.get('code', '')}
类型：{fund_data.get('type', '')}
当前净值：{fund_data.get('nav', 0)}
基金经理：{fund_data.get('manager', '')}
基金公司：{fund_data.get('company', '')}
基金规模：{fund_data.get('size', 0)}亿
近1年收益：{fund_data.get('perf_1y', 0)}%
近3年收益：{fund_data.get('perf_3y', 0)}%"""

    result = call_ai(system, user)
    if not result:
        return None
    
    try:
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(result[start:end])
    except Exception:
        pass
    return None
