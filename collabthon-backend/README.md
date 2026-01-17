# Collabthon - College Student Collaboration Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/mysql-8.0+-blue.svg)](https://www.mysql.com/)

</div>

## 🚀 Overview

Collabthon is a comprehensive full-stack web application designed to help college students showcase skills, find collaborators, and work on freelance or project-based opportunities. The platform provides student profiles, skill-based discovery, collaboration requests, and subscription plans with modern web development practices and scalability for future enhancements.

## 🏗️ Architecture

### Frontend
- **Technology**: HTML5, CSS3, JavaScript (ES6+)
- **Design**: Modern, responsive UI with dark/light mode
- **Features**: Interactive forms, search/filter functionality, real-time updates
- **State Management**: Client-side JavaScript with localStorage

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT-based with role-based access control
- **API**: RESTful with automatic OpenAPI/Swagger documentation

## 🌟 Key Features

### Authentication & Security
- JWT-based authentication with secure token management
- Google OAuth integration for easy sign-in
- reCAPTCHA protection against bots
- Password hashing with bcrypt
- Role-based access control (Students, Admins)

### User Management
- User registration and login with email verification
- Profile creation and editing with rich details
- Skill-based student search and filtering
- College and major-based discovery

### Project System
- Create and manage project listings
- Budget and timeline specification
- Required skills tagging
- Remote/local project options
- Advanced search and filtering

### Collaboration System
- Send and receive collaboration requests
- Real-time notifications
- Project-based collaboration matching
- Status tracking (Pending, Accepted, Rejected)

### Subscription Plans
- Free tier with basic features
- Professional tier with enhanced capabilities
- Enterprise tier with premium features
- Stripe integration for payments

### Admin Panel
- User management dashboard
- Content moderation tools
- Platform analytics
- Performance monitoring

## 🛠️ Tech Stack

### Backend Technologies
- **FastAPI**: High-performance web framework with automatic API documentation
- **Python 3.8+**: Modern, readable programming language
- **MySQL**: Reliable relational database management system
- **SQLAlchemy**: Powerful ORM for database operations
- **JWT**: Secure token-based authentication
- **Passlib**: Secure password hashing
- **Google Services**: OAuth, reCAPTCHA, Cloud Storage, Vision API

### Frontend Technologies
- **HTML5**: Semantic markup for content structure
- **CSS3**: Modern styling with flexbox and grid layouts
- **JavaScript ES6+**: Client-side interactivity and state management
- **Fetch API**: Modern HTTP client for API communication
- **LocalStorage**: Client-side data persistence

## 📁 Project Structure

```
collabthon/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── admin/        # Admin panel endpoints
│   │   │   ├── users/        # User management endpoints
│   │   │   ├── profiles/     # Profile management endpoints
│   │   │   ├── projects/     # Project management endpoints
│   │   │   ├── collaborations/ # Collaboration endpoints
│   │   │   └── subscriptions/ # Subscription endpoints
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── utils/            # Utility functions and helpers
│   │   ├── database.py       # Database connection and session management
│   │   ├── main.py           # FastAPI app entry point
│   │   └── core/             # Core utilities and configuration
│   ├── sql/                  # Database initialization scripts
│   ├── docs/                 # Documentation
│   ├── tests/                # Test suite
│   ├── requirements.txt      # Python dependencies
│   ├── run.py               # Application runner
│   ├── deploy.sh            # Production deployment script
│   └── README.md            # Project documentation
├── frontend/                 # HTML/CSS/JavaScript frontend
│   ├── index.html           # Main HTML file with complete UI
│   ├── styles.css           # Comprehensive CSS styling
│   ├── script.js            # Main JavaScript functionality
│   ├── api.js               # API client and state management
│   └── integrated.js        # Integration layer
└── setup_collabthon.sh      # Complete setup script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- Git
- Node.js (for development tools)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/collabthon.git
cd collabthon
```

2. **Set up the backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration values
```

4. **Set up the database**
```bash
# Start MySQL server
mysql -u root -p

# Execute SQL commands to create database
CREATE DATABASE collabthon_db;
CREATE USER 'collabthon'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON collabthon_db.* TO 'collabthon'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

5. **Run the application**
```bash
python run.py
```

6. **Access the application**
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Frontend: Serve static files from the frontend directory

## 🔐 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Application Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
PROJECT_NAME=Collabthon API

# Database Configuration
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/collabthon_db

# JWT Settings
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Settings
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"]

# Google Services
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_RECAPTCHA_SECRET=your-recaptcha-secret
GOOGLE_ANALYTICS_ID=your-analytics-id

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
```

## 🧪 Testing

Run the test suite:

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run tests
cd tests
python -m pytest
```

## 🚢 Deployment

For production deployment, use the provided deployment script:

```bash
./deploy.sh
```

Or follow manual deployment steps:
1. Set up production server
2. Install dependencies
3. Configure environment variables
4. Set up database
5. Deploy backend service
6. Configure reverse proxy (Nginx)
7. Set up SSL certificates

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/google-login` - Google OAuth login
- `POST /api/v1/auth/verify-recaptcha` - Verify reCAPTCHA

### Users
- `GET /api/v1/users/` - Get all users (admin only)
- `GET /api/v1/users/{id}` - Get specific user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Profiles
- `GET /api/v1/profiles/` - Get all public profiles
- `GET /api/v1/profiles/{id}` - Get specific profile
- `POST /api/v1/profiles/` - Create profile
- `PUT /api/v1/profiles/{id}` - Update profile
- `DELETE /api/v1/profiles/{id}` - Delete profile

### Projects
- `GET /api/v1/projects/` - Get all projects
- `GET /api/v1/projects/{id}` - Get specific project
- `POST /api/v1/projects/` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Collaborations
- `GET /api/v1/collaborations/` - Get collaboration requests
- `POST /api/v1/collaborations/` - Create collaboration request
- `PUT /api/v1/collaborations/{id}` - Update collaboration request
- `DELETE /api/v1/collaborations/{id}` - Cancel collaboration request

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Get subscription plans
- `GET /api/v1/subscriptions/my` - Get user's subscription
- `POST /api/v1/subscriptions/subscribe/{plan}` - Subscribe to plan
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Admin Panel
- `GET /api/v1/admin/stats` - Get platform statistics
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/{id}/toggle-active` - Toggle user active status
- `PUT /api/v1/admin/users/{id}/toggle-verified` - Toggle user verified status
- `GET /api/v1/admin/projects` - Get all projects
- `PUT /api/v1/admin/projects/{id}/update-status` - Update project status
- `GET /api/v1/admin/collaborations` - Get all collaborations
- `DELETE /api/v1/admin/collaborations/{id}` - Delete collaboration

## 🛡️ Security Best Practices

- Use HTTPS in production
- Validate and sanitize all inputs
- Implement rate limiting
- Use environment variables for sensitive data
- Regular security audits
- Keep dependencies updated
- Implement proper error handling

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## 📞 Support

If you encounter any issues or have questions:

- Check the [documentation](docs/)
- Open an [issue](https://github.com/yourusername/collabthon/issues)
- Review the API documentation at `/docs`
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI community for excellent documentation and tools
- SQLAlchemy for robust ORM capabilities
- All open-source contributors whose work made this project possible
- The Python community for continuous innovation
- Google for OAuth and other services integration

---

<div align="center">

**Made with ❤️ for the student community**

[Back to top](#collabthon---college-student-collaboration-platform)

</div>