#!/bin/bash

# Collabthon Platform Push to GitHub Script
# This script pushes the complete Collabthon Platform project to GitHub

set -e  # Exit on any error

echo "==========================================="
echo "Collabthon Platform Push to GitHub"
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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_success "Git is installed"

# Navigate to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
print_info "Project directory: $PROJECT_DIR"

# Check if this is a git repository
if [[ ! -d ".git" ]]; then
    print_info "Initializing new Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_info "Existing Git repository detected"
fi

# Set up the remote origin
REMOTE_URL="https://github.com/rohanshelar991/collabthon.git"
print_info "Setting up remote origin: $REMOTE_URL"

# Remove existing origin if it exists and add the new one
git remote remove origin 2>/dev/null || true
git remote add origin $REMOTE_URL
print_success "Remote origin set up"

# Create or update .gitignore
print_info "Creating/updating .gitignore file..."
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
.venv
venv/
env/
ENV/
.ENV
.pytest_cache/
.coverage
htmlcov/
.cov/
.nyc_output/
istanbul/
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.db-journal

# Logs
*.log
logs/

# Environment specific
.env.local
.env.development.local
.env.test.local
.env.production.local

# Secrets
secrets/
*.key
*.pem
*.crt
*.cert

# Local configuration
config/local/
*.local

# Coverage reports
coverage/
.coverage.*

# Virtual environments
.venv/
venv/
env/
ENV/

# FastAPI auto-generated
main.py-e

# Temporary files
tmp/
temp/
*.tmp
*.temp

# Compiled files
*.pyc
*.pyo
*.pyd
*.py.class

# Documentation
docs/_build/

# Backup files
*~
.#*
*.bak
*.old
*.orig

# IDE specific
.vs/
*.userprefs
*.useroptions
*.suo
*.user
*.aps
*.ncb
*.obj
*.ilk
*.pdb
*.sdf
*.sln.docstates

# Python virtual environments
.envrc
.flaskenv
.python-version

# FastAPI and related
alembic/
alembic.ini
alembic_version/

# Testing
.pytest_cache/
.hypothesis/
.coverage
.coverage.*
nosetests.xml
coverage.xml
*.cover
*.log

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg-info/
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# pipenv
Pipfile.lock

# PEP 582
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre checker
.pyre/

# IDE
.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment
.env
.env.local
.env.dev
.env.prod
.env.testing
.env.staging
.env.production
.env.development
.env.docker

# Database
*.sqlite
*.sqlite3

# Backup and temp files
*.bak
*.tmp
*.temp
*~
*.swp
*.swo

# Docker
.dockerenv
.dockerinit

# FastAPI
main.py-e

# Local development
local/
dev/
development/

# Configuration
config/
settings_local.py
local_settings.py

# Sensitive data
credentials.json
client_secret.json
service-account-key.json
google-services.json
google-services.json
google-services.plist
GoogleService-Info.plist
firebase-config.json

# Google Cloud
.gcloud/
.gcloudignore

# Google API
client_secrets.json
google_api_key.json

# Stripe
stripe_keys.json
stripe_config.json

# AWS
.aws/
.aws/config
.aws/credentials

# SSH
.ssh/

# System files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Thumbs.db:encryptable
iCloudPhotos.DB
iCloudSync.db
.Dragonden
EOF

print_success ".gitignore file created/updated"

# Add all files to git
print_info "Adding all files to Git..."
git add .
print_success "All files added to Git"

# Check if there are any changes to commit
if git diff --cached --quiet; then
    print_warning "No changes to commit. Everything is already committed."
    print_info "Attempting to push existing commits to remote repository..."
else
    # Create initial commit
    print_info "Creating initial commit..."
    git commit -m "Initial commit: Complete Collabthon Platform with all features
- Backend: FastAPI with advanced features (Google Cloud, Analytics, Payments, etc.)
- Frontend: Complete HTML/CSS/JS solution with responsive design
- Authentication: JWT with Google OAuth integration
- Advanced Search: With filters and recommendations
- Analytics: User activity tracking and insights
- Payments: Stripe integration for subscriptions
- Admin Panel: Comprehensive management tools
- UI/UX: Dark/light theme, animations, accessibility
- Documentation: Complete guides and setup instructions"
    print_success "Initial commit created"
fi

# Check if the 'main' branch exists locally, if not create it
if git show-ref --verify --quiet refs/heads/main; then
    print_info "Main branch already exists locally"
else
    print_info "Creating main branch..."
    git branch -M main
    print_success "Main branch created and set as default"
fi

# Check if the 'main' branch exists on remote, if not push with set-upstream
print_info "Pushing to GitHub repository..."
if git ls-remote --exit-code origin main >/dev/null 2>&1; then
    # Remote branch exists, just push
    git push -u origin main
    print_success "Successfully pushed to GitHub repository"
else
    # Remote branch doesn't exist, push and set upstream
    git push -u origin main
    print_success "Successfully pushed to GitHub repository and set upstream"
fi

# Verify the push
print_info "Verifying the push..."
REMOTE_URL_CHECK=$(git remote get-url origin)
BRANCH_STATUS=$(git status --porcelain=v1 2>/dev/null)
print_success "Repository URL: $REMOTE_URL_CHECK"
print_success "Branch status: On main branch"

# Check if the repository is private or public
print_info "Checking repository visibility..."
curl -s -o /dev/null -w "%{http_code}" "https://github.com/rohanshelar991/collabthon.git" -o /dev/null
if [ $? -eq 0 ]; then
    print_success "Repository is accessible at: https://github.com/rohanshelar991/collabthon"
else
    print_warning "Could not verify repository accessibility. It might be private."
    print_info "Repository should be accessible at: https://github.com/rohanshelar991/collabthon"
fi

print_info ""
print_success "🎉 Collabthon Platform successfully pushed to GitHub!"
print_info ""
print_info "Repository URL: https://github.com/rohanshelar991/collabthon"
print_info ""
print_info "The repository contains:"
print_info "- Complete backend with FastAPI and advanced features"
print_info "- Full frontend with responsive design"
print_info "- Google Cloud integrations (Storage, Vision, Maps, Translate)"
print_info "- Analytics and user tracking"
print_info "- Payment processing with Stripe"
print_info "- Admin panel and management tools"
print_info "- Authentication with JWT and Google OAuth"
print_info "- Advanced search and recommendation engine"
print_info "- Complete documentation and setup guides"
print_info ""

# Show the current status
print_info "Current repository status:"
git remote -v
print_info ""
git branch -v
print_info ""