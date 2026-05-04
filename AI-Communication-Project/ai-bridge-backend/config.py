"""
Central Configuration Module
=============================
Centralized settings for AI models, database, and Flask/Socket.IO configuration.
This file ensures all hardcoded values are in one place for easy maintenance.

Usage:
    from config import USE_REAL_MODELS, SIGN_CONFIDENCE_THRESHOLD
    from config import DATABASE_URI, SOCKET_TIMEOUT
"""

import os
from pathlib import Path

# ============================================================================
# ENVIRONMENT DETECTION
# ============================================================================

BASE_DIR = Path(__file__).parent.resolve()
ENV = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = ENV == 'production'

# ============================================================================
# FLASK CONFIGURATION
# ============================================================================

DEBUG = not IS_PRODUCTION
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')

# Flask-SocketIO Settings
SOCKETIO_CONFIG = {
    'cors_allowed_origins': '*',
    'ping_timeout': 60,
    'ping_interval': 25,
    'async_mode': 'threading',
}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_PATH = BASE_DIR / 'database.db'
DATABASE_URI = f'sqlite:///{DATABASE_PATH}'

# Database options
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = DEBUG  # Log SQL queries in debug mode

# ============================================================================
# AI MODEL CONFIGURATION
# ============================================================================

# Feature Flags
USE_REAL_MODELS = os.getenv('USE_REAL_MODELS', 'False').lower() == 'true'
USE_MOCK_MODELS = not USE_REAL_MODELS

# Model Directory
MODELS_DIR = BASE_DIR / 'models'
MODELS_DIR.mkdir(exist_ok=True)

# Model Paths (for when real models are available)
MODEL_PATHS = {
    'sign_recognition': MODELS_DIR / 'sign_recognition_model.h5',
    'stt': MODELS_DIR / 'stt_model.pkl',
    'tts': MODELS_DIR / 'tts_model.pkl',
}

# ============================================================================
# AI MODEL THRESHOLDS & SETTINGS
# ============================================================================

# Sign Recognition (Deaf User Gesture → Text)
SIGN_CONFIDENCE_THRESHOLD = 0.7  # Only emit if confidence > 70%
SIGN_MIN_LANDMARKS = 21  # MediaPipe detects 21 hand landmarks
SIGN_LANDMARK_DIMENSIONS = 3  # x, y, z (63 total = 21 × 3)
SIGN_TOTAL_LANDMARKS = SIGN_MIN_LANDMARKS * SIGN_LANDMARK_DIMENSIONS  # 63

# Speech-to-Text (Blind User Audio → Text)
STT_CONFIDENCE_THRESHOLD = 0.5  # Only emit if confidence > 50%
STT_LANGUAGE = 'en-US'  # Language code
STT_TIMEOUT = 30  # Seconds before timeout

# Text-to-Speech (Text → Audio for Blind User)
TTS_VOICE = 'default'  # Voice identifier
TTS_SPEED = 1.0  # Speech speed (0.5 = slow, 1.0 = normal, 2.0 = fast)
TTS_PITCH = 1.0  # Pitch adjustment
TTS_FORMAT = 'wav'  # Output audio format

# ============================================================================
# FRAME PROCESSING CONFIGURATION (for video/camera streams)
# ============================================================================

FRAME_PROCESSING = {
    'width': 640,
    'height': 480,
    'fps': 30,
    'interval_ms': 500,  # Process frame every 500ms (2 FPS)
    'jpeg_quality': 80,  # JPEG compression quality
}

# ============================================================================
# SOCKET.IO EVENT CONFIGURATION
# ============================================================================

# Define all socket events with their handlers
SOCKET_EVENTS = {
    # Blind User → Deaf User
    'voice_to_sign': {
        'handler': 'handle_voice_to_sign',
        'description': 'Blind user sends text to be converted to sign (GIF)',
    },
    'send_message': {
        'handler': 'handle_blind_to_deaf',
        'description': 'Blind user sends message to deaf user',
    },
    
    # Deaf User → Blind User
    'process_frame': {
        'handler': 'handle_frame',
        'description': 'Deaf user sends camera frame for AI sign recognition',
    },
    'deaf_message': {
        'handler': 'handle_deaf_message',
        'description': 'Deaf user confirms and sends AI prediction text',
    },
    
    # Broadcast Events
    'receive_message': {
        'direction': 'broadcast',
        'description': 'Broadcast message to all users',
    },
    'display_sign': {
        'direction': 'broadcast',
        'description': 'Broadcast GIF for sign language display',
    },
}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL = 'INFO' if not DEBUG else 'DEBUG'

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        },
        'detailed': {
            'format': '%(asctime)s - %(name)s - [%(filename)s:%(lineno)d] - %(levelname)s - %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'standard' if not DEBUG else 'detailed',
            'level': LOG_LEVEL,
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'app.log',
            'formatter': 'detailed',
            'level': 'WARNING',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file'],
            'level': LOG_LEVEL,
            'propagate': True,
        },
    },
}

# ============================================================================
# MESSAGE HISTORY & DATABASE SETTINGS
# ============================================================================

MESSAGE_RETENTION_DAYS = 30  # Keep messages for 30 days
MESSAGE_HISTORY_LIMIT = 50  # Show last 50 messages in UI

# ============================================================================
# PERFORMANCE & OPTIMIZATION
# ============================================================================

# Async processing
USE_ASYNC_PROCESSING = True  # Process frames asynchronously
MAX_WORKERS = 4  # Thread pool size

# Caching
ENABLE_CACHING = True
CACHE_TIMEOUT = 300  # 5 minutes

# Rate limiting
ENABLE_RATE_LIMITING = True
RATE_LIMIT_FRAMES = 100  # Max frames per minute
RATE_LIMIT_MESSAGES = 30  # Max messages per minute

# ============================================================================
# VALIDATION RULES
# ============================================================================

VALIDATION = {
    'max_message_length': 1000,
    'max_audio_duration': 60,  # seconds
    'max_text_for_tts': 500,  # characters
    'min_confidence': 0.3,  # Absolute minimum confidence
}

# ============================================================================
# ENVIRONMENT-SPECIFIC OVERRIDES
# ============================================================================

if IS_PRODUCTION:
    DEBUG = False
    SIGN_CONFIDENCE_THRESHOLD = 0.8  # More strict in production
    STT_CONFIDENCE_THRESHOLD = 0.6
    MESSAGE_RETENTION_DAYS = 7  # Shorter retention
    LOG_LEVEL = 'WARNING'
    FRAME_PROCESSING['interval_ms'] = 1000  # Less frequent processing
else:
    # Development overrides
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    FRAME_PROCESSING['interval_ms'] = 500

# ============================================================================
# CONFIG VALIDATION (ensure models directory exists)
# ============================================================================

try:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
except Exception as e:
    print(f"Warning: Could not create models directory: {e}")

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_config_summary() -> dict:
    """Return current configuration as dictionary"""
    return {
        'environment': ENV,
        'debug': DEBUG,
        'use_real_models': USE_REAL_MODELS,
        'sign_threshold': SIGN_CONFIDENCE_THRESHOLD,
        'stt_threshold': STT_CONFIDENCE_THRESHOLD,
        'database': str(DATABASE_URI),
        'models_dir': str(MODELS_DIR),
        'log_level': LOG_LEVEL,
    }


if __name__ == '__main__':
    # Print configuration summary when run directly
    import json
    print(json.dumps(get_config_summary(), indent=2))
