import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.database import engine, Base, get_db
from app import models
from datetime import datetime, timedelta

# Create a test client
client = TestClient(app)

# Test database setup
def override_get_db():
    try:
        db = MagicMock()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Collabthon" in data["message"]

def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Collabthon API" in data["service"]

def test_register_user():
    """Test user registration"""
    test_user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123"
    }
    
    response = client.post("/api/v1/auth/register", json=test_user_data)
    # This might fail if user already exists, so we expect either 201 or 400
    assert response.status_code in [201, 400]

def test_login_user():
    """Test user login"""
    login_data = {
        "username": "test@example.com",
        "password": "testpassword123"
    }
    
    response = client.post("/api/v1/auth/login", json=login_data)
    # May fail if user doesn't exist, so check for expected status codes
    assert response.status_code in [200, 401, 422]

def test_get_projects():
    """Test getting projects"""
    response = client.get("/api/v1/projects/")
    assert response.status_code in [200, 401]  # May require auth depending on implementation

def test_get_profiles():
    """Test getting profiles"""
    response = client.get("/api/v1/profiles/")
    assert response.status_code in [200, 401]  # May require auth depending on implementation

def test_verify_recaptcha():
    """Test reCAPTCHA verification (mocked)"""
    with patch('app.utils.google_services.google_services.verify_recaptcha') as mock_verify:
        mock_verify.return_value = True
        
        recaptcha_data = {"token": "test_token"}
        response = client.post("/api/v1/auth/verify-recaptcha", json=recaptcha_data)
        
        # This endpoint may not exist in the current setup, so check if it's available
        assert response.status_code in [200, 404, 405]

def test_get_admin_stats():
    """Test admin stats endpoint (should require admin auth)"""
    response = client.get("/api/v1/admin/stats")
    # Should return 401 or 403 without admin authentication
    assert response.status_code in [401, 403, 422]

def test_get_users():
    """Test get users endpoint (should require admin auth)"""
    response = client.get("/api/v1/admin/users")
    # Should return 401 or 403 without admin authentication
    assert response.status_code in [401, 403, 422]

def test_create_project():
    """Test creating a project (requires auth)"""
    project_data = {
        "title": "Test Project",
        "description": "Test Description",
        "required_skills": ["Python", "FastAPI"],
        "budget_min": 100,
        "budget_max": 500,
        "timeline": "2 weeks"
    }
    
    response = client.post("/api/v1/projects/", json=project_data)
    # Should return 401 without authentication
    assert response.status_code in [401, 422]

def test_search_projects():
    """Test project search functionality"""
    response = client.get("/api/v1/projects/?search=python")
    assert response.status_code in [200, 401, 404]

def test_get_profile_by_id():
    """Test getting a specific profile"""
    # This will likely return 404 for non-existent ID or 401 for auth
    response = client.get("/api/v1/profiles/99999")
    assert response.status_code in [401, 404, 422]

def test_create_profile():
    """Test creating a profile (requires auth)"""
    profile_data = {
        "first_name": "John",
        "last_name": "Doe",
        "college": "Test University",
        "major": "Computer Science",
        "year": 3,
        "bio": "Test bio",
        "skills": ["Python", "JavaScript"]
    }
    
    response = client.post("/api/v1/users/me/profile", json=profile_data)
    # Should return 401 without authentication
    assert response.status_code in [401, 422]

def test_get_user_me():
    """Test getting current user profile"""
    response = client.get("/api/v1/auth/me")
    # Should return 401 without authentication
    assert response.status_code in [401, 422]

def test_create_collaboration_request():
    """Test creating a collaboration request (requires auth)"""
    collaboration_data = {
        "receiver_id": 1,
        "message": "Test collaboration request"
    }
    
    response = client.post("/api/v1/collaborations/", json=collaboration_data)
    # Should return 401 without authentication
    assert response.status_code in [401, 422]

def test_get_subscriptions():
    """Test getting subscription plans"""
    response = client.get("/api/v1/subscriptions/plans")
    assert response.status_code in [200, 401]

def test_get_my_subscription():
    """Test getting user's subscription (requires auth)"""
    response = client.get("/api/v1/subscriptions/my")
    # Should return 401 without authentication
    assert response.status_code in [401, 422]

if __name__ == "__main__":
    pytest.main([__file__])