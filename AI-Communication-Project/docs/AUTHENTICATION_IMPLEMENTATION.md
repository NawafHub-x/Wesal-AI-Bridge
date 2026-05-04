# Authentication System & RBAC Implementation - Complete Guide

## Overview
This document provides a comprehensive guide to the newly implemented authentication system with Role-Based Access Control (RBAC) for the AI Communication Bridge application. The system supports three user roles: **Admin**, **Deaf**, and **Blind** users.

---

## 🎯 What's New

### Phase 1: Database & Authentication Layer ✅
- **Database**: SQLite User table with hashed passwords and JWT token support
- **Authentication Module**: `auth_utils.py` with password hashing, token generation, and validation
- **Backend Routes**: 8 new authenticated endpoints for auth and admin operations

### Phase 2: Frontend Navigation & Login ✅
- **SelectRole Component**: New landing page for role selection
- **Login Component**: Updated with username/password authentication
- **Protected Routes**: Route guards using token validation
- **Socket.IO Integration**: Token passing for WebSocket authentication

### Phase 3: Admin Dashboard ✅
- **User Management**: View all users, delete users (with safeguards)
- **Sign Library Management**: Add/delete signs from the library
- **Tab-based UI**: Intuitive interface for switching between management sections

---

## 📁 File Structure

### Backend Files

#### `ai-bridge-backend/auth_utils.py` (NEW - 160+ lines)
Central authentication module with utilities:

```python
# Core Functions:
- hash_password(password) → Generate secure password hash
- verify_password(password, hashed) → Validate password against hash
- create_token(user_id, username, role, expires_in_days=7) → Generate JWT
- verify_token(token) → Validate and extract token data
- get_token_from_request() → Extract token from Authorization header or query params
- get_auth_user() → Get current authenticated user from request

# Decorators:
- @require_auth → Validates JWT token, attaches user to request.auth_user
- @require_role(*allowed_roles) → RBAC enforcement, rejects unauthorized roles
```

#### `ai-bridge-backend/app.py` (MODIFIED - 8 new routes added)
Enhanced Flask application:

**New Database Model:**
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    role = db.Column(db.String(20), nullable=False)  # Admin, Deaf, or Blind
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Methods:
    - set_password(password) → Hash and store password
    - check_password(password) → Verify password
    - to_dict() → Convert to JSON-serializable dict
```

**New Authentication Routes:**
```
POST   /api/auth/register    → Create new user account
POST   /api/auth/login       → Authenticate and get JWT token
GET    /api/auth/verify      → Validate existing token
```

**New Admin Routes (requires Admin role):**
```
GET    /api/admin/users      → List all users
DELETE /api/admin/users/<id> → Delete specific user
GET    /api/admin/signs      → List all signs in library
POST   /api/admin/signs      → Add new sign to library
DELETE /api/admin/signs/<id> → Remove sign from library
```

**Database Initialization:**
- Creates default admin user on startup:
  - Username: `admin`
  - Password: `admin123`

### Frontend Files

#### `ai-bridge-front/src/SelectRole.jsx` (NEW - 260+ lines)
Landing page component with role selection:

**Features:**
- Three role buttons: Blind (blue), Deaf (teal), Admin (purple)
- Dark theme with glassmorphism design
- Stores selected role in `localStorage['bridge_selected_role']`
- Navigates to `/login` on role selection

**Styling:**
- Gradient background: `#1f2937` to `#111827`
- Role-specific accent colors
- Hover animations and glass effect cards

#### `ai-bridge-front/src/Login.jsx` (MODIFIED - 100+ lines updated)
Updated authentication component:

**Features:**
- Username and password input fields
- Two-mode operation: Login or Register
- Demo account display: `admin / admin123`
- Error message display with auto-dismiss
- Loading states and disabled button states

