import json
from typing import Any
from urllib import error, request

from app.config import Settings


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings

    @property
    def enabled(self) -> bool:
        return bool(self.settings.dashscope_api_key.strip())

    def chat_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        payload = {
            "model": self.settings.llm_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(
            f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
            data=body,
            headers={
                "Authorization": f"Bearer {self.settings.dashscope_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with request.urlopen(http_request, timeout=self.settings.llm_timeout_seconds) as response:
                raw = response.read().decode("utf-8")
        except (TimeoutError, error.URLError, error.HTTPError) as exc:
            raise RuntimeError(f"大模型调用失败: {exc}") from exc

        data = json.loads(raw)
        content = data["choices"][0]["message"]["content"]
        if isinstance(content, dict):
            return content
        return json.loads(content)

    def test_connection(self) -> dict[str, Any]:
        result = self.chat_json(
            "你是连通性测试助手。只输出 JSON。",
            '请返回 {"ok": true, "message": "connected"}',
        )
        return {
            "ok": bool(result and result.get("ok")),
            "message": str(result.get("message", "connected") if result else "not configured"),
            "model": self.settings.llm_model,
            "base_url": self.settings.llm_base_url,
        }
