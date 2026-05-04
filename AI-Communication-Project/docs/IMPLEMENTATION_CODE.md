# 🔧 AI Integration - Copy-Paste Implementation Guide

Complete code snippets ready to use. Just copy, paste, and adapt to your needs.

---

## 1️⃣ Update Flask app.py (Priority: CRITICAL)

### Current Code (Lines 1-20 in app.py)
```python
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy

# REMOVE THIS LINE:
# from ai_handler import SignModelManager 

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# REMOVE THESE LINES:
# ai_manager = SignModelManager()
```

### New Code (Replace with this)
```python
import os
import json
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
import io

# ✅ NEW: Import from production handler & config
from ai_handler_PRODUCTION import AIModelManager
from config import (
    USE_MOCK_MODELS,
    SIGN_CONFIDENCE_THRESHOLD,
    STT_CONFIDENCE_THRESHOLD,
    DEBUG
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ✅ NEW: Initialize models at startup (not lazy-loaded)
logger.info("🔄 Initializing AI models...")
try:
    ai_manager = AIModelManager(use_mock=USE_MOCK_MODELS)
    logger.info(f"✅ AI Models initialized successfully")
    logger.info(f"   Using: {'MOCK' if USE_MOCK_MODELS else 'REAL'} models")
    logger.info(f"   Status: {ai_manager.get_model_status()}")
except Exception as e:
    logger.error(f"❌ Failed to initialize AI models: {e}")
    logger.warning("⚠️  Falling back to mock models")
    ai_manager = AIModelManager(use_mock=True)
```

---

## 2️⃣ Add MediaPipe Landmark Extraction

### Create New File: utils/mediapipe_handler.py

```python
"""
MediaPipe Hand Landmark Extraction
===================================
Extracts 63 hand landmarks from camera frames.
Used by DeafUser for sign language recognition.
"""

import cv2
import numpy as np
import base64
import logging

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logging.warning("⚠️  MediaPipe not installed. Install with: pip install mediapipe")

logger = logging.getLogger(__name__)

# Initialize MediaPipe Hands
if MEDIAPIPE_AVAILABLE:
    mp_hands = mp.solutions.hands.Hands(
        static_image_mode=False,           # Video stream, not images
        max_num_hands=1,                   # Only detect 1 hand
        min_detection_confidence=0.7,      # 70% confidence threshold
        min_tracking_confidence=0.5        # 50% tracking threshold
    )
else:
    mp_hands = None


def decode_image(image_data_url: str) -> np.ndarray:
    """
    Decode base64 image from frontend.
    
    Args:
        image_data_url: Format like "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    
    Returns:
        numpy array (OpenCV BGR format)
    """
    try:
        # Remove "data:image/jpeg;base64," prefix
        image_data = base64.b64decode(image_data_url.split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        return None


def extract_hand_landmarks(image_data_url: str) -> list:
    """
    Extract 63 MediaPipe hand landmarks from camera frame.
    
    Args:
        image_data_url: Base64-encoded image from frontend
    
    Returns:
        List of 63 floats [x1,y1,z1, x2,y2,z2, ..., x21,y21,z21]
        OR None if hand not detected
    
    Format:
        - x, y: normalized image coordinates (0.0 to 1.0)
        - z: relative depth (0.0 to 1.0, negative = closer to camera)
        - 21 landmarks × 3 coordinates = 63 values total
    """
    if not MEDIAPIPE_AVAILABLE:
        logger.warning("MediaPipe not available")
        return None
    
    # 1. Decode base64 image
    frame = decode_image(image_data_url)
    if frame is None:
        return None
    
    # 2. Convert BGR to RGB (MediaPipe expects RGB)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # 3. Process frame with MediaPipe
    try:
        results = mp_hands.process(rgb_frame)
    except Exception as e:
        logger.error(f"Error processing frame with MediaPipe: {e}")
        return None
    
    # 4. No hand detected
    if not results.multi_hand_landmarks:
        logger.debug("No hand detected in frame")
        return None
    
    # 5. Extract first hand's landmarks (we only need 1 hand)
    hand_landmarks = results.multi_hand_landmarks[0]
    
    # 6. Convert to list of 63 floats
    landmarks = []
    for landmark in hand_landmarks.landmark:
        landmarks.append(float(landmark.x))  # x coordinate
        landmarks.append(float(landmark.y))  # y coordinate
        landmarks.append(float(landmark.z))  # z coordinate
    
    assert len(landmarks) == 63, f"Expected 63 landmarks, got {len(landmarks)}"
    
    logger.debug(f"✅ Extracted {len(landmarks)} hand landmarks")
    return landmarks


def visualize_landmarks(frame: np.ndarray, landmarks: list) -> np.ndarray:
    """
    Draw hand landmarks on frame (for debugging).
    
    Args:
        frame: OpenCV image
        landmarks: List of 63 floats
    
    Returns:
        Frame with drawn landmarks
    """
    if landmarks is None or len(landmarks) != 63:
        return frame
    
    # Draw circles at each landmark position
    h, w = frame.shape[:2]
    for i in range(0, 63, 3):
        x = int(landmarks[i] * w)
        y = int(landmarks[i+1] * h)
        cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)
    
    return frame
```