**Authentication Flow:**
1. User enters username and password
2. Click "Login" → POST `/api/auth/login`
3. OR click "Create New Account" → POST `/api/auth/register`
4. On success:
   - Token stored in `localStorage['bridge_token']`
   - User info stored in `localStorage['bridge_user']`
   - Navigate based on role:
     - Admin → `/admin-dashboard`
     - Deaf → `/visual-mode`
     - Blind → `/audio-mode`

#### `ai-bridge-front/src/AdminDashboard.jsx` (NEW - 500+ lines)
Comprehensive admin management interface:

**Two Tab Sections:**

1. **Users Tab:**
   - Display all users in table format
   - Columns: ID, Username, Full Name, Role, Created Date, Action
   - Delete button (with safeguards to prevent deleting last admin)
   - Role badges with color coding

2. **Signs Tab:**
   - Form to add new signs (symbol + meaning)
   - Table listing all signs with delete buttons
   - Prevents duplicate symbols
   - Real-time updates after add/delete

**Features:**
- Token-based authentication for all API calls
- Loading states during data fetches
- Error handling with display messages
- Logout button with localStorage cleanup
- Responsive design matching dark theme

#### `ai-bridge-front/src/App.jsx` (MODIFIED - Complete rewrite)
Updated main application router:

**New Routing Structure:**
```
/ → /select-role (redirect)
/select-role → SelectRole component
/login → Login component
/visual-mode → DeafUser component (protected, Deaf role only)
/audio-mode → BlindUser component (protected, Blind role only)
/admin-dashboard → AdminDashboard component (protected, Admin role only)

Legacy routes:
/deaf → /visual-mode (redirect)
/blind → /audio-mode (redirect)
```

**Protected Route Component:**
- `<ProtectedRoute>` wrapper validates token before rendering
- Checks user role matches required role
- Redirects to `/login` if unauthorized
- Shows loading state while validating

#### `ai-bridge-front/src/socket.js` (MODIFIED)
Updated Socket.IO initialization:

**New Features:**
- Automatically passes JWT token in auth configuration
- `updateToken()` function to refresh token on login
- Token retrieval from localStorage
- Reconnection support with new token

---

## 🔐 Security Features

### Password Security
- **Algorithm**: PBKDF2-SHA256 via werkzeug
- **Salting**: Automatic, cryptographically secure
- **Storage**: Only hashes stored, never plain text

### Token Security
- **Type**: JWT (JSON Web Tokens)
- **Expiration**: 7 days by default (configurable)
- **Encoding**: HS256 algorithm with secret key
- **Payload**: user_id, username, role, iat (issued at), exp (expiration)

### Route Protection
- **Authentication**: All sensitive routes require valid JWT
- **Authorization**: Role-based access control on admin routes
- **Token Validation**: Happens on every protected request
- **Token Source**: Supports both Authorization header and query parameters (WebSocket compatibility)

### Self-Delete Guard
- Cannot delete the last Admin user
- Prevents accidental lockout from admin panel

---

## 🚀 Getting Started

### Backend Setup

1. **Install Dependencies** (if not already done):
```bash
pip install flask flask-sqlalchemy flask-cors pyjwt werkzeug python-socketio
```

2. **Database Migration**:
   - The system automatically creates the User table on first run
   - Default admin user is created automatically:
     - Username: `admin`
     - Password: `admin123`

3. **Start Backend**:
```bash
cd ai-bridge-backend
python app.py
```

Backend should now be running at `http://localhost:5000`

### Frontend Setup

1. **Install Dependencies**:
```bash
cd ai-bridge-front
npm install
```

2. **Start Frontend**:
```bash
npm run dev
```

Frontend should now be running at `http://localhost:5173` (or similar)

---

## 📝 Authentication Flow Diagram

