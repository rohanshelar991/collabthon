# Collabthon Platform Developer Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Setup and Installation](#setup-and-installation)
4. [Development Workflow](#development-workflow)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Authentication System](#authentication-system)
8. [Security Best Practices](#security-best-practices)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

## Introduction

The Collabthon Platform is a comprehensive student collaboration platform built with FastAPI and designed for scalability. It enables college students to connect, collaborate on projects, and grow their skills through peer-to-peer learning.

### Features
- User authentication and authorization
- Profile management
- Project posting and discovery
- Collaboration requests
- Subscription management
- Real-time notifications
- Advanced search and filtering
- Analytics and user behavior tracking
- Payment processing
- Google Cloud integrations
- Multi-language support
- Location-based services

## Architecture

### Tech Stack
- **Backend**: FastAPI (Python 3.9+)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT with refresh tokens
- **Caching**: Redis (optional)
- **File Storage**: Google Cloud Storage
- **Payment Processing**: Stripe
- **Search**: Built-in search with Elasticsearch (optional)
- **Frontend**: HTML/CSS/JavaScript with Tailwind CSS

### Project Structure
```
collabthon-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Main application entry point
│   ├── api/                    # API route definitions
│   │   ├── __init__.py
│   │   ├── users.py           # User management endpoints
│   │   ├── profiles.py        # Profile management endpoints
│   │   ├── projects.py        # Project management endpoints
│   │   ├── collaborations.py  # Collaboration endpoints
│   │   ├── subscriptions.py   # Subscription endpoints
│   │   ├── notifications.py   # Notification endpoints
│   │   ├── auth_routes.py     # Authentication endpoints
│   │   ├── analytics.py       # Analytics endpoints
│   │   ├── search_advanced.py # Advanced search endpoints
│   │   ├── payments.py        # Payment endpoints
│   │   └── admin/             # Admin panel endpoints
│   ├── models/                # Database models
│   │   ├── __init__.py
│   │   ├── notification.py    # Notification model
│   │   └── analytics.py       # Analytics models
│   ├── schemas/               # Pydantic schemas
│   │   └── __init__.py
│   ├── core/                  # Core application logic
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration settings
│   │   ├── deps.py            # Dependency injection
│   │   └── security.py        # Security utilities
│   ├── database.py            # Database configuration
│   ├── utils/                 # Utility functions
│   │   ├── __init__.py
│   │   ├── google_services.py # Google services integration
│   │   ├── maps_service.py    # Google Maps service
│   │   ├── translation_service.py # Google Translation service
│   │   └── payment_service.py # Payment service
│   └── static/                # Static files
├── docs/                      # Documentation
├── tests/                     # Test files
├── requirements.txt           # Python dependencies
├── run.py                     # Application runner
└── README.md
```

## Setup and Installation

### Prerequisites
- Python 3.9+
- MySQL 8.0+
- Git
- pip package manager

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/your-org/collabthon.git
cd collabthon
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in the project root:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost/database_name
SECRET_KEY=your-super-secret-key-change-in-production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_RECAPTCHA_SECRET=your-recaptcha-secret
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_TRANSLATE_API_KEY=your-translate-api-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

5. Run database migrations:
```bash
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"
```

6. Start the development server:
```bash
python run.py
```

## Development Workflow

### Code Style
- Follow PEP 8 guidelines
- Use type hints for all function parameters and return values
- Write docstrings for all public functions and classes
- Use descriptive variable and function names

### Git Workflow
1. Create a feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git add . && git commit -m "Add new feature"`
3. Push to remote: `git push origin feature/new-feature`
4. Create a pull request to merge into main

### Testing
Run tests with pytest:
```bash
pytest tests/
```

## Database Schema

### Tables

#### users
- id (Integer, Primary Key)
- email (String, Unique, Not Null)
- username (String, Unique, Not Null)
- hashed_password (String, Not Null)
- role (Enum: student, admin)
- is_active (Boolean, Default: True)
- is_verified (Boolean, Default: False)
- is_google_account (Boolean, Default: False)
- created_at (DateTime)
- updated_at (DateTime)

#### profiles
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key to users.id, Unique, Not Null)
- first_name (String, Not Null)
- last_name (String, Not Null)
- college (String, Not Null)
- major (String, Not Null)
- year (Integer, Not Null)
- bio (Text)
- skills (Text) - JSON string
- experience (String)
- github_url (String)
- linkedin_url (String)
- portfolio_url (String)
- avatar_url (String)
- is_public (Boolean, Default: True)
- created_at (DateTime)
- updated_at (DateTime)

#### projects
- id (Integer, Primary Key)
- owner_id (Integer, Foreign Key to users.id, Not Null)
- title (String, Not Null)
- description (Text, Not Null)
- required_skills (Text) - JSON string
- budget_min (Float)
- budget_max (Float)
- timeline (String)
- status (Enum: open, in_progress, completed, closed)
- is_remote (Boolean, Default: True)
- created_at (DateTime)
- updated_at (DateTime)
- expires_at (DateTime)

#### collaboration_requests
- id (Integer, Primary Key)
- sender_id (Integer, Foreign Key to users.id, Not Null)
- receiver_id (Integer, Foreign Key to users.id, Not Null)
- project_id (Integer, Foreign Key to projects.id)
- message (Text)
- status (Enum: pending, accepted, rejected, cancelled)
- created_at (DateTime)
- updated_at (DateTime)

#### subscriptions
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key to users.id, Unique, Not Null)
- plan (Enum: free, professional, enterprise)
- stripe_customer_id (String)
- stripe_subscription_id (String)
- is_active (Boolean, Default: True)
- started_at (DateTime)
- expires_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

#### notifications
- id (Integer, Primary Key)
- recipient_id (Integer, Foreign Key to users.id, Not Null)
- type (Enum: collaboration_request, collaboration_accepted, etc.)
- title (String, Not Null)
- message (Text, Not Null)
- is_read (Boolean, Default: False)
- is_active (Boolean, Default: True)
- data (Text) - JSON string
- created_at (DateTime)
- read_at (DateTime)

#### user_activities
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key to users.id, Nullable)
- activity_type (String, Not Null)
- page_url (String)
- element_id (String)
- element_class (String)
- referrer (String)
- user_agent (Text)
- ip_address (String)
- session_id (String)
- metadata (JSON)
- timestamp (DateTime, Default: now)

#### location_tracking
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key to users.id, Nullable)
- latitude (Float)
- longitude (Float)
- country (String)
- city (String)
- region (String)
- postal_code (String)
- timezone (String)
- accuracy (Float)
- timestamp (DateTime, Default: now)

#### email_campaigns
- id (Integer, Primary Key)
- name (String, Not Null)
- subject (String, Not Null)
- content (Text, Not Null)
- recipients_count (Integer, Default: 0)
- sent_count (Integer, Default: 0)
- opened_count (Integer, Default: 0)
- clicked_count (Integer, Default: 0)
- created_by (Integer, Foreign Key to users.id)
- scheduled_at (DateTime)
- sent_at (DateTime)
- status (String, Default: "draft")
- created_at (DateTime)
- updated_at (DateTime)

#### file_uploads
- id (Integer, Primary Key)
- user_id (Integer, Foreign Key to users.id, Not Null)
- filename (String, Not Null)
- original_filename (String, Not Null)
- file_size (Integer)
- mime_type (String)
- file_path (String)
- storage_type (String, Default: "local")
- bucket_name (String)
- public_url (String)
- upload_status (String, Default: "uploading")
- uploaded_at (DateTime)
- expires_at (DateTime)

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/google-login` - Google OAuth login
- `POST /api/v1/auth/verify-recaptcha` - Verify reCAPTCHA

### User Management Endpoints
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/{id}` - Get user by ID

### Profile Management Endpoints
- `GET /api/v1/profiles/me` - Get current user profile
- `POST /api/v1/profiles` - Create profile
- `PUT /api/v1/profiles/me` - Update profile
- `GET /api/v1/profiles/{id}` - Get profile by ID

### Project Management Endpoints
- `GET /api/v1/projects` - Get all projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project by ID
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Collaboration Endpoints
- `GET /api/v1/collaborations` - Get collaboration requests
- `POST /api/v1/collaborations` - Send collaboration request
- `PUT /api/v1/collaborations/{id}` - Update collaboration status

### Subscription Endpoints
- `GET /api/v1/subscriptions/my` - Get user subscription
- `POST /api/v1/subscriptions/upgrade` - Upgrade subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Notification Endpoints
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/{id}/read` - Mark notification as read

### Analytics Endpoints
- `POST /api/v1/analytics/track-activity` - Track user activity
- `GET /api/v1/analytics/user-activity` - Get user activity data
- `GET /api/v1/analytics/user-activity/stats` - Get activity stats
- `POST /api/v1/analytics/location-track` - Track user location

### Search Endpoints
- `GET /api/v1/search-advanced/projects` - Advanced project search
- `GET /api/v1/search-advanced/profiles` - Advanced profile search
- `GET /api/v1/search-advanced/recommendations/projects` - Project recommendations
- `GET /api/v1/search-advanced/recommendations/profiles` - Profile recommendations

### Payment Endpoints
- `POST /api/v1/payments/create-checkout-session` - Create checkout session
- `POST /api/v1/payments/webhook` - Handle payment webhooks
- `POST /api/v1/payments/upgrade-subscription` - Upgrade subscription
- `POST /api/v1/payments/cancel-subscription` - Cancel subscription

### Admin Endpoints
- `GET /api/v1/admin/stats` - Get platform statistics
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/{id}/toggle-active` - Toggle user active status
- `GET /api/v1/admin/projects` - Get all projects
- `PUT /api/v1/admin/projects/{id}/update-status` - Update project status

## Authentication System

The Collabthon Platform uses JWT-based authentication with refresh tokens:

1. **Login**: User provides credentials, receives access and refresh tokens
2. **Access Token**: Valid for 30 minutes, used for API requests
3. **Refresh Token**: Valid for 7 days, used to get new access tokens
4. **Token Storage**: Tokens stored in HTTP-only cookies or local storage

### Token Refresh
When an access token expires, the frontend should:
1. Send refresh token to `/api/v1/auth/refresh` endpoint
2. Receive new access token
3. Retry original request with new token

### Role-Based Access Control
- **Student**: Can create profiles, projects, send collaboration requests
- **Admin**: All student permissions plus admin panel access

## Security Best Practices

### Input Validation
- All inputs are validated using Pydantic schemas
- SQL injection prevented by SQLAlchemy ORM
- XSS prevention through proper escaping

### Authentication & Authorization
- Passwords hashed with bcrypt
- JWT tokens signed with secret key
- Session management with refresh tokens
- Rate limiting to prevent brute force attacks

### Data Protection
- Sensitive data encrypted at rest
- HTTPS enforced for all communications
- Regular security audits recommended

### API Security
- CORS configured to allow only trusted origins
- Rate limiting on all endpoints
- Input sanitization for all parameters

## Testing

### Unit Tests
Located in the `tests/` directory, covering:
- Model validations
- API endpoint responses
- Business logic functions
- Authentication flows

### Running Tests
```bash
# Run all tests
pytest tests/

# Run tests with coverage
pytest tests/ --cov=app

# Run specific test file
pytest tests/test_users.py
```

### Test Structure
```
tests/
├── conftest.py              # Test fixtures
├── test_users.py           # User-related tests
├── test_profiles.py        # Profile-related tests
├── test_projects.py        # Project-related tests
├── test_auth.py            # Authentication tests
├── test_notifications.py   # Notification tests
└── test_analytics.py       # Analytics tests
```

## Deployment

### Production Deployment
1. Set up production environment with environment variables
2. Configure reverse proxy (nginx) for SSL termination
3. Set up process manager (gunicorn) for multiple workers
4. Configure database connection pooling
5. Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
```env
DEBUG=False
DATABASE_URL=postgresql://user:pass@prod-db:5432/collabthon
SECRET_KEY=super-long-production-secret-key
ALLOWED_HOSTS=*.yourdomain.com
REDIS_URL=redis://prod-redis:6379
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Verify database credentials in environment variables
- Check database server is running and accessible
- Confirm database name exists

#### Authentication Issues
- Ensure SECRET_KEY is set and not default
- Check JWT expiration times
- Verify refresh token handling

#### CORS Issues
- Confirm ALLOWED_ORIGINS includes your frontend domain
- Check if you're using HTTPS in production

#### Google Services Issues
- Verify API keys are correctly configured
- Check service account permissions
- Confirm billing is enabled for Google services

### Logging
The application logs to standard output by default. For production:
- Configure centralized logging (ELK stack, etc.)
- Monitor for security events
- Set up alerts for critical errors

### Monitoring
Recommended monitoring includes:
- API response times
- Error rates
- Database connection pool usage
- Memory and CPU usage
- Active user counts

## Support

For technical support:
- Email: dev-support@collabthon.com
- Discord: https://discord.gg/collabthon
- Documentation: https://docs.collabthon.com

For security issues:
- Email: security@collabthon.com (encrypted)
- Security Policy: https://github.com/your-org/collabthon/security/policy