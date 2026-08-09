from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: str
    
class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []

import os
from firebase_admin import firestore
from ai.provider import get_ai_provider
from main import settings

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")
        
    # 1. Fetch user's documents from Firestore to build RAG context
    context_str = "No documents found in vault."
    sources = []
    try:
        db_client = firestore.client()
        docs_ref = db_client.collection("documents").where("userId", "==", request.user_id).stream()
        docs_context = []
        for d in docs_ref:
            data = d.to_dict()
            title = data.get("title", "Untitled")
            docs_context.append(
                f"- Title: {title}\n"
                f"  Category: {data.get('category', 'General')}\n"
                f"  Summary: {data.get('summary', '')}\n"
                f"  Verified on Cardano: {data.get('verified', False)}\n"
                f"  Reminders: {data.get('reminders', [])}"
            )
            sources.append(title)
        if docs_context:
            context_str = "\n\n".join(docs_context)
    except Exception as db_err:
        print(f"Error loading RAG context from Firestore: {db_err}")

    # 2. Initialize AI Provider
    ai_provider = get_ai_provider(settings.ai_provider, {
        "nemotron": os.environ.get("NVIDIA_API_KEY", ""),
        "openai": os.environ.get("OPENAI_API_KEY", ""),
        "claude": os.environ.get("ANTHROPIC_API_KEY", "")
    })
    
    # Build prompt from history
    history_str = "\n".join([f"{msg.role}: {msg.content}" for msg in request.messages])
    
    prompt = f"""
    You are a helpful LifeVault AI assistant. 
    You help users manage and understand their documents, timelines, and reminders.
    
    Below is the list of documents currently inside the user's secure vault:
    {context_str}
    
    Conversation History:
    {history_str}
    
    Answer the user's query accurately using the provided vault context. Keep the answer helpful and concise.
    """
    
    try:
        reply = ai_provider.generate_completion(prompt)
    except Exception as ai_err:
        print(f"AI Generation failed: {ai_err}")
        reply = "I encountered an error querying my AI models. Please verify your NVIDIA API configurations."
        
    return ChatResponse(reply=reply, sources=sources)
