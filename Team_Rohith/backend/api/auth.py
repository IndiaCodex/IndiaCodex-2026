from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth

router = APIRouter(prefix="/auth", tags=["Auth"])

class WalletLoginRequest(BaseModel):
    wallet_address: str

class WalletLoginResponse(BaseModel):
    custom_token: str

@router.post("/wallet-login", response_model=WalletLoginResponse)
async def wallet_login(request: WalletLoginRequest):
    if not request.wallet_address:
        raise HTTPException(status_code=400, detail="Wallet address is required")
    
    # In a real app, you would cryptographically verify a signed payload from the wallet here.
    # For the hackathon MVP, we trust the frontend wallet address and mint a token for it.
    
    uid = f"wallet_{request.wallet_address}"
    
    try:
        # Create a custom token for this wallet UID
        custom_token = auth.create_custom_token(uid)
        return WalletLoginResponse(custom_token=custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
