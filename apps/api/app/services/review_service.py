from typing import Any

from app.models import Project


class ReviewService:
    def generate(self, project: Project | None = None) -> dict[str, Any]:
        core_question = project.core_question if project else "核心问题"
        return {
            "academic_score": 82,
            "logic_score": 86,
            "evidence_score": 78,
            "visual_score": 80,
            "issues": [
                f"需要在开头更明确“{core_question}”和后续内容之间的对应关系",
                "部分结论需要标注证据来源，避免听众误解为诊疗建议",
                "讨论页可进一步明确适用范围、局限性和争议点",
            ],
            "suggestions": [
                "补充指南、共识或高质量文献引用，并在页脚保留来源",
                "每一页只保留一个主观点，正文控制在3到5条以内",
                "增加“已有资料支持什么 / 仍不确定什么 / 下一步补什么”三段式总结",
            ],
            "priority_fixes": ["补证据来源", "压缩页面文字", "强化结论边界"],
        }
