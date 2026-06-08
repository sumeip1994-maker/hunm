from typing import Any

from app.config import Settings
from app.models import Document, Project
from app.services.llm_service import LLMService


class OutlineService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, project: Project | None = None, documents: list[Document] | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(project, documents or [])
            if llm_result:
                return llm_result

        core_question = project.core_question if project else ""
        doc_count = len(documents or [])
        sections = [
            "标题页",
            "PPT背景与问题来源",
            f"核心问题：{core_question}" if core_question else "核心问题",
            f"资料基础与证据来源（{doc_count}份资料）" if doc_count else "资料基础与待补充证据",
            "关键发现与证据解读",
            "讨论：适用范围、局限性与争议点",
            "结论与下一步计划",
            "参考文献",
        ]
        return {
            "sections": [{"title": title, "level": 1, "goal": self._goal_for(title)} for title in sections],
            "notes": [
                "每页只保留一个主要观点，避免堆叠大段文字。",
                "涉及病例和检查结果时先脱敏，再展示必要信息。",
                "结论页不要写成诊疗建议，应写成证据范围内的PPT结论。",
            ],
        }

    def _generate_with_llm(self, project: Project, documents: list[Document]) -> dict[str, Any] | None:
        docs_text = "\n\n".join(
            f"文件名: {document.original_filename}\n类型: {document.file_type}\n内容摘要:\n{document.parsed_text[:2500]}"
            for document in documents
        ) or "尚未上传资料。"
        result = LLMService(self.settings).chat_json(
            "你是医学PPT页面大纲策划助手。只输出严格 JSON，不输出诊疗建议。",
            f"""
请生成医学PPT页面大纲，输出 JSON：
sections: 数组，每项包含 title、level、goal。
notes: 字符串数组。
大纲控制在 6 到 9 个页面/章节，标题要具体，围绕核心问题组织。

项目名称：{project.title}
PPT类型：{project.presentation_type}
目标听众：{project.audience}
核心问题：{project.core_question}

资料：
{docs_text}
""",
        )
        if not result:
            return None
        sections = result.get("sections")
        if not isinstance(sections, list):
            return None
        normalized = []
        for item in sections[:9]:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "title": str(item.get("title", "")),
                    "level": int(item.get("level") or 1),
                    "goal": str(item.get("goal", "")),
                }
            )
        return {"sections": normalized, "notes": self._as_str_list(result.get("notes"))} if normalized else None

    def _goal_for(self, title: str) -> str:
        if "核心问题" in title:
            return "让读者明确这套PPT要回答什么。"
        if "证据" in title or "资料" in title:
            return "交代资料来源、质量和局限。"
        if "讨论" in title:
            return "引导专家围绕争议点和适用边界讨论。"
        if "结论" in title:
            return "收束观点，给出可继续完善的方向。"
            return "支撑PPT叙事。"

    def _as_str_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []
