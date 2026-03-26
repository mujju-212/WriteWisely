# 🎨 WriteWisely — Frontend Development Plan

> React + Vite + TailwindCSS | Connects to FastAPI Backend

---

## 📁 File Structure

```
frontend/
├── .env                          # VITE_API_URL=http://localhost:8000/api
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
│
└── src/
    ├── main.jsx                  # Entry point → renders App
    ├── App.jsx                   # AuthProvider + ThemeProvider + Router
    ├── index.css                 # Tailwind imports + custom styles
    │
    ├── pages/                    # One file per route
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── OtpVerify.jsx
    │   ├── ForgotPassword.jsx
    │   ├── Assessment.jsx
    │   ├── Dashboard.jsx
    │   ├── LearningHome.jsx
    │   ├── Lesson.jsx
    │   ├── PracticeHome.jsx
    │   ├── PracticeEditor.jsx
    │   ├── ProjectHome.jsx
    │   ├── ProjectEditor.jsx
    │   ├── AiChat.jsx
    │   ├── Analytics.jsx
    │   └── Settings.jsx
    │
    ├── components/               # Reusable UI pieces
    │   ├── Sidebar.jsx
    │   ├── Navbar.jsx
    │   ├── MainLayout.jsx
    │   ├── AuthLayout.jsx
    │   ├── TextEditor.jsx
    │   ├── CoachSidebar.jsx
    │   ├── QuizQuestion.jsx
    │   ├── LevelCard.jsx
    │   ├── ChatBubble.jsx
    │   ├── StatsCard.jsx
    │   └── ProgressBar.jsx
    │
    ├── context/
    │   ├── AuthContext.jsx        # User auth state + token
    │   └── ThemeContext.jsx       # Dark/light mode
    │
    ├── services/
    │   ├── api.js                 # Axios instance (base URL + token)
    │   ├── authService.js         # Auth API calls
    │   └── dataService.js         # All other API calls
    │
    ├── hooks/
    │   └── useDebounce.js         # Debounce text input (500ms)
    │
    └── utils/
        ├── constants.js           # Credit values, badge rules, levels
        └── helpers.js             # Date format, score calc, validators
```

---

## 🗺️ Routing Map

### App.jsx — Router Setup

```jsx
// App.jsx wraps everything:
// <AuthProvider>
//   <ThemeProvider>
//     <BrowserRouter>
//       <Routes> ... </Routes>
//     </BrowserRouter>
//   </ThemeProvider>
// </AuthProvider>
```

### Routes

| Path | Page | Layout | Auth Required | Description |
|------|------|--------|:---:|-------------|
| `/login` | `Login.jsx` | `AuthLayout` | ❌ | Email + password login |
| `/signup` | `Signup.jsx` | `AuthLayout` | ❌ | Name, email, phone, password, role |
| `/verify-otp` | `OtpVerify.jsx` | `AuthLayout` | ❌ | 6-digit OTP verification |
| `/forgot-password` | `ForgotPassword.jsx` | `AuthLayout` | ❌ | Email → OTP → new password |
| `/assessment` | `Assessment.jsx` | `AuthLayout` | ❌ | 10 questions to determine level |
| `/dashboard` | `Dashboard.jsx` | `MainLayout` | ✅ | Welcome, stats, recent activity |
| `/learn` | `LearningHome.jsx` | `MainLayout` | ✅ | All 30 levels with progress |
| `/learn/:levelId` | `Lesson.jsx` | `MainLayout` | ✅ | Lesson content + quiz + assignment |
| `/practice` | `PracticeHome.jsx` | `MainLayout` | ✅ | Task templates (email, letter, etc.) |
| `/practice/:taskId` | `PracticeEditor.jsx` | `MainLayout` | ✅ | Writing editor + live/after modes |
| `/projects` | `ProjectHome.jsx` | `MainLayout` | ✅ | List of saved documents |
| `/projects/:docId` | `ProjectEditor.jsx` | `MainLayout` | ✅ | Doc editor + coach sidebar |
| `/chat` | `AiChat.jsx` | `MainLayout` | ✅ | AI grammar coach chat |
| `/analytics` | `Analytics.jsx` | `MainLayout` | ✅ | Graphs, stats, badges |
| `/settings` | `Settings.jsx` | `MainLayout` | ✅ | Profile, theme, notifications |

