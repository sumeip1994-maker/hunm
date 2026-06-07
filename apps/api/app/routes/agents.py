from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project
from app.schemas import ApiResponse, ArtifactRead
from app.services.analysis_service import AnalysisService
from app.services.artifact_service import create_artifact
from app.services.direction_service import DirectionService
from app.services.outline_service import OutlineService
from app.services.qa_service import QAService
from app.services.review_service import ReviewService
from app.services.script_service import ScriptService


router = APIRouter(prefix="/projects/{project_id}", tags=["mock agents"])


def require_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.post("/analyze", response_model=ApiResponse[ArtifactRead])
def analyze(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "analysis_report", AnalysisService().generate())
    project.status = "analyzed"
    db.commit()
    return ApiResponse(data=artifact, message="AI分析已生成")


@router.post("/directions", response_model=ApiResponse[ArtifactRead])
def directions(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    require_project(db, project_id)
    artifact = create_artifact(db, project_id, "direction_recommendation", DirectionService().generate())
    return ApiResponse(data=artifact, message="汇报方向已生成")


@router.post("/outline", response_model=ApiResponse[ArtifactRead])
def outline(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "outline", OutlineService().generate())
    project.status = "outline_ready"
    db.commit()
    return ApiResponse(data=artifact, message="目录已生成")


@router.post("/review", response_model=ApiResponse[ArtifactRead])
def review(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "review_report", ReviewService().generate())
    project.status = "reviewed"
    db.commit()
    return ApiResponse(data=artifact, message="审稿建议已生成")


@router.post("/qa", response_model=ApiResponse[ArtifactRead])
def qa(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    require_project(db, project_id)
    artifact = create_artifact(db, project_id, "qa_report", QAService().generate())
    return ApiResponse(data=artifact, message="专家问答已生成")


@router.post("/script", response_model=ApiResponse[ArtifactRead])
def script(project_id: int, duration: int = Query(default=20), db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    require_project(db, project_id)
    artifact = create_artifact(db, project_id, "script", ScriptService().generate(duration))
    return ApiResponse(data=artifact, message="讲稿已生成")
