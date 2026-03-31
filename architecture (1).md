# Architecture — ChatSphere

---

## 1. System Overview

ChatSphere ek monolithic Next.js application hai jisme frontend aur backend dono ek saath hain. Real-time messaging ke liye ek alag Socket.IO server hai.

```
┌─────────────────────────────────────────┐
│           User's Browser                │
│  Next.js Frontend (React Components)    │
│  - HTTP requests → API Routes           │
│  - WebSocket → Socket Server            │
└──────────┬──────────────────┬───────────┘
           │ HTTPS            │ WebSocket
           ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│  Next.js Server  │  │  Socket.IO Server │
│  (Vercel)        │  │  (Railway/Render) │
│  API Routes      │  │  Real-time Events │
└──────────┬───────┘  └──────────┬───────┘
           │ Prisma ORM          │ In-memory
           ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL DB   │  │   Connected Users │
│  (Neon)          │  │   Map/Room Store  │
└──────────────────┘  └──────────────────┘
           │
           ▼
┌──────────────────┐
│   Cloudinary     │
│  (File Storage)  │
└──────────────────┘
```

---

## 2. Request Flow

### 2.1 HTTP Request Flow (Normal API)

```
User Action (click/submit)
        ↓
React Component
        ↓
axios/fetch call to /api/...
        ↓
Next.js API Route (route.ts)
        ↓
JWT Middleware (token verify)
        ↓
Business Logic
        ↓
Prisma Query to PostgreSQL
        ↓
JSON Response
        ↓
React State Update
        ↓
UI Re-render
```

---

### 2.2 Real-time Message Flow

```
User A types message + clicks Send
        ↓
React sends HTTP POST /api/messages/send
        ↓
API Route: message save in DB via Prisma
        ↓
API Route: emit 'send_message' to Socket Server
        ↓
Socket Server: find User B's socket ID
        ↓
Socket Server: emit 'receive_message' to User B
        ↓
User B's browser receives message
        ↓
User B's React state updates
        ↓
Message appears instantly in chat window
```

---

### 2.3 File Upload Flow

```
User selects file (< 5MB)
        ↓
Frontend validates: size + type
        ↓
FormData POST to /api/upload
        ↓
API Route validates again (server-side)
        ↓
Cloudinary SDK upload
        ↓
Cloudinary returns public URL
        ↓
URL included in message POST /api/messages/send
        ↓
Message saved with fileUrl in DB
        ↓
Real-time delivery via Socket
```

---

## 3. Components

### 3.1 Frontend Components

```
app/
├── (auth)/                    # Auth pages (no header/sidebar)
│   ├── login/page.tsx         # Login form
│   └── register/page.tsx      # Signup form
├── page.tsx                   # Home / Friends list
├── chat/page.tsx              # Chat page
├── stories/page.tsx           # Stories page
└── settings/page.tsx          # Settings page

components/
├── auth/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── chat/
│   ├── ChatSidebar.tsx        # Left panel: friends list
│   ├── ChatWindow.tsx         # Right panel: messages
│   ├── MessageBubble.tsx      # Individual message
│   └── MessageInput.tsx       # Input bar + file upload
├── story/
│   ├── StoryBar.tsx           # Horizontal story thumbnails
│   └── StoryViewer.tsx        # Full-screen story view
├── friends/
│   ├── FriendSearch.tsx       # Search users component
│   └── FriendRequest.tsx      # Accept/reject UI
└── ui/
    ├── Avatar.tsx             # Reusable avatar component
    ├── Button.tsx             # Reusable button
    ├── Input.tsx              # Reusable input
    └── Toast.tsx              # Notifications
```

---

### 3.2 Backend Components

