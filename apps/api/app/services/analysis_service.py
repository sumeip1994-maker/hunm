from typing import Any


class AnalysisService:
    def generate(self) -> dict[str, Any]:
        return {
            "summary": "根据已上传资料，本项目适合整理为一次医学学术分享。",
            "key_questions": [
                "本次汇报的核心临床或学术问题是什么？",
                "现有资料是否足以支撑结论？",
                "是否需要补充指南或高质量文献？",
            ],
            "academic_value": "中高",
            "teaching_value": "高",
            "suggested_focus": ["临床问题引入", "资料证据整合", "汇报结论和讨论"],
            "risk_notes": ["避免做出未经证据支持的诊疗结论", "病例资料应完成脱敏"],
        }
