# 📚 Learning Module — Complete Implementation Prompt

## Context For The AI

You are building the **Learning Module** for **WriteWisely** — a grammar and spelling coaching web app.

**Tech Stack:**
- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI + MongoDB (Motor async)
- Auth: JWT (token in localStorage, sent via axios interceptor)
- LLM: OpenRouter (already configured)

**What already exists:**
- Auth system (login, signup, OTP) ✅
- MainLayout with Sidebar and Navbar ✅
- MongoDB connected, `writewisely` database exists ✅
- `api.js` axios instance with JWT interceptor ✅
- `dataService.js` and `authService.js` exist ✅
- Tailwind configured with dark mode (class-based) ✅

**Lesson content for levels 1-5 is already in MongoDB** in the `lessons` collection. Levels 6-30 do not exist yet — show them as "Coming Soon."

---

## 🗄️ MongoDB — Data That Already Exists

### Collection: `lessons` (already seeded)
```json
{
  "_id": "ObjectId",
  "level": 1,
  "title": "Basic Spelling Rules",
  "category": "beginner",
  "content": {
    "sections": [
      {
        "heading": "Silent E Rule",
        "explanation": "When a word ends in silent 'e', drop the 'e' before adding '-ing' or '-ed'.",
        "examples": [
          { "correct": "writing", "wrong": "writeing", "rule": "drop the e" },
          { "correct": "making", "wrong": "makeing", "rule": "drop the e" }
        ],
        "memory_tip": "Think: the 'e' steps aside to let the suffix in!"
      }
    ]
  },
  "quiz": {
    "questions": [
      {
        "id": "l1q1",
        "question": "Which spelling is correct?",
        "options": ["writeing", "writing", "writting"],
        "correct": 1,
        "explanation": "Drop the silent 'e' before adding '-ing'"
      }
    ]
  },
  "assignment": {
    "prompt": "Write 3 sentences using words that follow the silent-e rule. Use words like: make/making, write/writing, hope/hoping.",
    "hints": ["Try: 'I am making a cake.' or 'She is writing a letter.'"]
  },
  "credits": {
    "lesson_complete": 10,
    "quiz_pass": 15,
    "quiz_perfect": 25,
    "assignment_submit": 15,
    "assignment_perfect": 30
  }
}
```

### Collection: `learning_progress` (created per user per level)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "level_number": 1,
  "topic": "basic_spelling_rules",
  "category": "beginner",
  "status": "not_started | in_progress | completed",
  "lesson_read": false,
  "quiz_completed": false,
  "quiz_score": 0,
  "quiz_total": 0,
  "assignment_submitted": false,
  "assignment_score": 0,
  "assignment_total": 0,
  "assignment_review": [],
  "credits_earned": 0,
  "started_at": null,
  "completed_at": null
}
```

### Collection: `error_patterns` (updated when assignment is graded)
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "error_type": "spelling",
  "error_subtype": "silent_e_rule",
  "original_word": "writeing",
  "correct_word": "writing",
  "frequency": 1,
  "last_occurred": "datetime",
  "source": "learning",
  "resolved": false
}
```

---

## 🗺️ Pages To Build

### Page 1: `/learn` → `LearningHome.jsx`
### Page 2: `/learn/:levelId` → `Lesson.jsx`

---

## 📄 PAGE 1: LearningHome.jsx — Full Specification

