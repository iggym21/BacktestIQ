from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.ai_service import generate_strategy
from routers.auth import get_current_user

router = APIRouter()


class AIRequest(BaseModel):
    description: str


@router.post("/generate-strategy")
def generate(req: AIRequest, _=Depends(get_current_user)):
    try:
        strategy = generate_strategy(req.description)
        return {"strategy": strategy}
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not generate strategy: {str(e)}")
