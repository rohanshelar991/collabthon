from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base
from .notification import Notification, NotificationType
from .analytics import UserActivity, LocationTracking, EmailCampaign, EmailRecipient, Report, FileUpload

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class ProjectStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"

class CollaborationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_google_account = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    projects = relationship("Project", back_populates="owner")
    collaboration_requests_sent = relationship("CollaborationRequest", foreign_keys="CollaborationRequest.sender_id", back_populates="sender")
    collaboration_requests_received = relationship("CollaborationRequest", foreign_keys="CollaborationRequest.receiver_id", back_populates="receiver")
    subscription = relationship("Subscription", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    college = Column(String(255), nullable=False)
    major = Column(String(255), nullable=False)
    year = Column(Integer, nullable=False)
    bio = Column(Text)
    skills = Column(Text)  # JSON string of skills
    experience = Column(String(100))
    github_url = Column(String(255))
    linkedin_url = Column(String(255))
    portfolio_url = Column(String(255))
    avatar_url = Column(String(255))
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="profile")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text)  # JSON string of required skills
    budget_min = Column(Float)
    budget_max = Column(Float)
    timeline = Column(String(100))
    status = Column(Enum(ProjectStatus), default=ProjectStatus.OPEN)
    is_remote = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    collaborations = relationship("CollaborationRequest", back_populates="project")

class CollaborationRequest(Base):
    __tablename__ = "collaboration_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    message = Column(Text)
    status = Column(Enum(CollaborationStatus), default=CollaborationStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="collaboration_requests_sent")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="collaboration_requests_received")
    project = relationship("Project", back_populates="collaborations")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(Enum(SubscriptionPlan), default=SubscriptionPlan.FREE)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    is_active = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscription")