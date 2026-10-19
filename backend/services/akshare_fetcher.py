"""
Stable financial data fetcher using AKShare + Ashare
- Stock real-time: Ashare (Sina + Tencent dual source)
- Stock history: AKShare
- Fund NAV: AKShare
- Fund history: AKShare
"""
import time
import json
import urllib.request

HEADERS = {"User-Agent": "Mozilla/5.0"}

# Cache
_cache = {}
_cache_ttl = 600  # 10 min cache


def _cached_fetch(key, fetch_fn, ttl=None):
    now = time.time()
    ttl = ttl or _cache_ttl
    if key in _cache:
        ct, cd = _cache[key]
        if now - ct < ttl:
            return cd
    result = fetch_fn()
    if result is not None:
        _cache[key] = (now, result)
    return result


# ========== STOCK DATA (AKShare) ==========

def get_stock_realtime(code):
    """Get real-time stock price using AKShare."""
    def _fetch():
        try:
            import akshare as ak
            # Get latest daily data
            import datetime
            end = datetime.datetime.now().strftime("%Y%m%d")
            start = (datetime.datetime.now() - datetime.timedelta(days=30)).strftime("%Y%m%d")
            df = ak.stock_zh_a_hist(symbol=code, period="daily", adjust="qfq", start_date=start, end_date=end)
            if df is None or df.empty:
                return None
            latest = df.iloc[-1]
            prev = df.iloc[-2] if len(df) > 1 else latest
            return {
                "code": code,
                "name": str(latest.get("股票代码", code)),
                "price": float(latest["收盘"]),
                "open": float(latest["开盘"]),
                "high": float(latest["最高"]),
                "low": float(latest["最低"]),
                "change_pct": round(float(latest.get("涨跌幅", 0)), 2),
                "volume": int(latest.get("成交量", 0)),
                "source": "akshare",
            }
        except Exception as e:
            print(f"AKShare stock error: {e}")
            return None
    return _cached_fetch(f"stock_{code}", _fetch, ttl=300)


def get_stock_history(code, days=365):
    """Get stock price history using AKShare."""
    def _fetch():
        try:
            import akshare as ak
            import datetime
            end = datetime.datetime.now().strftime("%Y%m%d")
            start = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime("%Y%m%d")
            df = ak.stock_zh_a_hist(symbol=code, period="daily", adjust="qfq", start_date=start, end_date=end)
            if df is None or df.empty:
                return []
            result = []
            for _, row in df.iterrows():
                result.append({
                    "date": str(row["日期"]),
                    "price": float(row["收盘"]),
                })
            return result
        except Exception as e:
            print(f"AKShare stock history error: {e}")
            return []
    return _cached_fetch(f"stock_hist_{code}_{days}", _fetch, ttl=600)


# ========== FUND DATA (AKShare) ==========

def get_fund_realtime(code):
    """Get fund NAV using AKShare."""
    def _fetch():
        try:
            import akshare as ak
            
            # Try to get fund name from basic info
            fund_name = ""
            try:
                info_df = ak.fund_open_fund_info_em(symbol=code, indicator="基金概况")
                if info_df is not None and not info_df.empty:
                    for _, row in info_df.iterrows():
                        if len(row) >= 2 and "基金名称" in str(row.iloc[0]):
                            fund_name = str(row.iloc[1])
                            break
            except Exception:
                pass
            
            # Get fund NAV history
            df = ak.fund_open_fund_info_em(symbol=code, indicator="单位净值走势")
            if df is None or df.empty:
                return None
            latest = df.iloc[-1]
            prev = df.iloc[-2] if len(df) > 1 else latest
            
            current_nav = float(latest["单位净值"])
            prev_nav = float(prev["单位净值"])
            daily_return = round((current_nav - prev_nav) / prev_nav * 100, 2) if prev_nav > 0 else 0
            
            # Build history
            history = []
            for _, row in df.iterrows():
                history.append({
                    "date": str(row["净值日期"]),
                    "price": float(row["单位净值"]),
                })
            
            # Calculate performance
            def calc_return(days):
                if len(history) < days:
                    return 0
                old = history[-days]["price"]
                new = history[-1]["price"]
                return round((new - old) / old * 100, 2) if old > 0 else 0
            
            return {
                "code": code,
                "name": fund_name,
                "nav": current_nav,
                "daily_return": daily_return,
                "history": history,
                "perf_1y": calc_return(250),
                "perf_6m": calc_return(125),
                "perf_3m": calc_return(60),
                "perf_1m": calc_return(20),
                "source": "akshare",
            }
        except Exception as e:
            print(f"AKShare fund error: {e}")
            return None
    return _cached_fetch(f"fund_{code}", _fetch, ttl=600)