```
app/api/
├── auth/
│   ├── register/route.ts      # POST: User signup
│   ├── login/route.ts         # POST: User login
│   ├── verify/route.ts        # POST: Email verify
│   └── me/route.ts            # GET: Current user
├── users/
│   ├── search/route.ts        # GET: Search by username
│   ├── profile/route.ts       # PUT: Update profile
│   └── change-password/route.ts
├── friends/
│   ├── send/route.ts          # POST: Send request
│   ├── respond/route.ts       # POST: Accept/reject
│   ├── list/route.ts          # GET: Friends list
│   └── requests/route.ts      # GET: Pending requests
├── messages/
│   ├── [userId]/route.ts      # GET: Chat history
│   ├── send/route.ts          # POST: Send message
│   └── seen/[senderId]/route.ts
├── stories/
│   ├── upload/route.ts        # POST: Upload story
│   └── feed/route.ts          # GET: Friends' stories
└── upload/route.ts            # POST: File upload

lib/
├── prisma.ts                  # Prisma client singleton
├── jwt.ts                     # JWT create/verify helpers
├── cloudinary.ts              # Cloudinary upload helper
├── email.ts                   # Nodemailer email sender
└── middleware.ts              # Auth middleware helper

socket/
└── server.ts                  # Socket.IO server
```

---

### 3.3 Socket.IO Server

```javascript
// socket/server.ts - Basic Structure

const connectedUsers = new Map()  // userId → socketId

io.on('connection', (socket) => {
  
  socket.on('join', ({ userId }) => {
    connectedUsers.set(userId, socket.id)
    // Update isOnline in DB
  })

  socket.on('send_message', ({ to, message }) => {
    const receiverSocketId = connectedUsers.get(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', message)
    }
  })

  socket.on('typing', ({ to, isTyping }) => {
    const receiverSocketId = connectedUsers.get(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { from: socket.userId, isTyping })
    }
  })

  socket.on('disconnect', () => {
    connectedUsers.delete(userId)
    // Update isOnline = false in DB
  })
})
```

---

## 4. State Management

### Frontend State (Zustand)

```javascript
// stores/useAuthStore.ts
{
  user: User | null,
  token: string | null,
  setUser: (user) => void,
  logout: () => void
}

// stores/useChatStore.ts
{
  selectedFriend: User | null,
  messages: Message[],
  friends: User[],
  setSelectedFriend: (friend) => void,
  addMessage: (message) => void,
  setMessages: (messages) => void
}

// stores/useSocketStore.ts
{
  socket: Socket | null,
  isConnected: boolean,
  initSocket: (userId) => void
}
```

---

## 5. Authentication Flow

```
1. User registers → password bcrypt hash → save to DB (unverified)
2. Verification email bheja jata hai (unique token, 24h expiry)
3. User link click karta hai → token validate → isVerified = true
4. Login → credentials verify → JWT token generate (7 day)
5. Token localStorage mein save hota hai
6. Har API request mein: Authorization: Bearer <token>
7. API Route mein middleware token verify karta hai
8. Invalid/expired token → 401 Unauthorized → logout
```

---

## 6. Data Flow Diagram

```
┌──────┐  register()   ┌─────────────┐  prisma.create()  ┌──────┐
│      │ ──────────── ▶ │  /api/auth  │ ─────────────── ▶ │  DB  │
│      │               │  /register  │                    │      │
│      │               └─────────────┘                    └──────┘
│  UI  │
│      │  login()      ┌─────────────┐  findUnique()      ┌──────┐
│      │ ──────────── ▶ │  /api/auth  │ ─────────────── ▶ │  DB  │
│      │               │  /login     │ ◀─────────────── ─ │      │
│      │ ◀ JWT token ─ └─────────────┘   user object      └──────┘
└──────┘
```

---

## 7. Error Handling Strategy

| Layer | What | How |
|-------|------|-----|
| Frontend | Network errors | try/catch, toast notification |
| Frontend | Validation | Zod schema validation before API call |
| API Route | Auth errors | 401 response, redirect to login |
| API Route | Validation | 400 response with error message |
| API Route | DB errors | Caught, 500 response |
| Socket | Disconnect | Auto-reconnect with backoff |
| Socket | Message fail | Retry mechanism |
