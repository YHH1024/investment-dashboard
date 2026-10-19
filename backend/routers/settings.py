from fastapi import APIRouter
from db_storage import get_all_settings, set_setting, get_setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/")
def get_settings():
    settings = get_all_settings()
    # Add defaults
    defaults = {
        "ai_api_key": "",
        "ai_base_url": "https://api.deepseek.com/v1",
        "ai_model": "deepseek-chat",
        "ai_enabled": False,
        "data_refresh_interval": 300,
        "stock_source": "auto",
    }
    for k, v in defaults.items():
        if k not in settings:
            settings[k] = v
    # Mask API key for security - don't return actual key
    if settings.get("ai_api_key"):
        key = str(settings["ai_api_key"])
        settings["ai_api_key_masked"] = key[:8] + "..." + key[-4:] if len(key) > 12 else "***"
        settings["ai_api_key"] = ""  # Don't return actual key
    return settings


@router.post("/")
def update_settings(data: dict):
    for k, v in data.items():
        set_setting(k, v)
    return {"ok": True, "message": "Settings saved."}


@router.post("/test-ai")
def test_ai_connection():
    settings = get_all_settings()
    if not settings.get("ai_api_key") or not settings.get("ai_enabled"):
        return {"success": False, "error": "AI not configured"}
    
    try:
        import json
        import urllib.request
        url = f"{settings.get('ai_base_url', 'https://api.deepseek.com/v1')}/chat/completions"
        payload = json.dumps({
            "model": settings.get("ai_model", "deepseek-chat"),
            "messages": [{"role": "user", "content": "Say hello"}],
            "max_tokens": 10,
        }).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings['ai_api_key']}",
        }
        req = urllib.request.Request(url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("choices"):
                return {"success": True, "model": settings.get("ai_model")}
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": False, "error": "No response"}
