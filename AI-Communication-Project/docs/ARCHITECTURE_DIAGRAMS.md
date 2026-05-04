# Authentication System Architecture & Flow Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI COMMUNICATION BRIDGE                       │
│                  AUTHENTICATION SYSTEM v1.0                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│     FRONTEND (React)     │         │    BACKEND (Flask)       │
│                          │         │                          │
│ ┌────────────────────┐   │         │ ┌────────────────────┐   │
│ │  SelectRole.jsx    │   │         │ │  auth_utils.py     │   │
│ │  - Role selection  │   │         │ │  - Hash password   │   │
│ │  - localStorage    │   │         │ │  - Create JWT      │   │
│ └────────────────────┘   │         │ │  - Verify token    │   │
│           ↓              │         │ │  - Decorators      │   │
│ ┌────────────────────┐   │         │ └────────────────────┘   │
│ │   Login.jsx        │   │         │           ↓              │
│ │  - Username/Pwd    │   │         │ ┌────────────────────┐   │
│ │  - Token storage   │◄──┼─────────→ │   app.py routes    │   │
│ │  - Role navigation │   │  HTTP    │ │ ┌────────────────┐ │   │
│ └────────────────────┘   │  JSON    │ │ │/api/auth/*     │ │   │
│           ↓              │         │ │ │/api/admin/*    │ │   │
│ ┌────────────────────┐   │         │ │ └────────────────┘ │   │
│ │AdminDashboard.jsx  │   │         │ │                    │   │
│ │  - Users table     │   │         │ │ User Model:        │   │
│ │  - Signs table     │   │         │ │ - id               │   │
│ └────────────────────┘   │         │ │ - username         │   │
│           ↓              │         │ │ - password_hash    │   │
│ ┌────────────────────┐   │         │ │ - role             │   │
│ │  socket.js         │◄──┼─────────→ │ │ - created_at       │   │
│ │  - Token in auth   │   │ WebSocket │ │ - Methods          │   │
│ │  - Existing events │   │         │ └────────────────────┘   │
│ └────────────────────┘   │         │                          │
│                          │         │ Database:               │
│  App.jsx:               │         │ ┌────────────────────┐   │
│  - Protected routes     │         │ │  SQLite (.db)      │   │
│  - Role validation      │         │ │ ┌────────────────┐ │   │
│  - Navigation logic     │         │ │ │ User table     │ │   │
│                          │         │ │ │ SignLibrary    │ │   │
│  localStorage:          │         │ │ │ Message        │ │   │
│  - bridge_token         │         │ │ └────────────────┘ │   │
│  - bridge_user          │         │ └────────────────────┘   │
│  - bridge_selected_role │         │                          │
└──────────────────────────┘         └──────────────────────────┘
```

---

## 2. Authentication Flow Diagram

```
╔════════════════════════════════════════════════════════════════╗
║              USER AUTHENTICATION FLOW                          ║
╚════════════════════════════════════════════════════════════════╝

START: User opens application at http://localhost:5173
   │
   ├─→ App.jsx checks localStorage for token
   │
   ├─→ ✗ No token found → Redirect to /select-role
   │   │
   │   └─→ SelectRole.jsx displays
   │       ┌─────────────────────────────────────┐
   │       │ Choose your role:                   │
   │       │ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │       │ │  BLIND   │ │  DEAF    │ │ ADMIN    │
   │       │ │ (Audio)  │ │ (Visual) │ │(Mgmt)    │
   │       │ └──────────┘ └──────────┘ └──────────┘
   │       └─────────────────────────────────────┘
   │       │ (Role stored in localStorage)
   │       │
   │       └─→ User clicks role button
   │           └─→ Redirect to /login
   │
   └─→ ✓ Token found → Validate token
       │
       ├─→ ✗ Token invalid/expired → Redirect to /login
       │
       └─→ ✓ Token valid → Check user role
           │
           ├─→ Admin → Redirect to /admin-dashboard
           ├─→ Deaf → Redirect to /visual-mode
           └─→ Blind → Redirect to /audio-mode

═══════════════════════════════════════════════════════════════════

LOGIN/REGISTER FLOW:

Login.jsx opens
   │
   ├─→ User enters: username, password
   │
   ├─→ User clicks "LOGIN"
   │   │
   │   └─→ POST /api/auth/login
   │       │
   │       ├─→ Backend validates credentials
   │       │   ├─→ ✗ User not found → Error 401
   │       │   ├─→ ✗ Password wrong → Error 401
   │       │   └─→ ✓ Valid → Generate JWT token
   │       │
   │       └─→ Response:
   │           {
   │             "success": true,
   │             "token": "eyJ0eXAi...",
   │             "user": { "id": 1, "role": "Admin" }
   │           }
   │
   │       Frontend stores:
   │       ├─→ localStorage['bridge_token'] = token
   │       ├─→ localStorage['bridge_user'] = user JSON
   │       │
   │       └─→ Navigate based on role
   │
   ├─→ User clicks "CREATE NEW ACCOUNT"
   │   │
   │   └─→ POST /api/auth/register
   │       │
   │       ├─→ Backend checks if username exists
   │       │   ├─→ ✗ Username taken → Error 400
   │       │   └─→ ✓ Available → Create user with hashed password
   │       │
   │       └─→ Same flow as login
   │
   └─→ Navigation:
       Admin → /admin-dashboard
       Deaf → /visual-mode
       Blind → /audio-mode
```

---

## 3. Protected Route Flow

```
╔════════════════════════════════════════════════════════════════╗
║           PROTECTED ROUTE ACCESS FLOW                         ║
╚════════════════════════════════════════════════════════════════╝

User tries to access: /admin-dashboard
   │
   ├─→ App.jsx routes to <ProtectedRoute>
   │
   ├─→ ProtectedRoute checks:
   │   │
   │   ├─→ Does token exist in localStorage?
   │   │   ├─→ ✗ No → Redirect to /login
   │   │   └─→ ✓ Yes → Continue
   │   │
   │   ├─→ Does user JSON exist in localStorage?
   │   │   ├─→ ✗ No → Redirect to /login
   │   │   └─→ ✓ Yes → Continue
   │   │
   │   └─→ Does user role match required role?
   │       ├─→ ✗ No (e.g., Deaf trying to access Admin) → Redirect to /login
   │       └─→ ✓ Yes → Render AdminDashboard
   │
   └─→ SUCCESS: User sees protected component

═══════════════════════════════════════════════════════════════════

Route Protection Matrix:

Route              Required Role    Redirect if Unauthorized
─────────────────────────────────────────────────────────────
/select-role       None             N/A (public)
/login             None             N/A (public)
/admin-dashboard   Admin            /login
/visual-mode       Deaf             /login
/audio-mode        Blind            /login

Legacy routes (backward compatibility):
/deaf              None (redirects) → /visual-mode
/blind             None (redirects) → /audio-mode
```

---

## 4. API Request Flow with Authentication

```
┌──────────────────────────────────────────────────────────────┐
│           API REQUEST WITH JWT AUTHENTICATION                │
└──────────────────────────────────────────────────────────────┘

Frontend AdminDashboard.jsx needs users list:
   │
   ├─→ Retrieve token from localStorage
   │   token = localStorage.getItem('bridge_token')
   │   // e.g., "eyJhbGciOiJIUzI1NiIs..."
   │
   ├─→ Make API request:
   │   fetch('http://localhost:5000/api/admin/users', {
   │     method: 'GET',
   │     headers: {
   │       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',
   │       'Content-Type': 'application/json'
   │     }
   │   })
   │
   ├─→ Backend receives request
   │   │
   │   ├─→ app.py extracts Authorization header
   │   │
   │   ├─→ @require_auth decorator runs:
   │   │   │
   │   │   ├─→ Extract token from header
   │   │   │   // "Authorization: Bearer <token>"
   │   │   │   // Get token part: "<token>"
   │   │   │
   │   │   ├─→ Verify token using auth_utils.verify_token()
   │   │   │   ├─→ ✗ Invalid/Expired → Return 401 Unauthorized
   │   │   │   └─→ ✓ Valid → Extract payload
   │   │   │
   │   │   └─→ Attach user info to request:
   │   │       // request.auth_user = {
   │   │       //   'user_id': 1,
   │   │       //   'username': 'admin',
   │   │       //   'role': 'Admin'
   │   │       // }
   │   │
   │   ├─→ @require_role('Admin') decorator runs:
   │   │   │
   │   │   ├─→ Check if role is 'Admin'
   │   │   │   ├─→ ✗ Not Admin → Return 403 Forbidden
   │   │   │   └─→ ✓ Is Admin → Continue to route handler
   │   │   │
   │   │   └─→ Route handler executes:
   │   │       GET /api/admin/users
   │   │       → Queries database for all users
   │   │       → Returns user list as JSON
   │   │
   │   └─→ Response:
   │       {
   │         "success": true,
   │         "users": [
   │           { "id": 1, "username": "admin", "role": "Admin" },
   │           { "id": 2, "username": "user1", "role": "Deaf" }
   │         ]
   │       }
   │
   └─→ Frontend receives response
       ├─→ ✓ 200 OK → setUsers(data.users)
       └─→ ✗ 401/403 → Show error, redirect to login
```

---

## 5. Token Generation & Validation Process

```
╔════════════════════════════════════════════════════════════════╗
║           JWT TOKEN LIFECYCLE                                 ║
╚════════════════════════════════════════════════════════════════╝

TOKEN GENERATION (During Login):
   │
   ├─→ User submits credentials
   │
   ├─→ Backend validates password:
   │   verify_password('user_input', 'stored_hash')
   │   ├─→ Uses werkzeug.security.check_password_hash()
   │   ├─→ ✗ Password mismatch → Return error
   │   └─→ ✓ Password correct → Continue
   │
   ├─→ Create JWT token:
   │   create_token(user_id=1, username='admin', role='Admin')
   │   │
   │   ├─→ Create payload:
   │   │   {
   │   │     'user_id': 1,
   │   │     'username': 'admin',
   │   │     'role': 'Admin',
   │   │     'iat': 1705324800,        // Issued at (now)
   │   │     'exp': 1706016000         // Expiration (now + 7 days)
   │   │   }
   │   │
   │   ├─→ Encode payload using HS256:
   │   │   jwt.encode(payload, SECRET_KEY, algorithm='HS256')
   │   │   // Result: "eyJ0eXAiOiJKV1QiLC..."
   │   │
   │   └─→ Return token to frontend
   │
   └─→ Frontend stores in localStorage

═══════════════════════════════════════════════════════════════════

TOKEN VALIDATION (On API Request):
   │
   ├─→ Extract token from request:
   │   ├─→ Check Authorization header
   │   │   // "Authorization: Bearer <token>"
   │   ├─→ OR check query parameter
   │   │   // "?token=<token>" (for WebSocket)
   │   └─→ Extract token string
   │
   ├─→ Decode token:
   │   verify_token(token)
   │   │
   │   ├─→ jwt.decode(token, SECRET_KEY, algorithm='HS256')
   │   │
   │   ├─→ Check expiration:
   │   │   current_time = now()
   │   │   if current_time > exp_time:
   │   │     └─→ ✗ Expired → Return error, raise ExpiredSignatureError
   │   │
   │   ├─→ Check signature:
   │   │   ├─→ ✗ Signature invalid → Raise InvalidTokenError
   │   │   └─→ ✓ Signature valid → Extract payload
   │   │
   │   └─→ Return payload:
   │       {
   │         'user_id': 1,
   │         'username': 'admin',
   │         'role': 'Admin'
   │       }
   │
   └─→ Attach to request, allow access

═══════════════════════════════════════════════════════════════════

TOKEN STRUCTURE:

Header.Payload.Signature
   │        │         │
   │        │         └─→ Signed with SECRET_KEY (HS256)
   │        │
   │        └─→ base64url({
   │              "user_id": 1,
   │              "username": "admin",
   │              "role": "Admin",
   │              "iat": 1705324800,
   │              "exp": 1706016000
   │            })
   │
   └─→ base64url({
         "typ": "JWT",
         "alg": "HS256"
       })

Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
         eyJ1c2VyX2lkIjogMSwgInVzZXJuYW1lIjogImFkbWluIn0.
         SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## 6. Password Security Flow

```
┌──────────────────────────────────────────────────────────────┐
│         PASSWORD HASHING & VERIFICATION                      │
└──────────────────────────────────────────────────────────────┘

USER REGISTRATION (Password Storage):
   │
   ├─→ User submits: password = "MySecurePass123"
   │
   ├─→ Backend hashes password:
   │   set_password("MySecurePass123")
   │   │
   │   ├─→ from werkzeug.security import generate_password_hash
   │   ├─→ hash = generate_password_hash("MySecurePass123")
   │   │   // Returns: "pbkdf2:sha256:600000$abc123xyz$def456..."
   │   │   //
   │   │   // Format: algorithm:hash_algorithm:iterations$salt$hash
   │   │   //
   │   │   // Key Components:
   │   │   // - Algorithm: pbkdf2 (Password-Based Key Derivation)
   │   │   // - Hash: sha256 (Cryptographic hash function)
   │   │   // - Iterations: 600000 (security iterations)
   │   │   // - Salt: abc123xyz (random, unique per password)
   │   │   // - Hash: def456... (the actual hash)
   │   │
   │   └─→ Store hash in database.password_hash
   │       // NEVER STORE PLAIN TEXT PASSWORD!
   │
   └─→ Save to database

═══════════════════════════════════════════════════════════════════

USER LOGIN (Password Verification):
   │
   ├─→ User submits: password = "MySecurePass123"
   │
   ├─→ Retrieve hash from database:
   │   stored_hash = "pbkdf2:sha256:600000$abc123xyz$def456..."
   │
   ├─→ Backend verifies password:
   │   check_password("MySecurePass123", stored_hash)
   │   │
   │   ├─→ from werkzeug.security import check_password_hash
   │   ├─→ result = check_password_hash(stored_hash, "MySecurePass123")
   │   │   │
   │   │   // Process:
   │   │   // 1. Extract salt from stored hash: abc123xyz
   │   │   // 2. Hash user input with same salt: 600000 iterations
   │   │   // 3. Compare hashes
   │   │   │
   │   │   ├─→ ✗ Hashes don't match → Return False
   │   │   │   └─→ Wrong password, deny access
   │   │   │
   │   │   └─→ ✓ Hashes match → Return True
   │   │       └─→ Correct password, generate token
   │   │
   │   └─→ Proceed with token generation
   │
   └─→ User is authenticated

═══════════════════════════════════════════════════════════════════

WHY THIS IS SECURE:

✓ Cannot recover password from hash
✓ Random salt prevents rainbow tables
✓ Many iterations (600000) slow down attacks
✓ Different algorithms can be used
✓ Each password has unique salt
✓ Industry-standard PBKDF2-SHA256
```

---

## 7. Role-Based Access Control (RBAC) Matrix

```
╔════════════════════════════════════════════════════════════════╗
║              RBAC - WHO CAN DO WHAT?                          ║
╚════════════════════════════════════════════════════════════════╝

                    ADMIN    DEAF    BLIND
                    ────     ────    ─────
Access /admin-dashboard      ✓       ✗      ✗
Access /visual-mode (Deaf)   ✓       ✓      ✗
Access /audio-mode (Blind)   ✓       ✗      ✓
Access /select-role          ✓       ✓      ✓

API PERMISSIONS:
                    ADMIN    DEAF    BLIND
                    ────     ────    ─────
GET /api/auth/*             ✓       ✓      ✓
GET /api/admin/users        ✓       ✗      ✗
DELETE /api/admin/users     ✓       ✗      ✗
GET /api/admin/signs        ✓       ✗      ✗
POST /api/admin/signs       ✓       ✗      ✗
DELETE /api/admin/signs     ✓       ✗      ✗

Socket.IO Access:
                    ADMIN    DEAF    BLIND
                    ────     ────    ─────
process_frame               ✓       ✓      ✓
send_message                ✓       ✓      ✓
voice_to_sign               ✓       ✓      ✓
deaf_message                ✓       ✓      ✓

═══════════════════════════════════════════════════════════════════

ACCESS CONTROL FLOW:

User makes request to /api/admin/users
   │
   ├─→ @require_auth validates token
   │   ├─→ ✗ No token → 401 Unauthorized
   │   └─→ ✓ Valid token → Extract user role
   │
   ├─→ @require_role('Admin') checks role
   │   ├─→ ✗ Not Admin → 403 Forbidden
   │   └─→ ✓ Is Admin → Access granted
   │
   └─→ Route handler executes
       └─→ Return response
```

---

## 8. Component Relationship Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        App.jsx                                 │
│                   (Main Router)                                │
│                                                                │
│  Routes:                                                       │
│  / → SelectRole                                               │
│  /select-role → SelectRole                                    │
│  /login → Login                                               │
│  /admin-dashboard → ProtectedRoute(AdminDashboard, Admin)    │
│  /visual-mode → ProtectedRoute(DeafUser, Deaf)               │
│  /audio-mode → ProtectedRoute(BlindUser, Blind)              │
└────────────────────────────────────────────────────────────────┘
  │
  ├─→ ┌──────────────────────────────────────┐
  │   │       SelectRole.jsx                 │
  │   ├──────────────────────────────────────┤
  │   │ • Three role buttons                 │
  │   │ • Dark theme styling                 │
  │   │ • localStorage storage               │
  │   │ • Navigate to /login                 │
  │   └──────────────────────────────────────┘
  │         │
  │         └─→ localStorage['bridge_selected_role']
  │
  ├─→ ┌──────────────────────────────────────┐
  │   │       Login.jsx                      │
  │   ├──────────────────────────────────────┤
  │   │ • Username/Password inputs           │
  │   │ • Login & Register modes             │
  │   │ • Error handling                     │
  │   │ • Token storage                      │
  │   │ • Role-based navigation              │
  │   └──────────────────────────────────────┘
  │         │
  │         ├─→ POST /api/auth/login
  │         ├─→ POST /api/auth/register
  │         ├─→ localStorage['bridge_token']
  │         ├─→ localStorage['bridge_user']
  │         └─→ Navigate to role dashboard
  │
  ├─→ ┌──────────────────────────────────────┐
  │   │   AdminDashboard.jsx                 │
  │   ├──────────────────────────────────────┤
  │   │ • Users tab (view/delete)            │
  │   │ • Signs tab (add/delete)             │
  │   │ • Protected route check              │
  │   │ • Token-based API calls              │
  │   └──────────────────────────────────────┘
  │         │
  │         ├─→ GET /api/admin/users
  │         ├─→ DELETE /api/admin/users/<id>
  │         ├─→ GET /api/admin/signs
  │         ├─→ POST /api/admin/signs
  │         └─→ DELETE /api/admin/signs/<id>
  │
  ├─→ ┌──────────────────────────────────────┐
  │   │       DeafUser.jsx                   │
  │   │       (Visual Interface)             │
  │   ├──────────────────────────────────────┤
  │   │ • Protected route (Deaf role only)   │
  │   │ • Socket.IO with token               │
  │   └──────────────────────────────────────┘
  │
  ├─→ ┌──────────────────────────────────────┐
  │   │       BlindUser.jsx                  │
  │   │       (Audio Interface)              │
  │   ├──────────────────────────────────────┤
  │   │ • Protected route (Blind role only)  │
  │   │ • Socket.IO with token               │
  │   └──────────────────────────────────────┘
  │
  └─→ ┌──────────────────────────────────────┐
      │      ProtectedRoute Wrapper          │
      ├──────────────────────────────────────┤
      │ • Check token exists                 │
      │ • Validate token                     │
      │ • Check user role                    │
      │ • Redirect if unauthorized           │
      └──────────────────────────────────────┘

Legend:
─→ Imports/Uses
→ API Calls
localStorage Writes
```

---

## 9. Data Flow Diagram

```
User Registration/Login Data Flow:

Client Browser              Network              Server Database
─────────────              ───────              ───────────────

User Input         HTTP POST                   Parse Request
│                 ─────────────→ /api/auth/    │
│ username        │              login         │
│ password        │                            Validate Creds
│ role            │                            │
│                 │                            Hash Lookup
│                 │                            │
│                 │                            Compare Hash
│                 │                            ✓ Match
│                 │                            │
│                 │         Create JWT          Generate Token
│                 │←─────────────── HTTP 200    │
│ Response: {                                   │
│   token: JWT    │                            │
│   user: {}      │                            │
│ }               │                            │
│                 │                            │
Store Token      │
Store User       │
Navigate         │


Subsequent API Call Data Flow:

Client Browser              Network              Server Database
─────────────              ───────              ───────────────

Fetch Request    HTTP GET                      Receive Request
│                ─────────────→ /api/admin/    │
│ Authorization: │              users          Validate Token
│ Bearer JWT     │              Header: Auth   │
│ Content-Type   │              token          Extract Payload
│                │                            │
│                │                            Check Role
│                │                            ✓ Admin
│                │                            │
│                │                            Query DB
│                │                            SELECT * FROM user
│                │                            │
│                │                            Return Data
│ Response: {    │←─────────────── HTTP 200    │
│   success: true│                            │
│   users: [..]  │                            │
│ }              │                            │
│                │                            │
Render Table    │
Update UI       │
```

---

## 10. Security Layers Visualization

```
╔════════════════════════════════════════════════════════════════╗
║              MULTI-LAYER SECURITY ARCHITECTURE                ║
╚════════════════════════════════════════════════════════════════╝

Layer 1: Transport Security
┌─────────────────────────────────────────────────────────┐
│ ✓ HTTPS/TLS (in production)                             │
│ ✓ Secure WebSocket (wss://)                             │
│ ✓ Encrypted communication channel                       │
└─────────────────────────────────────────────────────────┘

Layer 2: Authentication
┌─────────────────────────────────────────────────────────┐
│ ✓ Username/Password required                            │
│ ✓ Password hashing (PBKDF2-SHA256)                      │
│ ✓ JWT tokens for session management                    │
│ ✓ Token expiration (7 days)                            │
└─────────────────────────────────────────────────────────┘

Layer 3: Authorization (RBAC)
┌─────────────────────────────────────────────────────────┐
│ ✓ Role-based route protection                          │
│ ✓ Decorator-based access control                       │
│ ✓ Per-endpoint role validation                         │
│ ✓ Self-delete prevention (last admin)                  │
└─────────────────────────────────────────────────────────┘

Layer 4: Input Validation
┌─────────────────────────────────────────────────────────┐
│ ✓ Username length validation                           │
│ ✓ Password strength requirements                       │
│ ✓ SQL injection prevention (ORM)                       │
│ ✓ XSS prevention (sanitized output)                    │
└─────────────────────────────────────────────────────────┘

Layer 5: Error Handling
┌─────────────────────────────────────────────────────────┐
│ ✓ Secure error messages (no data leakage)             │
│ ✓ Rate limiting (future)                              │
│ ✓ Failed attempt logging (future)                     │
│ ✓ Graceful error recovery                             │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

This authentication system uses a multi-layered approach:
1. **Strong password hashing** prevents database breaches
2. **JWT tokens** provide stateless authentication
3. **Role-based access control** enforces authorization
4. **Protected routes** prevent unauthorized access
5. **Token validation** on every protected request
6. **Socket.IO integration** maintains real-time capabilities

All components work together to create a **secure, scalable, and maintainable** authentication system for the AI Communication Bridge application.

---

**Last Updated**: 2024  
**Architecture Version**: 1.0  
**Status**: Production Ready ✅
