import re
from datetime import time
from typing import Optional

from dto.request import ScenarioInputDto

CONFIDENCE_THRESHOLD = 0.6

# Что умеет наш шаттл
VEHICLE_TAGS = {
    "BUS",
    "L4",
}

ITALIAN_DAYS = {
    "LUNEDI": 0,
    "MARTEDI": 1,
    "MERCOLEDI": 2,
    "GIOVEDI": 3,
    "VENERDI": 4,
    "SABATO": 5,
    "DOMENICA": 6,
}

BASE_STOP_PHRASES = (
    "DIVIETO",
    "VIETATO",
    "SENSO VIETATO",
    "DIVIETO DI TRANSITO",
    "DIVIETO DI FERMATA",
    "DIVIETO DI SOSTA",
    "DIVIETO MEZZI PESANTI",
    "DIVIETO MEZZI NON AUTORIZZATI",
    "DIVIETO PER VEICOLI A MOTORE",
)

BASE_GO_PHRASES = (
    "ZTL VARCO NON ATTIVO",
    "FINE ZTL",
    "ACCESSO CONSENTITO",
)

WARNING_ONLY_PHRASES = (
    "ATTENZIONE",
    "RALLENTARE",
    "DOSSO",
    "LAVORI",
    "ROTATORIA",
    "TUTTE LE DIREZIONI",
    "STAZIONE FERROVIARIA",
    "PIAZZA DEL DUOMO",
    "CENTRO STORICO",
    "PARCHEGGIO A PAGAMENTO",
    "PASSAGGIO A LIVELLO",
    "SENSO UNICO ALTERNATO",
    "OBBLIGO DI SVOLTA A DESTRA",
    "STRADA SENZA USCITA",
    "LIMITE MASSIMO",
    "ZONA 30",
    "AREA PEDONALE",
)


def decide_action(fused_text: str, confidence: float, scenario: ScenarioInputDto) -> str:
    if confidence < CONFIDENCE_THRESHOLD:
        return "HUMAN_CONFIRMATION"

    text = normalize_text(fused_text)
    current_time = parse_time_safe(scenario.orario_rilevamento)
    current_day = parse_day_safe(scenario.giorno_settimana)

    if not text:
        return "HUMAN_CONFIRMATION"

    # Явно разрешающие формулировки
    if contains_any(text, BASE_GO_PHRASES):
        return "GO"

    # Только предупреждение / инфо
    if contains_any(text, WARNING_ONLY_PHRASES):
        return "GO"

    # Отдельная обработка ZTL
    if "ZTL" in text:
        return decide_ztl(text, current_time, current_day)

    # Рынок / временные ограничения по дню
    if "MERCATO RIONALE" in text:
        return decide_market(text, current_time, current_day)

    # "ECCETTO ..." без явного ZTL тоже надо уметь понимать
    if "ECCETTO" in text:
        return decide_exception_based_rule(text, current_time, current_day)

    # Базовые запреты
    if contains_any(text, BASE_STOP_PHRASES):
        return "STOP"

    return "HUMAN_CONFIRMATION"


def decide_ztl(text: str, current_time: Optional[time], current_day: Optional[int]) -> str:
    if "VARCO NON ATTIVO" in text or "FINE ZTL" in text:
        return "GO"

    if "SOLO GIORNI FESTIVI" in text:
        # В DTO нет признака праздника
        return "HUMAN_CONFIRMATION"

    if "ECCETTO" in text:
        return decide_exception_based_rule(text, current_time, current_day, default_if_exception_not_applicable="STOP")

    intervals = extract_time_ranges(text)

    # "ZTL 20:00" — неоднозначно: непонятно, с какого момента/до какого
    if not intervals and contains_single_time(text):
        return "HUMAN_CONFIRMATION"

    if intervals:
        if current_time is None:
            return "HUMAN_CONFIRMATION"
        return "STOP" if any(is_time_in_range(current_time, start, end) for start, end in intervals) else "GO"

    # Просто ZTL без уточнений — безопаснее спросить человека
    return "HUMAN_CONFIRMATION"


def decide_market(text: str, current_time: Optional[time], current_day: Optional[int]) -> str:
    mentioned_day = extract_day_from_text(text)
    intervals = extract_time_ranges(text)

    if mentioned_day is None or current_day is None or not intervals or current_time is None:
        return "HUMAN_CONFIRMATION"

    if current_day != mentioned_day:
        return "GO"

    return "STOP" if any(is_time_in_range(current_time, start, end) for start, end in intervals) else "GO"


