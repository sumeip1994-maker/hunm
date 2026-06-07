from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import Document
from app.schemas import ApiResponse, DocumentRead
from app.services.document_service import save_upload


router = APIRouter(tags=["documents"])


@router.post("/projects/{project_id}/documents", response_model=ApiResponse[DocumentRead])
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ApiResponse[DocumentRead]:
    document = await save_upload(db, settings, project_id, file)
    return ApiResponse(data=document, message="资料已上传")


@router.get("/projects/{project_id}/documents", response_model=ApiResponse[list[DocumentRead]])
def list_documents(project_id: int, db: Session = Depends(get_db)) -> ApiResponse[list[DocumentRead]]:
    documents = db.scalars(select(Document).where(Document.project_id == project_id).order_by(Document.created_at.desc())).all()
    return ApiResponse(data=documents)


@router.get("/documents/{document_id}", response_model=ApiResponse[DocumentRead])
def get_document(document_id: int, db: Session = Depends(get_db)) -> ApiResponse[DocumentRead]:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="资料不存在")
    return ApiResponse(data=document)


@router.delete("/documents/{document_id}", response_model=ApiResponse[dict[str, bool]])
def delete_document(document_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict[str, bool]]:
    document = db.get(Document, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="资料不存在")
    db.delete(document)
    db.commit()
    return ApiResponse(data={"deleted": True}, message="资料已删除")
