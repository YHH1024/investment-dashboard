from fastapi import APIRouter
from services.data_fetcher import SKILLS_DB

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("/")
def list_skills():
    return SKILLS_DB


@router.get("/{name}")
def skill_detail(name: str):
    for s in SKILLS_DB:
        if s["name"] == name:
            return s
    return {"error": "技能未找到"}


@router.put("/{name}/toggle")
def toggle_skill(name: str):
    for s in SKILLS_DB:
        if s["name"] == name:
            s["enabled"] = not s["enabled"]
            return s
    return {"error": "技能未找到"}


@router.put("/{name}/sub-skills/{sub_name}/toggle")
def toggle_sub_skill(name: str, sub_name: str):
    for s in SKILLS_DB:
        if s["name"] == name:
            for sub in s["sub_skills"]:
                if sub["name"] == sub_name:
                    sub["enabled"] = not sub["enabled"]
                    return s
    return {"error": "子技能未找到"}