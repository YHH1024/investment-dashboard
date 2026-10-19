"""
Skill-based AI Analysis Engine
Reads actual skill methodologies and uses AI to generate structured analysis.
"""
import os
import json
import re
import urllib.request

SKILLS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", ".hermes", "skills")

# Load skill content
def load_skill(name, path="SKILL.md"):
    skill_path = os.path.join(SKILLS_DIR, name, path)
    if os.path.exists(skill_path):
        with open(skill_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def _get_proxy_handler():
    """Get proxy handler for urllib."""
    import os
    proxy = os.environ.get("https_proxy") or os.environ.get("HTTPS_PROXY")
    if not proxy:
        # Try common proxy ports
        for port in [7890, 1080, 8080]:
            try:
                import socket
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(1)
                s.connect(("127.0.0.1", port))
                s.close()
                proxy = f"http://127.0.0.1:{port}"
                break
            except:
                continue
    if proxy:
        return urllib.request.ProxyHandler({"http": proxy, "https": proxy})
    return None


def call_ai(system_prompt, user_prompt, max_tokens=3000):
    """Call AI API with skill methodology."""
    # Load settings from db
    try:
        from db_storage import get_all_settings
        settings = get_all_settings()
        api_key = settings.get("ai_api_key", "")
        base_url = settings.get("ai_base_url", "https://api.deepseek.com/v1")
        model = settings.get("ai_model", "deepseek-chat")
        enabled = settings.get("ai_enabled", False)
    except Exception:
        return None

    if not api_key or not enabled:
        return None

    url = f"{base_url}/chat/completions"
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
    }).encode("utf-8")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    try:
        # Use proxy if available
        proxy_handler = _get_proxy_handler()
        if proxy_handler:
            opener = urllib.request.build_opener(proxy_handler)
        else:
            opener = urllib.request.build_opener()
        
        req = urllib.request.Request(url, data=payload, headers=headers)
        with opener.open(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"AI API error: {e}")
        return None


def analyze_stock_with_skill(stock_data):
    """Analyze stock using stock-analytics-skill methodology."""
    skill_content = load_skill("serenity-skill")

    system = f"""你是一个专业的股票投资分析师，使用 stock-analytics-skill 的分析框架。

分析框架：
1. 基本面分析：PE/PB/股息率/市值
2. 护城河评估：品牌/成本/网络/技术/牌照（0-100分）
3. 估值判断：PE历史分位、安全边际
4. 操作建议：买入价/卖出价/止损价
5. 30天预测：乐观/基准/悲观三个价格

请用以下JSON格式输出（不要输出其他内容）：
{{
  "ai_analysis": "一段话总结分析结论",
  "moat": {{"品牌": 0-100, "成本": 0-100, "网络": 0-100, "技术": 0-100, "牌照": 0-100}},
  "buy_price": 数字,
  "sell_price": 数字,
  "stop_loss": 数字,
  "predictions": {{"乐观": 数字, "基准": 数字, "悲观": 数字}},
  "risk_level": "低/中/高",
  "recommendation": "买入/持有/卖出"
}}"""

    user = f"""分析以下股票：
名称：{stock_data.get('name', '')}
代码：{stock_data.get('code', '')}
行业：{stock_data.get('industry', '')}
当前价格：{stock_data.get('price', 0)}
PE：{stock_data.get('pe', 0)}
PB：{stock_data.get('pb', 0)}
股息率：{stock_data.get('dividend_yield', 0)}%
市值：{stock_data.get('market_cap', 0)}亿

请用 stock-analytics-skill 的框架进行分析。"""

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


def analyze_fund_with_skill(fund_data):
    """Analyze fund using stock-analytics-skill methodology."""
    system = """你是一个专业的基金投资分析师，使用 stock-analytics-skill 的 fund-comparison 和 broad-index-etf-analysis 框架。

分析框架：
1. 基金概况：基金经理、规模、成立时间
2. 业绩分析：近1月/3月/6月/1年/3年收益 vs 基准 vs 同类
3. 风险评估：夏普比率、最大回撤、波动率
4. 30天预测：乐观/基准/悲观三个净值
5. 操作建议：买入/持有/定投/卖出

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
近3年收益：{fund_data.get('perf_3y', 0)}%
费率：{fund_data.get('fee_rate', 0)}%

请用 stock-analytics-skill 的框架进行分析。"""

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
