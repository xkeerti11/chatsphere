# Feature Breakdown — ChatSphere

---

## 1. Authentication Features

### 1.1 Email Signup
**Description:** User apna email, username aur password de kar account create karta hai.

**Inputs Required:**
- Email address (unique)
- Username (unique, min 3 chars, max 20 chars)
- Password (min 8 chars)

**Process:**
1. Form submit hota hai
2. Server email aur username uniqueness check karta hai
3. Password bcrypt se hash hoti hai
4. User record database mein save hota hai (isVerified = false)
5. Verification email bheja jata hai

**Output:** "Check your email to verify your account" message

---

### 1.2 Email Verification
**Description:** User ko ek verification link milta hai. Link click karne par account verify ho jata hai.

**Process:**
1. Email mein ek unique token hota hai (24 hour expiry)
2. User link click karta hai
3. Server token validate karta hai
4. isVerified flag = true ho jata hai
5. User login page par redirect hota hai

---

### 1.3 Login
**Description:** Verified user email aur password se login karta hai.

**Process:**
1. Email/password validate hota hai
2. bcrypt se password compare hota hai
3. JWT token generate hota hai (7 day expiry)
4. Token local storage ya httpOnly cookie mein save hota hai
5. User dashboard par redirect hota hai

**Error Cases:**
- Invalid credentials → "Email or password incorrect"
- Unverified account → "Please verify your email first"

---

### 1.4 Logout
- JWT token clear hota hai
- User login page par redirect hota hai

---

## 2. Friend System Features

### 2.1 Search User by Username
**Description:** User kisi bhi registered user ko username se dhundh sakta hai.

- Search bar mein type karte hi results dikhte hain
- Results mein: profile picture, username, full name
- Already friend hai toh "Friends" badge dikhega
- Request pending hai toh "Request Sent" dikhega

---

### 2.2 Send Friend Request
- Search results se "Add Friend" button click karo
- Request database mein save hoti hai (status = "pending")
- Receiver ko notification dikhti hai

---

### 2.3 Accept / Reject Friend Request
**Accept karne par:**
- FriendRequest status = "accepted" ho jata hai
- Dono users ek doosre ki friends list mein aa jaate hain
- Chat tab mein user dikhne lagta hai

**Reject karne par:**
- FriendRequest status = "rejected" ho jata hai
- Sender ko pata nahi chalta (silent rejection)

---

### 2.4 Friends List
- Sabhi accepted friends ki list
- Online/offline status indicator
- Click karke chat open hoga

---

## 3. Chat Features

### 3.1 Real-time Text Messaging
- Message type karke Enter ya Send button se bhejo
- Socket.IO ke through instantaneous delivery
- Message database mein store hota hai
- Chat history load hoti hai jab chat open ho

**Message Object:**
```
{
  id, senderId, receiverId, 
  text, fileUrl, 
  createdAt, seenAt
}
```

---

### 3.2 Send Images / Documents
- Paperclip icon se file select karo
- Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX
- Max size: 5MB
- File Cloudinary par upload hota hai
- URL message mein send hota hai

**Validation:**
- File size > 5MB → "File too large. Max 5MB allowed"
- Unsupported format → "File type not supported"

---

### 3.3 Seen Status (Optional)
- Message deliver hone par: single tick
- Message dekhe jane par: double tick (blue)
- seenAt timestamp database mein store hota hai

---

## 4. Story Features

### 4.1 Upload Story
- "+" button se story upload karo (home page par)
- Image ya short video select karo
- Cloudinary par upload hoti hai
- expiresAt = current time + 24 hours

---

### 4.2 View Stories
- Home page par friends ki stories circular thumbnails mein dikhti hain
- Click karne par full screen preview
- Stories chronological order mein hoti hain

---

### 4.3 Auto Delete After 24 Hours
- Database mein expiresAt field store hoti hai
- API fetch karte waqt expired stories filter ho jaati hain
- Optional: Cron job se delete bhi kar sakte hain

---

## 5. Settings Features

### 5.1 Update Profile
- Profile picture change (Cloudinary upload)
- Username update
- Display name / bio update

### 5.2 Change Password
- Current password verify karo
- Naya password enter karo (confirm password bhi)
- bcrypt se hash karke save karo

---

## 6. Feature Priority Matrix

| Feature | Priority | Complexity | Phase |
|---------|----------|------------|-------|
| Email Signup/Login | High | Medium | 2 |
| Email Verification | High | Medium | 2 |
| Search Users | High | Low | 3 |
| Friend Request | High | Low | 3 |
| Text Messaging | High | High | 4 |
| File Upload | Medium | Medium | 5 |
| Stories | Medium | Medium | 6 |
| Seen Status | Low | Low | 4 |
| Change Password | Medium | Low | 7 |
| Profile Update | Medium | Low | 7 |