### Layout Wrappers

```
AuthLayout (for public pages):
┌──────────────────────┐
│      Logo + Name     │
│  ┌────────────────┐  │
│  │  Centered Card │  │
│  │  (Login/Signup) │  │
│  └────────────────┘  │
└──────────────────────┘

MainLayout (for protected pages):
┌────────┬─────────────┐
│Sidebar │  Navbar     │
│        ├─────────────┤
│ Dash   │             │
│ Learn  │   PAGE      │
│ Pract  │   CONTENT   │
│ Proj   │             │
│ Chat   │             │
│ Analy  │             │
│ Sett   │             │
└────────┴─────────────┘
```

---

## 🔐 Context Providers

### AuthContext.jsx

```
STATE:
  - user (object: id, name, email, level, credits, role)
  - token (JWT string, stored in localStorage)
  - isAuthenticated (boolean)
  - loading (boolean)

FUNCTIONS:
  - login(email, password) → calls authService.login() → saves token + user
  - signup(data) → calls authService.signup() → navigates to OTP
  - logout() → clears token + user → navigates to /login
  - updateUser(data) → updates user state

ON MOUNT:
  - Checks localStorage for token
  - If token exists → calls authService.getProfile() → sets user
  - If expired/invalid → clears and redirects to /login
```

### ThemeContext.jsx

```
STATE:
  - theme ("light" | "dark")

FUNCTIONS:
  - toggleTheme() → switches between light/dark
  - Saves preference to localStorage
  - Applies class to <html> element for Tailwind dark mode
```

---

## 📄 Page Details

### 1. Login.jsx
```
WHAT IT DOES:
  - Form: email + password
  - Calls: authService.login(email, password)
  - On success: saves token via AuthContext → navigate to /dashboard
  - On fail: shows error toast
  - Links: "Forgot Password?" → /forgot-password
           "Sign Up" → /signup

BACKEND API:
  POST /api/auth/login
  Body: { email, password }
  Response: { token, user: { id, name, email, level, credits } }
```

### 2. Signup.jsx
```
WHAT IT DOES:
  - Form: name, email, phone, password, confirm password, role (dropdown)
  - Client validation: email format, password match, min 8 chars
  - Calls: authService.signup(data)
  - On success: navigate to /verify-otp with email in state
  - Role options: Student, Professional, Writer, Teacher, Other

BACKEND API:
  POST /api/auth/signup
  Body: { name, email, phone, password, role }
  Response: { message: "OTP sent to email" }
```

### 3. OtpVerify.jsx
```
WHAT IT DOES:
  - 6 digit OTP input boxes (auto-focus next on type)
  - Receives email from navigation state
  - Calls: authService.verifyOtp(email, otp)
  - On success: navigate to /assessment
  - Resend OTP: 30s cooldown timer → authService.resendOtp(email)

BACKEND API:
  POST /api/auth/verify-otp
  Body: { email, otp }
  Response: { token, message: "Email verified" }

  POST /api/auth/resend-otp
  Body: { email }
  Response: { message: "OTP resent" }
```

### 4. ForgotPassword.jsx
```
WHAT IT DOES:
  - Step 1: Enter email → send OTP
  - Step 2: Enter OTP (6 digits)
  - Step 3: Enter new password + confirm
  - Calls: authService.forgotPassword(email)
           authService.resetPassword(email, otp, newPassword)
  - On success: navigate to /login with success message

BACKEND API:
  POST /api/auth/forgot-password → { email }
  POST /api/auth/reset-password → { email, otp, new_password }
```

### 5. Assessment.jsx
```
WHAT IT DOES:
  - Shows 10 multiple choice / fill-in-the-blank questions
  - Questions fetched from: dataService.getAssessmentQuestions()
  - Mix of spelling, grammar, homophones, punctuation
  - User can answer all or click "Skip & Start from Beginning"
  - On submit: authService.submitAssessment(answers)
  - Shows result: Level assigned, score, strengths, weaknesses
  - Button: "Go to Dashboard" → /dashboard

BACKEND API:
  GET  /api/auth/assessment-questions
  POST /api/auth/submit-assessment
  Body: { answers: [{question_id, selected_answer}] }
  Response: { level, score, strengths, weaknesses }
```

