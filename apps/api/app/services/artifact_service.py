from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import Artifact


def create_artifact(db: Session, project_id: int, artifact_type: str, content: dict[str, Any]) -> Artifact:
    latest = db.scalar(
        select(Artifact)
        .where(Artifact.project_id == project_id, Artifact.type == artifact_type)
        .order_by(desc(Artifact.version))
    )
    artifact = Artifact(
        project_id=project_id,
        type=artifact_type,
        version=(latest.version + 1) if latest else 1,
        content_json=content,
    )
    db.add(artifact)
    db.commit()
    db.refresh(artifact)
    return artifact
