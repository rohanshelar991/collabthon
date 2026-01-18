# Collabthon Platform Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Collabthon Platform to various environments, including development, staging, and production.

## Prerequisites

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ (8GB for production)
- **Storage**: 10GB+ available space
- **OS**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2

### Software Requirements
- Python 3.9+
- MySQL 8.0+ or PostgreSQL 12+
- Git
- Docker (optional, for containerized deployment)
- Nginx (for production reverse proxy)

## Development Deployment

### Local Setup
1. Clone the repository:
```bash
git clone https://github.com/your-org/collabthon.git
cd collabthon
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"
```

6. Start the development server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Development Configuration
- Enable debug mode: `DEBUG=True`
- Use SQLite for local development (optional)
- Auto-reload on file changes
- Detailed error messages

## Production Deployment

### Server Preparation

1. **Update system packages:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install required software:**
```bash
sudo apt install python3 python3-pip python3-venv nginx supervisor git mysql-server -y
```

3. **Secure MySQL installation:**
```bash
sudo mysql_secure_installation
```

### Application Setup

1. **Clone the repository:**
```bash
cd /opt
sudo git clone https://github.com/your-org/collabthon.git collabthon
sudo chown -R $USER:$USER collabthon
```

2. **Create virtual environment:**
```bash
cd collabthon
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Configure environment variables:**
```bash
cat > .env << EOF
DATABASE_URL=mysql+pymysql://collabthon:your_password@localhost/collabthon_db
SECRET_KEY=your_production_secret_key
DEBUG=False
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
# Add other required environment variables
EOF
```

4. **Initialize database:**
```bash
source venv/bin/activate
python -c "from app.database import engine, Base; Base.metadata.create_all(bind=engine)"
```

### Process Management with Supervisor

1. **Create supervisor configuration:**
```bash
sudo tee /etc/supervisor/conf.d/collabthon.conf << EOF
[program:collabthon]
command=/opt/collabthon/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
directory=/opt/collabthon
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/collabthon.log
environment=PATH="/opt/collabthon/venv/bin"
EOF
```

2. **Reload supervisor:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start collabthon
```

### Web Server Configuration (Nginx)

1. **Create Nginx configuration:**
```bash
sudo tee /etc/nginx/sites-available/collabthon << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Serve static files directly
    location /static {
        alias /opt/collabthon/static;
        expires 30d;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    client_max_body_size 100M;
}
EOF
```

2. **Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/collabthon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

1. **Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

2. **Obtain SSL certificate:**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

3. **Set up auto-renewal:**
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Containerized Deployment (Docker)

### Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: collabthon-db
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: collabthon_db
      MYSQL_USER: collabthon
      MYSQL_PASSWORD: your_mysql_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    command: --default-authentication-plugin=mysql_native_password
    restart: unless-stopped

  backend:
    build: .
    container_name: collabthon-backend
    depends_on:
      - db
    environment:
      - DATABASE_URL=mysql+pymysql://collabthon:your_mysql_password@db:3306/collabthon_db
      - SECRET_KEY=your_production_secret_key
      - DEBUG=False
    ports:
      - "8000:8000"
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: collabthon-nginx
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped

volumes:
  mysql_data:
```

### Deploy with Docker Compose
```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment-Specific Configurations

### Production Environment (.env.production)
```env
DEBUG=False
DATABASE_URL=mysql+pymysql://user:pass@prod-db:3306/collabthon
SECRET_KEY=production_secret_key_that_is_long_and_random
ALLOWED_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
LOG_LEVEL=INFO
SENTRY_DSN=https://your-sentry-dsn
```

### Staging Environment (.env.staging)
```env
DEBUG=False
DATABASE_URL=mysql+pymysql://user:pass@staging-db:3306/collabthon
SECRET_KEY=staging_secret_key
ALLOWED_ORIGINS=["https://staging.yourdomain.com"]
LOG_LEVEL=DEBUG
```

## Database Migration Strategy

### Initial Setup
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

### Ongoing Migrations
```bash
# Generate migration after model changes
alembic revision --autogenerate -m "Description of changes"

# Apply migration
alembic upgrade head
```

## Backup and Recovery

### Database Backup
```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u collabthon -p your_password collabthon_db > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/ --region your-region
```

### Automated Backup (Cron Job)
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * /path/to/backup_db.sh >> /var/log/backup.log 2>&1
```

## Monitoring and Logging

### Application Logs
```bash
# View application logs
sudo tail -f /var/log/collabthon.log

# Monitor with log rotation
sudo logrotate -f /etc/logrotate.d/collabthon
```

### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor resources
htop
iotop -ao
nethogs
```

### Health Checks
Add to your load balancer or monitoring system:
- `/health` - Returns 200 OK if healthy
- Response: `{"status": "healthy", "service": "Collabthon API"}`

## Scaling Considerations

### Horizontal Scaling
- Use multiple application instances behind a load balancer
- Implement Redis for shared session storage
- Use CDN for static assets
- Database read replicas for read-heavy operations

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies
- Use connection pooling

## Security Hardening

### SSH Security
```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Change SSH port (optional)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# Restart SSH
sudo systemctl restart sshd
```

### Firewall Configuration
```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check supervisor logs
sudo supervisorctl status collabthon
sudo tail -f /var/log/collabthon.log

# Check if port is in use
sudo netstat -tlnp | grep :8000
```

#### Database Connection Issues
```bash
# Test database connection
mysql -u collabthon -p -h localhost collabthon_db

# Check MySQL service
sudo systemctl status mysql
```

#### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Tuning

#### Uvicorn Workers
Adjust worker count based on CPU cores:
```bash
# Number of workers = (2 × CPU cores) + 1
# For 4-core server: 9 workers
```

#### Database Connection Pooling
```python
# In database.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

## Rollback Procedure

### Automated Rollback Script
```bash
#!/bin/bash
# rollback.sh

# Stop current application
sudo supervisorctl stop collabthon

# Revert to previous version (if using git tags)
PREVIOUS_VERSION=$(git tag --sort=-v:refname | sed -n '2p')
git checkout $PREVIOUS_VERSION

# Reinstall dependencies if needed
source venv/bin/activate
pip install -r requirements.txt

# Restart application
sudo supervisorctl start collabthon

echo "Rollback completed to version: $PREVIOUS_VERSION"
```

## Post-Deployment Checklist

- [ ] Application is accessible via configured domain
- [ ] SSL certificate is valid and properly configured
- [ ] Database connection is established
- [ ] Environment variables are correctly set
- [ ] Logging is working properly
- [ ] Health checks are passing
- [ ] Backup jobs are scheduled
- [ ] Monitoring is set up
- [ ] Security configurations are applied
- [ ] Performance benchmarks are run

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies monthly
- Review security advisories
- Clean up old logs
- Monitor disk space usage
- Update SSL certificates
- Review access logs for suspicious activity

### Support Contacts
- Operations Team: ops@yourcompany.com
- Security Team: security@yourcompany.com
- Development Team: dev@yourcompany.com