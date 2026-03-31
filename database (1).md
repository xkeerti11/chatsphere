# Database Design — ChatSphere

---

## 1. Overview

ChatSphere PostgreSQL database use karta hai (Neon par hosted) aur Prisma ORM ke through access hota hai. Database mein 4 main tables hain.

**Database:** PostgreSQL  
**ORM:** Prisma  
**Hosting:** Neon (Serverless PostgreSQL)  

---

## 2. Entity Relationship Diagram

```
USERS
  |
  |---(senderId)---> FRIEND_REQUEST <---(receiverId)--- USERS
  |
  |---(senderId)---> MESSAGES <---(receiverId)--- USERS
  |
  |---(userId)---> STORIES
```

---

## 3. Tables

---

### 3.1 Users Table

**Purpose:** Registered users ki information store karna

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (UUID) | PRIMARY KEY, auto-generated | Unique user identifier |
| `email` | String | UNIQUE, NOT NULL | User ka email address |
| `password` | String | NOT NULL | bcrypt hashed password |
| `username` | String | UNIQUE, NOT NULL | Public username (lowercase) |
| `displayName` | String | NULLABLE | Profile mein dikhne wala naam |
| `profilePic` | String | NULLABLE | Cloudinary image URL |
| `bio` | String | NULLABLE | Short user bio |
| `isVerified` | Boolean | DEFAULT false | Email verify hua ya nahi |
| `verifyToken` | String | NULLABLE | Email verification token |
| `verifyTokenExpiry` | DateTime | NULLABLE | Token expiry time |
| `isOnline` | Boolean | DEFAULT false | Current online status |
| `lastSeen` | DateTime | NULLABLE | Last online time |
| `createdAt` | DateTime | DEFAULT now() | Account creation time |
| `updatedAt` | DateTime | Auto-update | Last update time |

**Prisma Schema:**
```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  password           String
  username           String    @unique
  displayName        String?
  profilePic         String?
  bio                String?
  isVerified         Boolean   @default(false)
  verifyToken        String?
  verifyTokenExpiry  DateTime?
  isOnline           Boolean   @default(false)
  lastSeen           DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  sentRequests       FriendRequest[] @relation("SentRequests")
  receivedRequests   FriendRequest[] @relation("ReceivedRequests")
  sentMessages       Message[]       @relation("SentMessages")
  receivedMessages   Message[]       @relation("ReceivedMessages")
  stories            Story[]
}
```

---

### 3.2 FriendRequest Table

**Purpose:** Friend requests aur friendship status track karna

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (UUID) | PRIMARY KEY | Unique request identifier |
| `senderId` | String | FOREIGN KEY (Users) | Request bhejna wala |
| `receiverId` | String | FOREIGN KEY (Users) | Request receive karne wala |
| `status` | Enum | NOT NULL | pending / accepted / rejected |
| `createdAt` | DateTime | DEFAULT now() | Request bheji gayi time |
| `updatedAt` | DateTime | Auto-update | Status change time |

**Status Enum Values:**
- `pending` — Request bheji gayi, response nahi aaya
- `accepted` — Request accept ho gayi (dono friends hain)
- `rejected` — Request reject ho gayi

**Prisma Schema:**
```prisma
enum FriendStatus {
  pending
  accepted
  rejected
}

model FriendRequest {
  id         String       @id @default(cuid())
  senderId   String
  receiverId String
  status     FriendStatus @default(pending)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  sender     User         @relation("SentRequests", fields: [senderId], references: [id])
  receiver   User         @relation("ReceivedRequests", fields: [receiverId], references: [id])

  @@unique([senderId, receiverId])
}
```

---

### 3.3 Message Table

**Purpose:** Users ke beech bheji gayi messages store karna

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (UUID) | PRIMARY KEY | Unique message identifier |
| `senderId` | String | FOREIGN KEY (Users) | Message bhejna wala |
| `receiverId` | String | FOREIGN KEY (Users) | Message receive karne wala |
| `text` | String | NULLABLE | Text message content |
| `fileUrl` | String | NULLABLE | Cloudinary file URL (image/doc) |
| `fileType` | String | NULLABLE | image / document / video |
| `isRead` | Boolean | DEFAULT false | Message padha gaya ya nahi |
| `seenAt` | DateTime | NULLABLE | Message dekhe jane ka time |
| `createdAt` | DateTime | DEFAULT now() | Message bheji gayi time |

