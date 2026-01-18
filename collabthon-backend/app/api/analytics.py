from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json
from app import schemas, models
from app.database import get_db
from app.core.deps import get_current_user, get_current_admin_user
from app.models.analytics import UserActivity, LocationTracking, EmailCampaign, EmailRecipient, Report
import uuid

router = APIRouter()


@router.post("/track-activity")
async def track_user_activity(
    request: Request,
    activity_data: schemas.ActivityTrackingRequest,
    db: Session = Depends(get_db)
):
    """
    Track user activity for analytics purposes
    """
    try:
        # Get user ID if authenticated
        user_id = None
        try:
            current_user = await get_current_user(request)
            user_id = current_user.id
        except:
            # Anonymous activity tracking
            pass
        
        # Get session ID from cookies or generate one
        session_id = request.cookies.get("session_id")
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Get IP address
        forwarded = request.headers.get("X-Forwarded-For")
        real_ip = request.headers.get("X-Real-IP")
        remote_addr = request.client.host
        
        ip_address = forwarded.split(",")[0].strip() if forwarded else \
                     real_ip if real_ip else remote_addr
        
        # Get user agent
        user_agent = request.headers.get("User-Agent", "")
        
        # Create activity record
        activity = UserActivity(
            user_id=user_id,
            activity_type=activity_data.activity_type,
            page_url=activity_data.page_url,
            element_id=activity_data.element_id,
            element_class=activity_data.element_class,
            referrer=activity_data.referrer,
            user_agent=user_agent,
            ip_address=ip_address,
            session_id=session_id,
            metadata=activity_data.metadata
        )
        
        db.add(activity)
        db.commit()
        db.refresh(activity)
        
        return {"success": True, "activity_id": activity.id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to track activity: {str(e)}"
        )


@router.get("/analytics/user-activity", response_model=List[schemas.UserActivityResponse])
async def get_user_activity(
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    activity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get user activity analytics (admin only)
    """
    query = db.query(UserActivity)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(UserActivity.timestamp >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(UserActivity.timestamp <= end_dt)
    
    if activity_type:
        query = query.filter(UserActivity.activity_type == activity_type)
    
    activities = query.offset(skip).limit(limit).all()
    return activities


@router.get("/analytics/user-activity/stats")
async def get_activity_stats(
    current_user: models.User = Depends(get_current_admin_user),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get user activity statistics (admin only)
    """
    query = db.query(UserActivity)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(UserActivity.timestamp >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(UserActivity.timestamp <= end_dt)
    
    # Total activities
    total_activities = query.count()
    
    # Activities by type
    activity_types = db.query(
        UserActivity.activity_type,
        db.func.count(UserActivity.id).label('count')
    ).group_by(UserActivity.activity_type).all()
    
    # Daily activity trend
    daily_activity = db.query(
        db.func.date(UserActivity.timestamp).label('date'),
        db.func.count(UserActivity.id).label('count')
    ).group_by(db.func.date(UserActivity.timestamp)).order_by('date').all()
    
    # Unique sessions
    unique_sessions = db.query(
        db.func.count(db.func.distinct(UserActivity.session_id))
    ).scalar()
    
    # Returning only registered users activity
    registered_user_activity = query.filter(UserActivity.user_id.isnot(None)).count()
    
    return {
        "total_activities": total_activities,
        "unique_sessions": unique_sessions,
        "registered_user_activity": registered_user_activity,
        "anonymous_activity": total_activities - registered_user_activity,
        "activity_types": [{"type": at[0], "count": at[1]} for at in activity_types],
        "daily_activity": [{"date": da[0].isoformat(), "count": da[1]} for da in daily_activity]
    }


@router.post("/location-track")
async def track_location(
    location_data: schemas.LocationTrackingRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track user location for geolocation analytics
    """
    try:
        location = LocationTracking(
            user_id=current_user.id,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            country=location_data.country,
            city=location_data.city,
            region=location_data.region,
            postal_code=location_data.postal_code,
            timezone=location_data.timezone,
            accuracy=location_data.accuracy
        )
        
        db.add(location)
        db.commit()
        db.refresh(location)
        
        return {"success": True, "location_id": location.id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to track location: {str(e)}"
        )


@router.get("/analytics/location-data")
async def get_location_data(
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get location tracking data (admin only)
    """
    locations = db.query(LocationTracking).offset(skip).limit(limit).all()
    return locations


@router.post("/email-campaigns")
async def create_email_campaign(
    campaign_data: schemas.EmailCampaignCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create a new email campaign (admin only)
    """
    try:
        campaign = EmailCampaign(
            name=campaign_data.name,
            subject=campaign_data.subject,
            content=campaign_data.content,
            created_by=current_user.id,
            scheduled_at=campaign_data.scheduled_at
        )
        
        db.add(campaign)
        db.commit()
        db.refresh(campaign)
        
        return {"success": True, "campaign_id": campaign.id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create email campaign: {str(e)}"
        )


@router.get("/email-campaigns", response_model=List[schemas.EmailCampaignResponse])
async def get_email_campaigns(
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get email campaigns (admin only)
    """
    campaigns = db.query(EmailCampaign).offset(skip).limit(limit).all()
    return campaigns


@router.post("/reports/generate")
async def generate_report(
    report_data: schemas.ReportGenerateRequest,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new report (admin only)
    """
    try:
        # In a real implementation, this would generate the actual report data
        # For now, we'll simulate generating a report
        
        # Simulate report data based on type
        if report_data.report_type == "user_activity":
            # Query user activity data
            activity_count = db.query(UserActivity).count()
            recent_activities = db.query(UserActivity).limit(10).all()
            
            report_data_content = {
                "total_activities": activity_count,
                "recent_activities": [activity.activity_type for activity in recent_activities[:5]],
                "generated_at": datetime.utcnow().isoformat()
            }
        elif report_data.report_type == "engagement":
            # Calculate engagement metrics
            total_users = db.query(models.User).count()
            active_users = db.query(models.User).filter(models.User.is_active == True).count()
            
            report_data_content = {
                "total_users": total_users,
                "active_users": active_users,
                "engagement_rate": (active_users / total_users * 100) if total_users > 0 else 0,
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            # Default report
            report_data_content = {
                "summary": f"Report for {report_data.report_type}",
                "generated_at": datetime.utcnow().isoformat()
            }
        
        report = Report(
            report_type=report_data.report_type,
            title=report_data.title,
            description=report_data.description,
            filters=report_data.filters,
            data=report_data_content,
            generated_by=current_user.id
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        return {"success": True, "report_id": report.id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.get("/reports/{report_id}", response_model=schemas.ReportResponse)
async def get_report(
    report_id: int,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific report (admin only)
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.get("/reports", response_model=List[schemas.ReportResponse])
async def get_reports(
    current_user: models.User = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all reports (admin only)
    """
    reports = db.query(Report).offset(skip).limit(limit).all()
    return reports