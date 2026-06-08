from typing import Any

from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.schemas import ApiResponse
from app.services.llm_service import LLMService


router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/llm/status", response_model=ApiResponse[dict[str, Any]])
def llm_status(settings: Settings = Depends(get_settings)) -> ApiResponse[dict[str, Any]]:
    service = LLMService(settings)
    return ApiResponse(
        data={
            "enabled": service.enabled,
            "provider": "aliyun-bailian-compatible",
            "model": settings.llm_model,
            "base_url": settings.llm_base_url,
            "api_key_configured": service.enabled,
        }
    )


@router.post("/llm/test", response_model=ApiResponse[dict[str, Any]])
def llm_test(settings: Settings = Depends(get_settings)) -> ApiResponse[dict[str, Any]]:
    service = LLMService(settings)
    if not service.enabled:
        return ApiResponse(
            data={
                "ok": False,
                "message": "未配置 DASHSCOPE_API_KEY，当前会使用 mock 数据。",
                "model": settings.llm_model,
                "base_url": settings.llm_base_url,
            }
        )
    return ApiResponse(data=service.test_connection(), message="大模型连通性测试完成")
