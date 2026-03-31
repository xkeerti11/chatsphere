# Security Guide — ChatSphere

---

## 1. Security Overview

ChatSphere mein multiple security layers hain jo user data aur communication ko protect karti hain. Yeh document har layer ko detail mein explain karta hai.

---

## 2. Authentication Security

### 2.1 Password Hashing (bcrypt)

User ka plain-text password kabhi database mein save nahi hota. bcrypt algorithm use hota hai:

```typescript
// lib/auth.ts

import bcrypt from 'bcryptjs'

// Password hash karo (register ke waqt)
const SALT_ROUNDS = 12
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Password verify karo (login ke waqt)
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

**Why bcrypt?**
- Slow algorithm by design — brute force attacks bahut time lagta hai
- Salt automatically add hota hai — same password ke alag hashes bante hain
- Work factor (12) — future mein increase kar sakte ho

---

### 2.2 JWT (JSON Web Tokens)

```typescript
// lib/jwt.ts

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = '7d'

// Token generate karo
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Token verify karo
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null  // Invalid ya expired token
  }
}
```

**JWT Security Rules:**
- Secret key min 32 characters, random hona chahiye
- Expiry 7 days (balance between UX aur security)
- Token sirf userId contain karta hai (sensitive info nahi)
- HTTPS ke through hi bheja jata hai

---

### 2.3 Auth Middleware

```typescript
// lib/middleware.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'
import { prisma } from './prisma'

export async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 }
  }

  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  
  if (!decoded) {
    return { error: 'Invalid or expired token', status: 401 }
  }

  const user = await prisma.user.findUnique({ 
    where: { id: decoded.userId },
    select: { id: true, email: true, username: true, isVerified: true }
  })

  if (!user) {
    return { error: 'User not found', status: 401 }
  }

  if (!user.isVerified) {
    return { error: 'Email not verified', status: 403 }
  }

  return { user }
}
```

---

## 3. Input Validation & Sanitization

### 3.1 Server-side Validation

**Kabhi bhi sirf frontend validation par depend mat karo.** Har API route par server-side validate karo:

```typescript
// Example: Register route validation

function validateRegisterInput(data: any) {
  const errors: string[] = []
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Valid email is required')
  }
  
  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!data.username || !usernameRegex.test(data.username)) {
    errors.push('Username must be 3-20 chars, alphanumeric and underscore only')
  }
  
  // Password validation
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  return errors
}
```

---

### 3.2 SQL Injection Prevention

Prisma ORM use karne se SQL injection automatically prevent hoti hai. **Kabhi bhi raw SQL queries mein user input inject mat karo:**

```typescript
// ❌ WRONG - SQL injection vulnerable
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${email}'
`

// ✅ CORRECT - Prisma parameterized query (safe)
const user = await prisma.user.findUnique({
  where: { email: email }
})
```

---

### 3.3 XSS (Cross-Site Scripting) Prevention

```typescript
// Message text ko sanitize karo
import DOMPurify from 'isomorphic-dompurify'

function sanitizeText(text: string): string {
  // HTML tags remove karo
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

// Use karo before saving to DB
const cleanText = sanitizeText(messageText)
```

---

## 4. File Upload Security

### 4.1 File Validation

```typescript
// app/api/upload/route.ts

const ALLOWED_TYPES = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB in bytes

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File size exceeds 5MB' }, { status: 400 })
  }
  
  // Type check (MIME type)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }
  
  // Magic bytes check (actual file content verify karo, not just extension)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  // JPEG check: starts with FF D8 FF
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
  // PNG check: starts with 89 50 4E 47
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50
  // PDF check: starts with 25 50 44 46
  const isPDF = bytes[0] === 0x25 && bytes[1] === 0x50
  
  // Cloudinary upload karo (safe URL milega)
  // ...
}
```

---

## 5. Authorization Checks

### 5.1 Resource Ownership Verification

**Hamesha verify karo ki user apna hi data access kar raha hai:**

```typescript
// ✅ CORRECT - Ownership check
export async function DELETE(request: NextRequest, { params }) {
  const { user } = await authenticate(request)
  
  const story = await prisma.story.findUnique({
    where: { id: params.storyId }
  })
  
  // Check: kya yeh story current user ki hai?
  if (story.userId !== user.id) {
    return NextResponse.json(
      { error: 'You can only delete your own stories' }, 
      { status: 403 }
    )
  }
  
  await prisma.story.delete({ where: { id: params.storyId } })
  return NextResponse.json({ success: true })
}
```

---

### 5.2 Friend-only Actions

```typescript
// Messages sirf friends ke beech allow karo
async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ],
      status: 'accepted'
    }
  })
  return !!friendship
}

// Message send route mein check karo
const friends = await areFriends(user.id, receiverId)
if (!friends) {
  return NextResponse.json(
    { error: 'You can only message your friends' }, 
    { status: 403 }
  )
}
```

---

## 6. Environment Variables Security

### 6.1 .env.local Rules

```bash
# .gitignore mein yeh file zaroor add karo!
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
```

### 6.2 What to Never Expose

| Variable | Kahan Rakho | Kahan Use Karo |
|----------|-------------|----------------|
| `DATABASE_URL` | Server only (.env.local) | API routes, Prisma |
| `JWT_SECRET` | Server only | Auth middleware |
| `CLOUDINARY_API_SECRET` | Server only | Upload API |
| `EMAIL_PASS` | Server only | Email service |
| `NEXT_PUBLIC_*` | Client-safe | Frontend components |

**Rule:** `NEXT_PUBLIC_` prefix wali variables browser mein visible hoti hain. Secret keys kabhi `NEXT_PUBLIC_` se mat banao.

---

## 7. Rate Limiting

### 7.1 Auth Routes Rate Limit

```typescript
// Brute force attacks se bachne ke liye login attempts limit karo

// Simple in-memory rate limiter (production mein Redis use karo)
const loginAttempts = new Map()

function checkRateLimit(ip: string): boolean {
  const attempts = loginAttempts.get(ip) || { count: 0, resetTime: Date.now() + 60000 }
  
  if (Date.now() > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: Date.now() + 60000 })
    return true
  }
  
  if (attempts.count >= 5) {
    return false  // 1 minute mein 5 se zyada attempts blocked
  }
  
  attempts.count++
  loginAttempts.set(ip, attempts)
  return true
}
```

---

## 8. HTTPS & Headers

### 8.1 Security Headers (next.config.js)

```javascript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' https://res.cloudinary.com; connect-src 'self' wss://your-socket-server.com"
  }
]

module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: securityHeaders,
    }]
  }
}
```

---

## 9. Security Checklist

### Development Phase
- [ ] `.env.local` ko `.gitignore` mein add karo
- [ ] Passwords bcrypt se hash karo (salt rounds >= 10)
- [ ] JWT secret min 32 characters ka use karo
- [ ] Har API route mein auth middleware lagao
- [ ] File upload mein size aur type validation karo
- [ ] User input sanitize karo before DB save

### Before Deployment
- [ ] Sab environment variables Vercel dashboard mein add karo
- [ ] `NODE_ENV=production` set karo
- [ ] Prisma Studio production mein disable karo
- [ ] HTTPS enabled hai ya nahi check karo (Vercel par auto)
- [ ] Error messages mein sensitive info na dikh jaye

### After Deployment
- [ ] API routes manually test karo (unauthorized access blocked?)
- [ ] File upload limits test karo
- [ ] JWT expiry test karo
