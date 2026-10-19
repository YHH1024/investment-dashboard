"""News service (mock)."""
from services.data_fetcher import get_news


def fetch_related_news(codes):
    all_news = []
    for code in codes:
        all_news.extend(get_news(code))
    seen = set()
    unique = []
    for n in all_news:
        if n["id"] not in seen:
            seen.add(n["id"])
            unique.append(n)
    return unique


def get_accuracy_stats():
    news = get_news()
    verified = [n for n in news if n["verified"]]
    correct = [n for n in verified if n.get("predicted_impact") == n.get("actual_impact")]
    total = len(verified) if verified else 1
    return {
        "total_predictions": len(verified),
        "correct_predictions": len(correct),
        "accuracy_rate": round(len(correct) / total * 100, 1),
        "positive_accuracy": 85.7,
        "negative_accuracy": 100.0,
        "neutral_accuracy": 50.0,
    }