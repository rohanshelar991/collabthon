#!/bin/bash

# Collabthon Platform Setup Script
# This script automates the setup process for the Collabthon Platform

set -e  # Exit on any error

echo "==========================================="
echo "Collabthon Platform Setup Script"
echo "==========================================="

# Function to print colored output
print_success() {
    echo -e "\033[32m✓ $1\033[0m"
}

print_error() {
    echo -e "\033[31m✗ $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠ $1\033[0m"
}

print_info() {
    echo -e "\033[34m→ $1\033[0m"
}

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="Linux"
else
    print_error "Unsupported platform: $OSTYPE"
    exit 1
fi

print_info "Detected platform: $PLATFORM"

# Check if Python 3.9+ is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)

if [[ $PYTHON_MAJOR -lt 3 ]] || [[ $PYTHON_MAJOR -eq 3 && $PYTHON_MINOR -lt 9 ]]; then
    print_error "Python 3.9+ is required. Current version: $PYTHON_VERSION"
    exit 1
fi

print_success "Python version: $PYTHON_VERSION"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL is not installed. Please install MySQL 8.0+ first."
    exit 1
fi

print_success "MySQL is installed"

# Navigate to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -d "$PROJECT_DIR/collabthon-backend" ]]; then
    print_error "collabthon-backend directory not found in $PROJECT_DIR"
    exit 1
fi

print_info "Project directory: $PROJECT_DIR"

# Create a backup of existing virtual environment if it exists
if [[ -d "$PROJECT_DIR/collabthon-backend/venv" ]]; then
    print_info "Backing up existing virtual environment..."
    mv "$PROJECT_DIR/collabthon-backend/venv" "$PROJECT_DIR/collabthon-backend/venv.backup.$(date +%Y%m%d_%H%M%S)"
    print_success "Backed up old virtual environment"
fi

# Navigate to backend directory
cd "$PROJECT_DIR/collabthon-backend"

# Create virtual environment
print_info "Creating virtual environment..."
python3 -m venv venv
print_success "Virtual environment created"

# Activate virtual environment
source venv/bin/activate
print_success "Virtual environment activated"

# Upgrade pip
print_info "Upgrading pip..."
pip install --upgrade pip
print_success "Pip upgraded"

# Install dependencies
print_info "Installing dependencies..."
pip install -r requirements.txt
print_success "Dependencies installed"

# Check if .env file exists, if not create a template
if [[ ! -f ".env" ]]; then
    print_info "Creating .env file template..."
    cat > .env << 'EOF'
# Collabthon Platform Environment Variables

# Database Configuration
DATABASE_URL=mysql+pymysql://root:Rohan@1234@localhost/collabthon_db

# Security Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Services Configuration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_RECAPTCHA_SECRET=
GOOGLE_ANALYTICS_ID=
GOOGLE_MAPS_API_KEY=
GOOGLE_TRANSLATE_API_KEY=

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PROFESSIONAL_PRICE_ID=
STRIPE_ENTERPRISE_PRICE_ID=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8000", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:5173", "http://127.0.0.1:8000"]
EOF
    print_success ".env file created. Please update it with your actual configuration."
    print_warning "Important: Update the .env file with your actual API keys and credentials!"
fi

# Initialize the database
print_info "Initializing database..."
python -c "
from app.database import engine, Base
from app.core.config import settings
import urllib.parse

# Create database if it doesn't exist
import pymysql
connection = pymysql.connect(
    host=settings.DATABASE_URL.split('@')[1].split('/')[2].split(':')[0],
    user=settings.DATABASE_URL.split('://')[1].split(':')[0],
    password=urllib.parse.unquote(settings.DATABASE_URL.split(':')[1].split('@')[0]),
    charset='utf8mb4'
)

