from typing import Any


class ScriptService:
    def generate(self, duration: int) -> dict[str, Any]:
        minutes = duration if duration in (10, 20, 30) else 20
        return {
            "duration_minutes": minutes,
            "slides": [
                {"slide_no": 1, "title": "标题页", "script": "各位老师好，今天汇报的主题是本项目的核心学术问题。", "estimated_time": "1分钟", "transition": "下面进入背景部分。"},
                {"slide_no": 2, "title": "汇报背景", "script": "本页用于说明问题来源、资料基础和听众需要关注的重点。", "estimated_time": "3分钟", "transition": "接下来聚焦核心问题。"},
                {"slide_no": 3, "title": "核心内容", "script": "围绕资料证据进行梳理，避免超出证据范围作出判断。", "estimated_time": f"{max(minutes - 6, 4)}分钟", "transition": "最后总结本次汇报。"},
                {"slide_no": 4, "title": "总结", "script": "回到核心问题，概括本次汇报的主要收获和后续可补充方向。", "estimated_time": "2分钟", "transition": "感谢各位老师。"},
            ],
        }
