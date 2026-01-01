"""Token schemas."""
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"
    requires_2fa: Optional[bool] = None
    user_id: Optional[int] = None


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: Optional[str] = None
