from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class UserActivityType(str, enum.Enum):
    PAGE_VIEW = "page_view"
    BUTTON_CLICK = "button_click"
    FORM_SUBMIT = "form_submit"
    LOGIN = "login"
    LOGOUT = "logout"
    PROFILE_VIEW = "profile_view"
    PROJECT_VIEW = "project_view"
    SEARCH = "search"


class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous activities
    activity_type = Column(String(50), nullable=False)  # Using String instead of Enum for flexibility
    page_url = Column(String(500))
    element_id = Column(String(100))  # ID of clicked element
    element_class = Column(String(200))  # Class of clicked element
    referrer = Column(String(500))  # Referring page
    user_agent = Column(Text)  # Browser information
    ip_address = Column(String(45))  # IP address
    session_id = Column(String(100))  # Session identifier
    metadata = Column(JSON)  # Additional metadata as JSON
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")


class LocationTracking(Base):
    __tablename__ = "location_tracking"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for anonymous users
    latitude = Column(Float)
    longitude = Column(Float)
    country = Column(String(100))
    city = Column(String(100))
    region = Column(String(100))
    postal_code = Column(String(20))
    timezone = Column(String(50))
    accuracy = Column(Float)  # Accuracy radius in meters
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")


class EmailCampaign(Base):
    __tablename__ = "email_campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    recipients_count = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))  # Admin who created
    scheduled_at = Column(DateTime)
    sent_at = Column(DateTime)
    status = Column(String(50), default="draft")  # draft, scheduled, sending, sent, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailRecipient(Base):
    __tablename__ = "email_recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("email_campaigns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # If sending to registered user
    email = Column(String(255), nullable=False)  # Target email address
    status = Column(String(50), default="pending")  # pending, sent, opened, clicked, bounced, unsubscribed
    opened_at = Column(DateTime)
    clicked_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(100), nullable=False)  # user_activity, engagement, revenue, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text)
    filters = Column(JSON)  # Report filters as JSON
    data = Column(JSON)  # Report data as JSON
    generated_by = Column(Integer, ForeignKey("users.id"))  # Admin who generated
    generated_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)  # When report cache expires
    is_cached = Column(Boolean, default=False)
    
    # Relationships
    generated_by_user = relationship("User")


class FileUpload(Base):
    __tablename__ = "file_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer)  # Size in bytes
    mime_type = Column(String(100))
    file_path = Column(String(500))  # Path in storage
    storage_type = Column(String(50), default="local")  # local, gcs, s3, etc.
    bucket_name = Column(String(255))  # For cloud storage
    public_url = Column(String(500))  # Publicly accessible URL
    upload_status = Column(String(50), default="uploading")  # uploading, completed, failed
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)  # When file expires
    
    # Relationships
    user = relationship("User")