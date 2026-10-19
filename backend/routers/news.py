from fastapi import APIRouter
from services.data_fetcher import get_news
from services.news_service import fetch_related_news, get_accuracy_stats

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("/")
def list_news(code: str = None):
    # Try real news first
    try:
        from services.akshare_fetcher import get_real_news
        real = get_real_news(code)
        if real:
            # Sort by date descending (newest first)
            return sorted(real, key=lambda x: x.get('date', ''), reverse=True)
    except Exception as e:
        print(f"Real news error: {e}")
    # Fallback to mock
    if code:
        result = get_news(code)
    else:
        result = get_news()
    return sorted(result, key=lambda x: x.get('date', ''), reverse=True)


@router.get("/related")
def related_news(codes: str = ""):
    code_list = [c.strip() for c in codes.split(",") if c.strip()]
    return fetch_related_news(code_list)


@router.get("/accuracy")
def accuracy():
    return get_accuracy_stats()