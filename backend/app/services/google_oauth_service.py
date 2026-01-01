"""Google OAuth service for authentication."""
import logging
from typing import Optional, Dict
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleOAuthService:
    """Service for Google OAuth authentication."""
    
    def __init__(self):
        """Initialize Google OAuth service."""
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        
    def is_configured(self) -> bool:
        """Check if Google OAuth is configured."""
        return bool(self.client_id and self.client_secret)
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """Generate Google OAuth authorization URL."""
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        # Scopes we need from Google
        scopes = [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]
        
        scope_str = " ".join(scopes)
        
        # Build authorization URL
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope={scope_str}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        if state:
            auth_url += f"&state={state}"
        
        return auth_url
    
    async def verify_id_token(self, token: str) -> Dict:
        """Verify Google ID token and return user info."""
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        try:
            # Verify the token with clock skew tolerance
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                self.client_id,
                clock_skew_in_seconds=10  # Allow 10 seconds clock skew
            )
            
            # Verify issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            # Extract user info
            return {
                'google_id': idinfo['sub'],
                'email': idinfo.get('email'),
                'email_verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name'),
                'picture': idinfo.get('picture'),
                'given_name': idinfo.get('given_name'),
                'family_name': idinfo.get('family_name'),
            }
            
        except ValueError as e:
            logger.error(f"Invalid Google token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google authentication token"
            )
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange authorization code for access token and user info."""
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google OAuth is not configured"
            )
        
        import httpx
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(token_url, data=token_data)
                response.raise_for_status()
                tokens = response.json()
            
            # Verify and decode ID token
            user_info = await self.verify_id_token(tokens['id_token'])
            
            return {
                'access_token': tokens.get('access_token'),
                'id_token': tokens.get('id_token'),
                'user_info': user_info
            }
            
        except httpx.HTTPError as e:
            logger.error(f"Error exchanging code for token: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code"
            )


google_oauth_service = GoogleOAuthService()
