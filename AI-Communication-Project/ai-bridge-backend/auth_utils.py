"""
Authentication Utilities
========================
Handles password hashing, JWT tokens, and user verification.
"""

import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app

# Password hashing (use werkzeug for secure hashing)
from werkzeug.security import generate_password_hash, check_password_hash

# ============================================================================
# PASSWORD HASHING
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using werkzeug security."""
    return generate_password_hash(password, method='pbkdf2:sha256')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return check_password_hash(hashed, password)


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

def create_token(user_id: int, username: str, role: str, expires_in_days: int = 7) -> str:
    """
    Create JWT token for user session.
    
    Args:
        user_id: Database user ID
        username: Username
        role: User role (Admin, Deaf, or Blind)
        expires_in_days: Token expiration in days
    
    Returns:
        JWT token string
    """
    secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=expires_in_days)
    }
    
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    return token


def verify_token(token: str) -> dict:
    """
    Verify JWT token and return payload.
    
    Args:
        token: JWT token string
    
    Returns:
        Token payload dict if valid
        None if invalid
    """
    try:
        secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token


# ============================================================================
# DECORATORS FOR ROUTE PROTECTION
# ============================================================================

def require_auth(f):
    """
    Decorator to require authentication token in request.
    
    Usage:
        @app.route('/protected')
        @require_auth
        def protected_route():
            # request.auth_user contains decoded token
            return {'user': request.auth_user['username']}
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        # Get token from query params (for WebSocket)
        if not token and 'token' in request.args:
            token = request.args.get('token')
        
        if not token:
            return jsonify({'error': 'Missing authentication token'}), 401
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Attach decoded token to request
        request.auth_user = payload
        
        return f(*args, **kwargs)
    
    return decorated


def require_role(*allowed_roles):
    """
    Decorator to require specific role.
    
    Usage:
        @app.route('/admin')
        @require_auth
        @require_role('Admin')
        def admin_route():
            return {'message': 'Admin only'}
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'auth_user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = request.auth_user.get('role')
            
            if user_role not in allowed_roles:
                return jsonify({'error': f'Requires one of: {allowed_roles}'}), 403
            
            return f(*args, **kwargs)
        
        return decorated
    
    return decorator


# ============================================================================
# TOKEN EXTRACTION HELPERS
# ============================================================================

def get_token_from_request() -> str:
    """
    Extract token from request (Authorization header or query param).
    
    Returns:
        Token string or None
    """
    # Try Authorization header
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        try:
            return auth_header.split(' ')[1]
        except IndexError:
            pass
    
    # Try query parameters
    return request.args.get('token')


def get_auth_user() -> dict:
    """
    Get authenticated user from request (if attached by decorator).
    
    Returns:
        User dict from JWT payload or None
    """
    return getattr(request, 'auth_user', None)