# ========== FUND DETAIL (AKShare) ==========

def get_fund_detail(code):
    """Get fund basic info using AKShare."""
    def _fetch():
        try:
            import akshare as ak
            df = ak.fund_open_fund_info_em(symbol=code, indicator="基金概况")
            if df is None or df.empty:
                return None
            # Parse the info
            info = {}
            for _, row in df.iterrows():
                key = str(row.iloc[0]) if len(row) > 0 else ""
                val = str(row.iloc[1]) if len(row) > 1 else ""
                info[key] = val
            return info
        except Exception as e:
            print(f"AKShare fund detail error: {e}")
            return None
    return _cached_fetch(f"fund_detail_{code}", _fetch, ttl=3600)

def get_fund_ranking():
    """Get fund ranking from AKShare."""
    def _fetch():
        try:
            import akshare as ak
            # Get fund ranking data
            df = ak.fund_open_fund_rank_em(symbol="全部")
            if df is None or df.empty:
                return []
            
            # Convert to list of dicts, filter NaN
            import math
            def safe_float(v, default=0):
                try:
                    f = float(v)
                    return default if math.isnan(f) or math.isinf(f) else f
                except (TypeError, ValueError):
                    return default
            
            funds = []
            for i, row in df.head(100).iterrows():
                funds.append({
                    "code": str(row.get("基金代码", "")),
                    "name": str(row.get("基金简称", "")),
                    "type": str(row.get("基金类型", "混合型")),
                    "nav": safe_float(row.get("单位净值"), 0),
                    "1y_return": safe_float(row.get("近1年"), 0),
                    "3y_return": safe_float(row.get("近3年"), 0),
                    "fee": 0.15,
                    "size": safe_float(row.get("资产规模"), 0),
                })
            return funds
        except Exception as e:
            print(f"AKShare fund ranking error: {e}")
            return []
    return _cached_fetch("fund_ranking", _fetch, ttl=86400)  # Cache for 24 hours

def get_real_news(code=None, limit=20):
    """Fetch real news from eastmoney."""
    def _fetch():
        try:
            import akshare as ak
            if code:
                # Stock-specific news
                df = ak.stock_news_em(symbol=code)
            else:
                # Market news
                df = ak.stock_news_em(symbol="000001")
            
            if df is None or df.empty:
                return []
            
            news = []
            for i, row in df.head(limit).iterrows():
                title = str(row.get("新闻标题", ""))
                content_text = str(row.get("新闻内容", ""))
                url = str(row.get("新闻链接", ""))
                date = str(row.get("发布时间", ""))[:10]
                
                # Determine impact from keywords
                impact = "neutral"
                if any(w in title for w in ["利好", "上涨", "增长", "突破", "创新高", "净买入", "超预期"]):
                    impact = "positive"
                elif any(w in title for w in ["利空", "下跌", "下跌", "亏损", "减持", "破位", "承压"]):
                    impact = "negative"
                
                news.append({
                    "id": i + 1,
                    "title": title,
                    "date": date,
                    "url": url,
                    "impact": impact,
                    "reason": content_text[:100] if content_text else "",
                    "affected": [code] if code else [],
                    "verified": False,
                })
            return news
        except Exception as e:
            print(f"News fetch error: {e}")
            return []
    
    key = f"news_{code}" if code else "news_market"
    return _cached_fetch(key, _fetch, ttl=1800)  # 30min cache
