from typing import Any


class DirectionService:
    def generate(self) -> dict[str, Any]:
        return {
            "directions": [
                {
                    "name": "临床问题驱动型汇报",
                    "scenario": "适合病例讨论、科室教学和疑难问题复盘。",
                    "reason": "以核心问题组织资料，便于听众跟随诊疗逻辑和证据链。",
                    "structure": ["问题提出", "资料整理", "证据分析", "讨论与总结"],
                },
                {
                    "name": "证据整合型汇报",
                    "scenario": "适合文献解读、指南更新和学术分享。",
                    "reason": "突出研究证据质量、适用人群和临床启示。",
                    "structure": ["背景", "证据来源", "关键发现", "实践启示"],
                },
                {
                    "name": "教学查房型汇报",
                    "scenario": "适合住培教学、带教汇报和病例教学。",
                    "reason": "兼顾知识点、思维路径和互动提问。",
                    "structure": ["病例导入", "关键节点", "知识拓展", "带教总结"],
                },
            ]
        }
