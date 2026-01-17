# Collabthon - College Student Collaboration Platform

## 🚀 Project Overview

Collabthon is a full-stack web application designed to help college students showcase skills, find collaborators, and work on freelance or project-based opportunities. The platform provides student profiles, skill-based discovery, collaboration requests, and subscription plans with modern web development practices.

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI (Python 3.13)
- **Database**: MySQL 8.0 with SQLAlchemy ORM
- **Authentication**: JWT-based with role-based access control
- **API**: RESTful with automatic OpenAPI/Swagger documentation
- **Security**: Password hashing with bcrypt, input validation

### Frontend (Vanilla HTML/CSS/JS)
- **Technology**: HTML5, CSS3, JavaScript ES6+
- **Design**: Responsive UI with dark/light mode support
- **State Management**: Client-side JavaScript with localStorage
- **API Integration**: Fetch API for backend communication

## 🌟 Key Features

### Authentication & Security
- ✅ JWT-based authentication with secure token management
- ✅ Google OAuth integration for easy sign-in
- ✅ reCAPTCHA protection against bots
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (Students, Admins)

### User Management
- ✅ User registration and login with email verification
- ✅ Profile creation and editing with rich details
- ✅ Skill-based student search and filtering
- ✅ College and major-based discovery

### Project System
- ✅ Create and manage project listings
- ✅ Budget and timeline specification
- ✅ Required skills tagging
- ✅ Remote/local project options
- ✅ Advanced search and filtering

### Collaboration System
- ✅ Send and receive collaboration requests
- ✅ Real-time notifications
- ✅ Project-based collaboration matching
- ✅ Status tracking (Pending, Accepted, Rejected)

### Subscription Plans
- ✅ Free tier with basic features
- ✅ Professional tier with enhanced capabilities
- ✅ Enterprise tier with premium features
- ✅ Stripe integration foundation

### Admin Panel
- ✅ User management dashboard
- ✅ Content moderation tools
- ✅ Platform analytics
- ✅ Performance monitoring

## 🛠️ Tech Stack

### Backend Technologies
- **FastAPI**: High-performance web framework
- **Python 3.13**: Modern programming language
- **MySQL**: Relational database management
- **SQLAlchemy**: ORM for database operations
- **JWT**: Secure token-based authentication
- **Passlib**: Secure password hashing
- **Google Services**: OAuth, reCAPTCHA, Cloud Storage, Vision API

### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with flexbox/grid
- **JavaScript ES6+**: Client-side interactivity
- **Fetch API**: HTTP client for API communication
- **LocalStorage**: Client-side data persistence

## 📁 Project Structure

```
collabthon/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth_routes.py # Authentication endpoints
│   │   │   ├── users.py      # User management endpoints
│   │   │   ├── profiles.py   # Profile management endpoints
│   │   │   ├── projects.py   # Project management endpoints
│   │   │   ├── collaborations.py # Collaboration endpoints
│   │   │   ├── subscriptions.py # Subscription endpoints
│   │   │   ├── admin/        # Admin panel endpoints
│   │   │   └── auth/         # Google OAuth endpoints
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── utils/            # Utility functions
│   │   ├── database.py       # Database connection
│   │   ├── main.py           # FastAPI app entry point
│   │   └── core/             # Core utilities
│   ├── sql/                  # Database initialization scripts
│   ├── docs/                 # Documentation
│   ├── tests/                # Test suite
│   ├── requirements.txt      # Python dependencies
│   ├── run.py               # Application runner
│   ├── deploy.sh            # Production deployment script
│   └── README.md            # Backend documentation
├── frontend/                 # HTML/CSS/JavaScript frontend
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styling
│   ├── script.js            # Main JavaScript
│   ├── api.js               # API client
│   └── integrated.js        # Integration layer
└── setup_collabthon.sh      # Complete setup script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- Git

### Backend Setup

1. **Navigate to backend directory**
```bash
cd collabthon-backend
```

2. **Install dependencies**
```bash
pip3 install -r requirements.txt
```

3. **Set up database**
```bash
# Make sure MySQL is running
mysql -u root -pRohan@1234

# Create database (if not already created)
CREATE DATABASE collabthon_db;
CREATE USER 'collabthon'@'localhost' IDENTIFIED BY 'collabthon_password';
GRANT ALL PRIVILEGES ON collabthon_db.* TO 'collabthon'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Initialize database schema
./init_db.sh
```

4. **Run the backend server**
```bash
python3 run.py
```

The backend will be available at: http://localhost:8000
API documentation: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd ../collabthon-clean
```

2. **Serve frontend files**
```bash
python3 -m http.server 3000
```

The frontend will be available at: http://localhost:3000

## 🔐 Environment Configuration

The backend uses the following environment variables (configured in `app/core/config.py`):

```python
# Database
DATABASE_URL = "mysql+pymysql://root:Rohan%401234@localhost/collabthon_db"

# JWT Settings
SECRET_KEY = "your-secret-key-here-change-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Google Services (optional)
GOOGLE_CLIENT_ID = ""
GOOGLE_CLIENT_SECRET = ""
GOOGLE_RECAPTCHA_SECRET = ""
GOOGLE_ANALYTICS_ID = ""
```

## 🧪 Testing

### Backend Testing
```bash
cd collabthon-backend
python3 -m pytest tests/
```

### API Endpoints Testing
All endpoints can be tested via the Swagger UI at http://localhost:8000/docs

## 🚢 Deployment

For production deployment, use the provided deployment script:

```bash
cd collabthon-backend
./deploy.sh
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/google-login` - Google OAuth login
- `POST /api/v1/auth/verify-recaptcha` - Verify reCAPTCHA

### Users
- `GET /api/v1/users/` - Get all users (admin)
- `GET /api/v1/users/{id}` - Get specific user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Profiles
- `GET /api/v1/profiles/` - Get all public profiles
- `GET /api/v1/profiles/{id}` - Get specific profile
- `POST /api/v1/profiles/` - Create profile
- `PUT /api/v1/profiles/{id}` - Update profile

### Projects
- `GET /api/v1/projects/` - Get all projects
- `GET /api/v1/projects/{id}` - Get specific project
- `POST /api/v1/projects/` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Admin Panel
- `GET /api/v1/admin/stats` - Get platform statistics
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/{id}/toggle-active` - Toggle user status
- `GET /api/v1/admin/projects` - Get all projects

## 🛡️ Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ Cross-site scripting (XSS) protection
- ✅ Rate limiting capabilities
- ✅ Secure cookie handling

## 🎯 Current Status

✅ **Backend**: Fully functional with all core features implemented
✅ **Frontend**: Complete UI with API integration
✅ **Database**: MySQL schema with all required tables
✅ **Authentication**: JWT and Google OAuth working
✅ **API Documentation**: Available at /docs endpoint
✅ **Testing**: Basic test suite implemented
✅ **Deployment**: Production-ready deployment scripts

## 📞 Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the backend logs for error details
- Ensure all dependencies are installed
- Verify database connection settings

## 📄 License

This project is licensed under the MIT License.