### 6. Dashboard.jsx
```
WHAT IT DOES:
  - Welcome message: "Welcome back, {name}! 🔥 {streak} day streak!"
  - Stat cards: Level, Credits, Accuracy (from dataService.getDashboardStats())
  - Continue Learning card: current lesson with progress bar
  - Recent Activity: last 5 activities (lessons, quizzes, practice)
  - Quick Stats: this week's numbers

COMPONENTS USED:
  - StatsCard (level, credits, accuracy)
  - ProgressBar (lesson progress)

BACKEND API:
  GET /api/analytics/dashboard
  Response: { user_stats, current_lesson, recent_activity, weekly_stats }
```

### 7. LearningHome.jsx
```
WHAT IT DOES:
  - Shows all 30 levels in 3 sections: Beginner (1-10), Intermediate (11-20), Advanced (21-30)
  - Each level shows: title, status (locked/available/completed), score
  - Color coded: 🟢 Beginner, 🟡 Intermediate, 🔴 Advanced
  - Click level → navigate to /learn/:levelId
  - Locked levels: can't click until previous is completed
  - Fetches: dataService.getAllLevels()

COMPONENTS USED:
  - LevelCard (per level: title, status, progress indicator)

BACKEND API:
  GET /api/learning/levels
  Response: [{ level_id, title, topic, status, score, credits_earned }]
```

### 8. Lesson.jsx
```
WHAT IT DOES:
  - 3 sections in one page (scrollable):
    1. LESSON CONTENT: Theory with examples (markdown-like rendering)
    2. QUICK QUIZ: Multiple choice questions (inline, instant feedback)
    3. MINI ASSIGNMENT: Write sentences using what you learned
  - Fetches: dataService.getLesson(levelId)
  - Quiz submit: dataService.submitQuiz(levelId, answers)
    → Shows correct/wrong instantly with explanation
    → Awards credits
  - Assignment submit: dataService.submitAssignment(levelId, text)
    → Shows review: each sentence marked ✅/❌ with explanation
    → Awards credits
    → Saves error patterns to DB

COMPONENTS USED:
  - QuizQuestion (single MCQ with feedback state)
  - ProgressBar (lesson progress)

BACKEND API:
  GET  /api/learning/levels/:id → { lesson_content, quiz, assignment_prompt }
  POST /api/learning/quiz/:id → { answers } → { results, credits }
  POST /api/learning/assignment/:id → { text } → { review, score, credits }
```

### 9. PracticeHome.jsx
```
WHAT IT DOES:
  - Shows practice task cards based on user's level
  - Task types: Email, Letter, Report, Conversation, Article, Essay
  - Each card shows: type, description, credit reward
  - "Random Practice Task" button
  - Click card → /practice/:taskId
  - Fetches: dataService.getPracticeTemplates()

COMPONENTS USED:
  - Cards with icons per task type

BACKEND API:
  GET /api/practice/templates?level={level}
  Response: [{ task_id, type, title, prompt, credits }]
```

### 10. PracticeEditor.jsx
```
WHAT IT DOES:
  - Shows task prompt at top
  - MODE TOGGLE: "Live Suggestions" vs "After Analysis"
  - Text editor area for user to write

  MODE 1 — LIVE SUGGESTIONS:
    - As user types (debounced 500ms) → calls dataService.checkText(text, "practice_live")
    - Shows: RED underline = spelling error, YELLOW underline = grammar error
    - On HOVER: shows error TYPE only (e.g., "Spelling error - double letter issue")
    - Does NOT show the correct answer (it's practice!)
    - Button: "Submit for Full Analysis" → switches to analysis view

  MODE 2 — AFTER ANALYSIS:
    - User writes freely, no hints
    - Click "Submit" → dataService.submitPractice(taskId, text)
    - Shows PracticeResult view

  PRACTICE RESULT (shown after submit in either mode):
    - Overall score: X/10
    - Category breakdown: Spelling, Grammar, Sentence Structure, Tone, Completeness
    - Each error listed with: what you wrote → correct → explanation
    - Improved version of the text
    - Credits earned
    - Buttons: "Retry Same Task" | "New Practice Task" | "View Pattern"

COMPONENTS USED:
  - TextEditor (the writing area)
  - ProgressBar (score bars)

BACKEND API:
  POST /api/checker/check
  Body: { text, mode: "practice_live", context: "email" }
  Response: { errors: [{ type, word, position, hint }] }

  POST /api/practice/submit
  Body: { task_id, text, mode }
  Response: { score, category_scores, errors, improved_version, credits }
```