def decide_exception_based_rule(
    text: str,
    current_time: Optional[time],
    current_day: Optional[int],
    default_if_exception_not_applicable: str = "STOP",
) -> str:
    """
    Примеры:
    - DIVIETO ECCETTO BUS -> GO
    - DIVIETO ECCETTO BUS E TAXI -> GO
    - ZTL ECCETTO L4 -> GO
    - ECCETTO MEZZI DI SOCCORSO -> STOP
    - ECCETTO FORNITORE 08:00-10:00 -> STOP
    """

    # Если исключение относится к нашему типу ТС — можно ехать
    if applies_to_vehicle(text):
        intervals = extract_time_ranges(text)
        mentioned_day = extract_day_from_text(text)

        if mentioned_day is not None:
            if current_day is None:
                return "HUMAN_CONFIRMATION"
            if current_day != mentioned_day:
                return default_if_exception_not_applicable

        if intervals:
            if current_time is None:
                return "HUMAN_CONFIRMATION"
            return "GO" if any(is_time_in_range(current_time, start, end) for start, end in intervals) else default_if_exception_not_applicable

        return "GO"

    # Исключение не для нас
    intervals = extract_time_ranges(text)
    mentioned_day = extract_day_from_text(text)

    if mentioned_day is not None:
        if current_day is None:
            return "HUMAN_CONFIRMATION"
        if current_day != mentioned_day:
            return "GO"

    if intervals:
        if current_time is None:
            return "HUMAN_CONFIRMATION"
        return default_if_exception_not_applicable if any(
            is_time_in_range(current_time, start, end) for start, end in intervals
        ) else "GO"

    return default_if_exception_not_applicable


def applies_to_vehicle(text: str) -> bool:
    if "BUS" in text:
        return True
    if re.search(r"\bL4\b", text):
        return True
    return False


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""

    t = text.upper().strip()

    # Убираем OCR-мусор вида "D I V I E T O"
    t = collapse_spaced_letters(t)

    # Нормализуем пробелы
    t = re.sub(r"\s+", " ", t)

    # Популярные OCR-опечатки из датасета
    t = t.replace("D I V E T O", "DIVIETO")
    t = t.replace("ACCSSO", "ACCESSO")

    return t.strip()


def collapse_spaced_letters(text: str) -> str:
    tokens = text.split()
    result = []
    i = 0

    while i < len(tokens):
        if len(tokens[i]) == 1 and tokens[i].isalpha():
            letters = []
            while i < len(tokens) and len(tokens[i]) == 1 and tokens[i].isalpha():
                letters.append(tokens[i])
                i += 1
            result.append("".join(letters))
        else:
            result.append(tokens[i])
            i += 1

    return " ".join(result)


def parse_time_safe(value: Optional[str]) -> Optional[time]:
    if not value:
        return None

    match = re.search(r"(\d{1,2}):(\d{2})", value)
    if not match:
        return None

    hour = int(match.group(1))
    minute = int(match.group(2))

    if hour == 24 and minute == 0:
        return time(0, 0)

    if 0 <= hour <= 23 and 0 <= minute <= 59:
        return time(hour, minute)

    return None


def parse_day_safe(value: Optional[str]) -> Optional[int]:
    if not value:
        return None

    normalized = normalize_text(value)
    return ITALIAN_DAYS.get(normalized)


def extract_day_from_text(text: str) -> Optional[int]:
    for day_name, day_num in ITALIAN_DAYS.items():
        if day_name in text:
            return day_num
    return None


def extract_time_ranges(text: str) -> list[tuple[time, time]]:
    ranges = []
    for start_h, start_m, end_h, end_m in re.findall(r"(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})", text):
        start = build_time(int(start_h), int(start_m))
        end = build_time(int(end_h), int(end_m))
        if start is not None and end is not None:
            ranges.append((start, end))
    return ranges


def contains_single_time(text: str) -> bool:
    return bool(re.search(r"\b\d{1,2}:\d{2}\b", text)) and not extract_time_ranges(text)


def build_time(hour: int, minute: int) -> Optional[time]:
    if hour == 24 and minute == 0:
        return time(0, 0)

    if 0 <= hour <= 23 and 0 <= minute <= 59:
        return time(hour, minute)

    return None


def is_time_in_range(current: time, start: time, end: time) -> bool:
    if start <= end:
        return start <= current <= end

    # Ночной интервал, типа 23:00-05:00
    return current >= start or current <= end


def contains_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)