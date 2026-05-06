import os
import json
import threading
import time
import atexit
import base64
import tempfile
import uuid
import asyncio
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
try:
    import cv2
    import numpy as np
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MEDIAPIPE_AVAILABLE = True
except Exception:
    MEDIAPIPE_AVAILABLE = False

try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except Exception:
    EDGE_TTS_AVAILABLE = False

# Authentication utilities
from auth_utils import (
    hash_password, verify_password,
    create_token, verify_token,
    require_auth, require_role
)
from config import *

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', SECRET_KEY)
ALLOWED_ORIGINS = "*"

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Socket.IO async mode:
# - Railway/production: force gevent (matches deployment stack)
# - Local dev: let Flask-SocketIO auto-pick (avoids "Invalid async_mode specified")
IS_RAILWAY = any(
    os.getenv(var)
    for var in (
        "RAILWAY_ENVIRONMENT",
        "RAILWAY_PROJECT_ID",
        "RAILWAY_SERVICE_ID",
        "RAILWAY_STATIC_URL",
    )
)
IS_PRODUCTION_ENV = (os.getenv("FLASK_ENV", "").lower() == "production") or IS_RAILWAY
SOCKETIO_ASYNC_MODE = "gevent" if IS_PRODUCTION_ENV else None

socketio = SocketIO(app, cors_allowed_origins="*", async_mode=SOCKETIO_ASYNC_MODE)

# --- 1. Database Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'communication_bridge.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Persistent temp directory for generated audio
TTS_TEMP_DIR = os.path.join(basedir, 'tts_audio')


def ensure_tts_temp_dir():
    os.makedirs(TTS_TEMP_DIR, exist_ok=True)


ensure_tts_temp_dir()

# ===== USER MODEL (NEW) =====
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='Blind')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = hash_password(password)

    def check_password(self, password):
        return verify_password(password, self.password_hash)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat()
        }

# ===== SIGN LIBRARY MODEL (EXISTING) =====
class SignLibrary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(50), unique=True, nullable=False)
    image_path = db.Column(db.String(200), nullable=False)

# ===== MESSAGE MODEL (EXISTING) =====
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    sender_type = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime, server_default=db.func.now())

connected_clients = {}
gesture_recognizer = None

gesture_translation = {
    'Thumb_Up': 'YES / AGREE',
    'Thumb_Down': 'NO / DISAGREE',
    'Open_Palm': 'HELLO / THANK YOU',
    'Closed_Fist': 'FINISHED / DONE',
    'Victory': 'PEACE / TWO',
    'Pointing_Up': 'I NEED HELP',
    'ILoveYou': 'I LOVE YOU / APPRECIATION'
}

# --- Sign synonym mapping (English only) ---
SYNONYM_MAP = {
    'ok': ["ok", "okay", "fine", "good", "perfect", "deal"],
    'hello': ["hello", "hi", "hey", "greetings", "welcome"],
    'love': ["love", "heart", "like", "adore"],
    'help': ["help", "assist", "save", "emergency", "support"],
    'no': ["no", "never", "stop", "refuse", "negative"],
    'pace': ["pace", "walk", "step", "slow"],
    'angry': ["angry", "mad", "furious", "upset"]
}

# Map canonical key -> filename in public/assets/signs
# Note: pace and angry use the exact filenames provided (with the 'sgin' typo)
CANONICAL_TO_FILENAME = {
    'ok': 'ok_sign.gif',
    'hello': 'hello_sign.gif',
    'love': 'love_sign.gif',
    'help': 'help_sign.gif',
    'no': 'no_sign.gif',
    'pace': 'pace_sgin.gif',
    'angry': 'angry_sgin.gif'
}


def find_sign_image_for_text(text: str):
    """Return the sign image path for recognized text using synonym mapping.
    Returns a relative path (e.g. /assets/signs/ok_sign.gif) or None.
    """
    if not text:
        return None
    text = text.lower()
    # simple token-based match
    words = [w.strip() for w in text.split() if w.strip()]
    for canonical, synonyms in SYNONYM_MAP.items():
        for w in words:
            if w in synonyms:
                fname = CANONICAL_TO_FILENAME.get(canonical)
                if fname:
                    path = f"/assets/signs/{fname}"
                    print(f"🎬 find_sign_image_for_text('{text}') -> matched '{canonical}' -> returning '{path}'")
                    return path
    print(f"🎬 find_sign_image_for_text('{text}') -> NO MATCH, returning None")
    return None

