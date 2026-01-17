#!/usr/bin/env python3
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

print("=== Debug Import Chain ===")

# Test importing each module step by step
try:
    print("1. Importing fastapi...")
    import fastapi
    print("✓ FastAPI imported successfully")
except Exception as e:
    print("✗ FastAPI import failed:", e)

try:
    print("2. Importing app...")
    import app
    print("✓ app imported successfully")
except Exception as e:
    print("✗ app import failed:", e)

try:
    print("3. Importing app.api...")
    import app.api
    print("✓ app.api imported successfully")
except Exception as e:
    print("✗ app.api import failed:", e)

try:
    print("4. Importing app.api.auth...")
    import app.api.auth
    print("✓ app.api.auth imported successfully")
    print("   Available attributes:", [attr for attr in dir(app.api.auth) if not attr.startswith('_')])
except Exception as e:
    print("✗ app.api.auth import failed:", e)
    import traceback
    traceback.print_exc()

try:
    print("5. Checking router attribute...")
    router = getattr(app.api.auth, 'router', None)
    print("   Router:", router)
    if router:
        print("   ✓ Router found!")
    else:
        print("   ✗ Router not found")
except Exception as e:
    print("✗ Router check failed:", e)
    import traceback
    traceback.print_exc()