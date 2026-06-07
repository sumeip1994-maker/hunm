from typing import Any


class QAService:
    def generate(self) -> dict[str, Any]:
        return {
            "director_questions": ["本次汇报最希望解决的核心问题是什么？", "这个结论对科室实践有什么启示？"],
            "expert_questions": ["关键证据的质量等级如何？", "是否存在与指南不一致的地方？"],
            "methodology_questions": ["纳入资料是否存在选择偏倚？", "统计或研究设计是否支持当前表述？"],
            "reference_answers": ["建议围绕证据来源、适用范围和局限性回答。", "涉及病例资料时应强调已脱敏和不构成诊疗建议。"],
        }
