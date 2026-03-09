from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from api.decision import router as decision_router

app = FastAPI()
app.include_router(decision_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