### 11. ProjectHome.jsx
```
WHAT IT DOES:
  - List of user's saved documents
  - Shows: title, type (journal/research/letter/email), word count, last edited
  - "+ New Document" button → creates new doc → navigates to editor
  - Click doc → /projects/:docId
  - Fetches: dataService.getProjects()
  - Create: dataService.createProject(title, type)

BACKEND API:
  GET  /api/project/list → [{ id, title, type, word_count, updated_at }]
  POST /api/project/create → { title, doc_type } → { id }
  DELETE /api/project/:id
```

### 12. ProjectEditor.jsx
```
WHAT IT DOES:
  - Left: Document list sidebar (mini)
  - Center: Rich text editor with toolbar (Bold, Italic, H1, H2, Lists)
  - Right: Coach Sidebar with suggestions

  EDITOR:
    - Auto-save every 2 minutes → dataService.saveProject(docId, content)
    - As user types (debounced 500ms) → dataService.checkText(text, "project")
    - RED underline = spelling, YELLOW underline = grammar
    - Word count shown at bottom

  COACH SIDEBAR (key difference from Practice):
    - Shows FULL suggestions with explanations (not just error type)
    - Each error has: what's wrong, why, correct version
    - [Fix] button to auto-apply correction
    - [Ignore] button to dismiss
    - Style tips and improvement suggestions
    - "Fix All Safe" button for obvious fixes

COMPONENTS USED:
  - TextEditor (editor area)
  - CoachSidebar (suggestion panel)

BACKEND API:
  GET  /api/project/:id → { title, content, doc_type }
  PUT  /api/project/:id → { content }  (auto-save)
  POST /api/checker/check → { text, mode: "project" } → { errors, suggestions }
```

### 13. AiChat.jsx
```
WHAT IT DOES:
  - Chat interface: message bubbles (user right, AI left)
  - Input box at bottom + Send button
  - Quick action buttons: "📊 My Progress", "❓ Grammar Question", "📝 Review Practice"
  - On mount: loads recent chat history → dataService.getChatHistory()
  - On send: dataService.sendChatMessage(message)
  - AI responds with personalized advice using user's learning data

  NOTE: AI has access to: learning patterns, scores, error patterns
        AI does NOT have: email, password, personal credentials
        This is handled by backend (context injection)

COMPONENTS USED:
  - ChatBubble (single message: user or AI)

BACKEND API:
  GET  /api/chat/history → [{ role, content, timestamp }]
  POST /api/chat/send → { message } → { response }
```

### 14. Analytics.jsx
```
WHAT IT DOES:
  - Period selector: Daily | Weekly | Monthly
  - Overview cards: Level, Accuracy %, Streak, Credits
  - Accuracy Over Time graph (line chart)
  - Error Pattern Analysis (bar chart: homophones, spelling, etc.)
  - Performance Metrics: Learning Mode stats vs Practice Mode stats
  - Achievements & Badges timeline
  - Fetches: dataService.getAnalytics(period)

COMPONENTS USED:
  - StatsCard (overview cards)
  - Recharts or Chart.js for graphs (AccuracyChart, ErrorBarChart inline)
  - ProgressBar (various stats)

BACKEND API:
  GET /api/analytics/overview?period=weekly
  Response: { stats, accuracy_graph, error_patterns, performance, badges }
```

