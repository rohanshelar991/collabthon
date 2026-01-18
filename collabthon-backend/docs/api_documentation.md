# Collabthon Platform API Documentation

## Overview
The Collabthon Platform API provides comprehensive functionality for student collaboration, project management, and enterprise features. This API follows RESTful principles and uses JSON for data exchange.

## Base URL
- Production: `https://api.collabthon.com`
- Staging: `https://staging-api.collabthon.com`
- Development: `http://localhost:8000`

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

## Authentication
### POST `/api/v1/auth/login`
Authenticate user and receive JWT tokens.

### POST `/api/v1/auth/register`
Register a new user account.

### POST `/api/v1/auth/google-login`
Authenticate using Google OAuth.

### POST `/api/v1/auth/verify-recaptcha`
Verify reCAPTCHA token.

## Users
### GET `/api/v1/users/me`
Get current user information.

### PUT `/api/v1/users/me`
Update current user information.

### GET `/api/v1/users/{user_id}`
Get user by ID.

## Profiles
### GET `/api/v1/profiles/me`
Get current user profile.

### POST `/api/v1/profiles`
Create a new profile.

### PUT `/api/v1/profiles/me`
Update current user profile.

### GET `/api/v1/profiles/{profile_id}`
Get profile by ID.

## Projects
### GET `/api/v1/projects`
Get all projects with pagination.

### POST `/api/v1/projects`
Create a new project.

### GET `/api/v1/projects/{project_id}`
Get project by ID.

### PUT `/api/v1/projects/{project_id}`
Update project by ID.

### DELETE `/api/v1/projects/{project_id}`
Delete project by ID.

## Collaborations
### GET `/api/v1/collaborations`
Get collaboration requests for current user.

### POST `/api/v1/collaborations`
Send a collaboration request.

### PUT `/api/v1/collaborations/{collaboration_id}`
Update collaboration request status.

### DELETE `/api/v1/collaborations/{collaboration_id}`
Delete collaboration request.

## Subscriptions
### GET `/api/v1/subscriptions/my`
Get current user subscription.

### POST `/api/v1/subscriptions/upgrade`
Upgrade user subscription.

### POST `/api/v1/subscriptions/cancel`
Cancel user subscription.

## Notifications
### GET `/api/v1/notifications`
Get user notifications.

### PUT `/api/v1/notifications/{notification_id}/read`
Mark notification as read.

### DELETE `/api/v1/notifications/{notification_id}`
Delete notification.

## Analytics
### POST `/api/v1/analytics/track-activity`
Track user activity for analytics.

### GET `/api/v1/analytics/user-activity`
Get user activity data (admin only).

### GET `/api/v1/analytics/user-activity/stats`
Get user activity statistics (admin only).

### POST `/api/v1/analytics/location-track`
Track user location.

### GET `/api/v1/analytics/location-data`
Get location tracking data (admin only).

### POST `/api/v1/analytics/email-campaigns`
Create email campaign (admin only).

### GET `/api/v1/analytics/email-campaigns`
Get email campaigns (admin only).

### POST `/api/v1/analytics/reports/generate`
Generate a report (admin only).

### GET `/api/v1/analytics/reports/{report_id}`
Get a specific report (admin only).

### GET `/api/v1/analytics/reports`
Get all reports (admin only).

## Advanced Search
### GET `/api/v1/search-advanced/projects`
Advanced project search with filters.

### GET `/api/v1/search-advanced/profiles`
Advanced profile search with filters.

### GET `/api/v1/search-advanced/trending-skills`
Get trending skills based on recent activity.

### GET `/api/v1/search-advanced/recommendations/projects`
Get personalized project recommendations.

### GET `/api/v1/search-advanced/recommendations/profiles`
Get personalized profile recommendations.

## Payments
### POST `/api/v1/payments/create-checkout-session`
Create a Stripe checkout session.

### POST `/api/v1/payments/webhook`
Handle Stripe webhook events.

### POST `/api/v1/payments/upgrade-subscription`
Upgrade user subscription.

### POST `/api/v1/payments/cancel-subscription`
Cancel user subscription.

### GET `/api/v1/payments/subscription-status`
Get current user subscription status.

## Admin Panel
### GET `/api/v1/admin/stats`
Get platform statistics (admin only).

### GET `/api/v1/admin/users`
Get all users (admin only).

### PUT `/api/v1/admin/users/{user_id}/toggle-active`
Toggle user active status (admin only).

### PUT `/api/v1/admin/users/{user_id}/toggle-verified`
Toggle user verified status (admin only).

### GET `/api/v1/admin/projects`
Get all projects (admin only).

### PUT `/api/v1/admin/projects/{project_id}/update-status`
Update project status (admin only).

### GET `/api/v1/admin/collaborations`
Get all collaboration requests (admin only).

### DELETE `/api/v1/admin/collaborations/{collaboration_id}`
Delete collaboration request (admin only).

## Rate Limiting
All endpoints are rate-limited to prevent abuse:
- Authenticated users: 1000 requests/hour
- Unauthenticated users: 100 requests/hour
- Admin endpoints: 500 requests/hour

## Error Handling
The API returns standard HTTP status codes:
- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Response Format
Successful responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Success message"
}
```

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": { /* optional error details */ }
}
```

## Pagination
Paginated responses include metadata:
```json
{
  "items": [ /* array of items */ ],
  "total": 100,
  "page": 1,
  "size": 10,
  "pages": 10
}
```

## Security
- All data transmission is encrypted with HTTPS
- Passwords are hashed using bcrypt
- JWT tokens expire after 30 minutes (configurable)
- Refresh tokens expire after 7 days (configurable)
- reCAPTCHA is used to prevent bot registration
- Input validation prevents injection attacks
- CORS policies restrict cross-origin requests

## Versioning
The API uses URI versioning with the `/api/v1/` prefix. Future versions will use `/api/v2/`, etc.

## Support
For API support, contact: api-support@collabthon.com
Documentation updates: https://docs.collabthon.com