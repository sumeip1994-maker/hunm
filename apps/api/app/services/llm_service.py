import json
from typing import Any
from urllib import error, request

from app.config import Settings


LLM_PROVIDERS: dict[str, dict[str, Any]] = {
    "bailian": {
        "label": "阿里云百炼",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "default_model": "qwen-plus",
        "models": ["qwen3.7-plus", "qwen-plus", "qwen-max", "qwen-turbo", "qwen-long"],
    },
    "bailian_coding": {
        "label": "阿里云百炼 Coding Plan",
        "base_url": "https://coding.dashscope.aliyuncs.com/v1",
        "default_model": "qwen3.7-plus",
        "models": [
            "qwen3.7-plus",
            "qwen3.6-plus",
            "kimi-k2.5",
            "glm-5",
            "MiniMax-M2.5",
            "qwen3.5-plus",
            "qwen3-max-2026-01-23",
            "qwen3-coder-next",
            "qwen3-coder-plus",
            "glm-4.7",
        ],
    },
    "deepseek": {
        "label": "DeepSeek",
        "base_url": "https://api.deepseek.com",
        "default_model": "deepseek-chat",
        "models": ["deepseek-chat", "deepseek-reasoner"],
    },
    "volcengine": {
        "label": "火山方舟",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "default_model": "doubao-seed-1-6",
        "models": ["doubao-seed-1-6", "doubao-seed-1-6-thinking", "deepseek-v3", "deepseek-r1"],
    },
    "volcengine_coding": {
        "label": "火山方舟 Coding Plan",
        "base_url": "https://ark.cn-beijing.volces.com/api/coding/v3",
        "default_model": "ark-code-latest",
        "supports_response_format": False,
        "models": [
            "ark-code-latest",
            "doubao-seed-code",
            "doubao-seed-2.0-code",
            "deepseek-v3.2",
            "kimi-k2.5",
            "glm-4.7",
        ],
    },
}


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
    def provider(self) -> str:
        provider = str(self.config.get("provider") or "bailian").strip()
        return provider if provider in LLM_PROVIDERS else "bailian"

    @property
    def provider_config(self) -> dict[str, Any]:
        return LLM_PROVIDERS[self.provider]

    @property
    def base_url(self) -> str:
        return str(self.config.get("base_url") or self.provider_config["base_url"]).strip()

    @property
    def model(self) -> str:
        return str(self.config.get("model") or self.provider_config["default_model"]).strip()

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "provider": self.provider,
            "provider_label": self.provider_config["label"],
            "model": self.model,
            "base_url": self.base_url,
            "api_key_configured": self.enabled,
            "providers": LLM_PROVIDERS,
        }

    def save_config(self, api_key: str, provider: str, model: str, base_url: str | None = None) -> dict[str, Any]:
        provider_key = provider if provider in LLM_PROVIDERS else "bailian"
        provider_config = LLM_PROVIDERS[provider_key]
        next_api_key = api_key.strip() or self.api_key
        next_base_url = (base_url or "").strip()
        if next_api_key.startswith("sk-sp-") and provider_key == "bailian":
            provider_key = "bailian_coding"
            provider_config = LLM_PROVIDERS[provider_key]
            next_base_url = str(provider_config["base_url"])
        data = {
            "api_key": next_api_key,
            "provider": provider_key,
            "model": model.strip() or str(provider_config["default_model"]),
            "base_url": next_base_url or str(provider_config["base_url"]),
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
        }
        if self.provider_config.get("supports_response_format", True):
            payload["response_format"] = {"type": "json_object"}
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
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"大模型调用失败: HTTP {exc.code} {detail}") from exc
        except (TimeoutError, error.URLError) as exc:
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
