#!/bin/bash
# Collabthon Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Collabthon Production Deployment..."

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

# Configuration
PROJECT_NAME="collabthon"
BACKEND_DIR="/opt/collabthon/backend"
FRONTEND_DIR="/opt/collabthon/frontend"
LOG_DIR="/var/log/collabthon"
ENV_FILE="$BACKEND_DIR/.env"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is not recommended for production."
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL is not installed. Please install MySQL first."
    exit 1
fi

print_success "Prerequisites check passed."

# Create directories
print_status "Creating deployment directories..."
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR
sudo mkdir -p $LOG_DIR

# Set permissions
sudo chown -R $USER:$USER $BACKEND_DIR
sudo chown -R $USER:$USER $FRONTEND_DIR
sudo chown -R $USER:$USER $LOG_DIR

# Copy backend files
print_status "Copying backend files..."
cp -r /Users/rohanmahendrashelar/Documents/gui/collabthon-backend/* $BACKEND_DIR/

# Create virtual environment
print_status "Setting up Python virtual environment..."
cd $BACKEND_DIR
python3 -m venv venv
source venv/bin/activate

# Install dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if installation was successful
if [ $? -ne 0 ]; then
    print_error "Failed to install Python dependencies."
    exit 1
fi

print_success "Dependencies installed successfully."

# Environment configuration
print_status "Configuring environment variables..."

# Check if .env file exists, if not create a template
if [ ! -f "$ENV_FILE" ]; then
    print_warning ".env file not found. Creating a template..."
    cat > $ENV_FILE << EOF
# Collabthon Environment Configuration
SECRET_KEY=$(openssl rand -hex 32)
DATABASE_URL=mysql+pymysql://root:Rohan@1234@localhost/collabthon_db
DEBUG=False
ALLOWED_ORIGINS=["http://localhost","http://localhost:3000","http://localhost:5173","https://yourdomain.com"]
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_RECAPTCHA_SECRET=
GOOGLE_ANALYTICS_ID=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
MAIL_FROM=
EOF
    print_warning "Please update $ENV_FILE with your actual configuration values."
fi

# Database setup
print_status "Setting up database..."
source $ENV_FILE
mysql -u root -pRohan@1234 -e "CREATE DATABASE IF NOT EXISTS collabthon_db;"
mysql -u root -pRohan@1234 -e "CREATE USER IF NOT EXISTS 'collabthon'@'localhost' IDENTIFIED BY 'collabthon_password';"
mysql -u root -pRohan@1234 -e "GRANT ALL PRIVILEGES ON collabthon_db.* TO 'collabthon'@'localhost';"
mysql -u root -pRohan@1234 -e "FLUSH PRIVILEGES;"

# Run database migrations
print_status "Running database migrations..."
python run.py --migrate

# Frontend deployment
print_status "Deploying frontend files..."
cp -r /Users/rohanmahendrashelar/Documents/gui/collabthon-clean/* $FRONTEND_DIR/

# Create systemd service for backend
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/collabthon.service > /dev/null << EOF
[Unit]
Description=Collabthon Backend Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$ENV_FILE
ExecStart=$BACKEND_DIR/venv/bin/python run.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
print_status "Starting Collabthon service..."
sudo systemctl enable collabthon
sudo systemctl start collabthon

# Wait for service to start
sleep 5

# Check if service is running
if sudo systemctl is-active --quiet collabthon; then
    print_success "Collabthon service is running!"
else
    print_error "Collabthon service failed to start."
    sudo journalctl -u collabthon -n 50
    exit 1
fi

# Nginx configuration (if nginx is installed)
if command -v nginx &> /dev/null; then
    print_status "Configuring Nginx..."
    sudo tee /etc/nginx/sites-available/collabthon > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    location / {
        root $FRONTEND_DIR;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/collabthon /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
fi

# Health check
print_status "Performing health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    print_success "Health check passed! Service is responding on port 8000."
else
    print_warning "Health check failed. Service might not be accessible externally."
    print_status "Backend API should be accessible at http://localhost:8000"
    if command -v nginx &> /dev/null; then
        print_status "Frontend should be accessible at http://localhost"
    fi
fi

# Print deployment summary
echo ""
print_success "🎉 Collabthon Deployment Complete!"
echo ""
echo "📊 Service Status:"
sudo systemctl status collabthon --no-pager -l | head -10
echo ""
echo "📋 Deployment Summary:"
echo "   Backend Location: $BACKEND_DIR"
echo "   Frontend Location: $FRONTEND_DIR"
echo "   Logs Directory: $LOG_DIR"
echo "   Service Name: collabthon"
echo "   API Endpoint: http://localhost:8000"
echo "   Documentation: http://localhost:8000/docs"
echo ""
echo "🔧 Management Commands:"
echo "   Start: sudo systemctl start collabthon"
echo "   Stop: sudo systemctl stop collabthon"
echo "   Restart: sudo systemctl restart collabthon"
echo "   Status: sudo systemctl status collabthon"
echo "   Logs: sudo journalctl -u collabthon -f"
echo ""
echo "⚠️  Important:"
echo "   1. Update $ENV_FILE with your actual configuration values"
echo "   2. Configure SSL certificate for production use"
echo "   3. Set up proper firewall rules"
echo "   4. Configure backup strategy"
echo ""

print_success "Deployment completed successfully! 🚀"