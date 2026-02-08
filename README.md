# Collabthon Platform

## Overview

The Collabthon Platform is a comprehensive student collaboration platform designed to connect college students for project-based learning, skill sharing, and professional networking. Built with FastAPI and modern web technologies, it offers enterprise-level features with a focus on scalability, security, and user experience.

## 🚀 Features

### Core Features
- **Student Collaboration Matching**: Intelligent algorithm to match students based on skills, interests, and project goals
- **User Authentication**: JWT-based authentication with refresh tokens and Google OAuth 2.0
- **Profile Management**: Detailed student profiles with skills, experience, and education
- **Project Management**: Post, discover, and collaborate on projects
- **Collaboration System**: Request-based collaboration with messaging
- **Subscription Plans**: Free, Professional, and Enterprise tiers with Stripe integration
- **Real-time Notifications**: Instant updates on project invitations, messages, and collaboration requests

### Advanced Features
- **Google Cloud Integration**: 
  - Google OAuth 2.0: Secure user authentication with Google accounts
  - Google reCAPTCHA: Advanced bot protection and security
  - Google Cloud Storage: Scalable file and media storage
  - Google Vision API: Image analysis and processing capabilities
  - Google Maps API: Location-based services and geolocation tracking
  - Google Translate API: Multi-language support and translation services
  - Google Analytics 4: Comprehensive user behavior tracking
- **Advanced Search & Filtering**: Sophisticated search with multiple filters
- **Real-time Analytics**: User activity tracking and platform insights
- **Payment Integration**: Stripe for subscription management
- **Email Marketing**: Campaign management and tracking
- **Admin Dashboard**: Comprehensive admin tools for platform management
- **Multi-language Support**: Internationalization capabilities
- **Location-based Services**: Geographic features using Google Maps
- **Accessibility Compliance**: WCAG compliant interface
- **Performance Optimization**: Caching, CDN, and optimization strategies

### UI/UX Features
- **Responsive Design**: Works on all device sizes
- **Dark/Light Theme**: User preference-based theming
- **Animations**: Smooth transitions and micro-interactions
- **SEO Optimized**: Proper meta tags and structured data

## ☁️ Google Cloud Services Integration

- **Google OAuth 2.0**: Secure user authentication with Google accounts
- **Google reCAPTCHA**: Advanced bot protection and security
- **Google Cloud Storage**: Scalable file and media storage
- **Google Vision API**: Image analysis and processing capabilities
- **Google Maps API**: Location-based services and geolocation tracking
- **Google Translate API**: Multi-language support and translation services
- **Google Analytics 4**: Comprehensive user behavior tracking and analytics

## 💻 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.13+)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with secure hashing
- **Async Processing**: Celery with Redis broker
- **Caching**: Redis for performance optimization

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: CSS3 with responsive design
- **Icons**: Material Icons
- **Fonts**: Google Fonts

### Infrastructure
- **Database**: MySQL 8.0+
- **Cache**: Redis 6.0+
- **Message Queue**: Celery with Redis backend
- **Deployment**: Docker-ready configuration

## Architecture

### Backend Structure
```
collabthon-backend/
├── app/
│   ├── api/              # API route definitions
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── core/             # Core application logic
│   ├── database.py       # Database configuration
│   ├── utils/            # Utility functions
│   └── static/           # Static files
├── docs/                 # Documentation
├── tests/                # Test files
├── requirements.txt      # Dependencies
├── run.py                # Application runner
└── README.md
```

### Frontend Structure
```
collabthon-clean/
├── index.html            # Main HTML file
├── styles.css            # Styling
├── integrated.js         # Main JavaScript functionality
├── api.js                # API client
└── script.js             # Additional scripts
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- MySQL 8.0+
- Node.js (for development tools)
- Git

### Backend Setup

1. **Clone the repository:**
```bash
git clone https://github.com/rohanshelar991/collabthon.git
cd collabthon-backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**
Create a `.env` file in the project root:
```env
DATABASE_URL=mysql+pymysql://username:password@localhost/collabthon_db
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

5. **Initialize the database:**
```bash
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"
```

6. **Start the development server:**
```bash
python run.py
# Or using uvicorn directly:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

The frontend is served statically. Simply open `index.html` in a browser or serve it using any HTTP server.

