import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
import firebase_admin
from firebase_admin import credentials

class Settings(BaseSettings):
    project_name: str = "LifeVault API"
    version: str = "1.0.0"
    firebase_credential_path: str = "serviceAccountKey.json"
    ai_provider: str = "nemotron"

settings = Settings()

# Initialize Firebase Admin
if os.path.exists(settings.firebase_credential_path):
    cred = credentials.Certificate(settings.firebase_credential_path)
    firebase_admin.initialize_app(cred)
else:
    print(f"Warning: Firebase credential not found at {settings.firebase_credential_path}")

app = FastAPI(title=settings.project_name, version=settings.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.ingestion import router as ingestion_router
from api.chat import router as chat_router
from api.verify import router as verify_router
from api.auth import router as auth_router

app.include_router(ingestion_router)
app.include_router(chat_router)
app.include_router(verify_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to LifeVault API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