### 15. Settings.jsx
```
WHAT IT DOES:
  - Sections: Profile, Appearance, Notifications, Security, Data Management
  - Profile: edit name, phone, role, upload picture
  - Appearance: dark mode toggle, font size, editor theme
  - Notifications: push, email, daily reminder time
  - Security: change password (current password + new + confirm)
  - Data: export learning data (JSON), clear chat, reset progress, delete account
  - All changes saved via respective API calls

BACKEND API:
  GET  /api/auth/profile → { user details }
  PUT  /api/auth/profile → { name, phone, role }
  PUT  /api/auth/change-password → { current_password, new_password }
  PUT  /api/settings/update → { theme, notifications, font_size }
  POST /api/settings/export-data → downloads JSON
  DELETE /api/auth/delete-account → { password confirmation }
```

---

## 🧩 Component Details

### MainLayout.jsx
```
WHAT: Wrapper for all protected pages
HOW: Checks AuthContext → if not authenticated → redirect to /login
     Renders: Sidebar (left) + Navbar (top) + {children} (page content)
```

### AuthLayout.jsx
```
WHAT: Wrapper for login/signup pages
HOW: Centered card layout with logo at top
     If already authenticated → redirect to /dashboard
```

### Sidebar.jsx
```
WHAT: Left navigation panel
ITEMS: Dashboard, Learning, Practice, Projects, AI Chat, Analytics, Settings
HOW: Uses react-router NavLink for active state highlighting
     Collapsible on mobile (hamburger menu in Navbar)
PROPS: none (uses useLocation for active route)
```

### Navbar.jsx
```
WHAT: Top bar
SHOWS: App logo/name + Notification bell (count) + User avatar + name
HOW: Notification count from API, Profile dropdown on avatar click
     Mobile: hamburger menu button to toggle Sidebar
```

### TextEditor.jsx
```
WHAT: The core writing area used in Practice + Project modes
HOW: Uses CodeMirror 6 for rich text editing
PROPS:
  - value (string): current text
  - onChange (function): called on text change
  - errors (array): list of errors to highlight
    Each error: { type: "spelling"|"grammar", start, end, message }
  - readOnly (boolean): disable editing
FEATURES:
  - RED underline decoration for spelling errors
  - YELLOW underline decoration for grammar errors
  - On hover over error: shows tooltip with hint/explanation
  - Toolbar: Bold, Italic, Underline, H1, H2, Bullet List, Numbered List
```

### CoachSidebar.jsx
```
WHAT: Right panel in ProjectEditor showing suggestions
PROPS:
  - errors (array): [{ type, original, correction, explanation, severity }]
  - onFix (function): called when user clicks [Fix] on an error
  - onIgnore (function): called when user clicks [Ignore]
  - suggestions (array): style tips and improvements
SHOWS:
  - Count summary: "3 Spelling, 2 Grammar, 1 Style"
  - Each error as a card with Fix/Ignore buttons
  - Style tips section
  - "Fix All Safe" button
```

### QuizQuestion.jsx
```
WHAT: Single quiz question with options
PROPS:
  - question (string): the question text
  - options (array): possible answers
  - correctAnswer (string): the correct one
  - onAnswer (function): called when user selects
  - showFeedback (boolean): show correct/wrong state
BEHAVIOR:
  - Options are radio buttons
  - On select: highlights green (correct) or red (wrong)
  - Shows explanation text when answered
```

### LevelCard.jsx
```
WHAT: Card for each level in LearningHome
PROPS:
  - level (number), title (string), topic (string)
  - status: "locked" | "available" | "in_progress" | "completed"
  - score (number), onClick (function)
SHOWS:
  - Level number + title
  - Status icon (🔒 locked, ▶ available, 📖 in progress, ✅ done)
  - Score if completed
  - Grayed out if locked
```

### ChatBubble.jsx
```
WHAT: Single chat message bubble
PROPS:
  - message (string), role ("user" | "assistant"), timestamp (string)
SHOWS:
  - User messages: right-aligned, colored background
  - AI messages: left-aligned, with robot icon
  - Timestamp below message
```

### StatsCard.jsx
```
WHAT: Dashboard stat card
PROPS:
  - title (string), value (string/number), icon (string), change (string)
SHOWS:
  - Icon + title + large value number + change indicator (↑/↓)
```

### ProgressBar.jsx
```
WHAT: Horizontal progress bar
PROPS:
  - value (number 0-100), label (string), color (string)
SHOWS:
  - Label text + percentage + filled bar
```

---

## 📡 Services — API Connections

