import hashlib
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/verify", tags=["Verify"])

class VerifyRequest(BaseModel):
    document_id: str
    user_id: str

class VerifyResponse(BaseModel):
    document_hash: str
    transaction_cbor: str # Mocked for the demo
    timestamp: str

@router.post("/hash", response_model=VerifyResponse)
async def generate_document_hash(request: VerifyRequest):
    # In a real app, we would fetch the document bytes from S3/Firebase and hash them
    # Here we mock the hash generation
    
    mock_document_content = f"Content of document {request.document_id} belonging to {request.user_id}".encode('utf-8')
    doc_hash = hashlib.sha256(mock_document_content).hexdigest()
    
    # Mocking a transaction CBOR that would be built by Lucid
    mock_cbor = f"A10081825820{doc_hash}..." 
    
    return VerifyResponse(
        document_hash=doc_hash,
        transaction_cbor=mock_cbor,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
