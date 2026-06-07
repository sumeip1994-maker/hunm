from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Artifact, Project
from app.schemas import ApiResponse, ArtifactRead


router = APIRouter(tags=["artifacts"])


@router.get("/projects/{project_id}/artifacts", response_model=ApiResponse[list[ArtifactRead]])
def list_artifacts(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[list[ArtifactRead]]:
    artifacts = db.scalars(select(Artifact).where(Artifact.project_id == project_id).order_by(Artifact.created_at.desc())).all()
    return ApiResponse(data=artifacts)


@router.get("/projects/{project_id}/artifacts/{artifact_type}", response_model=ApiResponse[ArtifactRead])
def get_latest_artifact(project_id: int, artifact_type: str, db: Session = Depends(get_db)) -> ApiResponse[ArtifactRead]:
    artifact = db.scalar(
        select(Artifact)
        .where(Artifact.project_id == project_id, Artifact.type == artifact_type)
        .order_by(desc(Artifact.version))
    )
    if not artifact:
        raise HTTPException(status_code=404, detail="Artifact 不存在")
    return ApiResponse(data=artifact)
