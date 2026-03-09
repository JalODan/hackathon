from pydantic import BaseModel


class DecisionResponseDto(BaseModel):
    action: str
    confidence: float
    fused_text: str
    reason: str