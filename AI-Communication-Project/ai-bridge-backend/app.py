import os
import json
import threading
import time
import atexit
import base64
import tempfile
import uuid
import asyncio
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
import edge_tts
import speech_recognition as sr

# Authentication utilities
from auth_utils import (
    hash_password, verify_password,
    create_token, verify_token,
    require_auth, require_role
)
from config import *

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', SECRET_KEY)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# --- 1. Database Configuration ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'communication_bridge.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Persistent temp directory for generated audio
TTS_TEMP_DIR = os.path.join(basedir, 'tts_audio')
os.makedirs(TTS_TEMP_DIR, exist_ok=True)

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

with app.app_context():
    db.create_all()

    if not SignLibrary.query.first():
        initial_signs = [
            SignLibrary(word="hello", image_path="/assets/signs/hello.gif"),
            SignLibrary(word="water", image_path="/assets/signs/water.gif"),
            SignLibrary(word="help", image_path="/assets/signs/help.gif")
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

# ============================================================================
# TTS SUPPORT
# ============================================================================

async def edge_tts_to_file(text, language, output_path):
    voice = "ar-SA-ZariyahNeural" if language == "Arabic" else "en-US-JennyNeural"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    return output_path


def tts_model_sync(text, language):
    if not text or not text.strip():
        raise ValueError('Text is required for TTS generation.')

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

        audio_url = f"http://127.0.0.1:5000/api/audio/{os.path.basename(audio_path)}"
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
    sign_entry = SignLibrary.query.filter_by(word=text).first()
    response_data = {
        'text': text,
        'signUrl': sign_entry.image_path if sign_entry else None
    }
    new_msg = Message(content=text, sender_type='blind')
    db.session.add(new_msg)
    db.session.commit()
    print(f"📨 Blind user ({sender_sid}) sent: {text} → sending display_sign to Deaf user")
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
    voice_text = data.get('text', '').lower()
    sender_sid = request.sid
    sign_entry = SignLibrary.query.filter_by(word=voice_text).first()
    response_data = {
        'text': voice_text,
        'signUrl': sign_entry.image_path if sign_entry else None
    }
    new_msg = Message(content=voice_text, sender_type='blind')
    db.session.add(new_msg)
    db.session.commit()
    print(f"🎤 Blind user ({sender_sid}) said: {voice_text}")
    emit('display_sign', response_data, broadcast=True, include_self=False)


atexit.register(release_resources)


if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    finally:
        release_resources()
