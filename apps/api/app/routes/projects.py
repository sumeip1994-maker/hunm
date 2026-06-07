from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project
from app.schemas import ApiResponse, ProjectCreate, ProjectRead, ProjectUpdate


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ApiResponse[list[ProjectRead]])
def list_projects(db: Session = Depends(get_db)) -> ApiResponse[list[ProjectRead]]:
    projects = db.scalars(select(Project).order_by(Project.created_at.desc())).all()
    return ApiResponse(data=projects)


@router.post("", response_model=ApiResponse[ProjectRead])
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ApiResponse[ProjectRead]:
    project = Project(**payload.model_dump(), status="draft")
    db.add(project)
    db.commit()
    db.refresh(project)
    return ApiResponse(data=project, message="项目已创建")


@router.get("/{project_id}", response_model=ApiResponse[ProjectRead])
def get_project(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[ProjectRead]:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return ApiResponse(data=project)


@router.patch("/{project_id}", response_model=ApiResponse[ProjectRead])
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)) -> ApiResponse[ProjectRead]:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return ApiResponse(data=project, message="项目已更新")


@router.delete("/{project_id}", response_model=ApiResponse[dict[str, bool]])
def delete_project(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict[str, bool]]:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    db.delete(project)
    db.commit()
    return ApiResponse(data={"deleted": True}, message="项目已删除")