### Update app.py to Use Landmark Extraction

In your `app.py`, replace the `handle_frame` function:

```python
from utils.mediapipe_handler import extract_hand_landmarks

# Replace the old handle_frame function with this:
@socketio.on('process_frame')
def handle_frame(data):
    """
    Process camera frame from Deaf user.
    
    1. Extract MediaPipe hand landmarks
    2. Run AI sign recognition
    3. Emit prediction to users
    """
    try:
        image_data = data.get('image')
        if not image_data:
            logger.warning("No image data in frame")
            return
        
        # Step 1: Extract 63 hand landmarks from image
        landmarks = extract_hand_landmarks(image_data)
        
        if landmarks is None:
            logger.debug("No hand detected, skipping prediction")
            return
        
        # Step 2: Run AI prediction
        predicted_text, confidence = ai_manager.predict_sign(landmarks)
        
        # Step 3: Only emit if above threshold
        if predicted_text and confidence >= SIGN_CONFIDENCE_THRESHOLD:
            sender_sid = request.sid
            logger.info(f"🤖 Deaf user ({sender_sid}) predicted: {predicted_text} ({confidence:.1%})")
            
            # Send to Deaf user (who made the gesture)
            emit('receive_message', {
                'text': f"AI Prediction: {predicted_text}",
                'confidence': confidence
            }, to=sender_sid)
            
            # Also send to Blind user
            emit('receive_message', {
                'text': f"Deaf user signed: {predicted_text}",
                'confidence': confidence
            }, broadcast=True, include_self=False)
    
    except Exception as e:
        logger.error(f"❌ Error processing frame: {e}", exc_info=True)
        emit('error', {'message': 'Frame processing failed'})
```

---

## 3️⃣ Add Backend TTS Endpoint

Add this to your `app.py`:

```python
# Add to imports section
from flask import send_file

# Add this route to app.py (after other routes)
@app.route('/api/speak', methods=['POST'])
def speak():
    """
    Convert text to speech using backend TTS model.
    
    Request JSON:
        {
            "text": "Hello, how are you?",
            "speaker": "default"  // Optional
        }
    
    Response:
        Audio file in WAV format (application/wav)
    
    Example usage (JavaScript):
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: "Hello"})
        });
        const audio = await response.blob();
        new Audio(URL.createObjectURL(audio)).play();
    """
    try:
        # 1. Get request data
        data = request.get_json()
        if not data:
            return {'error': 'No JSON body'}, 400
        
        text = data.get('text', '').strip()
        speaker = data.get('speaker', 'default')
        
        # 2. Validate
        if not text:
            return {'error': 'Text cannot be empty'}, 400
        
        if len(text) > 500:
            return {'error': 'Text too long (max 500 chars)'}, 400
        
        # 3. Synthesize
        logger.info(f"🔊 TTS request: '{text}' (speaker: {speaker})")
        audio_bytes = ai_manager.text_to_speech(text, speaker)
        
        if not audio_bytes:
            logger.warning(f"TTS synthesis failed for: '{text}'")
            return {'error': 'TTS synthesis failed'}, 500
        
        # 4. Return as WAV file
        logger.info(f"✅ TTS generated {len(audio_bytes)} bytes")
        return send_file(
            io.BytesIO(audio_bytes),
            mimetype='audio/wav',
            as_attachment=False,
            download_name='speech.wav'
        )
    
    except Exception as e:
        logger.error(f"❌ TTS Error: {e}", exc_info=True)
        return {'error': str(e)}, 500
```

