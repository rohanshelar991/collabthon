#!/bin/bash

# Collabthon Platform - Ready to Push to GitHub
# This script prepares the complete Collabthon Platform project for GitHub

set -e  # Exit on any error

echo "==========================================="
echo "Collabthon Platform - Prepare for GitHub Push"
echo "==========================================="

echo "Step 1: Initialize Git repository"
if [[ ! -d ".git" ]]; then
    echo "Initializing new Git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "Existing Git repository detected"
fi

echo "Step 2: Setting up remote origin"
REMOTE_URL="https://github.com/rohanshelar991/collabthon.git"
git remote remove origin 2>/dev/null || true
git remote add origin $REMOTE_URL
echo "✓ Remote origin set to: $REMOTE_URL"

echo "Step 3: Ensure .gitignore is properly configured"
# The .gitignore file is already in place from the existing file

echo "Step 4: Adding all project files to Git"
git add .

echo "Step 5: Creating initial commit"
git add .
if ! git diff --cached --quiet; then
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
    echo "✓ Initial commit created"
else
    echo "ℹ️  No changes to commit - all files already tracked"
fi

echo "Step 6: Rename branch to main"
git branch -M main

echo "Step 7: Push to GitHub"
git push -u origin main

echo "🎉 Collabthon Platform successfully pushed to GitHub!"
echo "Repository URL: https://github.com/rohanshelar991/collabthon"