**Constraint:** Text ya fileUrl mein se ek toh hona chahiye (dono null nahi ho sakte)

**Prisma Schema:**
```prisma
model Message {
  id          String    @id @default(cuid())
  senderId    String
  receiverId  String
  text        String?
  fileUrl     String?
  fileType    String?
  isRead      Boolean   @default(false)
  seenAt      DateTime?
  createdAt   DateTime  @default(now())

  sender      User      @relation("SentMessages", fields: [senderId], references: [id])
  receiver    User      @relation("ReceivedMessages", fields: [receiverId], references: [id])

  @@index([senderId, receiverId])
  @@index([createdAt])
}
```

---

### 3.4 Story Table

**Purpose:** Users ki 24-hour stories store karna

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String (UUID) | PRIMARY KEY | Unique story identifier |
| `userId` | String | FOREIGN KEY (Users) | Story upload karne wala |
| `mediaUrl` | String | NOT NULL | Cloudinary media URL |
| `mediaType` | String | DEFAULT 'image' | image ya video |
| `caption` | String | NULLABLE | Optional story caption |
| `expiresAt` | DateTime | NOT NULL | 24 ghante baad ka time |
| `createdAt` | DateTime | DEFAULT now() | Upload time |

**Prisma Schema:**
```prisma
model Story {
  id         String   @id @default(cuid())
  userId     String
  mediaUrl   String
  mediaType  String   @default("image")
  caption    String?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])

  @@index([expiresAt])
  @@index([userId])
}
```

---

## 4. Complete Prisma Schema File

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum FriendStatus {
  pending
  accepted
  rejected
}

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  password           String
  username           String    @unique
  displayName        String?
  profilePic         String?
  bio                String?
  isVerified         Boolean   @default(false)
  verifyToken        String?
  verifyTokenExpiry  DateTime?
  isOnline           Boolean   @default(false)
  lastSeen           DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  sentRequests       FriendRequest[] @relation("SentRequests")
  receivedRequests   FriendRequest[] @relation("ReceivedRequests")
  sentMessages       Message[]       @relation("SentMessages")
  receivedMessages   Message[]       @relation("ReceivedMessages")
  stories            Story[]
}

model FriendRequest {
  id         String       @id @default(cuid())
  senderId   String
  receiverId String
  status     FriendStatus @default(pending)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  sender     User         @relation("SentRequests", fields: [senderId], references: [id], onDelete: Cascade)
  receiver   User         @relation("ReceivedRequests", fields: [receiverId], references: [id], onDelete: Cascade)

  @@unique([senderId, receiverId])
}

model Message {
  id          String    @id @default(cuid())
  senderId    String
  receiverId  String
  text        String?
  fileUrl     String?
  fileType    String?
  isRead      Boolean   @default(false)
  seenAt      DateTime?
  createdAt   DateTime  @default(now())

  sender      User      @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User      @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([senderId, receiverId])
}

model Story {
  id         String   @id @default(cuid())
  userId     String
  mediaUrl   String
  mediaType  String   @default("image")
  caption    String?
  expiresAt  DateTime
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
}
```

---

## 5. Setup Commands

```bash
# 1. Prisma initialize karo
npx prisma init

# 2. Schema.prisma mein apna schema paste karo

# 3. Database mein tables banao
npx prisma db push

# 4. Prisma client generate karo
npx prisma generate

# 5. Database GUI open karo (optional, development mein helpful)
npx prisma studio
```

---

## 6. Common Queries (Reference)

```typescript
// lib/prisma.ts - Prisma Client singleton
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// --- Common Query Examples ---

// User dhundho by email
const user = await prisma.user.findUnique({ where: { email } })

// Friends list nikalo
const friends = await prisma.friendRequest.findMany({
  where: { 
    OR: [{ senderId: userId }, { receiverId: userId }],
    status: 'accepted'
  },
  include: { sender: true, receiver: true }
})

// Chat history nikalo (do users ke beech)
const messages = await prisma.message.findMany({
  where: {
    OR: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  },
  orderBy: { createdAt: 'asc' }
})

// Active stories nikalo (expired nahi hui)
const stories = await prisma.story.findMany({
  where: { expiresAt: { gt: new Date() } },
  include: { user: true },
  orderBy: { createdAt: 'desc' }
})
```