### What It Does
- Fetches all level definitions + user's progress for each
- Shows 30 levels in 3 sections: Beginner (1-10), Intermediate (11-20), Advanced (21-30)
- Levels 1-5: fully interactive (clickable, shows real data)
- Levels 6-30: "Coming Soon" (grayed out, not clickable)
- Each level card shows status: locked / available / in_progress / completed
- Clicking an available/in_progress/completed level → navigate to `/learn/:levelId`

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  📚 Learning Path                                           │
│  Your journey to grammar mastery                            │
│                                                             │
│  Overall Progress: ██░░░░░░░░ 2/30 levels  (progress bar)  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟢 BEGINNER  (Levels 1–10)                                 │
│  ─────────────────────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ ✅ L1   │ │ 📖 L2   │ │ ▶ L3    │ │ 🔒 L4   │  ...   │
│  │ Basic   │ │ Common  │ │ Capital-│ │ Coming  │         │
│  │ Spelling│ │ Misspell│ │ ization │ │ Soon    │         │
│  │ 25/25 ⭐│ │ 15/25 ⭐│ │ Start → │ │         │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  🟡 INTERMEDIATE  (Levels 11–20)                            │
│  ─────────────────────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐  ...all coming soon...           │
│  │ 🔒 L11  │ │ 🔒 L12  │                                   │
│  │ Advanced │ │ Complex │                                   │
│  │ Punct.  │ │ Sentences│                                   │
│  │ Coming  │ │ Coming  │                                   │
│  │ Soon    │ │ Soon    │                                   │
│  └──────────┘ └──────────┘                                  │
│                                                             │
│  🔴 ADVANCED  (Levels 21–30)                                │
│  ─────────────────────────────────────────────────────────  │
│  ... all coming soon ...                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Level Card States
```
COMPLETED ✅
  - Green border
  - ✅ icon top right
  - Shows: title, score (e.g. "Score: 23/25"), credits earned
  - Fully clickable → goes to lesson (can review/redo)

IN_PROGRESS 📖
  - Blue border, pulsing dot
  - Shows: title, "Continue →"
  - Shows progress (e.g. "Quiz done, Assignment pending")
  - Fully clickable

AVAILABLE ▶
  - White/default border
  - Shows: title, "Start →"
  - Clickable

COMING SOON 🔒 (levels 6-30)
  - Gray, muted colors
  - 🔒 icon
  - Shows: title, "Coming Soon"
  - NOT clickable, cursor default
  - No hover effect
```

### API Call
```javascript
// dataService.js
getAllLevels()  →  GET /api/learning/levels
// Returns:
[
  {
    level_id: 1,
    title: "Basic Spelling Rules",
    category: "beginner",
    topic: "basic_spelling_rules",
    status: "completed",        // from learning_progress
    quiz_score: 5,
    quiz_total: 5,
    credits_earned: 25,
    available: true             // true for 1-5, false for 6-30
  },
  ...
]
```

---

## 📄 PAGE 2: Lesson.jsx — Full Specification

### What It Does
- Loads lesson content from backend
- Has 3 SECTIONS shown as steps/tabs (user moves through them):
  1. **LESSON** — read the content
  2. **QUIZ** — answer questions (instant feedback)
  3. **ASSIGNMENT** — write sentences, submit for review
- Progress through sections is LINEAR (must complete previous to unlock next)
- Awards credits at each step
- On full completion → marks level as "completed" → credits awarded → user can go back to LearningHome

### UI Layout — Overall Shell
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Levels    📚 Level 1: Basic Spelling Rules           │
│                       🟢 Beginner                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step Progress:                                                 │
│  [1. Lesson ✅] ──── [2. Quiz 📖] ──── [3. Assignment 🔒]      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [SECTION CONTENT CHANGES BASED ON ACTIVE STEP]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SECTION 1: LESSON CONTENT
```
┌─────────────────────────────────────────────────────────────────┐
│  📖 LESSON CONTENT                          +10 ⭐ on complete  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─── Section: Silent E Rule ──────────────────────────────┐   │
│  │                                                         │   │
│  │  When a word ends in silent 'e', drop the 'e' before    │   │
│  │  adding '-ing' or '-ed'.                                │   │
│  │                                                         │   │
│  │  ┌── Examples ──────────────────────────────────────┐  │   │
│  │  │  ❌ writeing    ✅ writing    (drop the e)        │  │   │
│  │  │  ❌ makeing     ✅ making     (drop the e)        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  💡 Memory Tip:                                        │   │
│  │  Think: the 'e' steps aside to let the suffix in!      │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [More sections render below if lesson has multiple sections]   │
│                                                                 │
│                      [I've read this → Go to Quiz →] (+10 ⭐)  │
└─────────────────────────────────────────────────────────────────┘
```

