from typing import Any

from app.models import Document, Project


class DirectionService:
    def generate(self, project: Project | None = None, documents: list[Document] | None = None) -> dict[str, Any]:
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
