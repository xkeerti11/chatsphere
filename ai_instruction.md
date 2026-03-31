# AI Build Instructions — ChatSphere
# AI se ChatSphere kaise banvayein — Complete Guide

---

## 1. Golden Rules

### Rule 1: Ek Kaam Ek Baar
**Kabhi mat kaho:** "Pura chat app banao"  
**Hamesha kaho:** "Register API route banao" ya "Login form component banao"

### Rule 2: Context Hamesha Do
Har prompt mein batao:
- Kaunsi technology use ho rahi hai (Next.js, Prisma, etc.)
- Kaunsa file/folder mein code chahiye
- Pehle se kya bana hua hai

### Rule 3: Error Copy-Paste Karo
Agar error aaye:
```
"Yeh error aa raha hai: [PURA ERROR MESSAGE PASTE KAR]
Mera current code yeh hai: [CODE PASTE KAR]
Isko fix karo."
```

### Rule 4: Pehle Test, Phir Aage
Authentication ke baad: pehle Postman se test karo  
Phir hi friend system banvao

### Rule 5: Small Steps
Bade features ko tod do:
- ❌ "Messaging system banao"
- ✅ "Database mein message save karne ka API route banao"
- ✅ "Phir Socket.IO se real-time delivery banao"
- ✅ "Phir frontend mein message list component banao"

---

## 2. Recommended AI Tools

| Tool | Best For | Link |
|------|---------|------|
| **Cursor AI** | Full file editing, multi-file context | cursor.sh |
| **Claude (Anthropic)** | Architecture, debugging, complex logic | claude.ai |
| **GitHub Copilot** | Inline code completion | github.com/copilot |
| **ChatGPT** | Quick questions, explanations | chatgpt.com |

**Recommendation:** Cursor AI use karo primary tool ki tarah. Claude se architecture aur tricky bugs discuss karo.

---

## 3. Phase-wise AI Prompts

---

### PHASE 1: Project Setup

**Prompt 1.1 — Next.js Setup:**
```
Create a new Next.js 14 project with App Router and TypeScript. 
Set up:
- Tailwind CSS
- ESLint
- Folder structure for a chat app with:
  - /app/api/ for API routes
  - /components/ for React components
  - /lib/ for utilities
  - /prisma/ for database schema

Show me the complete folder structure and package.json dependencies I need.
```

**Prompt 1.2 — Prisma + Neon Setup:**
```
I'm building a chat app with Next.js 14 and PostgreSQL on Neon.
Set up Prisma ORM with this schema:

Models needed:
1. User (id, email, password, username, displayName, profilePic, bio, isVerified, verifyToken, verifyTokenExpiry, isOnline, lastSeen, createdAt, updatedAt)
2. FriendRequest (id, senderId, receiverId, status enum[pending/accepted/rejected], createdAt, updatedAt)
3. Message (id, senderId, receiverId, text, fileUrl, fileType, isRead, seenAt, createdAt)
4. Story (id, userId, mediaUrl, mediaType, caption, expiresAt, createdAt)

Give me:
- Complete schema.prisma file
- lib/prisma.ts singleton file
- Commands to run
```

---

### PHASE 2: Authentication

**Prompt 2.1 — Register API:**
```
I'm using Next.js 14 App Router with Prisma and PostgreSQL.
Create POST /api/auth/register route that:
- Accepts: email, username, password
- Validates: email format, username (3-20 chars, alphanumeric), password (min 8 chars)
- Hashes password with bcrypt (salt rounds: 12)
- Checks if email/username already exists
- Saves user to DB (isVerified: false)
- Generates a verification token
- Sends verification email using Nodemailer with Gmail SMTP
- Returns success/error JSON response

Environment variables available: DATABASE_URL, JWT_SECRET, EMAIL_USER, EMAIL_PASS
Show complete route.ts file.
```

**Prompt 2.2 — Login API:**
```
Using Next.js 14, Prisma, bcryptjs, jsonwebtoken.
Create POST /api/auth/login route:
- Accepts: email, password
- Finds user by email in DB
- Checks if isVerified is true (error if not)
- Compares password with bcrypt
- Generates JWT token (expires in 7d)
- Returns token and user object (without password)
- Proper error handling with status codes

Also create lib/jwt.ts with generateToken() and verifyToken() helpers.
```

