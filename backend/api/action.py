from dto.request import ScenarioInputDto

CONFIDENCE_THRESHOLD = 0.5


def decide_action(fused_text: str, confidence: float, scenario: ScenarioInputDto):

    text = fused_text.upper()

    # 1. низкая уверенность
    if confidence < CONFIDENCE_THRESHOLD:
        return "HUMAN_CONFIRMATION"

    # 2. исключение для автобуса
    if "ECCETTO BUS" in text:
        return "GO"

    # 3. запрет
    if "DIVIETO" in text or "VIETATO" in text:
        return "STOP"

    return "GO"
