from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class NotificationType(str, enum.Enum):
    COLLABORATION_REQUEST = "collaboration_request"
    COLLABORATION_ACCEPTED = "collaboration_accepted"
    COLLABORATION_REJECTED = "collaboration_rejected"
    NEW_PROJECT_MATCH = "new_project_match"
    SYSTEM_MESSAGE = "system_message"
    SUBSCRIPTION_UPDATE = "subscription_update"


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    data = Column(Text)  # JSON string for additional data
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
    
    # Relationships
    recipient = relationship("User")