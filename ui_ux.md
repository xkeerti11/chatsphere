# UI/UX Design Guide — ChatSphere

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| **Minimal** | Sirf zaroori cheezein dikhao, clutter nahi |
| **Fast** | Instant feedback, loading states, optimistic UI |
| **Mobile-first** | Phone par pehle design, desktop par extend karo |
| **Familiar** | WhatsApp/Instagram jaisi patterns — user confuse na ho |
| **Accessible** | High contrast, readable fonts, touch-friendly buttons |

---

## 2. Color Palette

```
Primary Background:  #FFFFFF (White)
Secondary Background: #F0F2F5 (Light Gray)
Primary Brand:       #6C63FF (Purple)
Secondary Brand:     #A78BFA (Light Purple)
Text Primary:        #111827 (Dark Gray)
Text Secondary:      #6B7280 (Medium Gray)
Success:             #10B981 (Green)
Error:               #EF4444 (Red)
Border:              #E5E7EB (Light Border)
Online Indicator:    #22C55E (Bright Green)
```

---

## 3. Typography

```
Font Family: Inter (Google Fonts)
Heading 1:   28px, Bold (700)
Heading 2:   22px, SemiBold (600)
Heading 3:   18px, SemiBold (600)
Body:        14px, Regular (400)
Caption:     12px, Regular (400)
Button:      14px, Medium (500)
```

---

## 4. Pages & Screens

---

### 4.1 Auth Pages

#### Login Page
```
+----------------------------------+
|       ChatSphere Logo            |
|                                  |
|   Welcome Back!                  |
|                                  |
|   [Email Input Field         ]   |
|   [Password Input Field      ]   |
|                                  |
|   [      LOGIN BUTTON        ]   |
|                                  |
|   Don't have account? Sign Up    |
+----------------------------------+
```

**Elements:**
- Logo top center
- Tagline: "Connect. Chat. Share."
- Email + password inputs (rounded, bordered)
- "Show password" toggle
- Login button (brand color, full width)
- "Forgot Password?" link
- Signup link at bottom

---

#### Register Page
```
+----------------------------------+
|       ChatSphere Logo            |
|                                  |
|   Create Account                 |
|                                  |
|   [Username Input            ]   |
|   [Email Input               ]   |
|   [Password Input            ]   |
|   [Confirm Password          ]   |
|                                  |
|   [     SIGN UP BUTTON       ]   |
|                                  |
|   Already have account? Login    |
+----------------------------------+
```

---

#### Email Verification Page
```
+----------------------------------+
|       Check Your Email!          |
|                                  |
|   📧                             |
|                                  |
|   We sent a verification link    |
|   to rahul@email.com             |
|                                  |
|   [  Resend Email  ]             |
|                                  |
|   Back to Login                  |
+----------------------------------+
```

---

### 4.2 Home Page

```
+------------------------------------------+
| [☰] ChatSphere         [🔔] [👤 Profile] |
+------------------------------------------+
|                                           |
|  Stories Bar (horizontal scroll):         |
|  [+Add] [Priya] [Amit] [Sara] [Raj]      |
|                                           |
+------------------------------------------+
|  Friends Online                           |
|  🟢 Priya Sharma                         |
|  🟢 Amit Kumar                           |
|  ⚫ Riya Singh                           |
|                                           |
|  [Start a new chat...]                    |
|                                           |
+------------------------------------------+
```

---

### 4.3 Chat Page (Main Page)

```
+------------------+---------------------------+
|  SIDEBAR         |  CHAT WINDOW              |
|                  |                           |
| [Search Users]   |  [👤 Priya Sharma]  [📞] |
|                  |  🟢 Online               |
| 👤 Priya         +---------------------------+
|  Hey! What's..   |                           |
|  2:30 PM         |    [Message Bubble]       |
|                  |    "Hey! How are you?"    |
| 👤 Amit          |    2:25 PM                |
|  Send me notes   |                           |
|  Yesterday       |  [Your Message Bubble]    |
|                  |  "I'm good! You?"     ✓✓ |
| 👤 Riya          |  2:28 PM                  |
|  😊              |                           |
|  Monday          +---------------------------+
|                  |  [📎] [Type message...] [➤]|
+------------------+---------------------------+
```