with app.app_context():
    db.create_all()

    if not SignLibrary.query.first():
        initial_signs = [
            SignLibrary(word="hello", image_path="/assets/signs/hello_sign.gif"),
            SignLibrary(word="love", image_path="/assets/signs/love_sign.gif"),
            SignLibrary(word="ok", image_path="/assets/signs/ok_sign.gif"),
            SignLibrary(word="help", image_path="/assets/signs/help_sign.gif"),
            SignLibrary(word="no", image_path="/assets/signs/no_sign.gif"),
            SignLibrary(word="pace", image_path="/assets/signs/pace_sgin.gif"),
            SignLibrary(word="angry", image_path="/assets/signs/angry_sgin.gif"),
            # keep previous useful entries if any
            SignLibrary(word="water", image_path="/assets/signs/water.gif")
        ]
        db.session.bulk_save_objects(initial_signs)
        db.session.commit()
        print("✅ Database initialized with sample signs.")

    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', full_name='Administrator', role='Admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Default admin user created (username: admin, password: admin123)")


# ============================================================================
# TTS SUPPORT
# ============================================================================

async def edge_tts_to_file(text, language, output_path):
    if not EDGE_TTS_AVAILABLE:
        raise RuntimeError('edge_tts is not installed on backend server.')
    voice = "ar-SA-ZariyahNeural" if language == "Arabic" else "en-US-JennyNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    return output_path


def tts_model_sync(text, language):
    if not text or not text.strip():
        raise ValueError('Text is required for TTS generation.')

    ensure_tts_temp_dir()
    output_path = os.path.join(TTS_TEMP_DIR, f"wesal_gesture_{uuid.uuid4().hex}.mp3")
    return asyncio.run(edge_tts_to_file(text.strip(), language, output_path))


