import re
import json
import time
import urllib.request

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

# Cache
_cache = {}
_cache_ttl = 300  # 5 min


def fetch_url(url, timeout=15):
    now = time.time()
    if url in _cache:
        ct, cd = _cache[url]
        if now - ct < _cache_ttl:
            return cd
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read().decode("utf-8", errors="ignore")
                _cache[url] = (now, data)
                return data
        except Exception as e:
            if attempt < 2:
                time.sleep(0.5)
                continue
            return ""


# ========== STOCK DATA (multi-source) ==========

def get_stock_eastmoney(code):
    """Source 1: Eastmoney push2 API."""
    secid = f"1.{code}" if code.startswith("6") else f"0.{code}"
    url = f"https://push2.eastmoney.com/api/qt/stock/get?secid={secid}&fields=f43,f44,f45,f46,f47,f48,f57,f58,f170"
    text = fetch_url(url)
    if not text:
        return None
    try:
        data = json.loads(text).get("data", {})
        if not data or not data.get("f43"):
            return None
        return {
            "code": data.get("f57", code),
            "name": data.get("f58", ""),
            "price": data.get("f43", 0) / 100,
            "high": data.get("f44", 0) / 100,
            "low": data.get("f45", 0) / 100,
            "open": data.get("f46", 0) / 100,
            "change_pct": data.get("f170", 0) / 100,
            "source": "eastmoney",
        }
    except Exception:
        return None


def get_stock_sina(code):
    """Source 2: Sina Finance API."""
    prefix = "sh" if code.startswith("6") else "sz"
    url = f"https://hq.sinajs.cn/list={prefix}{code}"
    text = fetch_url(url)
    if not text or "failed" in text.lower():
        return None
    try:
        # Format: var hq_str_sh600036="招商银行,42.66,42.74,42.45,..."
        parts = text.split('"')[1].split(",")
        if len(parts) < 4:
            return None
        return {
            "code": code,
            "name": parts[0],
            "price": float(parts[3]),  # current price
            "open": float(parts[1]),
            "high": float(parts[4]),
            "low": float(parts[5]),
            "change_pct": round((float(parts[3]) - float(parts[2])) / float(parts[2]) * 100, 2) if float(parts[2]) > 0 else 0,
            "source": "sina",
        }
    except Exception:
        return None


def get_stock_realtime(code):
    """Get stock data with fallback: Eastmoney -> Sina -> Mock."""
    # Try Eastmoney first
    result = get_stock_eastmoney(code)
    if result and result.get("price", 0) > 0:
        return result
    
    # Fallback to Sina
    result = get_stock_sina(code)
    if result and result.get("price", 0) > 0:
        return result
    
    # Both failed, return None (will use mock data)
    return None


# ========== FUND DATA ==========

def get_fund_realtime(code):
    """Get fund NAV from eastmoney pingzhongdata API."""
    url = f"https://fund.eastmoney.com/pingzhongdata/{code}.js"
    text = fetch_url(url)
    if not text:
        return None
    try:
        name_m = re.search(r'fS_name\s*=\s*"([^"]+)"', text)
        nav_data = re.search(r'Data_netWorthTrend\s*=\s*(\[.*?\]);', text, re.DOTALL)
        perf_1y = re.search(r'syl_1n\s*=\s*"([^"]+)"', text)
        perf_6m = re.search(r'syl_6y\s*=\s*"([^"]+)"', text)
        perf_3m = re.search(r'syl_3y\s*=\s*"([^"]+)"', text)
        perf_1m = re.search(r'syl_1y\s*=\s*"([^"]+)"', text)

        name = name_m.group(1) if name_m else ""
        nav_history = []
        if nav_data:
            try:
                nav_list = json.loads(nav_data.group(1))
                for item in nav_list[-365:]:
                    ts = item.get("x", 0) / 1000
                    dt = time.strftime("%Y-%m-%d", time.localtime(ts))
                    nav_history.append({"date": dt, "price": item.get("y", 0)})
            except Exception:
                pass

        current_nav = nav_history[-1]["price"] if nav_history else 0
        daily_return = 0
        if len(nav_history) >= 2:
            prev = nav_history[-2]["price"]
            if prev > 0:
                daily_return = round((current_nav - prev) / prev * 100, 2)

        return {
            "code": code,
            "name": name,
            "nav": current_nav,
            "daily_return": daily_return,
            "history": nav_history,
            "perf_1y": float(perf_1y.group(1)) if perf_1y else 0,
            "perf_6m": float(perf_6m.group(1)) if perf_6m else 0,
            "perf_3m": float(perf_3m.group(1)) if perf_3m else 0,
            "perf_1m": float(perf_1m.group(1)) if perf_1m else 0,
            "source": "eastmoney",
        }
    except Exception as e:
        return None


def get_stock_history(code, days=365):
    """Fetch stock price history from eastmoney kline API."""
    secid = f"1.{code}" if code.startswith("6") else f"0.{code}"
    url = f"https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57&klt=101&fqt=0&end=20500101&lmt={days}"
    text = fetch_url(url)
    if not text:
        return []
    try:
        data = json.loads(text).get("data", {})
        klines = data.get("klines", [])
        result = []
        for k in klines:
            parts = k.split(",")
            if len(parts) >= 2:
                result.append({"date": parts[0], "price": float(parts[1])})
        return result
    except Exception:
        return []