```
User Visits Application
         ↓
   Go to / (SelectRole)
         ↓
   Select Role (Blind/Deaf/Admin)
   [Stored in localStorage]
         ↓
   Navigate to /login
         ↓
   ┌─────────────────────────┐
   │ Enter Username/Password │
   └─────────────────────────┘
         ↓
   ┌─────────────────────────────────┐
   │ Click Login or Register         │
   └─────────────────────────────────┘
         ↓
   POST /api/auth/login or /api/auth/register
         ↓
   Backend validates credentials
         ↓
   ┌─────────────────────────────────┐
   │ Success: Generate JWT Token     │
   └─────────────────────────────────┘
         ↓
   Frontend stores:
   - Token → localStorage['bridge_token']
   - User → localStorage['bridge_user']
         ↓
   Navigate to role-specific dashboard:
   - Admin → /admin-dashboard
   - Deaf → /visual-mode
   - Blind → /audio-mode
         ↓
   ✓ User is authenticated and authorized
```

---

## 🧪 Testing the System

### Demo Credentials
- **Username**: `admin`
- **Password**: `admin123`

### Test Scenarios

#### 1. New User Registration
1. Click "Select Role" → Choose "Deaf"
2. Go to login page
3. Click "Create New Account"
4. Enter new username and password
5. Should create account and log in
6. Should land on `/visual-mode`

#### 2. Admin Access
1. Log in with `admin / admin123`
2. Should land on `/admin-dashboard`
3. Go to "Users" tab → Should see admin user
4. Go to "Signs" tab → Should see existing signs
5. Try to add a new sign → Should appear in table
6. Try to delete a sign → Should be removed

#### 3. Role-Based Access Control
1. Log in as Deaf user
2. Try to access `/admin-dashboard` directly
3. Should be redirected to `/login`

#### 4. Token Expiration
1. Log in successfully
2. Wait 7 days
3. Try to access protected route
4. Should be redirected to `/login` with "Token expired" message

#### 5. Socket.IO Connection
1. Log in as Deaf user
2. Go to `/visual-mode`
3. Check browser console → Should show successful Socket.IO connection
4. Socket events should work normally (send_message, etc.)

---

## 🔄 Integration with Existing Features

### Socket.IO Events
All existing Socket.IO events remain unchanged:
- `process_frame` - Process video frames
- `send_message` - Send messages between users
- `voice_to_sign` - Convert voice to sign language
- `deaf_message` - Handle deaf user messages

**Important**: Token is now passed via Socket.IO auth on connection. The backend validates tokens for WebSocket connections as well.

### Styling & Theme
- New components follow existing dark theme
- Gradient backgrounds: `#1f2937` to `#111827`
- Accent colors maintained from original design
- All components responsive and accessible

### Database Integrity
- User table is separate from existing SignLibrary and Message tables
- No modifications to existing models
- Backward compatible database structure
- Migrations happen automatically on startup

---

## 📊 API Reference

### Authentication Endpoints

#### POST `/api/auth/register`
Create a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password",
  "full_name": "John Doe"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "full_name": "John Doe",
    "role": "Deaf"  // from localStorage
  }
}
```

#### POST `/api/auth/login`
Authenticate user and get token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin"
  }
}
```

#### GET `/api/auth/verify`
Verify token validity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "Admin"
  }
}
```

### Admin Endpoints

#### GET `/api/admin/users`
List all users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "full_name": null,
      "role": "Admin",
      "created_at": "2024-01-15T10:30:00"
    }
  ]
}
```

#### DELETE `/api/admin/users/<id>`
Delete specific user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### GET `/api/admin/signs`
List all signs in library (Admin only).

**Response:**
```json
{
  "success": true,
  "signs": [
    {
      "id": 1,
      "symbol": "hello",
      "meaning": "Greeting gesture"
    }
  ]
}
```

#### POST `/api/admin/signs`
Add new sign to library (Admin only).

**Request:**
```json
{
  "symbol": "hello",
  "meaning": "Greeting gesture"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sign added successfully",
  "sign": {
    "id": 1,
    "symbol": "hello",
    "meaning": "Greeting gesture"
  }
}
```

