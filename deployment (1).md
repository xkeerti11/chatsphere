# Deployment Guide — ChatSphere

---

## 1. Overview

ChatSphere ko deploy karne ke liye 3 services chahiye:

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Next.js app hosting | Free tier available |
| **Neon** | PostgreSQL database | Free tier (0.5 GB) |
| **Cloudinary** | File/image storage | Free tier (25 GB) |
| **Railway** | Socket.IO server | Free tier limited |
| **Gmail** | Email sending | Free |

---

## 2. Pre-Deployment Checklist

```bash
# Local mein sab kuch kaam kar raha hai confirm karo

# 1. Build successful hoti hai ya nahi
npm run build

# 2. Koi errors nahi hain
npm run lint

# 3. Prisma schema correct hai
npx prisma validate

# 4. Sab environment variables set hain
cat .env.local
```

---

## 3. Step 1: Neon Database Setup

### 3.1 Account Banana
1. [neon.tech](https://neon.tech) par jaao
2. "Sign Up" → GitHub se login karo
3. "New Project" create karo
4. Project name: `chatsphere`
5. Region: `Asia Pacific (Singapore)` — India ke liye fastest

### 3.2 Connection String Lena
1. Dashboard → Your Project → "Connection Details"
2. "Connection string" copy karo
3. Yeh format mein hoga:
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3.3 Tables Banana
```bash
# Apni local machine par yeh run karo
# DATABASE_URL mein Neon ka connection string use karo

DATABASE_URL="postgresql://..." npx prisma db push
```

Output mein yeh dikhega:
```
✓ Generated Prisma Client
✓ Your database is now in sync with your Prisma schema.
```

---

## 4. Step 2: Cloudinary Setup

### 4.1 Account Banana
1. [cloudinary.com](https://cloudinary.com) par jaao
2. "Sign Up for Free"
3. Dashboard par jaao

### 4.2 Credentials Nikalna
Dashboard → Settings → API Keys:
```
Cloud Name:  your-cloud-name
API Key:     123456789012345
API Secret:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.3 Upload Preset Create karna (Optional)
Settings → Upload → "Add upload preset":
- Name: `chatsphere`
- Signing mode: `Unsigned`
- Folder: `chatsphere`

---

## 5. Step 3: Gmail App Password Setup

### 5.1 2-Factor Authentication Enable Karo
1. [myaccount.google.com](https://myaccount.google.com) par jaao
2. Security → 2-Step Verification → Enable karo

### 5.2 App Password Generate Karo
1. Security → 2-Step Verification → App passwords
2. Select app: "Mail"
3. Select device: "Other" → "ChatSphere"
4. Generate karo
5. 16-digit password copy karo (spaces remove karo)

```
App Password example: abcd efgh ijkl mnop
Use as: abcdefghijklmnop (without spaces)
```

---

## 6. Step 4: GitHub Repository

### 6.1 Repository Banana
```bash
# Local project mein (ek baar)
git init
git add .
git commit -m "Initial commit: ChatSphere MVP"

# GitHub par new repository create karo: chatsphere
git remote add origin https://github.com/YOUR_USERNAME/chatsphere.git
git push -u origin main
```

### 6.2 .gitignore Confirm Karo
```
# .gitignore mein yeh hona chahiye
node_modules/
.env.local
.env
.next/
.vercel/
```

---

## 7. Step 5: Vercel Deployment

### 7.1 Account Setup
1. [vercel.com](https://vercel.com) par jaao
2. "Sign Up" → GitHub se login karo

### 7.2 Project Import Karo
1. Dashboard → "Add New Project"
2. GitHub repository select karo: `chatsphere`
3. Framework: Next.js (auto-detected)
4. Root Directory: `.` (default)
5. **Abhi Deploy mat karo** — pehle environment variables add karo

### 7.3 Environment Variables Add Karo

Vercel Dashboard → Project → Settings → Environment Variables

**Yeh sab variables add karo:**

| Name | Value |
|------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | `openssl rand -base64 32` se generate karo |
| `JWT_EXPIRES_IN` | `7d` |
| `EMAIL_USER` | `your@gmail.com` |
| `EMAIL_PASS` | Gmail app password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL (baad mein add karo) |

### 7.4 Deploy Karo
```
Settings → General → "Deploy" button click karo
```

Ya:
```bash
# CLI se deploy karo
npm install -g vercel
vercel login
vercel --prod
```

### 7.5 Custom Domain (Optional)
1. Vercel → Project → Settings → Domains
2. Domain add karo
3. DNS provider par CNAME/A record add karo

---

## 8. Step 6: Socket.IO Server Deployment

### Option A: Railway (Recommended)

1. [railway.app](https://railway.app) par jaao
2. "New Project" → "Deploy from GitHub"
3. Socket.IO server ka separate repository select karo

**Socket server ke liye alag folder ya repository banao:**

```javascript
// socket-server/index.js
const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "https://your-app.vercel.app",
    methods: ["GET", "POST"]
  }
})

