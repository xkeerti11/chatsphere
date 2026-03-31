# API Reference — ChatSphere

---

## 1. Base Configuration

```
Base URL (Local):      http://localhost:3000/api
Base URL (Production): https://your-app.vercel.app/api
Content-Type:          application/json
Authentication:        Bearer Token (JWT) in Authorization header
```

**Authentication Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Auth Routes

---

### POST /api/auth/register

**Description:** Naya user account banana

**Request Body:**
```json
{
  "email": "rahul@example.com",
  "username": "rahul123",
  "password": "MyPass@123"
}
```

**Validations:**
- Email: valid format, unique
- Username: 3-20 chars, alphanumeric + underscore only, unique
- Password: min 8 chars

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created! Please check your email to verify."
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

---

### POST /api/auth/login

**Description:** User login karna aur JWT token lena

**Request Body:**
```json
{
  "email": "rahul@example.com",
  "password": "MyPass@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123abc",
    "email": "rahul@example.com",
    "username": "rahul123",
    "displayName": "Rahul",
    "profilePic": "https://cloudinary.com/...",
    "isVerified": true
  }
}
```

**Error Responses:**
```json
{ "success": false, "error": "Invalid email or password" }
{ "success": false, "error": "Please verify your email first" }
```

---

### POST /api/auth/verify

**Description:** Email verification link se account verify karna

**Request Body:**
```json
{
  "token": "unique-verification-token-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now login."
}
```

**Error Response (400):**
```json
{ "success": false, "error": "Invalid or expired verification token" }
```

---

### GET /api/auth/me

**Description:** Current logged-in user ki info nikalna  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx123abc",
    "email": "rahul@example.com",
    "username": "rahul123",
    "displayName": "Rahul Kumar",
    "profilePic": "https://cloudinary.com/...",
    "bio": "Student at IIT Delhi"
  }
}
```

---

## 3. User Routes

---

### GET /api/users/search?username={query}

**Description:** Username se users dhundna  
**Auth Required:** Yes  
**Query Param:** `username` (minimum 2 characters)

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "clx456def",
      "username": "priya_sharma",
      "displayName": "Priya Sharma",
      "profilePic": "https://cloudinary.com/...",
      "friendStatus": "none"
    }
  ]
}
```

**friendStatus values:** `none`, `pending_sent`, `pending_received`, `accepted`

---

### PUT /api/users/profile

**Description:** Profile update karna  
**Auth Required:** Yes

**Request Body:**
```json
{
  "displayName": "Rahul Kumar",
  "bio": "Student & Developer",
  "profilePic": "https://cloudinary.com/new-image-url"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### PUT /api/users/change-password

**Description:** Password change karna  
**Auth Required:** Yes

**Request Body:**
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@456"
}
```

**Success/Error Responses:**
```json
{ "success": true, "message": "Password changed successfully" }
{ "success": false, "error": "Current password is incorrect" }
```

---

## 4. Friend Request Routes

---

### POST /api/friends/send

**Description:** Kisi user ko friend request bhejna  
**Auth Required:** Yes

**Request Body:**
```json
{
  "receiverId": "clx456def"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Friend request sent",
  "request": {
    "id": "clx789ghi",
    "senderId": "clx123abc",
    "receiverId": "clx456def",
    "status": "pending"
  }
}
```

**Error Responses:**
```json
{ "success": false, "error": "Friend request already sent" }
{ "success": false, "error": "You are already friends" }
```

---

### POST /api/friends/respond

**Description:** Friend request accept ya reject karna  
**Auth Required:** Yes

**Request Body:**
```json
{
  "requestId": "clx789ghi",
  "action": "accept"
}
```

**action values:** `accept` ya `reject`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Friend request accepted"
}
```

---

### GET /api/friends/list

**Description:** Apni complete friends list nikalna  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "friends": [
    {
      "id": "clx456def",
      "username": "priya_sharma",
      "displayName": "Priya Sharma",
      "profilePic": "https://cloudinary.com/...",
      "isOnline": true,
      "lastSeen": "2025-01-15T14:30:00Z"
    }
  ]
}
```

---

### GET /api/friends/requests

**Description:** Pending friend requests dekhna  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": "clx789ghi",
      "sender": {
        "id": "clx999xyz",
        "username": "amit_k",
        "displayName": "Amit Kumar",
        "profilePic": "https://cloudinary.com/..."
      },
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

