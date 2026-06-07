from typing import Any


class OutlineService:
    def generate(self) -> dict[str, Any]:
        sections = [
            "标题页",
            "汇报背景",
            "核心问题",
            "资料与证据整理",
            "关键内容分析",
            "讨论",
            "总结",
            "参考文献",
        ]
        return {"sections": [{"title": title, "level": 1} for title in sections]}
