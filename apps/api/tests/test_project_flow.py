from pathlib import Path

from fastapi.testclient import TestClient


def create_project(client: TestClient) -> int:
    response = client.post(
        "/projects",
        json={
            "title": "验收测试汇报",
            "presentation_type": "case_presentation",
            "audience": "科室医生",
            "duration_minutes": 20,
            "core_question": "如何形成清晰的学术汇报结构？",
        },
    )
    assert response.status_code == 200
    return int(response.json()["data"]["id"])


def test_project_to_ppt_flow(client: TestClient, tmp_path: Path) -> None:
    project_id = create_project(client)

    upload = client.post(
        f"/projects/{project_id}/documents",
        files={"file": ("note.docx", b"mock document", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert upload.status_code == 200
    assert upload.json()["data"]["original_filename"] == "note.docx"

    analysis = client.post(f"/projects/{project_id}/analyze")
    assert analysis.status_code == 200
    assert analysis.json()["data"]["type"] == "analysis_report"

    outline = client.post(f"/projects/{project_id}/outline")
    assert outline.status_code == 200
    assert outline.json()["data"]["type"] == "outline"

    ppt = client.post(f"/projects/{project_id}/ppt")
    assert ppt.status_code == 200
    assert ppt.json()["data"]["download_url"] == f"/projects/{project_id}/ppt/download"

    download = client.get(f"/projects/{project_id}/ppt/download")
    assert download.status_code == 200
    assert download.headers["content-type"] == "application/vnd.openxmlformats-officedocument.presentationml.presentation"


def test_artifact_versions_increment(client: TestClient) -> None:
    project_id = create_project(client)

    first = client.post(f"/projects/{project_id}/analyze")
    second = client.post(f"/projects/{project_id}/analyze")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["data"]["version"] == 1
    assert second.json()["data"]["version"] == 2
