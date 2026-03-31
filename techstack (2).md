# Tech Stack — ChatSphere

---

## 1. Overview

ChatSphere ek modern full-stack web application hai jo Next.js ke upar build ki gayi hai. Ek hi repository mein frontend aur backend dono hain, jisse development simple rehti hai.

```
Browser (Next.js Frontend)
       ↕ HTTP / WebSocket
Next.js API Routes (Backend)
       ↕ Prisma ORM
PostgreSQL on Neon (Database)
       ↕
Cloudinary (File Storage)
```

---

## 2. Frontend

### Next.js 14 (App Router)
- **Kyun:** Server-side rendering, file-based routing, API routes sab ek jagah
- **Version:** 14.x
- **Features used:** App Router, Server Components, Client Components, API Routes
- **Install:** `npx create-next-app@latest chatsphere`

### Tailwind CSS
- **Kyun:** Utility-first CSS, fast development, mobile responsive built-in
- **Version:** 3.x
- **Install:** Auto-included with Next.js setup

### Socket.IO Client
- **Kyun:** Real-time bidirectional communication ke liye
- **Install:** `npm install socket.io-client`

### Additional Frontend Libraries

| Library | Use | Install Command |
|---------|-----|-----------------|
| `lucide-react` | Icons | `npm install lucide-react` |
| `axios` | HTTP requests | `npm install axios` |
| `react-hot-toast` | Toast notifications | `npm install react-hot-toast` |
| `date-fns` | Date formatting | `npm install date-fns` |
| `zustand` | State management | `npm install zustand` |

---

## 3. Backend

### Next.js API Routes
- **Kyun:** Separate backend server ki zaroorat nahi, same codebase mein API
- **Location:** `/app/api/` folder
- **Format:** `route.ts` files with `GET`, `POST`, `PUT`, `DELETE` handlers

### Socket.IO Server
- **Kyun:** Real-time messaging ke liye WebSocket connections manage karna
- **Setup:** Custom Next.js server file ya separate Socket server
- **Install:** `npm install socket.io`

### Authentication Libraries

| Library | Use | Install |
|---------|-----|---------|
| `bcryptjs` | Password hashing | `npm install bcryptjs` |
| `jsonwebtoken` | JWT create/verify | `npm install jsonwebtoken` |
| `nodemailer` | Email sending | `npm install nodemailer` |

---

## 4. Database

### PostgreSQL on Neon
- **Kyun:** Free tier available, serverless PostgreSQL, Vercel ke saath perfect integration
- **Setup:** neon.tech par free account banao
- **Connection:** Connection string ko `.env` mein `DATABASE_URL` ke naam se add karo

### Prisma ORM
- **Kyun:** Type-safe database queries, auto-generated types, easy migrations
- **Version:** 5.x
- **Install:**
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- **Key Commands:**
  ```bash
  npx prisma db push        # Schema changes apply karo
  npx prisma generate       # Client regenerate karo
  npx prisma studio         # DB GUI open karo
  ```

---

## 5. File Storage

### Cloudinary
- **Kyun:** Free tier (25GB storage), image optimization automatic, CDN included
- **Use:** Profile pictures, chat images, story media upload
- **Install:** `npm install cloudinary`
- **Setup:** cloudinary.com par free account banao
- **Environment Variables:**
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```

---

## 6. Email Service

### Nodemailer + Gmail SMTP
- **Kyun:** Free, easy setup, email verification ke liye
- **Setup:**
  - Gmail account mein "App Password" generate karo
  - 2-Factor Authentication enable karni hogi
- **Environment Variables:**
  ```
  EMAIL_USER=your_gmail@gmail.com
  EMAIL_PASS=your_app_password
  ```

---

## 7. Deployment

### Vercel
- **Kyun:** Next.js ke creators ka platform, free tier, GitHub se auto-deploy
- **Setup:** vercel.com par account banao, GitHub repo connect karo
- **Socket.IO Note:** Vercel serverless hai, Socket.IO ke liye alag approach chahiye:
  - Option A: Railway.app ya Render.com par Socket server deploy karo
  - Option B: Vercel ke saath long-polling mode use karo

---

## 8. Development Tools

| Tool | Purpose |
|------|---------|
| VS Code | Code editor |
| Cursor AI | AI-powered coding assistant |
| Postman | API testing |
| Prisma Studio | Database GUI |
| Git + GitHub | Version control |
| ESLint + Prettier | Code formatting |

---

## 9. Environment Variables (.env.local)

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname"

# Authentication
JWT_SECRET="your-super-secret-key-here"
JWT_EXPIRES_IN="7d"

# Email (Gmail SMTP)
EMAIL_USER="your@gmail.com"
EMAIL_PASS="your-app-password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

---

## 10. Folder Structure

```
chatsphere/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── verify/route.ts
│   │   ├── friends/
│   │   │   ├── send/route.ts
│   │   │   ├── respond/route.ts
│   │   │   └── list/route.ts
│   │   ├── messages/
│   │   │   ├── [userId]/route.ts
│   │   │   └── send/route.ts
│   │   ├── stories/
│   │   │   ├── upload/route.ts
│   │   │   └── feed/route.ts
│   │   └── upload/route.ts
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── chat/page.tsx
│   ├── stories/page.tsx
│   ├── settings/page.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   ├── chat/
│   ├── story/
│   └── ui/
├── lib/
│   ├── prisma.ts
│   ├── jwt.ts
│   ├── cloudinary.ts
│   └── email.ts
├── prisma/
│   └── schema.prisma
├── socket/
│   └── server.ts
├── .env.local
└── package.json
```
