from fastapi import APIRouter

from app.schemas import ApiResponse


router = APIRouter(tags=["health"])


@router.get("/health", response_model=ApiResponse[dict[str, str]])
def health() -> ApiResponse[dict[str, str]]:
    return ApiResponse(data={"status": "ok", "service": "medical-presentation-studio-api"})
