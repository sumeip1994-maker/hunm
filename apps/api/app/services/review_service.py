from typing import Any

from app.config import Settings
from app.models import Project
from app.services.llm_service import LLMService


class ReviewService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, project: Project | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(project)
            if llm_result:
                return llm_result

        core_question = project.core_question if project else "核心问题"
        return {
            "academic_score": 82,
            "logic_score": 86,
            "evidence_score": 78,
            "visual_score": 80,
            "issues": [
                f"需要在开头更明确“{core_question}”和后续内容之间的对应关系",
                "部分结论需要标注证据来源，避免听众误解为诊疗建议",
                "讨论页可进一步明确适用范围、局限性和争议点",
            ],
            "suggestions": [
                "补充指南、共识或高质量文献引用，并在页脚保留来源",
                "每一页只保留一个主观点，正文控制在3到5条以内",
                "增加“已有资料支持什么 / 仍不确定什么 / 下一步补什么”三段式总结",
            ],
            "priority_fixes": ["补证据来源", "压缩页面文字", "强化结论边界"],
        }

    def _generate_with_llm(self, project: Project) -> dict[str, Any] | None:
        result = LLMService(self.settings).chat_json(
            "你是医学学术 PPT 审稿助手。只输出严格 JSON，不给个体化诊疗建议。",
            f"""
请按学术性、逻辑性、证据支撑、视觉表达审阅这个医学汇报项目，输出 JSON：
academic_score: 0-100 数字
logic_score: 0-100 数字
evidence_score: 0-100 数字
visual_score: 0-100 数字
issues: 字符串数组
suggestions: 字符串数组
priority_fixes: 字符串数组

项目名称：{project.title}
汇报类型：{project.presentation_type}
目标听众：{project.audience}
预计时长：{project.duration_minutes}分钟
核心问题：{project.core_question}
""",
        )
        if not result:
            return None
        return {
            "academic_score": self._score(result.get("academic_score")),
            "logic_score": self._score(result.get("logic_score")),
            "evidence_score": self._score(result.get("evidence_score")),
            "visual_score": self._score(result.get("visual_score")),
            "issues": self._as_str_list(result.get("issues")),
            "suggestions": self._as_str_list(result.get("suggestions")),
            "priority_fixes": self._as_str_list(result.get("priority_fixes")),
        }

    def _score(self, value: Any) -> int:
        try:
            return max(0, min(100, int(value)))
        except (TypeError, ValueError):
            return 0

    def _as_str_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []
