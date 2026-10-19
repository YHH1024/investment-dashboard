from fastapi import APIRouter
from db_storage import get_all_alerts, add_alert, delete_alert

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/")
def list_alerts():
    alerts = get_all_alerts()
    active = [a for a in alerts if a.get("is_active") and not a.get("is_triggered")]
    triggered = [a for a in alerts if a.get("is_triggered")]
    return {"active": active, "triggered": triggered}


@router.post("/")
def create_alert(item: dict):
    return add_alert(item)


@router.delete("/{alert_id}")
def remove_alert(alert_id: int):
    delete_alert(alert_id)
    return {"ok": True}
