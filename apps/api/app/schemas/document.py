from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


DocumentCategory = Literal["case_material", "literature", "image", "data", "existing_ppt", "other"]
FileType = Literal["pdf", "pptx", "docx", "image", "excel", "other"]


class DocumentRead(BaseModel):
    id: int
    project_id: int
    filename: str
    original_filename: str
    file_type: FileType
    file_path: str
    file_size: int
    parsed_text: str
    document_category: DocumentCategory
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
