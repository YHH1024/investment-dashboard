from fastapi import APIRouter
from db_storage import get_all_watchlist, add_watch, delete_watch

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("/")
def list_watchlist():
    return get_all_watchlist()


@router.post("/")
def create_watch(item: dict):
    return add_watch(item)


@router.delete("/{watch_id}")
def remove_watch(watch_id: int):
    delete_watch(watch_id)
    return {"ok": True}
