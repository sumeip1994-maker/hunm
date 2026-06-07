from datetime import datetime
from typing import Optional
from typing import Literal

from pydantic import BaseModel, ConfigDict


PresentationType = Literal[
    "case_presentation",
    "teaching_round",
    "literature_review",
    "guideline_review",
    "academic_lecture",
    "research_report",
    "department_report",
    "custom",
]
ProjectStatus = Literal["draft", "uploaded", "analyzed", "outline_ready", "ppt_ready", "reviewed"]


class ProjectBase(BaseModel):
    title: str
    presentation_type: PresentationType
    audience: str
    duration_minutes: int
    core_question: str


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    presentation_type: Optional[PresentationType] = None
    audience: Optional[str] = None
    duration_minutes: Optional[int] = None
    core_question: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectRead(ProjectBase):
    id: int
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
