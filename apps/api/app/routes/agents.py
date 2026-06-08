from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import Project
from app.schemas import ApiResponse, ArtifactRead
from app.services.analysis_service import AnalysisService
from app.services.artifact_service import create_artifact
from app.services.direction_service import DirectionService
from app.services.outline_service import OutlineService
from app.services.ppt_service import PPTService
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
def analyze(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(
        db,
        project_id,
        "analysis_report",
        AnalysisService(settings).generate(project, list(project.documents)),
    )
    project.status = "analyzed"
    db.commit()
    return ApiResponse(data=artifact, message="AI分析已生成")


@router.post("/directions", response_model=ApiResponse[ArtifactRead])
def directions(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "direction_recommendation", DirectionService(settings).generate(project, list(project.documents)))
    return ApiResponse(data=artifact, message="PPT制作方案已生成")


@router.post("/outline", response_model=ApiResponse[ArtifactRead])
def outline(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "outline", OutlineService(settings).generate(project, list(project.documents)))
    project.status = "outline_ready"
    db.commit()
    return ApiResponse(data=artifact, message="目录已生成")


@router.post("/review", response_model=ApiResponse[ArtifactRead])
def review(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "review_report", ReviewService(settings).generate(project))
    project.status = "reviewed"
    db.commit()
    return ApiResponse(data=artifact, message="PPT优化建议已生成")


@router.post("/qa", response_model=ApiResponse[ArtifactRead])
def qa(
    project_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "qa_report", QAService(settings).generate(project))
    return ApiResponse(data=artifact, message="答疑备忘已生成")


@router.post("/script", response_model=ApiResponse[ArtifactRead])
def script(
    project_id: int,
    duration: int = Query(default=20),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[ArtifactRead]:
    project = require_project(db, project_id)
    artifact = create_artifact(db, project_id, "script", ScriptService(settings).generate(duration, project))
    return ApiResponse(data=artifact, message="页面备注已生成")


@router.post("/workflow", response_model=ApiResponse[dict[str, object]])
def workflow(
    project_id: int,
    duration: int = Query(default=20),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[dict[str, object]]:
    project = require_project(db, project_id)
    documents = list(project.documents)
    steps: list[dict[str, str]] = []

    create_artifact(db, project_id, "analysis_report", AnalysisService(settings).generate(project, documents))
    steps.append({"key": "analysis", "label": "AI分析"})
    create_artifact(db, project_id, "direction_recommendation", DirectionService(settings).generate(project, documents))
    steps.append({"key": "directions", "label": "PPT方案"})
    create_artifact(db, project_id, "outline", OutlineService(settings).generate(project, documents))
    steps.append({"key": "outline", "label": "页面大纲"})

    ppt_result = PPTService().generate(db, settings, project)
    steps.append({"key": "ppt", "label": "PPT生成"})
    create_artifact(db, project_id, "review_report", ReviewService(settings).generate(project))
    steps.append({"key": "review", "label": "PPT优化建议"})

    project.status = "reviewed"
    db.commit()
    return ApiResponse(data={"steps": steps, "ppt": ppt_result}, message="完整工作流已完成")
