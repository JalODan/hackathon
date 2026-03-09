from fastapi import FastAPI

from api.decision import router as decision_router

app = FastAPI()
app.include_router(decision_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}