from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ArtifactRead(BaseModel):
    id: int
    project_id: int
    type: str
    version: int
    content_json: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
