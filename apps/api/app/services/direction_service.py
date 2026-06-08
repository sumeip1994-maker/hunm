from typing import Any

from app.config import Settings
from app.models import Document, Project
from app.services.llm_service import LLMService


class DirectionService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, project: Project | None = None, documents: list[Document] | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(project, documents or [])
            if llm_result:
                return llm_result

        title = project.title if project else "本项目"
        core_question = project.core_question if project else "核心医学问题"
        has_documents = bool(documents)
        return {
            "directions": [
                {
                    "name": "问题驱动型学术汇报",
                    "scenario": f"适合围绕“{core_question or title}”展开病例讨论、科室教学或疑难问题复盘。",
                    "reason": "先抛出听众真正关心的问题，再按资料和证据逐层推进，现场讨论感更强。",
                    "structure": ["临床/学术问题", "已有资料", "证据与局限", "可讨论结论", "后续补充"],
                    "recommended": True,
                },
                {
                    "name": "证据整合型汇报",
                    "scenario": "适合文献解读、指南更新、科研进展或学术会议分享。",
                    "reason": "突出证据来源、证据质量、适用人群和临床启示，便于形成严谨结论。",
                    "structure": ["研究背景", "资料来源", "关键发现", "证据等级", "实践启示"],
                    "recommended": has_documents,
                },
                {
                    "name": "教学查房型汇报",
                    "scenario": "适合住培教学、带教汇报、病例教学和科室内部培训。",
                    "reason": "把知识点、临床思维路径和互动提问放在同一条线上，适合带教场景。",
                    "structure": ["病例/问题导入", "关键节点", "诊疗思维", "知识拓展", "带教总结"],
                    "recommended": False,
                },
            ]
        }

    def _generate_with_llm(self, project: Project, documents: list[Document]) -> dict[str, Any] | None:
        docs_text = "\n\n".join(
            f"文件名: {document.original_filename}\n类型: {document.file_type}\n内容摘要:\n{document.parsed_text[:2500]}"
            for document in documents
        ) or "尚未上传资料。"
        result = LLMService(self.settings).chat_json(
            "你是医学学术汇报策划助手。只输出严格 JSON，不输出个体化诊疗建议。",
            f"""
请为医学学术汇报生成 3 个可选汇报方向，输出 JSON：
directions: 数组，每项包含 name、scenario、reason、structure、recommended。
structure 是字符串数组，recommended 是布尔值。

项目名称：{project.title}
汇报类型：{project.presentation_type}
目标听众：{project.audience}
预计时长：{project.duration_minutes}分钟
核心问题：{project.core_question}

资料：
{docs_text}
""",
        )
        if not result:
            return None
        directions = result.get("directions")
        if not isinstance(directions, list):
            return None
        normalized = []
        for item in directions[:3]:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "name": str(item.get("name", "")),
                    "scenario": str(item.get("scenario", "")),
                    "reason": str(item.get("reason", "")),
                    "structure": self._as_str_list(item.get("structure")),
                    "recommended": bool(item.get("recommended")),
                }
            )
        return {"directions": normalized} if normalized else None

    def _as_str_list(self, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if value:
            return [str(value)]
        return []
