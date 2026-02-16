# 🎯 Authentication Implementation Goals

Complete checklist for implementing authentication, sessions, and security in RentLedger.

---

## Phase 1: Core Authentication Setup

### Redis Configuration
- [ ] Install Redis client (`npm install ioredis`)
- [ ] Create Redis connection utility (`lib/redis.ts`)
- [ ] Configure Redis URL in `.env.local`
- [ ] Test Redis connection

### Bcrypt Configuration
- [x] Extract salt rounds to environment variable
- [x] Create bcrypt utility with configurable rounds
- [x] Update signup action to use config
- [x] Document password requirements

### Login Implementation
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Create login form component (`login-form.tsx`)
- [ ] Create login server action (`actions.ts`)
  - [ ] Email/password validation
  - [ ] User lookup
  - [ ] Password verification with bcrypt
  - [ ] Session creation
  - [ ] Cookie setting
- [ ] Add toast notifications
- [ ] Add loading states

### Session Management
- [ ] Create session utilities (`lib/session.ts`)
  - [ ] `createSession(userId)` - Generate session ID & store in Redis
  - [ ] `getSession(sessionId)` - Retrieve session from Redis
  - [ ] `validateSession(sessionId)` - Check if valid
  - [ ] `destroySession(sessionId)` - Delete from Redis
  - [ ] `refreshSession(sessionId)` - Extend TTL
- [ ] Set session expiry (e.g., 7 days)
- [ ] Implement session refresh on activity

### Logout Functionality
- [ ] Create logout server action
- [ ] Delete session from Redis
- [ ] Clear session cookie
- [ ] Add logout button to UI
- [ ] Redirect to login after logout

---

## Phase 2: Protection & Authorization

### Middleware Implementation
- [ ] Create `middleware.ts` in project root
- [ ] Implement session validation
- [ ] Define protected routes
- [ ] Define public routes (login, signup)
- [ ] Redirect unauthenticated users to login
- [ ] Redirect authenticated users away from login/signup

### Auth Utilities
- [ ] Create `lib/auth.ts` helper file
  - [ ] `getCurrentUser()` - Get user from session
  - [ ] `requireAuth()` - Throw if not authenticated
  - [ ] `getUserRole()` - Get user's role
  - [ ] `requireRole(role)` - Check role permission
- [ ] Type definitions for User, Session, AuthState

### Role Assignment
- [ ] Update signup to assign default role
- [ ] Create UserRole on user creation
- [ ] Add role selection during signup (optional)
- [ ] Store role in session data

### Role-Based Access
- [ ] Create role constants (`types/roles.ts`)
- [ ] Implement role checking middleware
- [ ] Create role-specific redirects
- [ ] Add role to session payload

---

## Phase 3: Security Enhancements

### Cookie Security
- [ ] Set `httpOnly: true`
- [ ] Set `secure: true` (production)
- [ ] Set `sameSite: 'lax'` or `'strict'`
- [ ] Set proper domain
- [ ] Set proper path
- [ ] Implement cookie signing/encryption

### Environment Variables
- [ ] `REDIS_URL` - Redis connection string
- [ ] `SESSION_SECRET` - For signing sessions
- [ ] `BCRYPT_SALT_ROUNDS` - Default 10
- [ ] `SESSION_TTL` - Session expiry time
- [ ] `NODE_ENV` - Environment detection

### Rate Limiting (Optional but Recommended)
- [ ] Install rate limiting library
- [ ] Implement login rate limiting
- [ ] Implement signup rate limiting
- [ ] Add rate limit error messages
- [ ] Configure limits (e.g., 5 attempts per 15 min)

### Input Validation
- [ ] Server-side email validation
- [ ] Server-side password validation
- [ ] Sanitize user inputs
- [ ] Prevent SQL injection (Prisma handles this)
- [ ] XSS protection

---

## Phase 4: User Experience

### Protected Routes
- [ ] Create landlord dashboard
- [ ] Create tenant dashboard
- [ ] Create admin panel
- [ ] Add navigation based on role
- [ ] Implement 404 for invalid routes

### Auth UI Components
- [ ] Loading spinner for form submission
- [ ] Error display components
- [ ] Success messages
- [ ] Password strength indicator
- [ ] "Remember me" checkbox (extended TTL)
- [ ] "Forgot password" link (future)

### Navigation & Layout
- [ ] Add user menu (profile, logout)
- [ ] Show user name in header
- [ ] Role badge display
- [ ] Conditional navigation items by role

---

## Phase 5: Testing & Validation

### Manual Testing Checklist
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test session persistence across page reloads
- [ ] Test session expiry
- [ ] Test protected route access
- [ ] Test role-based access
- [ ] Test invalid credentials
- [ ] Test duplicate signup
- [ ] Test middleware redirects

### Edge Cases
- [ ] Expired session handling
- [ ] Invalid session ID handling
- [ ] Concurrent logins (same user, multiple devices)
- [ ] Redis connection failure handling
- [ ] Database connection failure handling

---

## Phase 6: Documentation

- [ ] Document auth flow in README
- [ ] Document environment variables
- [ ] Document role permissions
- [ ] Create API documentation for auth actions
- [ ] Add code comments for complex logic

---

## 📊 Progress Tracking

**Phase 1**: ☐☐☐☐☐ (0/5)  
**Phase 2**: ☐☐☐☐ (0/4)  
**Phase 3**: ☐☐☐☐ (0/4)  
**Phase 4**: ☐☐☐ (0/3)  
**Phase 5**: ☐☐ (0/2)  
**Phase 6**: ☐ (0/1)  

**Overall Progress**: 0% (0/19 major items)

---

## 🔥 Priority Order (Start Here)

1. ✅ **Redis Setup** - Foundation for sessions
2. ✅ **Login Page** - Users need to log in!
3. ✅ **Session Management** - Store/retrieve sessions
4. ✅ **Logout** - Complete the auth cycle
5. ✅ **Middleware** - Protect your routes
6. ✅ **Dashboard** - Landing page after login

---

## 📝 Notes

- Mark items with `[x]` as you complete them
- Add dates next to completed items if helpful
- Add notes/blockers under items as needed
- Update progress percentages weekly

**Example:**
```markdown
- [x] Install Redis client - 2026-02-05
  - Used ioredis@5.3.0
  - Tested connection successfully
```