For development:
```bash
cd collabthon-clean
python -m http.server 3000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/google` - Google OAuth login
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/` - Get all users
- `GET /api/v1/users/{user_id}` - Get specific user
- `PUT /api/v1/users/{user_id}` - Update user profile
- `DELETE /api/v1/users/{user_id}` - Delete user

### Profiles
- `GET /api/v1/profiles/` - Get all profiles
- `GET /api/v1/profiles/{user_id}` - Get specific profile
- `PUT /api/v1/profiles/{user_id}` - Update profile
- `POST /api/v1/profiles/upload-photo` - Upload profile photo

### Projects
- `GET /api/v1/projects/` - Get all projects
- `POST /api/v1/projects/` - Create new project
- `GET /api/v1/projects/{project_id}` - Get specific project
- `PUT /api/v1/projects/{project_id}` - Update project
- `DELETE /api/v1/projects/{project_id}` - Delete project

### Collaborations
- `POST /api/v1/collaborations/request` - Send collaboration request
- `PUT /api/v1/collaborations/{request_id}/respond` - Respond to request
- `GET /api/v1/collaborations/my-requests` - Get my collaboration requests
- `GET /api/v1/collaborations/my-collaborations` - Get my collaborations

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Get available plans
- `POST /api/v1/payments/create-checkout-session` - Create Stripe checkout
- `GET /api/v1/payments/subscription-status` - Get subscription status
- `POST /api/v1/payments/upgrade-subscription` - Upgrade subscription
- `POST /api/v1/payments/cancel-subscription` - Cancel subscription

### Analytics
- `POST /api/v1/analytics/track-activity` - Track user activity
- `GET /api/v1/analytics/analytics/user-activity` - Get user activity (admin)
- `GET /api/v1/analytics/analytics/user-activity/stats` - Get activity stats
- `POST /api/v1/analytics/location-track` - Track user location
- `GET /api/v1/analytics/analytics/location-data` - Get location data (admin)
- `GET /api/v1/analytics/reports` - Get all reports (admin)
- `POST /api/v1/analytics/reports/generate` - Generate new report

### Notifications
- `GET /api/v1/notifications/` - Get user notifications
- `PUT /api/v1/notifications/{notification_id}/read` - Mark notification as read
- `DELETE /api/v1/notifications/{notification_id}` - Delete notification

### Search
- `GET /api/v1/search/projects` - Search projects
- `GET /api/v1/search/users` - Search users
- `GET /api/v1/search/advanced` - Advanced search with filters

### Utilities
- `GET /health` - Health check
- `GET /docs` - API documentation (Swagger UI)
- `GET /redoc` - API documentation (ReDoc)

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: ORM-based queries with parameterized inputs
- **XSS Protection**: Content security policies and output encoding
- **Google reCAPTCHA**: Bot protection on critical endpoints
- **Secure Headers**: Proper HTTP security headers

## 📊 Analytics and Monitoring

- **User Activity Tracking**: Comprehensive event logging
- **Geolocation Analytics**: Location-based insights
- **Engagement Metrics**: Detailed user engagement tracking
- **Performance Monitoring**: API response time tracking
- **Error Tracking**: Comprehensive error logging and monitoring

## 🧪 Testing

To run the comprehensive test suite:

```bash
python comprehensive_test.py
```

This runs end-to-end tests covering all major functionality including:
- API health and connectivity
- Database operations
- Authentication and authorization
- Google Cloud services integration
- Payment gateway functionality
- Notification system
- Search capabilities

## Deployment

### Production Deployment
1. Use environment variables for configuration
2. Set up a reverse proxy (nginx/Apache)
3. Configure SSL certificates
4. Use process managers (gunicorn/supervisor)
5. Set up monitoring and logging

### Docker Deployment
A Dockerfile and docker-compose.yml are included for containerized deployment.

## Development Guidelines

### Code Style
- Follow PEP 8 guidelines
- Use type hints for all functions
- Write docstrings for public functions
- Use descriptive variable names

### Git Workflow
1. Create feature branches
2. Write tests for new features
3. Submit pull requests for review
4. Follow semantic commit messages

### Testing
Run tests using pytest:
```bash
pytest tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs and feature requests on GitHub
- **Community**: Join our Discord for discussions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- Rohan Shelar - Initial work and primary development

## Acknowledgments

- FastAPI community for excellent documentation and examples
- Google Cloud Platform for comprehensive services
- Stripe for payment processing solutions
- All contributors and beta testers