#### DELETE `/api/admin/signs/<id>`
Remove sign from library (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Sign deleted successfully"
}
```

---

## ⚙️ Configuration & Customization

### Change Token Expiration
In `auth_utils.py`, modify the `create_token()` function's default parameter:
```python
def create_token(user_id, username, role, expires_in_days=30):  # Change 7 to 30
```

### Change Secret Key (IMPORTANT for production)
In `app.py`, update the secret key:
```python
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'  # Change to strong random string
```

### Add More User Roles
1. Update role validation in `auth_utils.py`
2. Add new routes in `app.py` for new role features
3. Update frontend routing in `App.jsx`

### Change Default Admin Credentials
In `app.py`, modify the database initialization section:
```python
admin_user = User(
    username='your_new_username',  # Change this
    full_name='Administrator',
    role='Admin'
)
admin_user.set_password('your_new_password')  # Change this
```

---

## 🐛 Troubleshooting

### Issue: "Login failed" error
**Solution**: 
- Verify backend is running on port 5000
- Check username/password are correct
- Try demo account: `admin / admin123`
- Check browser console for network errors

### Issue: Token validation fails after login
**Solution**:
- Clear browser localStorage: `localStorage.clear()`
- Log out and log back in
- Check token hasn't expired (7 days default)
- Verify secret key matches between frontend and backend

### Issue: Admin routes return 403 Unauthorized
**Solution**:
- Verify user role is "Admin"
- Check token is valid and not expired
- Verify Authorization header format: `Bearer <token>`
- Check server logs for detailed error

### Issue: Socket.IO connection fails after login
**Solution**:
- Verify token is properly stored in localStorage
- Check Socket.IO auth configuration in `socket.js`
- Look for CORS errors in browser console
- Try reconnecting by navigating to a new route

### Issue: CORS errors on API calls
**Solution**:
- Verify Flask CORS is enabled with proper headers
- Check frontend API URL matches backend address
- Ensure credentials are included in fetch calls if needed
- Check server logs for CORS configuration

---

## 📚 Next Steps

### Security Hardening (for production)
- [ ] Change JWT secret key to strong random value
- [ ] Implement rate limiting on login attempts
- [ ] Add email verification for registration
- [ ] Implement password reset functionality
- [ ] Add two-factor authentication (2FA)
- [ ] Use HTTPS instead of HTTP
- [ ] Implement refresh tokens for better security

### Feature Enhancements
- [ ] User profile management
- [ ] Change password functionality
- [ ] User activity logging
- [ ] Sign language video library management
- [ ] User permissions/permissions matrix
- [ ] Backup and recovery procedures

### Frontend Improvements
- [ ] Session timeout warnings
- [ ] Persistent auth state across page refreshes
- [ ] Better error messages with recovery instructions
- [ ] Loading skeletons for data tables
- [ ] Search and filter for users/signs

### Backend Improvements
- [ ] Database migration system (Alembic)
- [ ] Comprehensive logging
- [ ] Rate limiting middleware
- [ ] Request validation schemas
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Unit tests for auth functions

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console logs (F12)
3. Check server logs in terminal
4. Verify all files are properly updated
5. Run database check: Clear localStorage and restart

---

## ✅ Implementation Checklist

- [x] Create `auth_utils.py` with authentication functions
- [x] Add User model to `app.py`
- [x] Add authentication routes to `app.py`
- [x] Add admin routes to `app.py`
- [x] Create `SelectRole.jsx` component
- [x] Update `Login.jsx` with username/password auth
- [x] Create `AdminDashboard.jsx` component
- [x] Update `App.jsx` routing with protected routes
- [x] Update `socket.js` with token authentication
- [x] Test complete authentication flow
- [x] Verify Socket.IO still works
- [x] Create comprehensive documentation

---

**Last Updated**: 2024
**Version**: 1.0.0 - Initial Release
