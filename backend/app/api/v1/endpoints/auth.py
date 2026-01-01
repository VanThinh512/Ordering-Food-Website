"""Authentication endpoints."""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.crud.user import user as user_crud
from app.db.session import get_db
from app.schemas.token import Token
from app.schemas.user import User, UserCreate
from app.api.deps import get_current_active_user
from app.services.google_oauth_service import google_oauth_service
from app.services.totp_service import totp_service

router = APIRouter()


@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """Register new user."""
    user = user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    if user_in.student_id:
        existing_student = user_crud.get_by_student_id(db, student_id=user_in.student_id)
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student ID already registered",
            )
    
    user = user_crud.create(db, obj_in=user_in)
    return user


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login."""
    user = user_crud.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    elif not user_crud.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Check if 2FA is enabled
    if user.is_2fa_enabled:
        # Return special response indicating 2FA is required
        # Frontend will show 2FA code input
        return {
            "access_token": "",
            "token_type": "bearer",
            "requires_2fa": True,
            "user_id": user.id
        }
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "requires_2fa": False
    }


@router.get("/me", response_model=User)
def read_users_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user."""
    return current_user


@router.get("/google/login")
def google_login(
    db: Session = Depends(get_db),
) -> Any:
    """Initiate Google OAuth login flow."""
    if not google_oauth_service.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
        )
    
    # Generate authorization URL
    auth_url = google_oauth_service.get_authorization_url()
    
    # Redirect user to Google login
    return {"authorization_url": auth_url}


@router.get("/google/callback")
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    db: Session = Depends(get_db),
) -> Any:
    """Handle Google OAuth callback."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"🔵 Google callback received with code: {code[:20]}...")
        
        # Exchange code for token and get user info
        result = await google_oauth_service.exchange_code_for_token(code)
        user_info = result['user_info']
        
        logger.info(f"✅ Got user info: {user_info.get('email')}")
        
        # Validate email is verified
        if not user_info.get('email_verified'):
            logger.error("❌ Email not verified by Google")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not verified by Google"
            )
        
        # Get or create user
        logger.info(f"🔍 Getting or creating user for: {user_info['email']}")
        user = user_crud.get_or_create_by_google(
            db,
            google_id=user_info['google_id'],
            email=user_info['email'],
            full_name=user_info.get('name') or user_info['email'].split('@')[0],
            picture=user_info.get('picture')
        )
        
        # Check if user is active
        if not user_crud.is_active(user):
            logger.error(f"❌ User {user.email} is not active")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        logger.info(f"✅ Token created for user: {user.email}")
        
        # Redirect to frontend with token
        frontend_url = settings.BACKEND_CORS_ORIGINS[0] if settings.BACKEND_CORS_ORIGINS else "http://localhost:5173"
        redirect_url = f"{frontend_url}/auth/google/callback?token={access_token}"
        
        logger.info(f"🔄 Redirecting to: {redirect_url[:80]}...")
        
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Google authentication failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )


# ==================== 2FA Endpoints ====================

@router.post("/2fa/setup")
def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Generate new TOTP secret and QR code for 2FA setup.
    User must verify with a token before 2FA is enabled.
    """
    # Generate new secret
    secret = totp_service.generate_secret()
    
    # Generate QR code
    qr_code = totp_service.generate_qr_code(secret, current_user.email)
    
    # Save secret (but don't enable 2FA yet)
    current_user.totp_secret = secret
    current_user.is_2fa_enabled = False  # Will be enabled after verification
    db.add(current_user)
    db.commit()
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "message": "Scan QR code with Google Authenticator app, then verify with a 6-digit code"
    }


@router.post("/2fa/enable")
def enable_2fa(
    token: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Enable 2FA by verifying a token from authenticator app.
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No 2FA setup found. Please call /auth/2fa/setup first"
        )
    
    # Verify token
    if not totp_service.verify_token(current_user.totp_secret, token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code"
        )
    
    # Enable 2FA
    current_user.is_2fa_enabled = True
    db.add(current_user)
    db.commit()
    
    return {
        "message": "2FA enabled successfully",
        "is_2fa_enabled": True
    }


@router.post("/2fa/verify")
def verify_2fa(
    user_id: int,
    token: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Verify 2FA token and issue access token.
    Called after login when requires_2fa is True.
    """
    # Get user
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if 2FA is enabled
    if not user.is_2fa_enabled or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA is not enabled for this user"
        )
    
    # Verify token
    if not totp_service.verify_token(user.totp_secret, token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # Create access token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/2fa/disable")
def disable_2fa(
    password: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Disable 2FA (requires password confirmation).
    """
    # Verify password
    user = user_crud.authenticate(db, email=current_user.email, password=password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    
    # Disable 2FA and clear secret
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.add(current_user)
    db.commit()
    
    return {
        "message": "2FA disabled successfully",
        "is_2fa_enabled": False
    }


@router.get("/2fa/status")
def get_2fa_status(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get 2FA status for current user."""
    return {
        "is_2fa_enabled": current_user.is_2fa_enabled,
        "email": current_user.email
    }
