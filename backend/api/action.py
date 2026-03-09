from dto.request import ScenarioInputDto
from rules import STOP_SIGNS, GO_SIGNS


CONFIDENCE_THRESHOLD = 0.5


def decide_action(fused_text: str, confidence: float, scenario: ScenarioInputDto):

    text = fused_text.upper()

    # 1. низкая уверенность
    if confidence < CONFIDENCE_THRESHOLD:
        return "HUMAN_CONFIRMATION"

    text = fused_text.strip().upper()

    # 2. исключение для автобуса
    if text in GO_SIGNS:
        return "GO"

    # 3. запрет
    if text in STOP_SIGNS:
        return "STOP"

    return "HUMAN_CONFIRMATION"