### api.js (Base Axios Instance)
```javascript
// Creates axios instance with:
// - baseURL: import.meta.env.VITE_API_URL  (http://localhost:8000/api)
// - Interceptor: automatically adds Authorization header from localStorage
// - Response interceptor: if 401 → clear token → redirect to /login
```

### authService.js
```javascript
// All auth related API calls:
// - signup(data) → POST /api/auth/signup
// - login(email, password) → POST /api/auth/login
// - verifyOtp(email, otp) → POST /api/auth/verify-otp
// - resendOtp(email) → POST /api/auth/resend-otp
// - forgotPassword(email) → POST /api/auth/forgot-password
// - resetPassword(email, otp, newPassword) → POST /api/auth/reset-password
// - getProfile() → GET /api/auth/profile
// - updateProfile(data) → PUT /api/auth/profile
// - changePassword(current, new) → PUT /api/auth/change-password
// - submitAssessment(answers) → POST /api/auth/submit-assessment
// - deleteAccount(password) → DELETE /api/auth/delete-account
```

### dataService.js
```javascript
// ALL other API calls (combined for simplicity):

// --- Learning ---
// getAllLevels() → GET /api/learning/levels
// getLesson(levelId) → GET /api/learning/levels/:id
// submitQuiz(levelId, answers) → POST /api/learning/quiz/:id
// submitAssignment(levelId, text) → POST /api/learning/assignment/:id
// getAssessmentQuestions() → GET /api/auth/assessment-questions

// --- Practice ---
// getPracticeTemplates() → GET /api/practice/templates
// submitPractice(taskId, text, mode) → POST /api/practice/submit

// --- Checker (shared by Practice + Project) ---
// checkText(text, mode, context) → POST /api/checker/check

// --- Projects ---
// getProjects() → GET /api/project/list
// getProject(id) → GET /api/project/:id
// createProject(title, type) → POST /api/project/create
// saveProject(id, content) → PUT /api/project/:id
// deleteProject(id) → DELETE /api/project/:id

// --- Chat ---
// getChatHistory() → GET /api/chat/history
// sendMessage(message) → POST /api/chat/send

// --- Analytics ---
// getDashboardStats() → GET /api/analytics/dashboard
// getAnalytics(period) → GET /api/analytics/overview?period=weekly

// --- Settings ---
// updateSettings(data) → PUT /api/settings/update
// exportData() → POST /api/settings/export-data
```

---

## 🔁 Key Data Flows

### Flow 1: User Types in Editor → Errors Highlighted
```
User types → useDebounce(500ms) →
  dataService.checkText(text, mode) →
    POST /api/checker/check →
      Backend: LLM analysis (or fallback) →
        Response: { errors: [...] } →
          TextEditor receives errors →
            Renders RED/YELLOW underlines
```

### Flow 2: Practice Submit → Score + Analysis
```
User clicks "Submit" →
  dataService.submitPractice(taskId, text, mode) →
    POST /api/practice/submit →
      Backend: LLM detailed analysis →
        Response: { score, errors, improved_version } →
          PracticeEditor shows result view →
            Score bars + error cards + improved text
```

### Flow 3: AI Chat Message
```
User types message → Send →
  dataService.sendMessage(message) →
    POST /api/chat/send →
      Backend: queries DB for user context →
        Builds prompt with context →
          Calls LLM →
            Response: { reply } →
              ChatBubble rendered (AI side)
```

---

## 🎨 Styling Approach

```
TailwindCSS:
  - Dark mode: class-based (toggle via ThemeContext)
  - Custom colors in tailwind.config.js for brand
  - Responsive: mobile-first, sidebar collapses on small screens
  - animations: hover effects, transitions on nav, smooth scrolls

Key Design Tokens (tailwind.config.js):
  - primary: blue/indigo tones
  - success: green
  - warning: yellow (grammar errors)
  - danger: red (spelling errors)
  - dark mode: slate/gray backgrounds
```

---

## 📦 npm Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "axios": "^1",
    "@uiw/react-codemirror": "^4",
    "@codemirror/lang-markdown": "^6",
    "recharts": "^2",
    "react-toastify": "^10",
    "react-icons": "^5"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```