const connectedUsers = new Map()

io.on('connection', (socket) => {
  socket.on('join', ({ userId }) => {
    connectedUsers.set(userId, socket.id)
  })

  socket.on('send_message', ({ to, message }) => {
    const receiverSocketId = connectedUsers.get(to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', message)
    }
  })

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId)
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => console.log(`Socket server running on port ${PORT}`))
```

Railway par:
- Environment Variables mein `CLIENT_URL` = Vercel app URL add karo
- Railway automatically PORT assign karta hai
- Deploy hone ke baad URL milega: `https://your-socket.railway.app`

### Option B: Render (Free)

1. [render.com](https://render.com) → New Web Service
2. GitHub repo connect karo
3. Start command: `node socket-server/index.js`
4. Environment Variable: `CLIENT_URL=https://your-app.vercel.app`

---

## 9. Post-Deployment Testing

### 9.1 API Testing Checklist
```bash
# Base URL replace karo with your Vercel URL

# 1. Register test
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test@1234"}'

# 2. Login test
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@1234"}'

# 3. Protected route test (token se)
curl -X GET https://your-app.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9.2 Manual Testing Checklist

**Auth Flow:**
- [ ] Register karo → Verification email aata hai?
- [ ] Email link click karo → Account verify hota hai?
- [ ] Login karo → Dashboard pe jaata hai?
- [ ] Invalid password se login → Error message dikhta hai?

**Chat Flow:**
- [ ] Search user by username kaam karta hai?
- [ ] Friend request bhejna kaam karta hai?
- [ ] Accept request kaam karta hai?
- [ ] Message bhejne par instantly dikhta hai?

**File Upload:**
- [ ] 1MB image upload hoti hai?
- [ ] 6MB file block hoti hai?
- [ ] PDF upload hoti hai?

**Stories:**
- [ ] Story upload hoti hai?
- [ ] Home page par story dikhti hai?
- [ ] Expired story nahi dikhti?

---

## 10. Updating the App

```bash
# Code change karo
# Test locally: npm run dev

# GitHub par push karo
git add .
git commit -m "Fix: bug in message seen status"
git push origin main

# Vercel automatically redeploy karega!
# 2-3 minutes mein production update ho jaayega
```

---

## 11. Monitoring & Logs

### Vercel Logs Dekhna
- Vercel Dashboard → Project → Functions → Logs
- Real-time logs dikhte hain
- Error 500 errors yahan track hoti hain

### Neon Database Monitor Karna
- Neon Dashboard → Monitoring
- Query performance
- Connection count

### Common Deployment Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Build failed | TypeScript errors | `npm run build` locally pehle test karo |
| 500 on API | Missing env variable | Vercel mein sab variables check karo |
| DB connection error | Wrong DATABASE_URL | Neon se fresh connection string lo |
| Email not sending | Wrong app password | Gmail app password regenerate karo |
| Socket not connecting | CORS error | CLIENT_URL check karo Railway mein |