### SECTION 2: QUIZ
```
┌─────────────────────────────────────────────────────────────────┐
│  🧠 QUIZ                                    +15 ⭐ on pass      │
│  Answer all questions. Instant feedback shown after each.       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Question 1 of 5:                                               │
│  "Which spelling is correct?"                                   │
│                                                                 │
│  ○ writeing                                                     │
│  ● writing        ← user selected                               │
│  ○ writting                                                     │
│                                                                 │
│  ✅ Correct! Drop the silent 'e' before adding '-ing'           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Question 2 of 5: ...                                           │
│                                                                 │
│  [Answer all questions to see Submit button]                    │
│                                                                 │
│  [Submit Quiz →]  (appears when all answered)                   │
│                                                                 │
│  [After submit:]                                                │
│  Score: 4/5  ✅ Passed!  +15 ⭐ earned                         │
│  [Go to Assignment →]                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Quiz Rules:**
- Each question shows instantly after selection: ✅ correct (green) or ❌ wrong (red) + explanation
- User can still change answer before submitting
- Submit → calls backend → gets score → awards credits
- Pass = score >= 70% → unlocks Assignment tab
- Perfect = 100% → extra credits
- If fail → can retry (button: "Retry Quiz")

### SECTION 3: ASSIGNMENT
```
┌─────────────────────────────────────────────────────────────────┐
│  ✍️ ASSIGNMENT                             +15 ⭐ on submit     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Task:                                                       │
│  Write 3 sentences using words that follow the silent-e rule.   │
│  Use words like: make/making, write/writing, hope/hoping.       │
│                                                                 │
│  💡 Hints:                                                      │
│  Try: "I am making a cake." or "She is writing a letter."       │
│                                                                 │
│  ┌─── Your Answer ───────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  [Textarea — min 3 lines, resizable]                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Submit Assignment →]  (+15 ⭐)                                │
│                                                                 │
│  ─────────────── [After Submit] ──────────────────────────────  │
│                                                                 │
│  📊 Review:                                                     │
│                                                                 │
│  Sentence 1: "I am makeing a cake."                             │
│  ❌ Error: "makeing" → "making" (drop the silent e)             │
│                                                                 │
│  Sentence 2: "She is writing a letter."                         │
│  ✅ Correct!                                                    │
│                                                                 │
│  Sentence 3: "He is hoping for good weather."                   │
│  ✅ Correct!                                                    │
│                                                                 │
│  Score: 2/3   Credits Earned: +10 ⭐                           │
│                                                                 │
│  [🏆 Level Complete! Back to Levels →]                          │
│  OR [Retry Assignment] if score is 0                           │
└─────────────────────────────────────────────────────────────────┘
```

**Assignment Rules:**
- Textarea minimum 20 characters to enable submit button
- Submit → backend sends to LLM for grading → returns sentence-by-sentence review
- Each sentence: ✅ correct or ❌ with error + explanation
- Score = correct sentences / total sentences
- Credits based on score:
  - Any submission: +15
  - All correct: +30 (instead of +15)
- After submit → show full review → show "Level Complete" button
- "Level Complete" → marks learning_progress as completed → navigates to /learn

---

## 🔧 Backend — Complete Implementation

### routes/learning.py — All Endpoints

#### GET /api/learning/levels
```python
# PURPOSE: Return all 30 level definitions + user's progress status
# AUTH: Required (get user_id from JWT)

