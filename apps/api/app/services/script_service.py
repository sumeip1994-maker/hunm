from typing import Any

from app.models import Project


class ScriptService:
    def generate(self, duration: int, project: Project | None = None) -> dict[str, Any]:
        minutes = duration if duration in (10, 20, 30) else 20
        title = project.title if project else "本次汇报"
        core_question = project.core_question if project else "核心问题"
        return {
            "duration_minutes": minutes,
            "opening": f"各位老师好，我今天汇报的主题是《{title}》。这次汇报会围绕“{core_question}”展开。",
            "slides": [
                {"slide_no": 1, "title": "标题页", "script": f"各位老师好，今天汇报《{title}》。我会先说明问题来源，再梳理现有资料，最后把可讨论的结论和局限呈现出来。", "estimated_time": "1分钟", "transition": "下面进入背景部分。"},
                {"slide_no": 2, "title": "汇报背景", "script": f"本页重点说明为什么要讨论“{core_question}”。建议从临床场景、教学需求或学术争议切入，让听众知道这个问题为什么值得讨论。", "estimated_time": "3分钟", "transition": "明确背景后，接下来聚焦本次汇报的问题。"},
                {"slide_no": 3, "title": "核心问题与资料", "script": "这里建议把资料分为病例资料、文献证据、指南或已有PPT三类。讲述时只保留与核心问题相关的信息，避免把所有资料都平铺出来。", "estimated_time": f"{max(minutes // 3, 3)}分钟", "transition": "资料基础交代清楚后，进入关键发现。"},
                {"slide_no": 4, "title": "关键发现与讨论", "script": "这一部分按证据链展开：先讲最直接的观察，再讲支持或反驳的证据，最后说明局限。涉及诊疗判断时，要强调这是汇报讨论，不替代个体化诊疗决策。", "estimated_time": f"{max(minutes - 8, 4)}分钟", "transition": "最后回到本次汇报最想传达的结论。"},
                {"slide_no": 5, "title": "总结", "script": f"回到“{core_question}”，用三句话总结：第一，已有资料支持什么；第二，仍然不确定什么；第三，后续还需要补充什么证据或讨论。", "estimated_time": "2分钟", "transition": "我的汇报到这里，欢迎各位老师批评指正。"},
            ],
            "closing": "我的汇报到此结束，感谢各位老师。欢迎从证据充分性、适用范围和后续补充资料三个角度提出建议。",
        }