**Sidebar (Left Panel) — 300px wide:**
- Search bar at top
- Friend list with: avatar, name, last message preview, time, unread count badge
- Active chat highlighted with brand color background

**Chat Window (Right Panel) — remaining width:**
- Header: friend's avatar, name, online status, options menu
- Message area: scrollable, newest at bottom
- Sent messages: right-aligned, brand color background
- Received messages: left-aligned, gray background
- Timestamps below each message
- Input bar: file attach button + text input + send button

---

### 4.4 Story Viewer

```
+----------------------------------+
|  ← [Progress Bar ██████░░░░]     |
|     Priya Sharma   2 hours ago   |
|                                  |
|                                  |
|    [FULL SCREEN STORY IMAGE]     |
|                                  |
|                                  |
|  < (prev story)   (next story) > |
+----------------------------------+
```

- Full screen overlay
- Progress bar at top showing time remaining
- Tap left = previous story, tap right = next story
- Swipe down = close

---

### 4.5 Settings Page

```
+----------------------------------+
|  ← Settings                      |
|                                  |
|  [  Profile Picture (circle)  ]  |
|  [     Change Photo Button    ]  |
|                                  |
|  Username: [________________]    |
|  Email: [________________]       |
|  Bio: [____________________]     |
|                                  |
|  [     Save Changes           ]  |
|                                  |
|  ─────────────────────────────   |
|                                  |
|  Change Password                 |
|  Current: [________________]     |
|  New: [________________]         |
|  Confirm: [________________]     |
|                                  |
|  [     Update Password        ]  |
|                                  |
|  ─────────────────────────────   |
|  [     Logout (Red Button)    ]  |
+----------------------------------+
```

---

## 5. Component Library

### Buttons
```
Primary:   bg-purple-600, text-white, rounded-lg, px-4 py-2
Secondary: bg-gray-100, text-gray-800, rounded-lg, px-4 py-2
Danger:    bg-red-500, text-white, rounded-lg, px-4 py-2
```

### Input Fields
```
border border-gray-300
rounded-lg px-4 py-2
focus:ring-2 focus:ring-purple-500
w-full
```

### Message Bubbles
```
Sent:     bg-purple-600 text-white, rounded-2xl rounded-br-sm
Received: bg-gray-100 text-gray-900, rounded-2xl rounded-bl-sm
```

### Avatar
```
Sizes: sm (32px), md (40px), lg (56px), xl (80px)
Shape: circle (rounded-full)
Fallback: user's initials with brand color background
```

---

## 6. Responsive Breakpoints

| Screen | Width | Layout Change |
|--------|-------|---------------|
| Mobile | < 768px | Sidebar hidden, chat full width, toggle button for sidebar |
| Tablet | 768–1024px | Sidebar 240px, chat takes rest |
| Desktop | > 1024px | Sidebar 300px, full layout |

**Mobile Chat View:**
- Friend list = separate screen
- Tap on friend → opens full-screen chat
- Back button → returns to friend list

---

## 7. Loading States & Feedback

| Action | Feedback |
|--------|----------|
| Login | Button shows spinner, disabled |
| Message send | Optimistic UI (show immediately, confirm on ack) |
| File upload | Progress bar below input |
| Story load | Skeleton placeholder circles |
| API error | Toast notification (red, top-right) |
| Success | Toast notification (green, top-right) |

---

## 8. Icons (Recommended: Lucide React)

```
Menu:        Menu
Chat:        MessageCircle
Friend:      Users
Story:       Circle
Settings:    Settings
Send:        Send
Attach:      Paperclip
Search:      Search
Logout:      LogOut
Online:      Circle (filled green)
Seen:        CheckCheck
```