@app.route('/api/generate-speech', methods=['POST'])
def generate_speech():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    language = data.get('language', 'English')

    if not text:
        return jsonify({'error': 'text is required'}), 400

    try:
        audio_path = tts_model_sync(text, language)
        with open(audio_path, 'rb') as audio_file:
            audio_base64 = base64.b64encode(audio_file.read()).decode('utf-8')

        base_url = request.host_url.rstrip('/')
        audio_url = f"{base_url}/api/audio/{os.path.basename(audio_path)}"
        return jsonify({
            'text': text,
            'language': language,
            'audio_url': audio_url,
            'audio_base64': audio_base64
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/speak-gesture', methods=['POST'])
def speak_gesture():
    return generate_speech()


@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    ensure_tts_temp_dir()
    safe_name = os.path.basename(filename)
    path = os.path.join(TTS_TEMP_DIR, safe_name)
    if not os.path.exists(path):
        return jsonify({'error': 'Audio file not found'}), 404
    return send_file(path, mimetype='audio/mpeg', as_attachment=False)


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400

        username = data.get('username').strip()
        password = data.get('password')
        full_name = data.get('full_name', username)
        role = data.get('role', 'Blind')

        if role not in ['Admin', 'Deaf', 'Blind']:
            return jsonify({'error': 'Role must be Admin, Deaf, or Blind'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409

        user = User(username=username, full_name=full_name, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        token = create_token(user.id, user.username, user.role)
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'token': token,
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password required'}), 400

        username = data.get('username')
        password = data.get('password')
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401

        token = create_token(user.id, user.username, user.role)
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/verify', methods=['GET'])
@require_auth
def verify_token_route():
    auth_user = request.auth_user
    return jsonify({
        'valid': True,
        'user': auth_user
    }), 200


# ============================================================================
# ADMIN ROUTES
# ============================================================================

@app.route('/api/admin/users', methods=['GET'])
@require_auth
@require_role('Admin')
def get_all_users():
    try:
        users = User.query.all()
        return jsonify({'users': [user.to_dict() for user in users]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@require_auth
@require_role('Admin')
def delete_user(user_id):
    try:
        if user_id == request.auth_user['user_id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/signs', methods=['GET'])
@require_auth
@require_role('Admin')
def get_all_signs():
    try:
        signs = SignLibrary.query.all()
        return jsonify({'signs': [{'id': s.id, 'word': s.word, 'image_path': s.image_path} for s in signs]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/signs', methods=['POST'])
@require_auth
@require_role('Admin')
def add_sign():
    try:
        data = request.get_json()
        if not data or not data.get('word') or not data.get('image_path'):
            return jsonify({'error': 'Word and image_path required'}), 400

        word = data.get('word').lower().strip()
        image_path = data.get('image_path')

        if SignLibrary.query.filter_by(word=word).first():
            return jsonify({'error': 'Word already exists in library'}), 409

        sign = SignLibrary(word=word, image_path=image_path)
        db.session.add(sign)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Sign added successfully', 'sign': {'id': sign.id, 'word': sign.word, 'image_path': sign.image_path}}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/signs/<int:sign_id>', methods=['DELETE'])
@require_auth
@require_role('Admin')
def delete_sign(sign_id):
    try:
        sign = SignLibrary.query.get(sign_id)
        if not sign:
            return jsonify({'error': 'Sign not found'}), 404

        db.session.delete(sign)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Sign deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def initialize_gesture_recognizer():
    global gesture_recognizer
    if not MEDIAPIPE_AVAILABLE:
        raise RuntimeError('MediaPipe dependencies are not installed on backend server.')
    model_path = os.path.join(os.path.dirname(__file__), 'gesture_recognizer.task')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Gesture model not found at {model_path}")

    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.GestureRecognizerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        min_tracking_confidence=0.5,
        min_hand_presence_confidence=0.5
    )
    gesture_recognizer = vision.GestureRecognizer.create_from_options(options)
    print(f'✅ Gesture Recognizer initialized (IMAGE) from {model_path}')


def release_resources():
    global gesture_recognizer
    if gesture_recognizer is not None:
        gesture_recognizer.close()
        gesture_recognizer = None
        print('✅ Gesture Recognizer closed')


@socketio.on('connect')
def handle_connect():
    print(f"✅ Client connected: {request.sid}")
    connected_clients[request.sid] = {'connected_at': None}
    emit('status', {'message': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in connected_clients:
        del connected_clients[request.sid]
    print(f"❌ Client disconnected: {request.sid}")


@socketio.on('process_frame')
def process_frame(data):
    global gesture_recognizer
    try:
        image_data = data.get('image', '')
        if not image_data:
            return

        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]

        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            print('⚠️ process_frame: invalid image frame')
            return

        if gesture_recognizer is None:
            initialize_gesture_recognizer()

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        result = gesture_recognizer.recognize(mp_image)

        detected_sign = None
        if result.gestures and result.gestures[0]:
            gesture_name = result.gestures[0][0].category_name
            detected_sign = gesture_translation.get(gesture_name)

        if detected_sign:
            print(f'🖐️ Detected gesture {gesture_name}, sending {detected_sign}')
            socketio.emit('new_sign', {'sign': detected_sign})

    except Exception as e:
        print(f'❌ process_frame error: {e}')


@socketio.on('send_message')
def handle_blind_to_deaf(data):
    text = data.get('text', '').lower()
    sender_sid = request.sid
    # first try database exact match
    sign_entry = SignLibrary.query.filter_by(word=text).first()
    # fallback to synonym mapping
    sign_url = sign_entry.image_path if sign_entry else find_sign_image_for_text(text)
    response_data = {
        'text': text,
        'signUrl': sign_url
    }
    print(f"📨 send_message from Blind user ({sender_sid}): text='{text}', signUrl='{sign_url}'")
    new_msg = Message(content=text, sender_type='blind')
    db.session.add(new_msg)
    db.session.commit()
    print(f"📨 Emitting display_sign to Deaf user: {response_data}")
    emit('display_sign', response_data, broadcast=True, include_self=False)


@socketio.on('deaf_message')
def handle_deaf_message(data):
    text = data.get('text', '')
    sender_sid = request.sid
    new_msg = Message(content=text, sender_type='deaf')
    db.session.add(new_msg)
    db.session.commit()
    print(f"📨 Deaf user ({sender_sid}) sent: {text}")
    emit('receive_message', {'text': text}, broadcast=True, include_self=False)


@socketio.on('voice_to_sign')
def handle_voice_to_sign(data):
    voice_text = (data.get('text', '') or '').lower()
    sender_sid = request.sid
    sign_entry = SignLibrary.query.filter_by(word=voice_text).first()
    sign_url = sign_entry.image_path if sign_entry else find_sign_image_for_text(voice_text)
    response_data = {
        'text': voice_text,
        'signUrl': sign_url
    }
    new_msg = Message(content=voice_text, sender_type='blind')
    db.session.add(new_msg)
    db.session.commit()
    print(f"🎤 Blind user ({sender_sid}) said: {voice_text}")
    emit('display_sign', response_data, broadcast=True, include_self=False)


@socketio.on('get_tts_feedback')
def handle_tts_feedback(data):
    """Generate Neural TTS audio and return it to requesting client."""
    try:
        payload = data or {}
        text = (payload.get('text', '') or '').strip()
        if not text:
            emit('tts_feedback', {'error': 'text is required'})
            return

        language = payload.get('language')
        if language not in ('Arabic', 'English'):
            language = 'Arabic' if any('\u0600' <= ch <= '\u06FF' for ch in text) else 'English'

        audio_path = tts_model_sync(text, language)
        base_url = request.host_url.rstrip('/')
        audio_url = f"{base_url}/api/audio/{os.path.basename(audio_path)}"

        emit('tts_feedback', {
            'text': text,
            'language': language,
            'audio_url': audio_url
        })
    except Exception as e:
        print(f"❌ get_tts_feedback error: {e}")
        emit('tts_feedback', {'error': str(e)})


atexit.register(release_resources)


if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
    finally:
        release_resources()
