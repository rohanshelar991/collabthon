#!/bin/bash
# Complete Collabthon Setup Script

echo "🚀 Starting Collabthon Full Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS. Please adapt for your system."
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

print_success "Prerequisites check passed!"

# Setup backend
print_status "Setting up backend environment..."

cd /Users/rohanmahendrashelar/Documents/gui/collabthon-backend

# Create virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed successfully!"
else
    print_error "Failed to install backend dependencies!"
    exit 1
fi

# Initialize database
print_status "Initializing database..."
./init_db.sh

if [ $? -eq 0 ]; then
    print_success "Database initialized successfully!"
else
    print_error "Failed to initialize database!"
    exit 1
fi

# Setup frontend
print_status "Setting up frontend environment..."

cd /Users/rohanmahendrashelar/Documents/gui/collabthon-clean

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Frontend setup will be skipped."
else
    # Install frontend dependencies
    if [ -f "package.json" ]; then
        print_status "Installing frontend dependencies..."
        npm install
        
        if [ $? -eq 0 ]; then
            print_success "Frontend dependencies installed successfully!"
        else
            print_warning "Failed to install frontend dependencies."
        fi
    else
        print_warning "No package.json found in frontend directory."
    fi
fi

# Create environment file
print_status "Creating environment configuration..."

cat > /Users/rohanmahendrashelar/Documents/gui/collabthon-backend/.env << EOF
# Collabthon Environment Configuration

# Database
DATABASE_URL=mysql+pymysql://root:Rohan@1234@localhost/collabthon_db

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-12345
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:8000"]

# Google Services (fill these in production)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_RECAPTCHA_SECRET=
GOOGLE_ANALYTICS_ID=

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=

# Payment Gateway (Stripe)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EOF

print_success "Environment file created!"

# Create startup scripts
print_status "Creating startup scripts..."

# Backend startup script
cat > /Users/rohanmahendrashelar/Documents/gui/start_backend.sh << 'EOF'
#!/bin/bash
cd /Users/rohanmahendrashelar/Documents/gui/collabthon-backend
source venv/bin/activate
echo "🚀 Starting Collabthon Backend API..."
python run.py
EOF

chmod +x /Users/rohanmahendrashelar/Documents/gui/start_backend.sh

# Frontend startup script
cat > /Users/rohanmahendrashelar/Documents/gui/start_frontend.sh << 'EOF'
#!/bin/bash
cd /Users/rohanmahendrashelar/Documents/gui/collabthon-clean
echo "🎨 Starting Collabthon Frontend..."
if command -v npm &> /dev/null; then
    npm run dev
else
    python3 -m http.server 8000
fi
EOF

chmod +x /Users/rohanmahendrashelar/Documents/gui/start_frontend.sh

# Combined startup script
cat > /Users/rohanmahendrashelar/Documents/gui/start_collabthon.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Collabthon Platform..."

# Start backend in background
echo "Starting backend API..."
/Users/rohanmahendrashelar/Documents/gui/start_backend.sh &

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
/Users/rohanmahendrashelar/Documents/gui/start_frontend.sh
EOF

chmod +x /Users/rohanmahendrashelar/Documents/gui/start_collabthon.sh

print_success "Startup scripts created!"

# Display setup summary
echo ""
echo "=========================================="
echo "🎉 COLLABTHON SETUP COMPLETE!"
echo "=========================================="
echo ""
print_success "Directories created:"
echo "  - Backend: /Users/rohanmahendrashelar/Documents/gui/collabthon-backend"
echo "  - Frontend: /Users/rohanmahendrashelar/Documents/gui/collabthon-clean"
echo ""
print_success "To start the complete platform:"
echo "  ./start_collabthon.sh"
echo ""
print_success "To start backend only:"
echo "  ./start_backend.sh"
echo ""
print_success "To start frontend only:"
echo "  ./start_frontend.sh"
echo ""
print_success "API Documentation will be available at:"
echo "  http://localhost:8000/docs"
echo ""
print_success "Frontend will be available at:"
echo "  http://localhost:8000 (or 5173 if using Vite)"
echo ""
echo "=========================================="
echo "Happy coding! 🚀"
echo "=========================================="