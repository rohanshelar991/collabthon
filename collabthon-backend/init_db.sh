#!/bin/bash
# Database initialization script for Collabthon

echo "Initializing Collabthon Database..."

# MySQL connection parameters
MYSQL_USER="root"
MYSQL_PASS="Rohan@1234"
MYSQL_HOST="localhost"

# Create database and tables
echo "Creating database schema..."
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASS < sql/init.sql

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully!"
    echo "Database: collabthon_db"
    echo "Tables created: users, profiles, projects, collaboration_requests, subscriptions"
    echo "Sample admin user created: admin@collabthon.com"
else
    echo "❌ Database initialization failed!"
    exit 1
fi

echo "Database setup complete. You can now run the backend application."