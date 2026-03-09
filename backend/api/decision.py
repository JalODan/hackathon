from fastapi import APIRouter

from api.action import decide_action
from dto.request import ScenarioInputDto
from dto.response import DecisionResponseDto
from api.cleaning import fondi_sensori_avanzato

router = APIRouter(prefix="/api", tags=["decision"])


@router.post("/decision", response_model=DecisionResponseDto)
def make_decision(data: ScenarioInputDto) -> DecisionResponseDto:
    testo_finale, confidenza_finale = fondi_sensori_avanzato(data.sensori.dict())

    action = decide_action(
        fused_text=testo_finale,
        confidence=confidenza_finale,
        scenario=data
    )

    return DecisionResponseDto(
        action=action,
        confidence=confidenza_finale,
        fused_text=testo_finale,
        reason="just because"
    )
