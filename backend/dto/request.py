from typing import Optional

from pydantic import BaseModel


class SensorDto(BaseModel):
    testo: Optional[str]
    confidenza: Optional[float]


class SensoriDto(BaseModel):
    camera_frontale: SensorDto
    camera_laterale: SensorDto
    V2I_receiver: SensorDto


class ScenarioInputDto(BaseModel):
    id_scenario: int
    sensori: SensoriDto
    orario_rilevamento: str
    giorno_settimana: str