# LOGIC:
# 1. Get all lesson definitions from `lessons` collection (levels 1-5 exist)
# 2. Get all user's learning_progress documents
# 3. For levels 1-5:
#    - Check if user has a learning_progress doc for this level
#    - Determine status:
#      * No progress doc + level 1 → "available"
#      * No progress doc + previous level completed → "available"
#      * No progress doc + previous level NOT completed → "locked"
#      * Has progress, status="in_progress" → "in_progress"
#      * Has progress, status="completed" → "completed"
# 4. For levels 6-30:
#    - Return as "coming_soon" with hardcoded titles (see Level Definitions below)
#    - available: false
# 5. Return full list of 30 items

# RESPONSE:
[
  {
    "level_id": 1,
    "title": "Basic Spelling Rules",
    "category": "beginner",
    "topic": "basic_spelling_rules",
    "status": "completed",
    "quiz_score": 5,
    "quiz_total": 5,
    "credits_earned": 25,
    "available": true
  },
  {
    "level_id": 6,
    "title": "Apostrophes & Contractions",
    "category": "beginner",
    "status": "coming_soon",
    "available": false
  }
]
```

#### GET /api/learning/levels/:id
```python
# PURPOSE: Get full lesson content for a specific level
# AUTH: Required
# ONLY WORKS for levels 1-5 (content exists in DB)
# If level 6-30 requested → return 404

# LOGIC:
# 1. Find lesson in `lessons` collection by level number
# 2. Find user's learning_progress for this level (create if doesn't exist)
# 3. If creating new progress doc → set status="in_progress", started_at=now
# 4. Return lesson content + user's current progress

# RESPONSE:
{
  "lesson": {
    "level": 1,
    "title": "Basic Spelling Rules",
    "category": "beginner",
    "content": { "sections": [...] },
    "quiz": { "questions": [...] },
    "assignment": { "prompt": "...", "hints": [...] },
    "credits": { "lesson_complete": 10, "quiz_pass": 15, ... }
  },
  "progress": {
    "lesson_read": false,
    "quiz_completed": false,
    "quiz_score": 0,
    "quiz_total": 0,
    "assignment_submitted": false,
    "assignment_score": 0,
    "assignment_review": [],
    "credits_earned": 0,
    "status": "in_progress"
  }
}
```

#### POST /api/learning/lesson/:id/complete
```python
# PURPOSE: Mark lesson as read → award +10 credits
# AUTH: Required
# BODY: {} (empty)

# LOGIC:
# 1. Find learning_progress for user + level
# 2. If lesson_read already true → return current state (no double credit)
# 3. Set lesson_read = true
# 4. Add +10 credits via pattern_service.add_credits(user_id, 10, "lesson_read")
# 5. Update credits_earned in learning_progress
# 6. Return updated progress + credits_earned

# RESPONSE:
{
  "message": "Lesson marked as read",
  "credits_earned": 10,
  "total_credits": 460,
  "progress": { "lesson_read": true, ... }
}
```

#### POST /api/learning/quiz/:id
```python
# PURPOSE: Submit quiz answers → get score → award credits
# AUTH: Required
# BODY: { "answers": [{ "question_id": "l1q1", "selected": 1 }] }

# LOGIC:
# 1. Find lesson in `lessons` collection → get correct answers
# 2. Compare user answers with correct answers
# 3. Calculate score and total
# 4. Determine if passed (score/total >= 0.7)
# 5. If quiz_completed already in progress → allow retry but don't re-award credits
# 6. If first time completing:
#    - Pass: award +15 credits
#    - Perfect (100%): award +25 credits (instead of +15)
# 7. Update learning_progress:
#    - quiz_completed = true
#    - quiz_score = score
#    - quiz_total = total
#    - Add credits to credits_earned
# 8. Return results with per-question feedback

