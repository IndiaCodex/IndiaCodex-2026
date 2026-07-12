import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import os
from pydantic import BaseModel
import pymupdf  # fitz
from ai.provider import get_ai_provider, AIProvider
from main import settings

router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

class IngestionResult(BaseModel):
    category: str
    summary: str
    timeline_events: list[dict]
    reminders: list[dict]
    extracted_text: str

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return "Failed to extract text."

def parse_llm_response(response: str) -> dict:
    try:
        # Assuming the LLM returns a JSON string, try to parse it
        # A robust implementation would use a function call or strict JSON mode
        # Strip code blocks if present
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1].split("```")[0]
            
        return json.loads(response.strip())
    except Exception as e:
        print(f"Failed to parse LLM JSON: {e}")
        return {
            "category": "Unknown",
            "summary": "Could not generate summary.",
            "timeline_events": [],
            "reminders": []
        }

@router.post("/upload", response_model=IngestionResult)
async def upload_document(file: UploadFile = File(...)):
    filename_lower = file.filename.lower()
    allowed_extensions = (".pdf", ".png", ".jpg", ".jpeg")
    if not filename_lower.endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, PNG, JPG, or JPEG.")
    
    file_bytes = await file.read()
    
    if filename_lower.endswith(".pdf"):
        extracted_text = extract_text_from_pdf(file_bytes)
        if len(extracted_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF document.")
            
        ai_provider = get_ai_provider(settings.ai_provider, {
            "nemotron": os.environ.get("NVIDIA_API_KEY", ""),
            "openai": os.environ.get("OPENAI_API_KEY", ""),
            "claude": os.environ.get("ANTHROPIC_API_KEY", "")
        })
        
        prompt = f"""
        You are an expert document analyzer for LifeVault, a personal second brain.
        Analyze the following extracted document text.
        Extract the following information and return it strictly as a JSON object:
        1. "category": A single string classifying the document (e.g., "Invoice", "Medical", "Warranty", "Legal").
        2. "summary": A brief 2-sentence summary of what the document is.
        3. "timeline_events": A list of objects with "date" (YYYY-MM-DD) and "event" (string description of what happened).
        4. "reminders": A list of objects with "date" (YYYY-MM-DD) and "reminder" (string description of what needs to be done, like "Warranty Expires").

        Document Text:
        {extracted_text[:4000]}
        """
        
        llm_response = ai_provider.generate_completion(prompt)
        parsed = parse_llm_response(llm_response)
        
    else:
        # Real LLaMA 3.2 Vision extraction using the NVIDIA API
        import base64
        import requests
        
        base64_image = base64.b64encode(file_bytes).decode("utf-8")
        mime_type = "image/png" if filename_lower.endswith(".png") else "image/jpeg"
        
        prompt = """
        You are an expert document analyzer for LifeVault, a personal second brain.
        Analyze the following document image.
        Extract the following information and return it strictly as a JSON object:
        1. "category": A single string classifying the document (e.g., "Invoice", "Medical", "Warranty", "Legal").
        2. "summary": A brief 2-sentence summary of what the document is.
        3. "timeline_events": A list of objects with "date" (YYYY-MM-DD) and "event" (string description of what happened).
        4. "reminders": A list of objects with "date" (YYYY-MM-DD) and "reminder" (string description of what needs to be done, like "Warranty Expires").

        Return ONLY the raw JSON object. Do not include markdown code block formatting (e.g. ```json).
        """
        
        invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {os.environ.get('NVIDIA_API_KEY', '')}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "meta/llama-3.2-11b-vision-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
                    ]
                }
            ],
            "max_tokens": 512,
            "temperature": 0.2,
            "top_p": 1.00,
            "stream": False
        }
        
        try:
            response = requests.post(invoke_url, headers=headers, json=payload)
            if not response.ok:
                raise Exception(f"NVIDIA API Error: {response.text}")
            
            res_data = response.json()
            llm_response = res_data["choices"][0]["message"]["content"]
            parsed = parse_llm_response(llm_response)
            extracted_text = f"[Image Document Ingested: {file.filename}]"
        except Exception as e:
            print(f"NVIDIA Vision API failed: {e}")
            raise HTTPException(status_code=500, detail=f"AI extraction failed: {str(e)}")
    
    result = IngestionResult(
        category=parsed.get("category", "Unknown"),
        summary=parsed.get("summary", ""),
        timeline_events=parsed.get("timeline_events", []),
        reminders=parsed.get("reminders", []),
        extracted_text=extracted_text
    )
    
    return result
