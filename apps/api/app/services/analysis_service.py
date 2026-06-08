from typing import Any

from app.config import Settings
from app.models import Document, Project
from app.services.llm_service import LLMService


class AnalysisService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, project: Project | None = None, documents: list[Document] | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(project, documents or [])
            if llm_result:
                return llm_result

        return {
            "summary": "根据已上传资料，本项目适合整理为一次医学学术分享。",
            "key_questions": [
                "这套PPT要解决的核心临床或学术问题是什么？",
                "现有资料是否足以支撑结论？",
                "是否需要补充指南或高质量文献？",
            ],
            "academic_value": "中高",
            "teaching_value": "高",
            "suggested_focus": ["临床问题引入", "资料证据整合", "PPT结论和讨论页"],
            "risk_notes": ["避免做出未经证据支持的诊疗结论", "病例资料应完成脱敏"],
        }

    def _generate_with_llm(self, project: Project, documents: list[Document]) -> dict[str, Any] | None:
        service = LLMService(self.settings)
        docs_text = "\n\n".join(
            f"文件名: {document.original_filename}\n类型: {document.file_type}\n内容摘要:\n{document.parsed_text[:3000]}"
            for document in documents
        )
        if not docs_text:
            docs_text = "尚未上传资料，请基于项目元信息给出准备建议。"

        system_prompt = (
            "你是医学PPT制作助手，只做资料整理、PPT内容结构建议和风险提醒。"
            "不要给出个体化诊疗决策。必须输出严格 JSON。"
        )
        user_prompt = f"""
请为以下医学PPT项目生成资料提炼结果，输出 JSON，字段必须是：
summary: 字符串
key_questions: 字符串数组
academic_value: 字符串
teaching_value: 字符串
suggested_focus: 字符串数组
risk_notes: 字符串数组

项目名称：{project.title}
PPT类型：{project.presentation_type}
目标听众：{project.audience}
预计时长：{project.duration_minutes}分钟
核心问题：{project.core_question}

资料：
{docs_text}
"""
        result = service.chat_json(system_prompt, user_prompt)
        if not result:
            return None
        return {
            "summary": str(result.get("summary", "")),
            "key_questions": self._as_str_list(result.get("key_questions")),
            "academic_value": str(result.get("academic_value", "")),
            "teaching_value": str(result.get("teaching_value", "")),
            "suggested_focus": self._as_str_list(result.get("suggested_focus")),
            "risk_notes": self._as_str_list(result.get("risk_notes")),
        }

    def _as_str_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []
