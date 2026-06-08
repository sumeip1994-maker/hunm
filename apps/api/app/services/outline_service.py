from typing import Any

from app.models import Document, Project


class OutlineService:
    def generate(self, project: Project | None = None, documents: list[Document] | None = None) -> dict[str, Any]:
        core_question = project.core_question if project else ""
        doc_count = len(documents or [])
        sections = [
            "标题页",
            "汇报背景与问题来源",
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
                "结论页不要写成诊疗建议，应写成证据范围内的汇报结论。",
            ],
        }

    def _goal_for(self, title: str) -> str:
        if "核心问题" in title:
            return "让听众明确本次汇报要回答什么。"
        if "证据" in title or "资料" in title:
            return "交代资料来源、质量和局限。"
        if "讨论" in title:
            return "引导专家围绕争议点和适用边界讨论。"
        if "结论" in title:
            return "收束观点，给出可继续完善的方向。"
        return "支撑汇报叙事。"