# RESPONSE:
{
  "score": 4,
  "total": 5,
  "passed": true,
  "perfect": false,
  "credits_earned": 15,
  "total_credits": 475,
  "results": [
    {
      "question_id": "l1q1",
      "correct": true,
      "user_answer": 1,
      "correct_answer": 1,
      "explanation": "Drop the silent 'e' before adding '-ing'"
    }
  ]
}
```

#### POST /api/learning/assignment/:id
```python
# PURPOSE: Submit assignment text → LLM grades it → return review → award credits
# AUTH: Required
# BODY: { "text": "I am making a cake. She is writing..." }

# LOGIC:
# 1. Check assignment not already submitted (no re-submission for credit)
# 2. Get lesson from DB → get assignment prompt
# 3. Call LLM via llm_service with assignment grading prompt:
#    - Send: assignment prompt + user's submitted text
#    - Get back: sentence-by-sentence review JSON
# 4. Parse LLM response → extract sentence reviews
# 5. Calculate score: correct_sentences / total_sentences
# 6. Award credits:
#    - Any valid submission: +15
#    - All correct (100%): +30 instead
# 7. Save to learning_progress:
#    - assignment_submitted = true
#    - assignment_score = correct count
#    - assignment_total = total sentences
#    - assignment_review = [{sentence, correct, error, explanation}]
#    - status = "completed"
#    - completed_at = now
# 8. Extract errors → save to error_patterns via pattern_service
# 9. Update user streak via pattern_service.update_streak(user_id)
# 10. Return review

# LLM PROMPT for assignment grading:
"""
You are grading a writing assignment for a {user_level} student.

Lesson Topic: {lesson_title}
Assignment Prompt: {assignment_prompt}

Student's submission:
{submitted_text}

Grade each sentence. Return JSON:
{
  "sentences": [
    {
      "text": "the student's sentence",
      "correct": true/false,
      "errors": [
        {
          "original": "wrong word",
          "correction": "right word",
          "error_type": "spelling|grammar|word_choice",
          "explanation": "brief friendly explanation"
        }
      ]
    }
  ],
  "overall_feedback": "brief encouraging message"
}

Rules:
- Be encouraging
- Only flag clear errors related to the lesson topic
- If sentence is correct, errors array is empty
"""

# RESPONSE:
{
  "score": 2,
  "total": 3,
  "credits_earned": 15,
  "total_credits": 490,
  "level_completed": true,
  "review": {
    "sentences": [
      {
        "text": "I am makeing a cake.",
        "correct": false,
        "errors": [
          {
            "original": "makeing",
            "correction": "making",
            "error_type": "spelling",
            "explanation": "Drop the silent 'e' before adding '-ing'"
          }
        ]
      },
      {
        "text": "She is writing a letter.",
        "correct": true,
        "errors": []
      }
    ],
    "overall_feedback": "Great effort! You correctly applied the rule in 2 out of 3 sentences."
  }
}
```

---

## 🔧 Services to Update

### pattern_service.py — add_credits function
```python
# Already planned — make sure it:
# 1. Increments users.profile.total_credits by amount
# 2. Recalculates rank based on new total
# 3. Checks badge eligibility:
#    - first_steps: first lesson read
#    - bookworm: 5 lessons completed
# 4. Saves new badge to badges collection if earned
# 5. Returns new total_credits + any badges earned
```

---

## 🧩 Frontend Components To Build

### LevelCard.jsx
```
PROPS:
  - level (number)
  - title (string)
  - category (string: "beginner"|"intermediate"|"advanced")
  - status (string: "completed"|"in_progress"|"available"|"coming_soon")
  - quizScore (number), quizTotal (number)
  - creditsEarned (number)
  - onClick (function)

RENDER LOGIC:
  if status === "coming_soon":
    → gray card, lock icon, "Coming Soon" badge, no hover, cursor-default
  if status === "completed":
    → green border, ✅ icon, show score and credits
  if status === "in_progress":
    → blue border, 📖 icon, "Continue →" button
  if status === "available":
    → default border, ▶ icon, "Start →" button