---

## 4️⃣ Add STT Audio Upload Handler

Add this Socket.IO handler to `app.py`:

```python
@socketio.on('upload_audio')
def handle_audio_upload(data):
    """
    Process uploaded audio through STT model.
    
    Useful for:
    - Longer recordings (> 30 seconds)
    - Background noise filtering
    - Custom language models
    
    Socket event structure:
        {
            "audio": <bytes>,      // Raw audio bytes
            "language": "en",      // Optional
            "format": "wav"        // Optional
        }
    
    Response event:
        emit('transcription_result', {
            'text': 'Hello world',
            'confidence': 0.95,
            'duration': 2.5
        })
    """
    try:
        audio_bytes = data.get('audio')
        language = data.get('language', 'en')
        
        if not audio_bytes:
            emit('transcription_error', {'error': 'No audio data'})
            return
        
        logger.info(f"🎤 STT request: {len(audio_bytes)} bytes, language: {language}")
        
        # Process through STT model
        text, confidence = ai_manager.speech_to_text(audio_bytes, language)
        
        if text and confidence >= STT_CONFIDENCE_THRESHOLD:
            logger.info(f"✅ STT result: '{text}' ({confidence:.1%})")
            emit('transcription_result', {
                'text': text,
                'confidence': confidence
            })
        else:
            logger.warning(f"STT result below threshold: '{text}' ({confidence:.1%})")
            emit('transcription_error', {
                'error': 'Could not understand audio',
                'confidence': confidence
            })
    
    except Exception as e:
        logger.error(f"❌ STT Error: {e}", exc_info=True)
        emit('transcription_error', {'error': str(e)})
```

---

## 5️⃣ Add Model Status Endpoints

Add these routes to `app.py`:

```python
@app.route('/api/models/status', methods=['GET'])
def model_status():
    """
    Get current status of all 3 AI models.
    
    Response:
        {
            "status": "operational",
            "models": {
                "use_mock": false,
                "sign_model": "RealSignRecognition",
                "sign_threshold": 0.7,
                "stt_model": "RealSpeechToText",
                "stt_threshold": 0.5,
                "tts_model": "RealTextToSpeech",
                "tts_speakers": ["default", "male", "female"]
            },
            "thresholds": {
                "sign": 0.7,
                "stt": 0.5
            }
        }
    """
    try:
        return jsonify({
            'status': 'operational',
            'timestamp': datetime.now().isoformat(),
            'models': ai_manager.get_model_status(),
            'thresholds': {
                'sign': SIGN_CONFIDENCE_THRESHOLD,
                'stt': STT_CONFIDENCE_THRESHOLD
            }
        })
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        return {'error': str(e)}, 500


@app.route('/api/models/reload', methods=['POST'])
def reload_models():
    """
    Reload AI models (development only).
    
    Useful for:
    - Testing new model files
    - Hot-swapping models without restart
    - Debugging model loading
    
    Only available in DEBUG mode.
    
    Response:
        {
            "status": "success",
            "message": "Models reloaded",
            "models": {...}
        }
    """
    try:
        if not DEBUG:
            return {
                'error': 'Model reload only available in DEBUG mode'
            }, 403
        
        logger.info("🔄 Reloading AI models...")
        ai_manager.reload_models()
        
        logger.info("✅ Models reloaded successfully")
        return jsonify({
            'status': 'success',
            'message': 'Models reloaded',
            'models': ai_manager.get_model_status()
        })
    
    except Exception as e:
        logger.error(f"❌ Error reloading models: {e}", exc_info=True)
        return {'error': str(e)}, 500
```

---

## 6️⃣ Update Frontend to Use Backend TTS

### In BlindUser.jsx, Replace speak() Function

