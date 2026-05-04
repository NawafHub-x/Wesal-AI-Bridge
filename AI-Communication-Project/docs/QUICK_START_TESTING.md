# Quick Start - Authentication System Testing

## ⚡ Quick Setup (5 minutes)

### Step 1: Start Backend
```bash
cd ai-bridge-backend
python app.py
```
✓ You should see: `Running on http://localhost:5000`

### Step 2: Start Frontend
```bash
cd ai-bridge-front
npm run dev
```
✓ You should see: `Local: http://localhost:5173`

### Step 3: Open Browser
Navigate to: `http://localhost:5173`

---

## 🧪 Test Flows

### Test 1: Login with Demo Account
1. **Page loads** → You see "Role Selection"
2. **Click "Admin" button** → Navigate to login
3. **Enter credentials**:
   - Username: `admin`
   - Password: `admin123`
4. **Click "Login"** → Should go to Admin Dashboard
5. **Verify**: Admin Dashboard shows users and signs

### Test 2: Register New Account
1. **From Login page** → Click "Create New Account"
2. **Select Deaf role** first (in role selection)
3. **Enter new credentials**:
   - Username: `test_user`
   - Password: `test123`
4. **Click "Create New Account"**
5. **Verify**: Logged in and at `/visual-mode` dashboard

### Test 3: Manage Users (Admin Only)
1. **Log in as admin** → Go to Admin Dashboard
2. **Click "Users" tab**
3. **Verify**:
   - See all users listed
   - Can see user details (ID, username, role, date created)
4. **Try to delete a user**:
   - Click "Delete" on any non-admin user
   - Confirm deletion
   - User disappears from list
5. **Try to delete last admin**:
   - Click "Delete" on admin user
   - Button should be disabled (greyed out)

### Test 4: Manage Sign Library (Admin Only)
1. **Log in as admin** → Go to Admin Dashboard
2. **Click "Signs" tab**
3. **Add a new sign**:
   - Symbol: `hello`
   - Meaning: `A greeting gesture`
   - Click "Add Sign"
4. **Verify**: New sign appears in table below
5. **Delete a sign**:
   - Click "Delete" on any sign
   - Confirm deletion
   - Sign disappears

### Test 5: Role-Based Access Control
1. **Log in as Deaf user**
2. **Try accessing admin dashboard**:
   - URL: `http://localhost:5173/admin-dashboard`
   - Should be redirected to login page
3. **Log in as admin**
4. **Go to visual mode** (deaf interface):
   - URL: `http://localhost:5173/visual-mode`
   - Should work (Admin can access any interface)

### Test 6: Protected Routes
1. **Without logging in**:
   - Try visiting `/admin-dashboard` → Redirects to `/login`
   - Try visiting `/visual-mode` → Redirects to `/login`
   - Try visiting `/audio-mode` → Redirects to `/login`
2. **After logging in**:
   - All protected routes should work
   - Role-specific routes should be accessible

### Test 7: Token Persistence
1. **Log in as admin**
2. **Open browser DevTools** (F12)
3. **Go to Application → Local Storage**
4. **Verify**:
   - `bridge_token` is set (JWT token)
   - `bridge_user` contains user JSON
   - `bridge_selected_role` contains role
5. **Refresh page** (F5)
6. **Verify**: Still logged in, dashboard intact

### Test 8: Logout
1. **From any dashboard**
2. **Click "Logout" button**
3. **Verify**:
   - Redirected to `/select-role`
   - localStorage cleared
   - Cannot access previous dashboard without logging in again

### Test 9: Socket.IO Connection
1. **Log in as Deaf user**
2. **Go to visual-mode dashboard**
3. **Open browser Console** (F12 → Console)
4. **Verify**:
   - No error messages
   - Socket.IO connects successfully
   - Can send/receive messages if communication partner available

---

## 🐛 Debug Checklist

### Before Testing
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] No CORS errors in browser console
- [ ] SQLite database file exists in backend folder

### If Login Fails
- [ ] Check backend console for errors
- [ ] Verify correct username: `admin`
- [ ] Verify correct password: `admin123`
- [ ] Try clearing localStorage: `localStorage.clear()` in console
- [ ] Restart both backend and frontend

