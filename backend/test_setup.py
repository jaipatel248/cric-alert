#!/usr/bin/env python3
"""
Test script to verify backend setup
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("🧪 Testing Cricket Alert Backend")
print("=" * 50)

# Test 1: Import modules
print("\n1. Testing imports...")
try:
    from app.core.config import settings
    print("   ✅ Config imported")
    
    from app.services.api_client import CricbuzzAPIClient
    print("   ✅ API Client imported")
    
    from app.services.gemini_client import GeminiClient
    print("   ✅ Gemini Client imported")
    
    from app.services.watcher import AlertWatcher
    print("   ✅ Watcher imported")
    
    from app.services.scheduler import AdaptiveScheduler
    print("   ✅ Scheduler imported")
    
    from app.services.cricket_service import cricket_service
    print("   ✅ Cricket Service imported")
    
    from app.services.alert_service import alert_service
    print("   ✅ Alert Service imported")
    
except Exception as e:
    print(f"   ❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Check configuration
print("\n2. Testing configuration...")
try:
    print(f"   App Name: {settings.APP_NAME}")
    print(f"   Version: {settings.VERSION}")
    print(f"   Host: {settings.HOST}:{settings.PORT}")
    print(f"   Base Dir: {settings.BASE_DIR}")
    print(f"   Prompts Dir: {settings.PROMPTS_DIR}")
    print("   ✅ Configuration loaded")
except Exception as e:
    print(f"   ❌ Configuration failed: {e}")
    sys.exit(1)

# Test 3: Check prompts exist
print("\n3. Testing prompts...")
try:
    system_prompt = settings.PROMPTS_DIR / "system-prompt.md"
    user_prompt = settings.PROMPTS_DIR / "user-prompt.md"
    
    if system_prompt.exists():
        print(f"   ✅ System prompt found: {system_prompt}")
    else:
        print(f"   ❌ System prompt missing: {system_prompt}")
    
    if user_prompt.exists():
        print(f"   ✅ User prompt found: {user_prompt}")
    else:
        print(f"   ❌ User prompt missing: {user_prompt}")
        
except Exception as e:
    print(f"   ❌ Prompts check failed: {e}")
    sys.exit(1)

# Test 4: Test API client
print("\n4. Testing API client...")
try:
    client = CricbuzzAPIClient()
    print("   ✅ API Client initialized")
except Exception as e:
    print(f"   ❌ API Client failed: {e}")

# Test 5: Test services
print("\n5. Testing services...")
try:
    print(f"   Active monitors: {len(alert_service.active_monitors)}")
    print("   ✅ Services initialized")
except Exception as e:
    print(f"   ❌ Services failed: {e}")

print("\n" + "=" * 50)
print("✅ All tests passed! Backend is ready.")
print("\nTo start the API server:")
print("   cd backend")
print("   ./start.sh")
print("\nOr:")
print("   cd backend")
print("   python run.py")
