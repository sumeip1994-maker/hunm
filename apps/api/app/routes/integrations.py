from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.schemas import ApiResponse
from app.services.llm_service import LLMService


router = APIRouter(prefix="/integrations", tags=["integrations"])


class LLMConfigUpdate(BaseModel):
    api_key: str
    model: str = "qwen-plus"
    base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"


@router.get("/llm/status", response_model=ApiResponse[dict[str, Any]])
def llm_status(settings: Settings = Depends(get_settings)) -> ApiResponse[dict[str, Any]]:
    service = LLMService(settings)
    return ApiResponse(data=service.status())


@router.put("/llm/config", response_model=ApiResponse[dict[str, Any]])
def save_llm_config(payload: LLMConfigUpdate, settings: Settings = Depends(get_settings)) -> ApiResponse[dict[str, Any]]:
    service = LLMService(settings)
    return ApiResponse(data=service.save_config(payload.api_key, payload.model, payload.base_url), message="大模型配置已保存")


@router.post("/llm/test", response_model=ApiResponse[dict[str, Any]])
def llm_test(settings: Settings = Depends(get_settings)) -> ApiResponse[dict[str, Any]]:
    service = LLMService(settings)
    if not service.enabled:
        return ApiResponse(
            data={
                "ok": False,
                "message": "未配置 DASHSCOPE_API_KEY，当前会使用 mock 数据。",
                "model": service.model,
                "base_url": service.base_url,
            }
        )
    return ApiResponse(data=service.test_connection(), message="大模型连通性测试完成")