**Prompt 2.3 — Auth Middleware:**
```
Create a reusable authentication middleware for Next.js 14 API routes.
File: lib/middleware.ts

It should:
- Extract Bearer token from Authorization header
- Verify JWT token
- Find user in DB via Prisma
- Return user object if valid
- Return error object with status code if invalid

Usage in API routes:
const { user, error, status } = await authenticate(request)
if (error) return NextResponse.json({ error }, { status })
```

**Prompt 2.4 — Login Form (Frontend):**
```
Create a React login form component for Next.js 14 with Tailwind CSS.
File: components/auth/LoginForm.tsx

Requirements:
- Email and password inputs
- Show/hide password toggle
- Form validation (client-side)
- Submit calls POST /api/auth/login
- Shows loading spinner on button while submitting
- Success: saves token to localStorage, redirects to /chat
- Error: shows error toast using react-hot-toast
- Mobile responsive
- Clean, minimal design with purple accent color (#6C63FF)
```

---

### PHASE 3: Friend System

**Prompt 3.1 — Friend Requests API:**
```
Next.js 14, Prisma PostgreSQL, JWT auth middleware available at lib/middleware.ts

Create these API routes:

1. POST /api/friends/send
   - Auth required
   - Body: { receiverId }
   - Creates FriendRequest with status: pending
   - Error if already sent or already friends

2. POST /api/friends/respond  
   - Auth required
   - Body: { requestId, action: 'accept' | 'reject' }
   - Updates FriendRequest status
   - Only receiver can respond

3. GET /api/friends/list
   - Auth required
   - Returns all accepted friends with online status

4. GET /api/friends/requests
   - Auth required
   - Returns pending received requests with sender info

Show all 4 route.ts files.
```

**Prompt 3.2 — User Search:**
```
Next.js 14 API route.
Create GET /api/users/search route:
- Query param: username (min 2 chars)
- Auth required
- Search users by username (case-insensitive, partial match)
- For each result, include friend status with current user:
  none / pending_sent / pending_received / accepted
- Exclude current user from results
- Return max 10 results
```

---

### PHASE 4: Real-time Chat

**Prompt 4.1 — Message API:**
```
Next.js 14, Prisma.
Create these API routes:

1. GET /api/messages/[userId]
   - Auth required
   - Path param: userId (the other user)
   - Returns messages between current user and userId
   - Order: oldest first
   - Check: both users must be friends
   - Include pagination (page, limit query params)

2. POST /api/messages/send
   - Auth required
   - Body: { receiverId, text?, fileUrl?, fileType? }
   - Validate: at least text or fileUrl must be provided
   - Save to DB
   - Return created message

3. PUT /api/messages/seen/[senderId]
   - Auth required
   - Mark all messages from senderId as read
   - Set seenAt = current time
```

**Prompt 4.2 — Socket.IO Server:**
```
Create a Socket.IO server (Node.js) for a chat app.
File: socket-server/index.js

Features needed:
- CORS configured for frontend URL (from env CLIENT_URL)
- Track connected users: Map of userId -> socketId
- Events to handle:
  * 'join' ({ userId }) - user connects, update map
  * 'send_message' ({ to, message }) - relay to receiver if online
  * 'typing' ({ to, isTyping }) - typing indicator
  * 'seen' ({ messageId, to }) - seen notification
  * 'disconnect' - remove from map

Use environment variable PORT for the port.
Include package.json dependencies.
```

**Prompt 4.3 — Chat UI:**
```
Next.js 14, Tailwind CSS, Socket.IO client, axios.
Create the main chat page: app/chat/page.tsx

Layout:
- Left sidebar (300px): friends list with last message preview
- Right panel: chat window with selected friend

Chat window includes:
- Header: friend avatar, name, online status
- Messages area (scrollable, oldest at top)
- Sent messages: right-aligned, purple background
- Received messages: left-aligned, gray background
- Timestamps below messages
- Input bar: file attach button + text input + send button

Features:
- Load messages from GET /api/messages/[friendId]
- Send message via POST + Socket.IO emit
- Receive messages via socket.on('receive_message')
- Auto-scroll to newest message
- Mobile responsive (sidebar hides on mobile)

Use lucide-react for icons.
```