### If Admin Dashboard Won't Load
- [ ] Check token in localStorage (F12 → Storage)
- [ ] Verify user role is "Admin"
- [ ] Check backend console for 401/403 errors
- [ ] Try logging out and back in

### If Users/Signs Table Empty
- [ ] Check backend database file exists
- [ ] Try adding a new user/sign
- [ ] Check backend logs for database errors
- [ ] Verify API responses in Network tab (F12)

---

## 🔍 Network Testing (F12 Developer Tools)

### Check API Calls
1. **Open DevTools** → Network tab
2. **Log in** → Watch for requests:
   - `POST /api/auth/login` → Should return 200 with token
3. **Go to Admin Dashboard** → Watch for:
   - `GET /api/admin/users` → Should return 200 with users array
   - `GET /api/admin/signs` → Should return 200 with signs array
4. **Add a sign** → Watch for:
   - `POST /api/admin/signs` → Should return 200 with new sign
5. **Delete item** → Watch for:
   - `DELETE /api/admin/.../<id>` → Should return 200

### Check Response Headers
1. Click any API request
2. Go to "Response" tab
3. Verify:
   - Success: `"success": true`
   - Data is returned correctly
   - No error messages

---

## 📊 Test Data Fixtures

### Pre-created Users
- Admin User:
  - Username: `admin`
  - Password: `admin123`
  - Role: Admin

### Sample Signs (if any exist)
- Check Admin Dashboard → Signs tab to see existing signs

### Creating Test Users
1. Use registration flow to create:
   - Deaf User: `deaf_user / test123`
   - Blind User: `blind_user / test123`
   - Admin User: `admin2 / admin456`

---

## ✅ Success Indicators

After successful implementation:
- ✓ Can log in with admin credentials
- ✓ Admin dashboard loads without errors
- ✓ Can view users in table format
- ✓ Can add and delete signs
- ✓ Role-based access works (can't access admin as non-admin)
- ✓ Logout clears session
- ✓ Protected routes redirect to login when unauthorized
- ✓ Socket.IO connects with token
- ✓ No console errors related to auth

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 401 Unauthorized on API calls | Token missing or expired. Re-login. |
| CORS error in console | Backend CORS not configured. Check app.py. |
| Admin dashboard won't load | Not an Admin user. Log in as admin. |
| Blank user/signs table | API not returning data. Check backend logs. |
| Token not persisting | localStorage disabled. Check browser settings. |
| Socket.IO connection failed | Token not passed. Check socket.js. |
| "Last admin cannot be deleted" | Design feature. Create another admin first. |

---

## 📞 Emergency Procedures

### Reset Everything
```bash
# In backend directory
rm *.db  # Delete database

# Restart backend
python app.py
# Will recreate fresh database with admin user

# Clear frontend localStorage
# In browser console:
localStorage.clear()

# Refresh page
```

### Test Default Credentials
- If you forgot credentials, use default:
- Username: `admin`
- Password: `admin123`

---

## 📋 Testing Checklist (Print This!)

```
Authentication Tests:
□ Demo login works (admin/admin123)
□ New user registration works
□ Wrong password shows error
□ Empty fields show error

Admin Dashboard:
□ Admin can access /admin-dashboard
□ Non-admin cannot access /admin-dashboard
□ Users table shows users
□ Can delete non-admin user
□ Cannot delete last admin
□ Can add sign to library
□ Can delete sign from library
□ Signs appear immediately after add

Role-Based Access:
□ Deaf user sees /visual-mode
□ Blind user sees /audio-mode
□ Admin user sees /admin-dashboard
□ Cannot access other role's interface

Session Management:
□ Token persists after refresh
□ Logout clears localStorage
□ After logout, cannot access protected routes
□ Can log in again after logout

Socket.IO:
□ Socket connects after login
□ No connection errors in console
□ Can send/receive messages (if partner available)

Edge Cases:
□ Very long username works
□ Special characters in password work
□ Rapid clicks don't cause issues
□ Multiple browsers work independently
```

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Ready for Production Testing ✅
