from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import Project
from app.schemas import ApiResponse
from app.services.ppt_service import PPTService


router = APIRouter(prefix="/projects/{project_id}/ppt", tags=["ppt"])


@router.post("", response_model=ApiResponse[dict[str, str]])
def generate_ppt(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[dict[str, str]]:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    result = PPTService().generate(db, settings, project)
    return ApiResponse(data=result, message="PPT已生成")


@router.get("/download")
def download_ppt(project_id: int, settings: Settings = Depends(get_settings)) -> FileResponse:
    path = Path(settings.output_path) / f"project_{project_id}_presentation.pptx"
    if not path.exists():
        raise HTTPException(status_code=404, detail="PPT 文件不存在，请先生成")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=path.name,
    )
