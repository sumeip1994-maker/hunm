from typing import Any

from app.config import Settings
from app.models import Project
from app.services.llm_service import LLMService


class QAService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, project: Project | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(project)
            if llm_result:
                return llm_result

        core_question = project.core_question if project else "这套PPT的核心问题"
        return {
            "director_questions": [
                f"你希望通过这套PPT把“{core_question}”呈现到什么程度？",
                "这个结论对科室教学、流程改进或后续研究有什么启示？",
            ],
            "expert_questions": [
                "关键证据的质量等级如何？是否有指南或共识支持？",
                "是否存在与既往研究或临床经验不一致的地方？",
                "如果资料不足，你准备优先补充哪一类证据？",
            ],
            "methodology_questions": [
                "纳入资料是否存在选择偏倚？",
                "研究设计或样本量是否足以支撑当前表述？",
                "病例资料是否已经完成脱敏，是否避免了可识别信息？",
            ],
            "reference_answers": [
                "回答时先承认资料边界，再说明已有证据支持的部分。",
                "涉及病例资料时强调已脱敏，并说明PPT仅用于学术讨论。",
                "对专家追问可采用“证据来源、适用范围、局限性、后续计划”的顺序回答。",
            ],
        }

    def _generate_with_llm(self, project: Project) -> dict[str, Any] | None:
        result = LLMService(self.settings).chat_json(
            "你是医学PPT答疑备忘助手。只输出严格 JSON，回答应强调证据边界和脱敏。",
            f"""
请为该医学PPT生成可能追问和答疑备忘，输出 JSON：
director_questions: 字符串数组
expert_questions: 字符串数组
methodology_questions: 字符串数组
reference_answers: 字符串数组

项目名称：{project.title}
PPT类型：{project.presentation_type}
目标听众：{project.audience}
预计时长：{project.duration_minutes}分钟
核心问题：{project.core_question}
""",
        )
        if not result:
            return None
        return {
            "director_questions": self._as_str_list(result.get("director_questions")),
            "expert_questions": self._as_str_list(result.get("expert_questions")),
            "methodology_questions": self._as_str_list(result.get("methodology_questions")),
            "reference_answers": self._as_str_list(result.get("reference_answers")),
        }

    def _as_str_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []
