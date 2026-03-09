from fastapi import APIRouter

from dto.request import ScenarioInputDto
from dto.response import DecisionResponseDto

router = APIRouter(prefix="/api", tags=["decision"])


@router.post("/decision", response_model=DecisionResponseDto)
def make_decision(data: ScenarioInputDto) -> DecisionResponseDto:
    texts = [
        data.sensori.camera_frontale.testo,
        data.sensori.camera_laterale.testo,
        data.sensori.V2I_receiver.testo,
    ]

    fused_text = " ".join(text for text in texts if text)

    return DecisionResponseDto(
        action="GO",
        confidence=0.85,
        fused_text=fused_text,
        reason="test rule",
    )