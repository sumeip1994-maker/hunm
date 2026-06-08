from typing import Any

from app.models import Project


class QAService:
    def generate(self, project: Project | None = None) -> dict[str, Any]:
        core_question = project.core_question if project else "本次汇报的核心问题"
        return {
            "director_questions": [
                f"你希望通过这次汇报把“{core_question}”推进到什么程度？",
                "这个结论对科室教学、流程改进或后续研究有什么启示？",
            ],
            "expert_questions": [
                "关键证据的质量等级如何？是否有指南或共识支持？",
                "是否存在与既往研究或临床经验不一致的地方？",
                "如果资料不足，你准备优先补充哪一类证据？",
            ],
            "methodology_questions": [
                "纳入资料是否存在选择偏倚？",
                "研究设计或样本量是否足以支撑当前表述？",
                "病例资料是否已经完成脱敏，是否避免了可识别信息？",
            ],
            "reference_answers": [
                "回答时先承认资料边界，再说明已有证据支持的部分。",
                "涉及病例资料时强调已脱敏，并说明汇报仅用于学术讨论。",
                "对专家追问可采用“证据来源、适用范围、局限性、后续计划”的顺序回答。",
            ],
        }