```javascript
// OLD (browser-only speech API)
const speak = (text) => {
    if ('speechSynthesis' in window && text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
};

// NEW (can use backend TTS or fallback to browser)
const speak = async (text) => {
    if (!text) return;
    
    try {
        // Try backend TTS first (better quality)
        const response = await fetch('http://localhost:5000/api/speak', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                text: text,
                speaker: 'default'
            })
        });
        
        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            await audio.play();
            logger.info('✅ Using backend TTS');
            return;
        }
    } catch (error) {
        logger.warn('Backend TTS failed, falling back to browser API', error);
    }
    
    // Fallback to browser Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        logger.info('✅ Using browser TTS');
    }
};
```

---

## 7️⃣ Add Health Check Endpoint

Add this to `app.py`:

```python
from datetime import datetime

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        {
            "status": "healthy",
            "timestamp": "2026-02-10T14:30:00",
            "components": {
                "flask": "ok",
                "socketio": "ok",
                "database": "ok",
                "ai_models": "ok"
            }
        }
    """
    try:
        # Check database
        try:
            SignLibrary.query.first()
            db_status = "ok"
        except Exception as e:
            logger.error(f"Database check failed: {e}")
            db_status = "error"
        
        # Check AI models
        try:
            model_status = ai_manager.get_model_status()
            ai_status = "ok"
        except Exception as e:
            logger.error(f"AI models check failed: {e}")
            ai_status = "error"
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'components': {
                'flask': 'ok',
                'socketio': 'ok',
                'database': db_status,
                'ai_models': ai_status
            },
            'models': model_status if ai_status == 'ok' else None
        })
    
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {'status': 'unhealthy', 'error': str(e)}, 503
```

---

## 🧪 Testing Snippets

### Test in Python Shell

```python
# 1. Test model initialization
from ai_handler_PRODUCTION import AIModelManager

manager = AIModelManager(use_mock=True)
print(f"✅ Manager initialized: {manager.get_model_status()}")

# 2. Test sign prediction
landmarks = [0.5] * 63
text, conf = manager.predict_sign(landmarks)
print(f"Sign prediction: {text} ({conf:.1%})")

# 3. Test STT
audio_bytes = b"mock audio"
text, conf = manager.speech_to_text(audio_bytes)
print(f"STT result: {text} ({conf:.1%})")

# 4. Test TTS
audio = manager.text_to_speech("Hello world")
print(f"TTS result: {len(audio) if audio else 'None'} bytes")
```

### Test with curl

```bash
# 1. Check health
curl http://localhost:5000/api/health

# 2. Check models
curl http://localhost:5000/api/models/status

# 3. Test TTS
curl -X POST http://localhost:5000/api/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test"}'

# 4. Reload models (dev only)
curl -X POST http://localhost:5000/api/models/reload
```

### Test in JavaScript

```javascript
// Check if backend TTS is working
async function testTTS() {
    const response = await fetch('http://localhost:5000/api/speak', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: "Test successful"})
    });
    
    if (response.ok) {
        const audio = await response.blob();
        new Audio(URL.createObjectURL(audio)).play();
        console.log('✅ Backend TTS works!');
    } else {
        console.error('❌ TTS failed:', response.status);
    }
}

// Check models status
async function checkModels() {
    const response = await fetch('http://localhost:5000/api/models/status');
    const data = await response.json();
    console.log('Models:', data.models);
}
```

---

## 📋 Integration Checklist

- [ ] Copy `ai_handler_TEMPLATE.py` to `ai_handler.py`
- [ ] Update imports in `app.py`
- [ ] Create `utils/mediapipe_handler.py`
- [ ] Update `handle_frame()` function
- [ ] Add `/api/speak` endpoint
- [ ] Add `/api/models/status` endpoint
- [ ] Add `handle_audio_upload()` Socket handler
- [ ] Update frontend `speak()` function
- [ ] Test with mock models
- [ ] Install required packages (mediapipe, tensorflow, etc.)
- [ ] Place real model files in `models/` folder
- [ ] Test with real models
- [ ] Monitor `/api/health` endpoint

---

## 📦 Required Packages

```bash
# Core Flask
pip install flask flask-cors flask-socketio

# AI Models
pip install tensorflow mediapipe

# Audio processing (optional)
pip install librosa scipy

# Database
pip install flask-sqlalchemy

# Development
pip install python-dotenv pytest
```

---

## 🚀 You're Ready!

These code snippets give you everything needed to integrate the 3 AI models into your Bridge project.

**Estimated implementation time: 2-3 hours for all changes**

Good luck! 🎉