```

### QuizQuestion.jsx
```
PROPS:
  - question (string)
  - options (array of strings)
  - questionNumber (number)
  - totalQuestions (number)
  - onAnswer (function: called with selected index)
  - showFeedback (boolean)
  - isCorrect (boolean)
  - explanation (string)
  - correctAnswer (number index)

BEHAVIOR:
  - Before answer: radio buttons, all white
  - After answer selected:
    * Selected option: green (if correct) or red (if wrong)
    * Correct option always shown green when wrong answer given
    * Explanation text shown below
  - Can still click other options before quiz submitted
```

### ProgressStepper.jsx (new component)
```
PROPS:
  - steps: ["Lesson", "Quiz", "Assignment"]
  - currentStep (0|1|2)
  - completedSteps (array of completed step indexes)

RENDER:
  Shows 3 circles connected by lines:
  ✅ Lesson  ──── 📖 Quiz (active) ──── 🔒 Assignment
  
  Colors:
  - Completed: green circle with checkmark
  - Active: blue circle with step icon, pulsing
  - Locked: gray circle with lock icon
```

---

## 📡 Frontend Service Functions

### Add to dataService.js:
```javascript
// Learning
getAllLevels()          → GET /api/learning/levels
getLesson(levelId)      → GET /api/learning/levels/:id
markLessonRead(levelId) → POST /api/learning/lesson/:id/complete
submitQuiz(levelId, answers) → POST /api/learning/quiz/:id
submitAssignment(levelId, text) → POST /api/learning/assignment/:id
```

---

## 🎨 Styling Rules

```
Colors:
  Beginner category: green tones (border-green-500, bg-green-50)
  Intermediate: yellow/amber tones (border-yellow-500, bg-yellow-50)
  Advanced: red tones (border-red-500, bg-red-50)
  Coming Soon: gray (border-gray-200, bg-gray-50, text-gray-400)

Cards:
  - Rounded corners (rounded-xl)
  - Shadow on hover for clickable cards
  - Smooth transition on hover
  - Dark mode compatible (dark:bg-gray-800 etc.)

Step sections:
  - Each section in a white card (dark: dark:bg-gray-800)
  - Clear heading with icon
  - Credit badge shown top right: "+10 ⭐"

Quiz feedback:
  - Correct: bg-green-100 border-green-500 text-green-800
  - Wrong: bg-red-100 border-red-500 text-red-800
  - Explanation: italic, muted color

Assignment review:
  - Correct sentence: green left border + ✅
  - Wrong sentence: red left border + ❌ + error details
```

---

## ⚠️ Important Rules

```
1. CREDITS: Never double-award. Check if action already rewarded before adding.

2. LEVEL UNLOCK: Level N only available if level N-1 is "completed".
   Level 1 is always available.

3. COMING SOON (levels 6-30): These cards are display only.
   No click handler. No API call. Grayed out visually.

4. QUIZ RETRY: User can retry quiz. But credits only awarded on FIRST pass.
   Track this in learning_progress.quiz_completed field.

5. ASSIGNMENT: One submission only (for credit purposes).
   Show "Already submitted" if user tries to resubmit.
   Show previous review if already submitted.

6. PROGRESS STATE: When user returns to a lesson they started:
   - Show which steps are already done (lesson read, quiz done)
   - Don't re-award credits
   - Allow review of completed sections

7. ERROR PATTERNS: Every error from assignment grading must be saved
   to error_patterns collection. This feeds Analytics + AI Chat.

8. STREAK: Update user's streak on lesson/quiz/assignment completion
   (call pattern_service.update_streak).
