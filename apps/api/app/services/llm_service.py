import json
from typing import Any
from urllib import error, request

from app.config import Settings


class LLMService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.config = self._read_config()

    @property
    def enabled(self) -> bool:
        return bool(self.api_key.strip())

    @property
    def api_key(self) -> str:
        return str(self.config.get("api_key") or self.settings.dashscope_api_key).strip()

    @property
    def base_url(self) -> str:
        return str(self.config.get("base_url") or self.settings.llm_base_url).strip()

    @property
    def model(self) -> str:
        return str(self.config.get("model") or self.settings.llm_model).strip()

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "provider": "aliyun-bailian-compatible",
            "model": self.model,
            "base_url": self.base_url,
            "api_key_configured": self.enabled,
        }

    def save_config(self, api_key: str, model: str, base_url: str) -> dict[str, Any]:
        data = {
            "api_key": api_key.strip(),
            "model": model.strip() or self.settings.llm_model,
            "base_url": base_url.strip() or self.settings.llm_base_url,
        }
        self.settings.llm_config_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        self.config = data
        return self.status()

    def chat_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        body = json.dumps(payload).encode("utf-8")
        http_request = request.Request(
            f"{self.base_url.rstrip('/')}/chat/completions",
            data=body,
            headers={
                "Authorization": f"Bearer {self.api_key}",
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
            "model": self.model,
            "base_url": self.base_url,
        }

    def _read_config(self) -> dict[str, Any]:
        path = self.settings.llm_config_file
        if not path.exists():
            return {}
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return {}
        return data if isinstance(data, dict) else {}
