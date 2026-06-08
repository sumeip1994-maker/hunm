from typing import Any

from app.config import Settings
from app.models import Project
from app.services.llm_service import LLMService


class ScriptService:
    def __init__(self, settings: Settings | None = None):
        self.settings = settings

    def generate(self, duration: int, project: Project | None = None) -> dict[str, Any]:
        if self.settings and project:
            llm_result = self._generate_with_llm(duration, project)
            if llm_result:
                return llm_result

        minutes = duration if duration in (10, 20, 30) else 20
        title = project.title if project else "本套PPT"
        core_question = project.core_question if project else "核心问题"
        return {
            "duration_minutes": minutes,
            "opening": f"本套PPT的主题是《{title}》，内容围绕“{core_question}”组织。",
            "slides": [
                {"slide_no": 1, "title": "标题页", "script": f"页面备注：标题聚焦《{title}》，副标题建议补充场景、科室或资料来源。", "estimated_time": "1分钟", "transition": "下一页进入背景。"},
                {"slide_no": 2, "title": "PPT背景", "script": f"页面备注：说明为什么要讨论“{core_question}”，用临床场景、教学需求或学术争议切入。", "estimated_time": "3分钟", "transition": "背景之后聚焦核心问题。"},
                {"slide_no": 3, "title": "核心问题与资料", "script": "页面备注：把资料分为病例资料、文献证据、指南或已有PPT三类，只保留与核心问题相关的信息。", "estimated_time": f"{max(minutes // 3, 3)}分钟", "transition": "资料基础交代清楚后，进入关键发现。"},
                {"slide_no": 4, "title": "关键发现与讨论", "script": "页面备注：按证据链展开，先讲观察，再讲支持或反驳证据，最后说明局限。避免写成个体化诊疗建议。", "estimated_time": f"{max(minutes - 8, 4)}分钟", "transition": "最后回到这套PPT最想传达的结论。"},
                {"slide_no": 5, "title": "总结", "script": f"页面备注：回到“{core_question}”，用三句话总结已有资料支持什么、仍不确定什么、后续还需要补充什么。", "estimated_time": "2分钟", "transition": "PPT到这里收束。"},
            ],
            "closing": "页面备注：结尾页建议保留证据充分性、适用范围和后续补充资料三个收束点。",
        }

    def _generate_with_llm(self, duration: int, project: Project) -> dict[str, Any] | None:
        minutes = duration if duration in (10, 20, 30) else 20
        result = LLMService(self.settings).chat_json(
            "你是医学PPT页面备注助手。只输出严格 JSON，语言克制，避免诊疗指令。",
            f"""
请为医学PPT生成页面备注，输出 JSON：
duration_minutes: 数字
opening: 字符串
slides: 数组，每项包含 slide_no、title、script、estimated_time、transition
closing: 字符串

项目名称：{project.title}
PPT类型：{project.presentation_type}
目标听众：{project.audience}
核心问题：{project.core_question}
""",
        )
        if not result:
            return None
        slides = result.get("slides")
        if not isinstance(slides, list):
            return None
        normalized = []
        for index, item in enumerate(slides[:12], start=1):
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "slide_no": int(item.get("slide_no") or index),
                    "title": str(item.get("title", "")),
                    "script": str(item.get("script", "")),
                    "estimated_time": str(item.get("estimated_time", "")),
                    "transition": str(item.get("transition", "")),
                }
            )
        return {
            "duration_minutes": minutes,
            "opening": str(result.get("opening", "")),
            "slides": normalized,
            "closing": str(result.get("closing", "")),
        }