---

### PHASE 5: File Sharing

**Prompt 5.1 — Upload API:**
```
Next.js 14 API route + Cloudinary.
Create POST /api/upload route:

Requirements:
- Accept multipart/form-data with 'file' field
- Auth required
- Validate: max 5MB size
- Validate: allowed types = jpg, jpeg, png, gif, pdf, doc, docx
- Upload to Cloudinary using cloudinary SDK
- Return: { url, fileType, size }

Also create lib/cloudinary.ts with uploadFile() helper.
Environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

Show complete route.ts and cloudinary.ts files.
```

---

### PHASE 6: Stories

**Prompt 6.1 — Stories Feature:**
```
Next.js 14, Prisma.
Create stories feature:

1. POST /api/stories/upload
   - Auth required
   - Body: { mediaUrl, mediaType, caption? }
   - Set expiresAt = current time + 24 hours
   - Save to Story table

2. GET /api/stories/feed
   - Auth required
   - Get current user's friends list
   - For each friend, get their non-expired stories
   - Filter: expiresAt > now()
   - Group by user
   - Return: array of { user, stories[] }

Also create the StoryBar component (horizontal scroll, circular thumbnails) and StoryViewer (full-screen overlay with progress bar).
```

---

### PHASE 7: UI Polish

**Prompt 7.1 — Settings Page:**
```
Next.js 14, Tailwind CSS.
Create app/settings/page.tsx with:

1. Profile section:
   - Current profile pic with click-to-change
   - File upload triggers /api/upload, then updates profile
   - Edit username, displayName, bio
   - Save button → PUT /api/users/profile

2. Password section:
   - Current password, new password, confirm new password
   - Submit → PUT /api/users/change-password
   - Show success/error toast

3. Logout button (red) at bottom
   - Clear localStorage token
   - Redirect to /login

Auth: read token from localStorage, add to all API calls.
```

---

## 4. Debugging Prompts

**When API returns 500:**
```
My Next.js API route is returning 500 error. Here's the full error from Vercel logs:
[PASTE ERROR]

Here's my route.ts file:
[PASTE CODE]

What's wrong and how to fix it?
```

**When Prisma query fails:**
```
Getting this Prisma error:
[PASTE ERROR]

My schema.prisma:
[PASTE SCHEMA]

My query code:
[PASTE CODE]

How to fix this query?
```

**When Socket.IO not connecting:**
```
Socket.IO is not connecting. 
Frontend code: [PASTE]
Socket server code: [PASTE]
Browser console error: [PASTE]
CORS settings: [PASTE]

What's the issue?
```

---

## 5. Code Review Prompts

**Security Review:**
```
Review this API route for security issues:
[PASTE CODE]

Check for:
- Input validation
- SQL injection
- Auth bypass possibilities
- Sensitive data exposure
```

**Performance Review:**
```
Review these Prisma queries for performance:
[PASTE CODE]

Suggest optimizations like:
- Adding indexes
- Reducing N+1 queries
- Pagination
```

---

## 6. Quick Reference Commands

```bash
# Development
npm run dev                    # Local server start
npx prisma studio             # Database GUI
npx prisma db push            # Schema changes apply

# Testing API
# Postman ya curl se test karo

# Deployment
git add . && git commit -m "feat: add messaging" && git push
# Vercel auto-deploys

# Database Reset (careful!)
npx prisma db push --force-reset
```

---

## 7. Common Mistakes to Avoid

| Mistake | Correct Approach |
|---------|-----------------|
| Ek prompt mein sara project banvana | Phase-wise, feature-wise banvao |
| Frontend validation par hi depend karna | Hamesha server-side bhi validate karo |
| JWT secret hardcode karna | Environment variables use karo |
| Prisma client multiple instances | Singleton pattern use karo (lib/prisma.ts) |
| Error messages ignore karna | Pura error AI ko dikhao |
| Deploy karne ke baad test nahi karna | Har deploy ke baad checklist follow karo |
| Socket aur HTTP ko mix up karna | Messages save = HTTP, deliver = Socket |
| `.env.local` GitHub par push karna | `.gitignore` mein zaroor add karo |