## 5. Message Routes

---

### GET /api/messages/:userId

**Description:** Do users ke beech ki chat history nikalna  
**Auth Required:** Yes  
**Path Param:** `userId` — doosre user ka ID

**Query Params (optional):**
- `page` — Page number (default: 1)
- `limit` — Messages per page (default: 50)

**Success Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg123",
      "senderId": "clx123abc",
      "receiverId": "clx456def",
      "text": "Hey! Kaise ho?",
      "fileUrl": null,
      "fileType": null,
      "isRead": true,
      "seenAt": "2025-01-15T14:35:00Z",
      "createdAt": "2025-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "hasMore": true
  }
}
```

---

### POST /api/messages/send

**Description:** Message bhejna (text ya file)  
**Auth Required:** Yes

**Request Body:**
```json
{
  "receiverId": "clx456def",
  "text": "Hey! Notes share karo please",
  "fileUrl": null,
  "fileType": null
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg124",
    "senderId": "clx123abc",
    "receiverId": "clx456def",
    "text": "Hey! Notes share karo please",
    "createdAt": "2025-01-15T14:31:00Z"
  }
}
```

---

### PUT /api/messages/seen/:senderId

**Description:** Kisi user ke saare messages ko seen mark karna  
**Auth Required:** Yes  
**Path Param:** `senderId` — jinke messages seen karne hain

**Success Response (200):**
```json
{
  "success": true,
  "updatedCount": 5
}
```

---

## 6. Story Routes

---

### POST /api/stories/upload

**Description:** Nayi story upload karna  
**Auth Required:** Yes

**Request Body:**
```json
{
  "mediaUrl": "https://cloudinary.com/story-image-url",
  "mediaType": "image",
  "caption": "Sunset view! 🌅"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "story": {
    "id": "story123",
    "userId": "clx123abc",
    "mediaUrl": "https://cloudinary.com/...",
    "caption": "Sunset view! 🌅",
    "expiresAt": "2025-01-16T14:31:00Z",
    "createdAt": "2025-01-15T14:31:00Z"
  }
}
```

---

### GET /api/stories/feed

**Description:** Friends ki active (non-expired) stories dekhna  
**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "stories": [
    {
      "user": {
        "id": "clx456def",
        "username": "priya_sharma",
        "profilePic": "https://cloudinary.com/..."
      },
      "stories": [
        {
          "id": "story456",
          "mediaUrl": "https://cloudinary.com/...",
          "caption": "Morning chai ☕",
          "expiresAt": "2025-01-16T08:00:00Z",
          "createdAt": "2025-01-15T08:00:00Z"
        }
      ]
    }
  ]
}
```

---

## 7. File Upload Route

---

### POST /api/upload

**Description:** File (image/document) Cloudinary par upload karna  
**Auth Required:** Yes  
**Content-Type:** `multipart/form-data`

**Request:** FormData with `file` field

**Validations:**
- Max size: 5MB
- Allowed types: jpg, jpeg, png, gif, pdf, doc, docx

**Success Response (200):**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/...",
  "fileType": "image",
  "size": 1234567
}
```

**Error Responses:**
```json
{ "success": false, "error": "File size exceeds 5MB limit" }
{ "success": false, "error": "File type not supported" }
```

---

## 8. HTTP Status Codes Summary

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Authorized but not allowed |
| 404 | Not Found | Resource nahi mila |
| 409 | Conflict | Duplicate data (email already exists) |
| 500 | Server Error | Unexpected server error |

---

## 9. Socket.IO Events

### Client se Server par emit:
```javascript
socket.emit('join', { userId })              // User connect hua
socket.emit('send_message', { message })     // Message bhejna
socket.emit('typing', { to, isTyping })      // Typing indicator
socket.emit('seen', { messageId, from })     // Message dekha
socket.emit('disconnect_user', { userId })   // User disconnect hua
```

### Server se Client par emit:
```javascript
socket.on('receive_message', (message) => {})   // Naya message aaya
socket.on('user_typing', ({ from, isTyping }) => {})  // Typing status
socket.on('message_seen', ({ messageId }) => {})       // Seen update
socket.on('user_online', ({ userId }) => {})           // User online
socket.on('user_offline', ({ userId }) => {})          // User offline
```
