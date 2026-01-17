from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
import json

# Base schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_verified: bool
    is_google_account: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Profile schemas
class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    college: str
    major: str
    year: int
    bio: Optional[str] = None
    skills: List[str] = []
    experience: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: bool = True

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    college: Optional[str] = None
    major: Optional[str] = None
    year: Optional[int] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    avatar_url: Optional[str] = None
    is_public: Optional[bool] = None

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    title: str
    description: str
    required_skills: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    timeline: Optional[str] = None
    is_remote: bool = True

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    timeline: Optional[str] = None
    status: Optional[str] = None
    is_remote: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Collaboration schemas
class CollaborationBase(BaseModel):
    receiver_id: int
    project_id: Optional[int] = None
    message: Optional[str] = None

class CollaborationCreate(CollaborationBase):
    pass

class CollaborationUpdate(BaseModel):
    status: str

class CollaborationResponse(CollaborationBase):
    id: int
    sender_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    plan: str

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    plan: Optional[str] = None
    is_active: Optional[bool] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    is_active: bool
    started_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Admin schemas
class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_projects: int
    active_projects: int
    total_collaborations: int
    pending_collaborations: int

class ProjectStatusUpdate(BaseModel):
    status: str

# Response wrappers
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    size: int
    pages: int