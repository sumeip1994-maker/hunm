from typing import Any


class ReviewService:
    def generate(self) -> dict[str, Any]:
        return {
            "academic_score": 82,
            "logic_score": 86,
            "evidence_score": 78,
            "visual_score": 80,
            "issues": ["部分结论需要标注证据来源", "讨论页可进一步明确临床或学术边界"],
            "suggestions": ["补充指南或高质量文献引用", "减少大段文字，增强章节之间的过渡"],
        }