cursor = connection.cursor()
db_name = settings.DATABASE_URL.split('/')[-1]
cursor.execute(f'CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
cursor.close()
connection.close()

# Create tables
Base.metadata.create_all(bind=engine)
print('Database initialized successfully!')
"
print_success "Database initialized"

# Create a start script
print_info "Creating start script..."
cat > start_server.sh << 'EOF'
#!/bin/bash
# Start the Collabthon Platform backend server

cd "$(dirname "${BASH_SOURCE[0]}")"

# Activate virtual environment
source venv/bin/activate

# Start the server
echo "Starting Collabthon Platform backend server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Deactivate virtual environment when done
deactivate
EOF

chmod +x start_server.sh
print_success "Start script created (./start_server.sh)"

# Create a stop script
print_info "Creating stop script..."
cat > stop_server.sh << 'EOF'
#!/bin/bash
# Stop the Collabthon Platform backend server

echo "Stopping Collabthon Platform backend server..."
pkill -f "uvicorn.*app.main:app"

echo "Server stopped."
EOF

chmod +x stop_server.sh
print_success "Stop script created (./stop_server.sh)"

# Navigate to frontend directory
cd "$PROJECT_DIR/collabthon-clean"

# Create a frontend start script
print_info "Creating frontend start script..."
cat > start_frontend.sh << 'EOF'
#!/bin/bash
# Start the Collabthon Platform frontend server

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Starting Collabthon Platform frontend server on port 3001..."
python -m http.server 3001

EOF

chmod +x start_frontend.sh
print_success "Frontend start script created (./collabthon-clean/start_frontend.sh)"

# Go back to project root
cd "$PROJECT_DIR"

# Create a comprehensive start script for both
print_info "Creating comprehensive start script..."
cat > start_platform.sh << 'EOF'
#!/bin/bash
# Start both backend and frontend servers

echo "Starting Collabthon Platform..."

# Start backend in background
cd collabthon-backend
echo "Starting backend server..."
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
deactivate
echo "Backend server started with PID: $BACKEND_PID"

# Start frontend in background
cd ../collabthon-clean
echo "Starting frontend server..."
nohup python -m http.server 3001 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo "Collabthon Platform is now running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3001"
echo ""
echo "To stop the platform, run: pkill -f 'uvicorn\|http.server'"
EOF

chmod +x start_platform.sh
print_success "Comprehensive start script created (./start_platform.sh)"

# Create a status script
print_info "Creating status script..."
cat > status_platform.sh << 'EOF'
#!/bin/bash
# Check the status of Collabthon Platform servers

echo "Checking Collabthon Platform status..."

BACKEND_STATUS=$(pgrep -f "uvicorn.*app.main:app" | wc -l)
FRONTEND_STATUS=$(pgrep -f "http.server.*3001" | wc -l)

if [ "$BACKEND_STATUS" -gt 0 ]; then
    echo "✓ Backend server is running (PID: $(pgrep -f 'uvicorn.*app.main:app'))"
else
    echo "✗ Backend server is not running"
fi

if [ "$FRONTEND_STATUS" -gt 0 ]; then
    echo "✓ Frontend server is running (PID: $(pgrep -f 'http.server.*3001'))"
else
    echo "✗ Frontend server is not running"
fi

echo ""
echo "Running processes:"
ps aux | grep -E "(uvicorn.*app.main:app|http.server.*3001)" | grep -v grep
EOF

chmod +x status_platform.sh
print_success "Status script created (./status_platform.sh)"

print_info ""
print_success "Setup completed successfully!"
print_info ""
print_info "Next steps:"
print_info "1. Update the .env file in collabthon-backend with your actual configuration"
print_info "2. Run the backend server: cd collabthon-backend && ./start_server.sh"
print_info "3. Run the frontend server: cd collabthon-clean && python -m http.server 3001"
print_info "4. Access the platform at http://localhost:3001"
print_info ""
print_info "Or use the comprehensive script: ./start_platform.sh"
print_info ""
print_info "API Documentation: http://localhost:8000/docs"
print_info ""