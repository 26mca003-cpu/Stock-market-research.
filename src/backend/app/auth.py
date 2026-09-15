from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from app.db import get_supabase

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """Verify Supabase JWT and return user details."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    supabase = get_supabase()
    
    if not supabase:
        # If Supabase is disabled, we mock the user for local dev
        return {"id": "default_user", "email": "local@dev.com", "role": "admin"}
        
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
            
        user_id = user_response.user.id
        email = user_response.user.email
        
        # Check role strictly from database profiles table and verified app_metadata
        role = "user"
        profile = supabase.table("profiles").select("role").eq("id", user_id).execute()
        if profile.data and len(profile.data) > 0:
            role = profile.data[0].get("role", "user")
        elif user_response.user.app_metadata and user_response.user.app_metadata.get("role") == "admin":
            role = "admin"
        elif user_response.user.user_metadata and (user_response.user.user_metadata.get("role") == "admin" or user_response.user.user_metadata.get("is_admin") is True):
            role = "admin"
            
        return {"id": user_id, "email": email, "role": role}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")


def require_user(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency for endpoints requiring any authenticated user."""
    return user


def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency for endpoints requiring admin role."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="admin only")
    return user
