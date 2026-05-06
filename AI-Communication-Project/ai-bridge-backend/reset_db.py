#!/usr/bin/env python3
"""
Reset database and verify initialization.
Run this from the backend directory.
"""
import os
import sys

# Ensure we're in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
if not backend_dir.endswith('ai-bridge-backend'):
    backend_dir = os.path.join(backend_dir, 'ai-bridge-backend')

os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Remove old database
db_path = os.path.join(backend_dir, 'communication_bridge.db')
if os.path.exists(db_path):
    print(f"🗑️  Removing old database: {db_path}")
    os.remove(db_path)
    print("✅ Database removed")

# Import and initialize app
try:
    from app import app, db, SignLibrary
    
    print("\n🔄 Reinitializing database...")
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")
        
        # Check if signs are initialized
        signs = SignLibrary.query.all()
        print(f"\n📚 Signs in database ({len(signs)}):")
        for sign in signs:
            print(f"  - {sign.word}: {sign.image_path}")
        
        if len(signs) == 0:
            print("❌ No signs found in database!")
        else:
            print(f"✅ Database initialized with {len(signs)} signs")
            
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Done!")