```

---

## 🏗️ Level Definitions (Hardcoded for Coming Soon display)

```python
ALL_LEVELS = [
  # BEGINNER (content exists in DB for 1-5)
  {"level": 1, "title": "Basic Spelling Rules", "category": "beginner"},
  {"level": 2, "title": "Common Misspellings", "category": "beginner"},
  {"level": 3, "title": "Capitalization Rules", "category": "beginner"},
  {"level": 4, "title": "Basic Punctuation", "category": "beginner"},
  {"level": 5, "title": "Subject-Verb Agreement", "category": "beginner"},
  # Coming Soon
  {"level": 6, "title": "Apostrophes & Contractions", "category": "beginner"},
  {"level": 7, "title": "Articles (a, an, the)", "category": "beginner"},
  {"level": 8, "title": "Basic Tenses", "category": "beginner"},
  {"level": 9, "title": "Common Homophones", "category": "beginner"},
  {"level": 10, "title": "Beginner Assessment", "category": "beginner"},
  # INTERMEDIATE
  {"level": 11, "title": "Advanced Punctuation", "category": "intermediate"},
  {"level": 12, "title": "Complex Sentences", "category": "intermediate"},
  {"level": 13, "title": "Active vs Passive Voice", "category": "intermediate"},
  {"level": 14, "title": "Commonly Confused Words", "category": "intermediate"},
  {"level": 15, "title": "Paragraph Structure", "category": "intermediate"},
  {"level": 16, "title": "Transition Words", "category": "intermediate"},
  {"level": 17, "title": "Advanced Tenses", "category": "intermediate"},
  {"level": 18, "title": "Prepositions", "category": "intermediate"},
  {"level": 19, "title": "Formal vs Informal Writing", "category": "intermediate"},
  {"level": 20, "title": "Intermediate Assessment", "category": "intermediate"},
  # ADVANCED
  {"level": 21, "title": "Style & Tone", "category": "advanced"},
  {"level": 22, "title": "Conciseness", "category": "advanced"},
  {"level": 23, "title": "Advanced Punctuation (Em Dash)", "category": "advanced"},
  {"level": 24, "title": "Parallel Structure", "category": "advanced"},
  {"level": 25, "title": "Conditional Sentences", "category": "advanced"},
  {"level": 26, "title": "Academic Writing", "category": "advanced"},
  {"level": 27, "title": "Business Writing", "category": "advanced"},
  {"level": 28, "title": "Creative Writing Techniques", "category": "advanced"},
  {"level": 29, "title": "Editing & Proofreading", "category": "advanced"},
  {"level": 30, "title": "Final Assessment", "category": "advanced"},
]
```

---

## ✅ Definition of Done

```
LearningHome:
  ✅ Shows all 30 levels in 3 sections
  ✅ Levels 1-5 show real status from DB
  ✅ Levels 6-30 show as "Coming Soon" (grayed, not clickable)
  ✅ Overall progress bar works
  ✅ Clicking available level → navigates to lesson

Lesson Page:
  ✅ 3-step flow: Lesson → Quiz → Assignment
  ✅ Step progress indicator at top
  ✅ Lesson content renders correctly (sections, examples, memory tip)
  ✅ "Mark as Read" button awards +10 credits (once only)
  ✅ Quiz works with instant per-question feedback
  ✅ Quiz submit → score shown → credits awarded (once only)
  ✅ Assignment textarea → submit → LLM review → sentence-by-sentence feedback
  ✅ Assignment credits awarded (once only)
  ✅ Level marked complete after assignment submitted
  ✅ "Back to Levels" after completion → LearningHome refreshes with new status
  ✅ Returning to completed lesson → shows completed state, no re-credit

Backend:
  ✅ GET /api/learning/levels → all 30 with correct status
  ✅ GET /api/learning/levels/:id → lesson content + progress
  ✅ POST /api/learning/lesson/:id/complete → +10 credits
  ✅ POST /api/learning/quiz/:id → score + credits
  ✅ POST /api/learning/assignment/:id → LLM review + credits + error patterns saved
  ✅ Credits never double-awarded
  ✅ error_patterns updated on assignment errors
  ✅ Streak updated on completion
```