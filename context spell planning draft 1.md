\# 🎓 Contextual Spell & Grammar Coach - Complete Product Blueprint

\## Let me organize your entire vision systematically:

\-\--

\## 🏗️ HIGH-LEVEL ARCHITECTURE

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ COMPLETE SYSTEM │

│ │

│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │

│ │ AUTH & │ │ LEARNING │ │ PRACTICE │ │ PROJECT │ │

│ │ PROFILE │ │ MODE │ │ MODE │ │ (DOCS) │ │

│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │

│ │ │ │ │ │

│ ┌────┴──────────────┴──────────────┴──────────────┴─────┐ │

│ │ CORE ENGINE │ │

│ │ ┌─────────┐ ┌──────────┐ ┌────────────────────┐ │ │

│ │ │ LLM │ │ Edit │ │ Pattern/Analytics │ │ │

│ │ │ Primary │ │ Distance │ │ Engine │ │ │

│ │ │ │ │ Fallback │ │ │ │ │

│ │ └─────────┘ └──────────┘ └────────────────────┘ │ │

│ └───────────────────────────────────────────────────────┘ │

│ │ │ │ │ │

│ ┌────┴──────────────┴──────────────┴──────────────┴─────┐ │

│ │ ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ │ │

│ │ │ AI │ │ANALYTICS│ │GAMIFI- │ │ SETTINGS │ │ │

│ │ │ CHAT │ │ │ │CATION │ │ │ │ │

│ │ └────────┘ └─────────┘ └────────┘ └──────────┘ │ │

│ └───────────────────────────────────────────────────────┘ │

│ │ │

│ ┌────┴────┐ │

│ │ DB │ │

│ │(MongoDB/│ │

│ │ Postgres)│ │

│ └─────────┘ │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 📱 MODULE 1: AUTHENTICATION & ONBOARDING

\### 1A. Signup Flow

\`\`\`

┌─────────────────────────────────────────────────┐

│ SIGN UP │

│ │

│ Step 1: Credentials │

│ ┌────────────────────────────────────┐ │

│ │ 👤 Full Name: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│ │

│ │ 📧 Email: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│ │

│ │ 📱 Phone: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│ │

│ │ 🔒 Password: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│ │

│ │ 🔒 Confirm: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│ │

│ │ 💼 Role/Occupation: \[Dropdown\_\_\_\_\]│ │

│ │ - Student │ │

│ │ - Professional │ │

│ │ - Writer │ │

│ │ - Teacher │ │

│ │ - Other │ │

│ │ │ │

│ │ \[Sign Up →\] │ │

│ └────────────────────────────────────┘ │

│ │

│ Step 2: Email OTP Verification │

│ ┌────────────────────────────────────┐ │

│ │ 📧 OTP sent to user@email.com │ │

│ │ │ │

│ │ \[\_\] \[\_\] \[\_\] \[\_\] \[\_\] \[\_\] │ │

│ │ │ │

│ │ Resend OTP (30s) │ │

│ │ \[Verify →\] │ │

│ └────────────────────────────────────┘ │

│ │

│ Step 3: Level Assessment │

│ ┌────────────────────────────────────┐ │

│ │ 📝 Let\'s find your current level! │ │

│ │ │ │

│ │ Q1: Choose the correct sentence: │ │

│ │ ○ Their going to the store │ │

│ │ ○ They\'re going to the store ✓ │ │

│ │ ○ There going to the store │ │

│ │ │ │

│ │ Q2: Spot the error: │ │

│ │ \"I should of went to school\" │ │

│ │ \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\] │ │

│ │ │ │

│ │ Q3-Q10: \... (mix of difficulty) │ │

│ │ │ │

│ │ ── OR ── │ │

│ │ \[Skip & Start from Beginning\] │ │

│ │ │ │

│ │ \[Submit Assessment →\] │ │

│ └────────────────────────────────────┘ │

│ │

│ Step 4: Result │

│ ┌────────────────────────────────────┐ │

│ │ 🎯 Your Level: INTERMEDIATE │ │

│ │ │ │

│ │ Score: 6/10 │ │

│ │ Strong: Spelling, Basic Grammar │ │

│ │ Weak: Homophones, Punctuation │ │

│ │ │ │

│ │ We\'ll customize your learning! │ │

│ │ │ │

│ │ \[Go to Dashboard →\] │ │

│ └────────────────────────────────────┘ │

└─────────────────────────────────────────────────┘

\`\`\`

\### 1B. Login & Password Recovery

\`\`\`

┌─────────────────────────────────┐

│ LOGIN │

│ │

│ 📧 Email: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│

│ 🔒 Password: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]│

│ │

│ \[Login\] │

│ │

│ Forgot Password? │

│ ┌───────────────────────┐ │

│ │ Enter email → OTP → │ │

│ │ New Password → Confirm│ │

│ │ \[Resend OTP available\]│ │

│ └───────────────────────┘ │

└─────────────────────────────────┘

\`\`\`

\### Backend Schema - User

\`\`\`json

{

\"user\": {

\"id\": \"uuid\",

\"name\": \"John Doe\",

\"email\": \"john@email.com\",

\"phone\": \"+1234567890\",

\"password_hash\": \"bcrypt_hash\",

\"email_verified\": true,

\"role\": \"student\",

\"created_at\": \"2025-01-15T10:00:00Z\",

\"profile\": {

\"current_level\": \"intermediate\",

\"assessment_score\": 6,

\"strengths\": \[\"spelling\", \"basic_grammar\"\],

\"weaknesses\": \[\"homophones\", \"punctuation\"\],

\"total_credits\": 450,

\"badges\": \[\"first_login\", \"week_streak_3\"\],

\"learning_streak\": 5,

\"joined_date\": \"2025-01-15\"

},

\"settings\": {

\"theme\": \"dark\",

\"notifications_enabled\": true,

\"email_notifications\": true,

\"password_last_changed\": \"2025-01-15\",

\"data_sharing\": {

\"learning_pattern_visible\": true,

\"share_achievements\": true

}

}

}

}

\`\`\`

\-\--

\## 📱 MODULE 2: DASHBOARD

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ ┌─────────┐ 🔔(3) 👤 John │

│ │ LOGO │ Contextual Grammar Coach │

│ └─────────┘ │

├──────────────┬──────────────────────────────────────────────────┤

│ │ │

│ SIDEBAR │ 👋 Welcome back, John! │

│ │ 🔥 5 day streak! Keep it up! │

│ ┌────────┐ │ │

│ │📊 Dash │◄─│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │

│ │ board │ │ │ Level │ │ Credits │ │ Accuracy │ │

│ ├────────┤ │ │ INTER- │ │ 450 │ │ 78% │ │

│ │📚 Learn│ │ │ MEDIATE │ │ ⭐ │ │ 📈 │ │

│ │ Mode │ │ └──────────┘ └──────────┘ └──────────┘ │

│ ├────────┤ │ │

│ │✍️ Prac-│ │ ┌─── Continue Learning ───────────────┐ │

│ │ tice │ │ │ 📖 Lesson 12: Punctuation Rules │ │

│ ├────────┤ │ │ Progress: ████████░░ 80% │ │

│ │📄 Proj-│ │ │ \[Continue →\] │ │

│ │ ects │ │ └──────────────────────────────────────┘ │

│ ├────────┤ │ │

│ │💬 AI │ │ ┌─── Recent Activity ─────────────────┐ │

│ │ Chat │ │ │ ✅ Completed: Homophones Quiz (9/10)│ │

│ ├────────┤ │ │ 📝 Practice: Email Writing (7/10) │ │

│ │📈 Ana- │ │ │ 📄 Project: Research Paper (draft) │ │

│ │ lytics │ │ └──────────────────────────────────────┘ │

│ ├────────┤ │ │

│ │⚙️ Set- │ │ ┌─── Quick Stats ─────────────────────┐ │

│ │ tings │ │ │ This Week: │ │

│ └────────┘ │ │ Lessons: 3 \| Quizzes: 5 │ │

│ │ │ Errors Fixed: 47 \| New Words: 12 │ │

│ │ └──────────────────────────────────────┘ │

└──────────────┴──────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 📚 MODULE 3: LEARNING MODE

\### 3A. Learning Structure

\`\`\`

LEARNING PATH (Levels)

│

├── 🟢 BEGINNER (Levels 1-10)

│ ├── L1: Basic Spelling Rules

│ ├── L2: Common Misspellings

│ ├── L3: Capitalization Rules

│ ├── L4: Basic Punctuation (Period, Comma)

│ ├── L5: Subject-Verb Agreement

│ ├── L6: Singular vs Plural

│ ├── L7: Articles (a, an, the)

│ ├── L8: Basic Tenses (Past, Present, Future)

│ ├── L9: Common Homophones (their/there/they\'re)

│ └── L10: 🏆 Beginner Assessment

│

├── 🟡 INTERMEDIATE (Levels 11-20)

│ ├── L11: Advanced Punctuation (Semicolons, Colons)

│ ├── L12: Complex Sentences

│ ├── L13: Active vs Passive Voice

│ ├── L14: Commonly Confused Words

│ ├── L15: Paragraph Structure

│ ├── L16: Transition Words

│ ├── L17: Advanced Tenses

│ ├── L18: Prepositions

│ ├── L19: Formal vs Informal Writing

│ └── L20: 🏆 Intermediate Assessment

│

├── 🔴 ADVANCED (Levels 21-30)

│ ├── L21: Style & Tone

│ ├── L22: Conciseness

│ ├── L23: Advanced Punctuation (Em dash, etc.)

│ ├── L24: Parallel Structure

│ ├── L25: Conditional Sentences

│ ├── L26: Academic Writing

│ ├── L27: Business Writing

│ ├── L28: Creative Writing Techniques

│ ├── L29: Editing & Proofreading Skills

│ └── L30: 🏆 Final Assessment

│

└── 🎓 MASTERY

\`\`\`

\### 3B. Lesson Page UI

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ 📚 Learning Mode \> Intermediate \> L14: Commonly Confused Words│

│ │

│ Progress: ████████████░░░░ 75% ⭐ +20 credits │

├──────────────────────────────────────────────────────────────────┤

│ │

│ ┌─── LESSON CONTENT ──────────────────────────────────────┐ │

│ │ │ │

│ │ 📖 AFFECT vs EFFECT │ │

│ │ │ │

│ │ AFFECT (verb) = to influence │ │

│ │ \"The weather affects my mood.\" │ │

│ │ │ │

│ │ EFFECT (noun) = a result │ │

│ │ \"The medicine had a positive effect.\" │ │

│ │ │ │

│ │ 💡 Memory Trick: │ │

│ │ Affect = Action (both start with A) │ │

│ │ Effect = End result (both start with E) │ │

│ │ │ │

│ │ ┌─── EXAMPLES ─────────────────────────────────┐ │ │

│ │ │ ✅ \"The noise affected my concentration.\" │ │ │

│ │ │ ✅ \"The effect of the noise was significant.\" │ │ │

│ │ │ ❌ \"The noise effected my concentration.\" │ │ │

│ │ └───────────────────────────────────────────────┘ │ │

│ │ │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── QUICK QUIZ (In-Lesson) ──────────────────────────────┐ │

│ │ │ │

│ │ Fill in the blank: │ │

│ │ \"The rain \_\_\_\_\_\_\_ the game schedule.\" │ │

│ │ │ │

│ │ ○ affected ← ✅ Correct! +5 credits │ │

│ │ ○ effected │ │

│ │ │ │

│ │ 📖 \"Affect is the verb (action word). The rain │ │

│ │ is DOING something to the schedule.\" │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── MINI ASSIGNMENT ─────────────────────────────────────┐ │

│ │ │ │

│ │ ✍️ Write 3 sentences using affect/effect correctly: │ │

│ │ │ │

│ │ 1.
\[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]
│ │

│ │ 2.
\[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]
│ │

│ │ 3.
\[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]
│ │

│ │ │ │

│ │ \[Submit Assignment →\] (+15 credits) │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ \[← Previous Lesson\] \[Next Lesson →\] │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\### 3C. Assignment Review (After Submission)

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ 📝 Assignment Review - L14: Commonly Confused Words │

│ │

│ Your Submission: │

│ │

│ 1. \"The medicine had a good affect on me.\" │

│ ❌ ERROR: \"affect\" → \"effect\" │

│ 📖 Here you need a NOUN (result). \"Effect\" is the noun. │

│ \"Affect\" is the verb. The medicine produced a RESULT │

│ (effect), it didn\'t perform an action. │

│ │

│ 2. \"Climate change effects everyone.\" │

│ ❌ ERROR: \"effects\" → \"affects\" │

│ 📖 Here you need a VERB (action). Climate change is │

│ DOING something to everyone = affects (verb). │

│ │

│ 3. \"The effect of studying was visible.\" │

│ ✅ CORRECT! Well done! │

│ 📖 Perfect use! \"Effect\" as a noun meaning \"result.\" │

│ │

│ ┌─── SCORE ────────────────────┐ │

│ │ Score: 1/3 correct │ │

│ │ Credits earned: +5 (partial)│ │

│ │ Area to review: affect/ │ │

│ │ effect distinction │ │

│ │ \[Retry Assignment\] │ │

│ │ \[Move to Next Lesson →\] │ │

│ └──────────────────────────────┘ │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\### Backend: Learning Pattern Data (JSON)

\`\`\`json

{

\"learning_pattern\": {

\"user_id\": \"uuid\",

\"current_level\": 14,

\"total_levels_completed\": 13,

\"level_history\": \[

{

\"level\": 14,

\"topic\": \"commonly_confused_words\",

\"status\": \"in_progress\",

\"started_at\": \"2025-01-20T10:00:00Z\",

\"quiz_scores\": \[

{\"quiz_id\": \"q1\", \"score\": 4, \"total\": 5, \"time_taken\": 120}

\],

\"assignment\": {

\"submitted\": true,

\"score\": 1,

\"total\": 3,

\"errors\": \[

{

\"type\": \"word_confusion\",

\"word_pair\": \"affect/effect\",

\"user_wrote\": \"affect\",

\"correct\": \"effect\",

\"context\": \"noun_needed\",

\"frequency\": 3

}

\],

\"credits_earned\": 5,

\"retry_count\": 0

}

}

\],

\"error_patterns\": {

\"homophones\": {\"count\": 15, \"accuracy\": 0.6},

\"punctuation\": {\"count\": 8, \"accuracy\": 0.75},

\"tense_errors\": {\"count\": 5, \"accuracy\": 0.8},

\"spelling\": {\"count\": 20, \"accuracy\": 0.85},

\"subject_verb\": {\"count\": 3, \"accuracy\": 0.9}

},

\"learning_speed\": {

\"avg_time_per_lesson\": \"25min\",

\"avg_time_per_quiz\": \"3min\",

\"lessons_per_week\": 4,

\"consistency_score\": 0.78

}

}

}

\`\`\`

\-\--

\## ✍️ MODULE 4: PRACTICE MODE

\### 4A. Practice Templates

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ ✍️ Practice Mode Level: Intermediate │

├──────────────────────────────────────────────────────────────────┤

│ │

│ Choose a Practice Task: │

│ │

│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │

│ │ 📧 EMAIL │ │ 📄 LETTER │ │ 📊 REPORT │ │

│ │ │ │ │ │ │ │

│ │ Write a │ │ Write a │ │ Write a │ │

│ │ professional │ │ formal │ │ summary │ │

│ │ email │ │ complaint │ │ report │ │

│ │ │ │ letter │ │ │ │

│ │ +30 credits │ │ +40 credits │ │ +50 credits │ │

│ └──────────────┘ └──────────────┘ └──────────────┘ │

│ │

│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │

│ │ 💬 CONVO │ │ 📰 ARTICLE │ │ 📝 ESSAY │ │

│ │ │ │ │ │ │ │

│ │ Complete a │ │ Write a │ │ Write a │ │

│ │ conversation │ │ short news │ │ persuasive │ │

│ │ dialogue │ │ article │ │ essay │ │

│ │ │ │ │ │ │ │

│ │ +25 credits │ │ +45 credits │ │ +60 credits │ │

│ └──────────────┘ └──────────────┘ └──────────────┘ │

│ │

│ 🔀 \[Random Practice Task\] │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\### 4B. Practice Writing Interface - TWO MODES

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ ✍️ Practice: Write a Professional Email │

│ │

│ 📋 Task: Write an email to your manager requesting a │

│ day off next Friday for a medical appointment. │

│ │

│ MODE: ○ 🔴 Live Suggestions ● 🔵 After Analysis │

│ │

├─────────────────────────────────────────────────────────────────┤

\`\`\`

\#### MODE 1: LIVE SUGGESTIONS (Red = Spell, Yellow = Grammar)

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ MODE: 🔴 LIVE SUGGESTIONS │

├──────────────────────────────────────────────────────────────────┤

│ │

│ Subject: Reqeust for Day Off │

│ \~\~\~\~\~\~\~ (RED underline) │

│ └─ hover: \"Reqeust\" → Did you mean \"Request\"? │

│ (Shows error, NOT the full solution) │

│ │

│ Dear Manager, │

│ │

│ I am writting to inform you that I need a day │

│ \~\~\~\~\~\~\~\~ (RED) │

│ └─ hover: Spelling error - double letter issue │

│ │

│ off on next Friday. I have a medical appointment │

│ \~\~\~\~\~\~\~\~\~\~\~\~\~\~ (YELLOW) │

│ └─ hover: Grammar hint - unnecessary preposition │

│ │

│ that I could\'nt reschedule. I will make sure to │

│ \~\~\~\~\~\~\~\~ (RED) │

│ └─ hover: Contraction spelling error │

│ │

│ complete all my work before than. │

│ \~\~\~\~ (YELLOW) │

│ └─ hover: Word choice error │

│ │

│ ⚠️ NOTE: Hover shows the TYPE of error, not the answer! │

│ This is PRACTICE - you learn by figuring it out! │

│ │

│ \[Submit for Full Analysis →\] │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\#### MODE 2: AFTER ANALYSIS (Detailed Report)

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ MODE: 🔵 AFTER ANALYSIS - Complete Report │

├──────────────────────────────────────────────────────────────────┤

│ │

│ ┌─── YOUR SCORE ──────────────────────────────────────────┐ │

│ │ │ │

│ │ Overall Score: 6.5 / 10 │ │

│ │ │ │

│ │ 📊 Breakdown: │ │

│ │ Spelling: ████████░░ 7/10 │ │

│ │ Grammar: ██████░░░░ 5/10 │ │

│ │ Sentence Structure: ████████░░ 7/10 │ │

│ │ Tone/Formality: ██████░░░░ 6/10 │ │

│ │ Completeness: ████████░░ 8/10 │ │

│ │ │ │

│ │ Credits Earned: +20 │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── DETAILED ERROR ANALYSIS ─────────────────────────────┐ │

│ │ │ │

│ │ ❌ ERROR 1: Spelling │ │

│ │ You wrote: \"Reqeust\" │ │

│ │ Correct: \"Request\" │ │

│ │ 📖 The letters \'e\' and \'u\' are swapped. │ │

│ │ Tip: \"re-QUEST\" - think of it as a quest! │ │

│ │ │ │

│ │ ❌ ERROR 2: Spelling │ │

│ │ You wrote: \"writting\" │ │

│ │ Correct: \"writing\" │ │

│ │ 📖 \"Write\" → \"writing\" (drop the \'e\', single \'t\') │ │

│ │ Rule: When adding \'-ing\', if word ends in \'e\', │ │

│ │ drop the \'e\'. Don\'t double the consonant here. │ │

│ │ │ │

│ │ ❌ ERROR 3: Grammar │ │

│ │ You wrote: \"on next Friday\" │ │

│ │ Correct: \"next Friday\" │ │

│ │ 📖 Don\'t use \"on\" before \"next/last/this\" + day. │ │

│ │ ✅ \"on Friday\" OR \"next Friday\" (not both) │ │

│ │ │ │

│ │ ❌ ERROR 4: Spelling │ │

│ │ You wrote: \"could\'nt\" │ │

│ │ Correct: \"couldn\'t\" │ │

│ │ 📖 Apostrophe placement: could + not = couldn\'t │ │

│ │ The apostrophe replaces the \'o\' in \'not\' │ │

│ │ │ │

│ │ ❌ ERROR 5: Word Choice │ │

│ │ You wrote: \"before than\" │ │

│ │ Correct: \"before then\" or \"before that\" │ │

│ │ 📖 \"Than\" is for comparisons (bigger than). │ │

│ │ \"Then\" is for time (before then). │ │

│ │ │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── IMPROVED VERSION ────────────────────────────────────┐ │

│ │ │ │

│ │ Subject: Request for Day Off │ │

│ │ │ │

│ │ Dear \[Manager\'s Name\], │ │

│ │ │ │

│ │ I am writing to inform you that I need a day off │ │

│ │ next Friday. I have a medical appointment that I │ │

│ │ couldn\'t reschedule. I will make sure to complete │ │

│ │ all my work before then. │ │

│ │ │ │

│ │ \[Changes highlighted in green\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ \[Retry Same Task\] \[New Practice Task\] \[View Pattern →\] │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\### Backend: Practice Pattern Data (JSON)

\`\`\`json

{

\"practice_record\": {

\"user_id\": \"uuid\",

\"practice_id\": \"prc_001\",

\"task_type\": \"email\",

\"task_prompt\": \"Write email requesting day off\...\",

\"mode\": \"after_analysis\",

\"submitted_text\": \"Subject: Reqeust for Day Off\...\",

\"submitted_at\": \"2025-01-20T14:30:00Z\",

\"analysis\": {

\"overall_score\": 6.5,

\"scores\": {

\"spelling\": 7,

\"grammar\": 5,

\"sentence_structure\": 7,

\"tone\": 6,

\"completeness\": 8

},

\"errors\": \[

{

\"id\": \"err_1\",

\"type\": \"spelling\",

\"subtype\": \"letter_swap\",

\"original\": \"Reqeust\",

\"correction\": \"Request\",

\"explanation\": \"Letters \'e\' and \'u\' are swapped\",

\"position\": {\"start\": 9, \"end\": 15},

\"severity\": \"minor\"

},

{

\"id\": \"err_2\",

\"type\": \"grammar\",

\"subtype\": \"unnecessary_preposition\",

\"original\": \"on next Friday\",

\"correction\": \"next Friday\",

\"explanation\": \"Don\'t use \'on\' before next/last/this + day\",

\"position\": {\"start\": 89, \"end\": 103},

\"severity\": \"moderate\"

}

\],

\"total_errors\": 5,

\"error_breakdown\": {

\"spelling\": 3,

\"grammar\": 1,

\"word_choice\": 1

}

},

\"credits_earned\": 20,

\"retry_count\": 0,

\"llm_response_raw\": { },

\"fallback_used\": false

}

}

\`\`\`

\-\--

\## 📄 MODULE 5: PROJECT MODE (Document Editor)

\### 5A. Main Editor Interface

\`\`\`

┌─────────────────────────────────────────────────────────────────────────┐

│ 📄 Project Mode 🔔 👤 John │

├──────────┬──────────────────────────────────────┬───────────────────────┤

│ │ │ │

│ MY DOCS │ 📄 Research Paper - Climate Change │ 🤖 WRITING COACH │

│ │ ───────────────────────────────── │ │

│ + New │ │ Suggestions: │

│ │ \[B\] \[I\] \[U\] \[H1\] \[H2\] \[•\] \[1.\] │ │

│ 📁 Recent│ ──────────────────────────────── │ ┌────────────────┐ │

│ │ │ │ 📝 3 Spelling │ │

│ Research │ Climate change is one of the most │ │ 📝 2 Grammar │ │

│ Paper │ pressing isues facing our planet │ │ 📝 1 Style │ │

│ ──────── │ \~\~\~\~\~ (RED) │ └────────────────┘ │

│ My │ today. The affects of rising │ │

│ Journal │ \~\~\~\~\~\~\~ (YELLOW) │ ── Error 1 ── │

│ ──────── │ temperatures are far-reaching │ \"isues\" → \"issues\" │

│ Cover │ and effect every aspect of human │ 📖 Double \'s\' │

│ Letter │ \~\~\~\~\~\~ (YELLOW) │ before \'ues\' │

│ ──────── │ life. Scientists has warned that │ \[Fix\] \[Ignore\] │

│ Meeting │ \~\~\~ (YELLOW) │ │

│ Notes │ we must take immediate action. │ ── Error 2 ── │

│ │ │ \"affects\" → │

│ │ The green house gasses produced │ \"effects\" │

│ │ \~\~\~\~\~\~\~\~\~\~\~ (RED) │ 📖 Here you need │

│ │ by industrial activities are the │ the noun \"effects\" │

│ │ primary driver of global warming. │ (results), not the │

│ │ \~\~\~\~\~\~ (YELLOW) │ verb \"affects\" │

│ │ │ \[Fix\] \[Ignore\] │

│ │ │ │

│ │ │ ── Error 3 ── │

│ │ │ \"Scientists has\" │

│ │ │ → \"Scientists have\"│

│ │ │ 📖 \"Scientists\" is │

│ │ │ plural, so use │

│ │ │ \"have\" not \"has\" │

│ │ │ \[Fix\] \[Ignore\] │

│ │ │ │

│ │ │ ── Suggestion ── │

│ │ │ 💡 Consider: │

│ │ │ \"primary driver\" │

│ │ │ → \"primary drivers\"│

│ │ │ (plural to match │

│ │ │ \"gasses\") │

│ │ │ │

│ │ │ ── Style Tip ── │

│ │ │ ✨ Your opening │

│ │ │ sentence is good! │

│ │ │ Consider adding │

│ │ │ a thesis statement │

│ │ │ in the first │

│ │ │ paragraph. │

│ │ │ │

│ │ \[Auto-save: 2 min ago\] │ \[Fix All Safe\] 🔧 │

│ │ Word Count: 156 │ │

└──────────┴──────────────────────────────────────┴───────────────────────┘

\`\`\`

\### Key Difference from Practice Mode:

\`\`\`

┌─────────────────────────────────────────────────────────┐

│ PRACTICE MODE vs PROJECT MODE │

│ │

│ Practice: │

│ - Hover shows error TYPE only (not solution) │

│ - Full analysis AFTER submission │

│ - Scored 1-10 │

│ - Purpose: LEARNING │

│ │

│ Project: │

│ - Side panel shows FULL suggestions with explanations │

│ - Real-time coach (like having a tutor beside you) │

│ - \[Fix\] button to accept corrections │

│ - Purpose: PRODUCING quality documents │

│ - Coach GUIDES, doesn\'t write for you │

└─────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 💬 MODULE 6: AI CHAT

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ 💬 AI Grammar Coach Chat │

├──────��───────────────────────────────────────────────────────────┤

│ │

│ ┌──────────────────────────────────────────────────────────┐ │

│ │ │ │

│ │ 🤖 Hi John! I\'m your grammar coach. I can see your │ │

│ │ learning progress and help you improve. Ask me │ │

│ │ anything! │ │

│ │ │ │

│ │ 👤 How am I doing with my learning? │ │

│ │ │ │

│ │ 🤖 Great question! Here\'s your summary: │ │

│ │ 📊 You\'ve completed 14 of 30 levels │ │

│ │ 🎯 Your biggest improvement: Spelling (+23%) │ │

│ │ ⚠️ Area to focus: You still confuse affect/effect │ │

│ │ - You\'ve made this error 8 times in practice │ │

│ │ 💡 I recommend redoing Lesson 14 quiz and trying │ │

│ │ the email practice task to reinforce this. │ │

│ │ │ │

│ │ 👤 Can you explain when to use semicolons? │ │

│ │ │ │

│ │ 🤖 Of course! A semicolon (;) connects two related │ │

│ │ complete sentences: │ │

│ │ ✅ \"I love coding; it makes me creative.\" │ │

│ │ ❌ \"I love coding; and it makes me creative.\" │ │

│ │ │ │

│ │ Think of it as a \"soft period\" - stronger than a │ │

│ │ comma, weaker than a period. │ │

│ │ │ │

│ │ I noticed in your research paper project, you │ │

│ │ used a comma splice in paragraph 2. That would │ │

│ │ be a perfect place for a semicolon! │ │

│ │ │ │

│ │ 👤 What about my practice test yesterday? │ │

│ │ │ │

│ │ 🤖 Your email writing practice scored 6.5/10. │ │

│ │ Main issues: │ │

│ │ 1. Spelling: \"Reqeust\" (letter swap pattern - │ │

│ │ I\'ve seen you do this 4 other times!) │ │

│ │ 2. Preposition: \"on next Friday\" (extra \"on\") │ │

│ │ 3. Contraction: \"could\'nt\" (apostrophe placement) │ │

│ │ │ │

│ │ Want me to create a quick exercise on contractions? │ │

│ │ │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌──────────────────────────────────────────────────────────┐ │

│ │ 💬 Type your message\... \[Send →\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ Quick Actions: │

│ \[📊 My Progress\] \[❓ Grammar Question\] \[📝 Review Practice\] │

│ │

│ ⚠️ AI has access to: Learning patterns, practice scores, │

│ project errors, level progress │

│ 🔒 AI does NOT have access to: Personal credentials, │

│ password, email, phone number │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\### Backend: AI Chat Architecture

\`\`\`

┌─────────────────────────────────────────────────────────────┐

│ AI CHAT FLOW │

│ │

│ User Message │

│ │ │

│ ▼ │

│ ┌─────────────────┐ │

│ │ Backend API │ │

│ │ /api/chat │ │

│ └────────┬────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────┐ ┌──────────────────────┐ │

│ │ Query Database │────→│ Get User Context │ │

│ │ for user data │ │ - Learning progress │ │

│ └─────────────────┘ │ - Error patterns │ │

│ │ - Practice scores │ │

│ │ - Project errors │ │

│ │ ❌ NOT credentials │ │

│ └──────────┬───────────┘ │

│ │ │

│ ▼ │

│ ┌──────────────────────────────────────────────┐ │

│ │ CONSTRUCT PROMPT │ │

│ │ │ │

│ │ System: \"You are a grammar coach for {user}. │ │

│ │ Here is their learning data: {context_json}. │ │

│ │ Help them improve. Be encouraging. Reference │ │

│ │ their specific errors and progress. Never │ │

│ │ reveal personal info.\" │ │

│ │ │ │

│ │ User: \"{user_message}\" │ │

│ │ Context: {relevant_data_json} │ │

│ └──────────────────────┬───────────────────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────────────┐ │

│ │ LLM API Call │ │

│ │ (OpenAI / Groq / HuggingFace)│ │

│ └──────────────────┬──────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────────┐ │

│ │ Response → User │ │

│ │ (Save chat history) │ │

│ └─────────────────────────┘ │

└─────────────────────────────────────────────────────────────┘

\`\`\`

\`\`\`python

\# Backend: Chat endpoint with DB context

\@app.post(\"/api/chat\")

async def chat(user_id: str, message: str):

\# 1. Get user context (NOT credentials)

user_context = db.get_user_learning_context(user_id)

\# Returns: level, errors, scores, patterns

\# Does NOT return: email, password, phone

\# 2. Build prompt

system_prompt = f\"\"\"You are a friendly grammar coach.

Student Profile:

\- Current Level: {user_context\[\'level\'\]}

\- Strengths: {user_context\[\'strengths\'\]}

\- Weaknesses: {user_context\[\'weaknesses\'\]}

\- Recent Errors: {json.dumps(user_context\[\'recent_errors\'\])}

\- Practice Scores: {json.dumps(user_context\[\'practice_scores\'\])}

\- Credits: {user_context\[\'credits\'\]}

Rules:

\- Be encouraging and helpful

\- Reference their specific mistakes

\- Suggest specific lessons or practice tasks

\- NEVER reveal personal credentials

\- Give examples when explaining grammar rules

\"\"\"

\# 3. Call LLM

response = await llm_client.chat(

system=system_prompt,

user_message=message,

history=get_chat_history(user_id)

)

\# 4. Save chat history

save_chat(user_id, message, response)

return {\"response\": response}

\`\`\`

\-\--

\## 📊 MODULE 7: ANALYTICS

\`\`\`

┌─────────────────────────────────────────────────────────────────────────┐

│ 📊 Analytics Dashboard Period: \[Monthly▼\]│

├─────────────────────────────────────────────────────────────────────────┤

│ │

│ ┌─── OVERVIEW CARDS ──────────────────────────────────────────────┐ │

│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │

│ │ │ LEVEL │ │ ACCURACY │ │ STREAK │ │ CREDITS │ │ │

│ │ │ 14/30 │ │ 78% │ │ 🔥 5 days│ │ ⭐ 450 │ │ │

│ │ │ ↑ +2 │ │ ↑ +5% │ │ Best: 12 │ │ ↑ +80 │ │ │

│ │ │ this week│ │ this week│ │ │ │ this week│ │ │

│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │

│ └────────────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── LEARNING PROGRESS GRAPH ─────────────────────────────────────┐ │

│ │ │ │

│ │ Accuracy Over Time: │ │

│ │ 100%\| ● │ │

│ │ 80%\| ●────●───●────●───● │ │

│ │ 60%\| ●────●──── │ │

│ │ 40%\| ●───── │ │

│ │ 20%\|●─── │ │

│ │
0%\|\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
│ │

│ │ W1 W2 W3 W4 W5 W6 W7 W8 │ │

│ │ │ │

│ │ \[Daily\] \[Weekly\] \[Monthly\] │ │

│ └──────────────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── ERROR PATTERN ANALYSIS ──────────────────────────────────────┐ │

│ │ │ │

│ │ Most Common Mistakes: Error Trend: │ │

│ │ │ │

│ │ 1. Homophones ████████████ 15 Spelling: ↓ Improving │ │

│ │ 2. Spelling █████████░░ 12 Grammar: ↔ Stable │ │

│ │ 3. Punctuation ███████░░░░ 8 Homophones: ↓ Improving │ │

│ │ 4. Tense Errors █████░░░░░░ 5 Punctuation: ↑ Needs Work │ │

│ │ 5. Subject-Verb ███░░░░░░░░ 3 Word Choice: ↓ Improving │ │

│ │ │ │

│ └──────────────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── PERFORMANCE METRICS ─────────────────────────────────────────┐ │

│ │ │ │

│ │ ┌────────────────────┐ ┌────────────────────┐ │ │

│ │ │ LEARNING MODE │ │ PRACTICE MODE │ │ │

│ │ │ │ │ │ │ │

│ │ │ Lessons Done: 14 │ │ Tasks Done: 8 │ │ │

│ │ │ Quizzes Passed: 12 │ │ Avg Score: 6.8/10 │ │ │

│ │ │ Assignments: 10 │ │ Best Score: 9/10 │ │ │

│ │ │ Avg Time/Lesson: │ │ Avg Time/Task: │ │ │

│ │ │ 25 min │ │ 35 min │ │ │

│ │ │ Completion Rate: │ │ Improvement Rate: │ │ │

│ │ │ 87% │ │ +12% this month │ │ │

│ │ └────────────────────┘ └────────────────────┘ │ │

│ └──────────────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── ACHIEVEMENTS & BADGES ───────────────────────────────────────┐ │

│ │ │ │

│ │ Timeline: │ │

│ │ ●───────●───────●───────●───────●──────○───────○ │ │

│ │ 🏅 🎯 📚 🔥 ✍️ 🏆 🎓 │ │

│ │ First 10 Level 7-day 50 100 Master │ │

│ │ Login Quizzes 10 Streak Tasks Credits Level │ │

│ │ ✅ ✅ ✅ ✅ ✅ 🔒 🔒 │ │

│ │ │ │

│ │ Total Credits: 450 ⭐ │ │

│ │ Badges Earned: 5/12 │ │

│ │ Current Rank: Grammar Enthusiast │ │

│ │ │ │

│ │ ┌─── SHARE ACHIEVEMENT ─────────────────────────┐ │ │

│ │ │ 🎉 Generate Certificate of Progress │ │ │

│ │ │ │ │ │

│ │ │ ┌──────────────────────────────────┐ │ │ │

│ │ │ │ 📜 PROOF OF LEARNING │ │ │ │

│ │ │ │ │ │ │ │

│ │ │ │ John Doe │ │ │ │

│ │ │ │ Level: Intermediate (14/30) │ │ │ │

│ │ │ │ Accuracy: 78% │ │ │ │

│ │ │ │ Badges: 5 earned │ │ │ │

│ │ │ │ Streak: 5 days │ │ │ │

│ │ │ │ Date: Jan 20, 2025 │ │ │ │

│ │ │ │ │ │ │ │

│ │ │ │ \[QR Code for verification\] │ │ │ │

│ │ │ └──────────────────────────────────┘ │ │ │

│ │ │ │ │ │

│ │ │ \[📥 Download PNG\] \[🔗 Share Link\] │ │ │

│ │ │ \[📱 Share to LinkedIn/Twitter\] │ │ │

│ │ └────────────────────────────────────────────────┘ │ │

│ └──────────────────────────────────────────────────────────────────┘ │

└─────────────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 🎮 GAMIFICATION SYSTEM (Credit Points)

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ CREDIT SYSTEM │

├──────────────────────────────────────────────────────────────────┤

│ │

│ EARNING CREDITS: │

│ ───────────────── │

│ 📚 Complete a lesson \...\...\...\...\...\..... +10 credits │

│ ✅ Pass a quiz (\>70%) \...\...\...\...\...\... +15 credits │

│ ✅ Perfect quiz score (100%) \...\...\..... +25 credits │

│ ✍️ Submit assignment \...\...\...\...\...\.... +15 credits │

│ ✍️ Perfect assignment \...\...\...\...\...\... +30 credits │

│ 📝 Complete practice task \...\...\...\..... +20-60 credits │

│ (based on difficulty) │

│ 📝 Practice score 9-10/10 \...\...\...\.... +20 bonus │

│ 🔥 Daily login \...\...\...\...\...\...\...\.... +5 credits │

│ 🔥 7-day streak \...\...\...\...\...\...\..... +50 bonus │

│ 🔥 30-day streak \...\...\...\...\...\...\.... +200 bonus │

│ 📄 Write 500+ word document \...\...\..... +30 credits │

│ 🎯 Fix all errors in a document \...\.... +15 credits │

│ │

│ BADGES & RANKS: │

│ ───────────────── │

│ 🏅 First Steps (10 credits) - Complete first lesson │

│ 📖 Bookworm (100 credits) - Complete 10 lessons │

│ ✍️ Writer (250 credits) - Complete 10 practice tasks │

│ 🔥 On Fire (300 credits) - 7-day streak │

│ 🎯 Sharpshooter (400 credits) - 5 perfect quiz scores │

│ 📚 Scholar (500 credits) - Reach Level 15 │

│ ✨ Perfectionist (750 credits) - 3 practice scores of 10/10 │

│ 🏆 Grammar Champion (1000 credits) - Reach Level 25 │

│ 🎓 Master (2000 credits) - Complete all 30 levels │

│ 👑 Legend (5000 credits) - All badges + 90% accuracy │

│ │

│ RANKS: │

│ 0-99: Beginner Writer │

│ 100-299: Grammar Learner │

│ 300-499: Grammar Enthusiast │

│ 500-999: Skilled Writer │

│ 1000-1999: Grammar Expert │

│ 2000+: Language Master │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## ⚙️ MODULE 8: SETTINGS

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ ⚙️ Settings │

├──────────────────────────────────────────────────────────────────┤

│ │

│ ┌─── PROFILE ──────────────────────────────────────────────┐ │

│ │ 👤 Name: John Doe \[Edit\] │ │

│ │ 📧 Email: john@email.com \[Verified ✅\] │ │

│ │ 📱 Phone: +1234567890 \[Edit\] │ │

│ │ 💼 Role: Student \[Edit\] │ │

│ │ 📸 Profile Picture: \[Upload\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── APPEARANCE ───────────────────────────────────────────┐ │

│ │ 🌙 Dark Mode: \[Toggle ON/OFF\] │ │

│ │ 🔤 Font Size: \[Small/Medium/Large\] │ │

│ │ 🎨 Editor Theme: \[Default/Sepia/Dark\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── NOTIFICATIONS ────────────────────────────────────────┐ │

│ │ 🔔 Push Notifications: \[Toggle ON/OFF\] │ │

│ │ 📧 Email Notifications: \[Toggle ON/OFF\] │ │

│ │ 📅 Daily Reminder: \[Set Time: 9:00 AM\] │ │

│ │ 🏆 Achievement Alerts: \[Toggle ON/OFF\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── SECURITY ─────────────────────────────────────────────┐ │

│ │ 🔒 Change Password: \[Change →\] │ │

│ │ 🔐 Two-Factor Auth: \[Enable\] │ │

│ │ 📱 Active Sessions: \[View/Manage\] │ │

│ └──────────────────────────────────────────────────────────┘ │

│ │

│ ┌─── DATA MANAGEMENT ──────────────────────────────────────┐ │

│ │ 📊 Learning Pattern Data: \[View\] \[Export JSON\] │ │

│ │ 📝 Practice History: \[View\] \[Export\] │ │

│ │ 📄 Project Documents: \[View\] \[Export All\] │ │

│ │ 💬 Chat History: \[View\] \[Clear\] │ │

│ │ 🗑️ Reset Learning Data: \[Reset\] ⚠️ Irreversible │ │

│ │ 🗑️ Delete Account: \[Delete\] ⚠️ Irreversible │ │

│ └──────────────────────────────────────────────────────────┘ │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 🔧 COMPLETE TECH ARCHITECTURE

\`\`\`

┌──────────────────────────────────────────────────────────────────┐

│ TECH STACK │

├──────────────────────────────────────────────────────────────────┤

│ │

│ FRONTEND: │

│ ├── React.js (or Next.js for SSR) │

│ ├── TailwindCSS (styling) │

│ ├── CodeMirror 6 (text editor for Project mode) │

│ ├── Chart.js / Recharts (analytics graphs) │

│ ├── React Router (navigation) │

│ └── Axios (API calls) │

│ │

│ BACKEND: │

│ ├── Python FastAPI (main server) │

│ ├── JWT + bcrypt (authentication) │

│ ├── SMTP (email OTP) │

│ ├── python-Levenshtein (edit distance fallback) │

│ └── Pydantic (data validation) │

│ │

│ DATABASE: │

│ ├── PostgreSQL (users, credentials, structured data) │

│ ├── MongoDB (learning patterns, practice records - JSON heavy) │

│ └── Redis (session cache, OTP storage) │

│ │

│ AI/LLM: │

│ ├── Primary: OpenAI API (GPT-3.5/4) or Groq (fast + free tier) │

│ ├── Fallback: python-Levenshtein + NLTK │

│ ├── Predefined prompts + rules │

│ └── JSON request/response format │

│ │

│ FOR HACKATHON (simplified): │

│ ├── Frontend: React + TailwindCSS │

│ ├── Backend: FastAPI │

│ ├── DB: SQLite or MongoDB Atlas (free) │

│ └── LLM: Groq API (free, fast) │

└──────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 🔄 API & DATA FLOW

\### Core Spell/Grammar Check Flow

\`\`\`

┌────────────────────────────────────────────────────────────────┐

│ SPELL/GRAMMAR CHECK FLOW │

│ │

│ User types text │

│ │ │

│ ▼ (debounced - every 500ms of pause) │

│ ┌─────────────────────┐ │

│ │ Frontend sends JSON: │ │

│ │ { │ │

│ │ \"text\": \"\...\", │ │

│ │ \"mode\": \"practice\", │ │

│ │ \"user_id\": \"uuid\", │ │

│ │ \"context\": \"email\" │ │

│ │ } │ │

│ └──────────┬──────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────┐ │

│ │ Backend /api/check │ │

│ └──────────┬──────────┘ │

│ │ │

│ ┌──────┴──────┐ │

│ │ │ │

│ ▼ ▼ │

│ ┌────────┐ ┌──────────┐ │

│ │ FAST │ │ SMART │ │

│ │ CHECK │ │ CHECK │ │

│ │ │ │ │ │

│ │ Edit │ │ LLM API │ │

│ │Distance│ │ call with│ │

│ │+Dict │ │ predefined│ │

│ │lookup │ │ prompt │ │

│ └───┬────┘ └────┬─────┘ │

│ │ │ │

│ │ (if LLM fails) │

│ │ ┌─────┘ │

│ │ │ │

│ ▼ ▼ │

│ ┌─────────────────────────┐ │

│ │ MERGE & DEDUPLICATE │ │

│ │ + Format Response │ │

│ └──────────┬──────────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────────────────────┐ │

│ │ SAVE TO PATTERN DB │ │

│ │ (errors, types, frequency) │ │

│ │ Don\'t call API again for analytics - │ │

│ │ USE THIS SAVED DATA │ │

│ └──────────┬──────────────────────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────────┐ │

│ │ Response JSON: │ │

│ │ { │ │

│ │ \"errors\": \[ │ │

│ │ { │ │

│ │ \"type\": \"spelling\",│ │

│ │ \"word\": \"teh\", │ │

│ │ \"correction\":\"the\",│ │

│ │ \"explanation\":\"\...\",│ │

│ │ \"position\":{\...}, │ │

│ │ \"severity\":\"minor\",│ │

│ │ \"color\": \"red\" │ │

│ │ } │ │

│ │ \], │ │

│ │ \"score\": 7.5, │ │

│ │ \"suggestions\": \[\...\] │ │

│ │ } │ │

│ └─────────────────────────┘ │

└────────────────────────────────────────────────────────────────┘

\`\`\`

\### LLM Prompt Templates

\`\`\`python

\# Predefined prompts stored in backend

PROMPTS = {

\"spell_grammar_check\": \"\"\"

You are a grammar and spelling checker. Analyze this text:

Text: \"{text}\"

Context: User is writing a {context_type}

User Level: {user_level}

Return JSON with this exact format:

{{

\"errors\": \[

{{

\"type\": \"spelling\|grammar\|punctuation\|word_choice\|style\",

\"original\": \"the wrong word/phrase\",

\"correction\": \"the correct version\",

\"explanation\": \"brief friendly explanation of WHY\",

\"rule\": \"the grammar rule involved\",

\"position\": {{\"start\": 0, \"end\": 5}},

\"severity\": \"minor\|moderate\|major\"

}}

\],

\"overall_feedback\": \"brief overall comment\",

\"score\": 7.5

}}

Rules:

\- Be precise with positions

\- Explanations should teach, not just correct

\- Adjust explanation complexity to {user_level}

\"\"\",

\"practice_analysis\": \"\"\"

Analyze this {task_type} written by a {user_level} student:

Task: {task_prompt}

Text: \"{submitted_text}\"

Provide detailed analysis in JSON:

{{

\"overall_score\": 7.5,

\"category_scores\": {{

\"spelling\": 8,

\"grammar\": 6,

\"sentence_structure\": 7,

\"tone_formality\": 7,

\"completeness\": 8

}},

\"errors\": \[\...\],

\"improved_version\": \"\...\",

\"strengths\": \[\"\...\"\],

\"areas_to_improve\": \[\"\...\"\]

}}

\"\"\",

\"chat_coach\": \"\"\"

You are a friendly grammar coach for {user_name}.

Their profile:

\- Level: {level}

\- Strengths: {strengths}

\- Weaknesses: {weaknesses}

\- Recent errors: {recent_errors}

\- Practice scores: {scores}

RULES:

\- Be encouraging

\- Reference their specific data

\- Suggest specific lessons/practices

\- NEVER reveal personal credentials

\- Give examples when explaining rules

Student asks: \"{message}\"

\"\"\"

}

\`\`\`

\-\--

\## 📁 DATABASE SCHEMA (Complete)

\`\`\`json

{

\"COLLECTIONS/TABLES\": {

\"users\": {

\"id\": \"uuid\",

\"name\": \"string\",

\"email\": \"string (unique)\",

\"phone\": \"string\",

\"password_hash\": \"string\",

\"email_verified\": \"boolean\",

\"role\": \"string\",

\"created_at\": \"datetime\",

\"last_login\": \"datetime\"

},

\"user_profiles\": {

\"user_id\": \"FK→users\",

\"current_level\": \"integer\",

\"assessment_score\": \"integer\",

\"strengths\": \[\"array\"\],

\"weaknesses\": \[\"array\"\],

\"total_credits\": \"integer\",

\"current_streak\": \"integer\",

\"best_streak\": \"integer\",

\"rank\": \"string\",

\"last_active\": \"datetime\"

},

\"badges\": {

\"user_id\": \"FK→users\",

\"badge_id\": \"string\",

\"badge_name\": \"string\",

\"earned_at\": \"datetime\",

\"credits_at_earn\": \"integer\"

},

\"learning_progress\": {

\"user_id\": \"FK→users\",

\"level_number\": \"integer\",

\"topic\": \"string\",

\"status\": \"not_started\|in_progress\|completed\",

\"started_at\": \"datetime\",

\"completed_at\": \"datetime\",

\"quiz_scores\": \[{\"quiz_id\": \"\", \"score\": 0, \"total\": 0}\],

\"assignment_score\": \"integer\",

\"credits_earned\": \"integer\"

},

\"error_patterns\": {

\"user_id\": \"FK→users\",

\"error_type\": \"string\",

\"error_subtype\": \"string\",

\"original_word\": \"string\",

\"correct_word\": \"string\",

\"context\": \"string\",

\"frequency\": \"integer\",

\"last_occurred\": \"datetime\",

\"source\": \"learning\|practice\|project\",

\"resolved\": \"boolean\"

},

\"practice_records\": {

\"id\": \"uuid\",

\"user_id\": \"FK→users\",

\"task_type\": \"string\",

\"task_prompt\": \"string\",

\"submitted_text\": \"text\",

\"mode\": \"live\|after_analysis\",

\"analysis_json\": \"JSON (full LLM response)\",

\"overall_score\": \"float\",

\"errors_found\": \"integer\",

\"credits_earned\": \"integer\",

\"submitted_at\": \"datetime\"

},

\"projects\": {

\"id\": \"uuid\",

\"user_id\": \"FK→users\",

\"title\": \"string\",

\"content\": \"text\",

\"doc_type\": \"journal\|research\|letter\|email\|other\",

\"word_count\": \"integer\",

\"errors_history\": \"JSON\",

\"created_at\": \"datetime\",

\"updated_at\": \"datetime\",

\"auto_saved\": \"boolean\"

},

\"chat_history\": {

\"id\": \"uuid\",

\"user_id\": \"FK→users\",

\"message\": \"text\",

\"role\": \"user\|assistant\",

\"context_used\": \"JSON (what data was sent to LLM)\",

\"timestamp\": \"datetime\"

},

\"analytics_snapshots\": {

\"user_id\": \"FK→users\",

\"period\": \"daily\|weekly\|monthly\",

\"date\": \"date\",

\"accuracy\": \"float\",

\"lessons_completed\": \"integer\",

\"practice_tasks\": \"integer\",

\"errors_made\": \"integer\",

\"errors_fixed\": \"integer\",

\"credits_earned\": \"integer\",

\"time_spent_minutes\": \"integer\",

\"top_errors\": \"JSON\"

},

\"user_settings\": {

\"user_id\": \"FK→users\",

\"theme\": \"light\|dark\",

\"font_size\": \"small\|medium\|large\",

\"notifications_enabled\": \"boolean\",

\"email_notifications\": \"boolean\",

\"reminder_time\": \"time\",

\"data_sharing_preferences\": \"JSON\"

}

}

}

\`\`\`

\-\--

\## 🏃 HACKATHON EXECUTION PLAN

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ HACKATHON PRIORITY ORDER │

│ │

│ PHASE 1: CORE (First 6-8 hours) - MUST COMPLETE │

│ ───────────────────────────────────────────────── │

│ ✅ 1. Auth (signup/login/OTP) - 2 hours │

│ ✅ 2. Assessment quiz + level assignment - 1 hour │

│ ✅ 3. Text editor with spell/grammar check - 3 hours │

│ - Red underline (spelling) │

│ - Yellow underline (grammar) │

│ - Hover to see error hint │

│ - LLM integration + edit-distance fallback │

│ ✅ 4. Basic dashboard - 1 hour │

│ │

│ PHASE 2: KEY FEATURES (Next 6-8 hours) │

│ ────────────────────────────────────────── │

│ ✅ 5. Learning Mode (3-4 lessons with quizzes) - 3 hours │

│ ✅ 6. Practice Mode (2 modes: live + analysis) - 3 hours │

│ ✅ 7. Project Mode (doc editor + coach sidebar) - 2 hours │

│ │

│ PHASE 3: DIFFERENTIATORS (Next 4-6 hours) │

│ ────────────────────────────────────────── │

│ ✅ 8. AI Chat with user context - 2 hours │

│ ✅ 9. Analytics (graphs + error patterns) - 2 hours │

│ ✅ 10. Gamification (credits + badges) - 1 hour │

│ ✅ 11. Settings page - 1 hour │

│ │

│ PHASE 4: POLISH (Last 2-4 hours) │

│ ────────────────────────────────────── │

│ ✅ 12. Certificate/share feature - 1 hour │

│ ✅ 13. UI polish + dark mode - 1 hour │

│ ✅ 14. Demo preparation - 1 hour │

│ ✅ 15. Bug fixes + testing - 1 hour │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 🎤 DEMO SCRIPT (For Judges)

\`\`\`

\"Introducing Contextual Spell & Grammar Coach -

not just a spell checker, but a PERSONAL LANGUAGE TUTOR.\"

1\. SHOW: Signup → OTP → Assessment Quiz → Level Assignment

\"We identify where each user stands\"

2\. SHOW: Learning Mode → Lesson → Quiz → Assignment Review

\"Structured learning with explanations, not just corrections\"

3\. SHOW: Practice Mode → Write email → Live red/yellow hints

→ Submit → Detailed 1-10 score with analysis

\"Two modes: hints while writing, full analysis after\"

4\. SHOW: Project Mode → Write doc → Coach sidebar suggestions

\"Real documents with a personal writing coach\"

5\. SHOW: AI Chat → Ask about progress → Get personalized advice

\"AI knows your learning patterns, not your credentials\"

6\. SHOW: Analytics → Graphs → Badges → Certificate

\"Gamified learning with shareable proof of progress\"

7\. SHOW: Error pattern → Same mistake reducing over time

\"The system learns YOUR patterns and helps you improve\"

\`\`\`

\-\--

\## ❓ Questions For Your Team

Before building, decide:

\`\`\`

1\. Team size? Who handles frontend vs backend vs AI?

2\. Hackathon duration? (24h / 36h / 48h?)

3\. Free LLM tier: Groq API (free, fast) or OpenAI (paid, accurate)?

4\. Will you pre-create lesson content or generate with AI?

5\. Mobile responsive or desktop only for hackathon?

\`\`\`

\-\--

\# 🛠️ Complete Tech Stack & Requirements

\## What You\'ve Chosen

\`\`\`

✅ Frontend: React

✅ Backend: Python (Flask + FastAPI)

✅ Database: MongoDB (good choice for JSON-heavy data)

✅ LLM API: OpenRouter (access to OpenAI + other models)

\`\`\`

\-\--

\## What Else You Need

\### 1. AUTHENTICATION

\`\`\`

📌 JWT (JSON Web Tokens) → for login sessions

📌 bcrypt → for password hashing

📌 SMTP service → for sending OTP emails

Options:

\- Gmail SMTP (free, limited)

\- Resend (free tier, easy)

\- Mailgun (free tier)

\`\`\`

\### 2. FRONTEND LIBRARIES

\`\`\`

📌 React Router → page navigation

📌 Axios → API calls to backend

📌 TailwindCSS → fast styling

📌 React Toastify → notifications/alerts

📌 Recharts or Chart.js → analytics graphs

📌 CodeMirror 6 → text editor (project mode)

(handles red/yellow underlines nicely)

📌 React Icons → icons

\`\`\`

\### 3. BACKEND LIBRARIES

\`\`\`

📌 Flask OR FastAPI → pick ONE (I recommend FastAPI)

📌 PyMongo / Motor → MongoDB connection

📌 python-jose → JWT tokens

📌 bcrypt / passlib → password hashing

📌 python-Levenshtein → edit distance (spell check fallback)

📌 httpx or requests → calling OpenRouter API

📌 pydantic → data validation (comes with FastAPI)

📌 python-dotenv → environment variables (.env file)

📌 CORS middleware → allow frontend to talk to backend

\`\`\`

\### 4. DATABASE

\`\`\`

📌 MongoDB Atlas → free cloud tier (512MB free)

OR

📌 Local MongoDB → for development

📌 No extra ORM needed → PyMongo handles it directly

\`\`\`

\### 5. LLM / AI

\`\`\`

📌 OpenRouter API → one key, many models

\- Can use GPT-3.5/4, Claude, Llama etc

\- Pay per use (cheap for demo)

📌 Fallback (no API needed):

\- python-Levenshtein → spell check

\- Built-in dictionary → word lookup

\`\`\`

\### 6. TOOLS

\`\`\`

📌 VS Code → coding

📌 Postman / Thunder Client → API testing

📌 Git + GitHub → version control

📌 Vercel → deploy frontend (free)

📌 Render / Railway → deploy backend (free tier)

📌 .env file → store API keys safely

\`\`\`

\-\--

\## Quick Summary - Everything You Need

\`\`\`

FRONTEND (React)

├── react-router-dom

├── axios

├── tailwindcss

├── recharts

├── \@uiw/react-codemirror (or codemirror 6)

├── react-toastify

└── react-icons

BACKEND (Python)

├── fastapi

├── uvicorn

├── pymongo

├── python-jose\[cryptography\]

├── passlib\[bcrypt\]

├── python-Levenshtein

├── httpx

├── python-dotenv

├── pydantic

└── python-multipart

DATABASE

└── MongoDB Atlas (free)

EXTERNAL APIs

├── OpenRouter (LLM)

└── Gmail SMTP or Resend (email OTP)

DEPLOYMENT (for demo)

├── Vercel (frontend)

└── Render (backend)

\`\`\`

\-\--

\## One Important Decision

\`\`\`

⚠️ Flask + FastAPI together = NOT recommended

Pick ONE:

┌─────────────────────────────────────────┐

│ │

│ FastAPI ← I RECOMMEND THIS │

│ - Faster │

│ - Async (good for LLM API calls) │

│ - Auto API docs (Swagger UI) │

│ - Built-in validation (Pydantic) │

│ - Better for this project │

│ │

│ Flask │

│ - Simpler │

│ - More tutorials online │

│ - But slower, no async by default │

│ │

│ 👉 Go with FastAPI │

│ │

└─────────────────────────────────────────┘

\`\`\`

\# 📁 Complete Project Structure & Architecture

\-\--

\## 🗂️ OVERALL PROJECT STRUCTURE

\`\`\`

contextual-grammar-coach/

├── frontend/ (React App)

├── backend/ (FastAPI App)

├── .gitignore

└── README.md

\`\`\`

\-\--

\## 🎨 FRONTEND FILE STRUCTURE

\`\`\`

frontend/

├── public/

│ ├── index.html

│ └── favicon.ico

│

├── src/

│ │

│ ├── App.jsx (Main app + route setup)

│ ├── index.js (Entry point)

│ │

│ ├── routes/

│ │ └── AppRoutes.jsx (All route definitions)

│ │

│ ├── pages/

│ │ ├── auth/

│ │ │ ├── Signup.jsx (Signup form)

│ │ │ ├── Login.jsx (Login form)

│ │ │ ├── OtpVerify.jsx (OTP verification)

│ │ │ ├── ForgotPassword.jsx (Forgot password)

│ │ │ └── Assessment.jsx (Level assessment quiz)

│ │ │

│ │ ├── dashboard/

│ │ │ └── Dashboard.jsx (Main dashboard)

│ │ │

│ │ ├── learning/

│ │ │ ├── LearningHome.jsx (All levels overview)

│ │ │ ├── Lesson.jsx (Single lesson page)

│ │ │ ├── Quiz.jsx (Quiz within lesson)

│ │ │ └── AssignmentReview.jsx (Assignment results)

│ │ │

│ │ ├── practice/

│ │ │ ├── PracticeHome.jsx (Task selection)

│ │ │ ├── PracticeEditor.jsx (Writing + live/after modes)

│ │ │ └── PracticeResult.jsx (Detailed analysis)

│ │ │

│ │ ├── project/

│ │ │ ├── ProjectHome.jsx (All documents list)

│ │ │ └── ProjectEditor.jsx (Doc editor + coach sidebar)

│ │ │

│ │ ├── chat/

│ │ │ └── AiChat.jsx (AI chat interface)

│ │ │

│ │ ├── analytics/

│ │ │ └── Analytics.jsx (All analytics + graphs)

│ │ │

│ │ └── settings/

│ │ └── Settings.jsx (All settings)

│ │

│ ├── components/

│ │ ├── layout/

│ │ │ ├── Sidebar.jsx (Sidebar navigation)

│ │ │ ├── Navbar.jsx (Top bar + notifications)

│ │ │ ├── MainLayout.jsx (Sidebar + Navbar wrapper)

│ │ │ └── AuthLayout.jsx (Layout for login/signup)

│ │ │

│ │ ├── common/

│ │ │ ├── Button.jsx

│ │ │ ├── Input.jsx

│ │ │ ├── Card.jsx

│ │ │ ├── Modal.jsx

│ │ │ ├── Loader.jsx

│ │ │ ├── Badge.jsx

│ │ │ ├── ProgressBar.jsx

│ │ │ └── Toast.jsx

│ │ │

│ │ ├── editor/

│ │ │ ├── TextEditor.jsx (CodeMirror wrapper)

│ │ │ ├── ErrorHighlight.jsx (Red/Yellow underlines)

│ │ │ ├── HoverTooltip.jsx (Error hover popup)

│ │ │ └── CoachSidebar.jsx (Suggestion panel)

│ │ │

│ │ ├── learning/

│ │ │ ├── LevelCard.jsx (Level display card)

│ │ │ ├── QuizQuestion.jsx (Single quiz question)

│ │ │ └── LessonContent.jsx (Lesson text renderer)

│ │ │

│ │ ├── analytics/

│ │ │ ├── AccuracyChart.jsx (Line graph)

│ │ │ ├── ErrorBarChart.jsx (Bar chart)

│ │ │ ├── BadgeTimeline.jsx (Achievement timeline)

│ │ │ └── StatsCard.jsx (Stat display card)

│ │ │

│ │ └── chat/

│ │ ├── ChatBubble.jsx (Single message)

│ │ └── ChatInput.jsx (Message input)

│ │

│ ├── context/

│ │ ├── AuthContext.jsx (User auth state)

│ │ └── ThemeContext.jsx (Dark/light mode)

│ │

│ ├── hooks/

│ │ ├── useAuth.js (Auth logic)

│ │ ├── useApi.js (API call helper)

│ │ └── useDebounce.js (Debounce for editor)

│ │

│ ├── services/

│ │ ├── api.js (Axios instance + base URL)

│ │ ├── authService.js (Login/signup/OTP calls)

│ │ ├── learningService.js (Lessons/quiz API calls)

│ │ ├── practiceService.js (Practice API calls)

│ │ ├── projectService.js (Project CRUD API calls)

│ │ ├── chatService.js (Chat API calls)

│ │ ├── analyticsService.js (Analytics API calls)

│ │ └── checkService.js (Spell/grammar check calls)

│ │

│ ├── utils/

│ │ ├── constants.js (Credit values, badge list)

│ │ ├── helpers.js (Date format, score calc)

│ │ └── validators.js (Email, password validation)

│ │

│ └── styles/

│ └── globals.css (Tailwind imports + custom)

│

├── tailwind.config.js

├── package.json

└── .env (REACT_APP_API_URL)

\`\`\`

\-\--

\## 🔗 FRONTEND ROUTING MAP

\`\`\`

AppRoutes.jsx defines ALL routes:

PUBLIC ROUTES (no login needed)

│

├── /login → Login.jsx

├── /signup → Signup.jsx

├── /verify-otp → OtpVerify.jsx

├── /forgot-password → ForgotPassword.jsx

└── /assessment → Assessment.jsx

PROTECTED ROUTES (login required → wrapped in MainLayout)

│

├── /dashboard → Dashboard.jsx

│

├── /learn → LearningHome.jsx

├── /learn/:levelId → Lesson.jsx

├── /learn/:levelId/quiz → Quiz.jsx

├── /learn/:levelId/review → AssignmentReview.jsx

│

├── /practice → PracticeHome.jsx

├── /practice/:taskId → PracticeEditor.jsx

├── /practice/:taskId/result → PracticeResult.jsx

│

├── /projects → ProjectHome.jsx

├── /projects/:docId → ProjectEditor.jsx

│

├── /chat → AiChat.jsx

│

├── /analytics → Analytics.jsx

│

└── /settings → Settings.jsx

\`\`\`

\### How Pages Connect to Layouts

\`\`\`

┌────────────────────────────────────────────────────┐

│ │

│ PUBLIC PAGES (AuthLayout) │

│ ┌───────────────────────────────────────┐ │

│ │ ┌─────────────────────────────────┐ │ │

│ │ │ Logo + App Name │ │ │

│ │ │ ┌───────────────────────────┐ │ │ │

│ │ │ │ Login / Signup / OTP │ │ │ │

│ │ │ │ (centered card) │ │ │ │

│ │ │ └───────────────────────────┘ │ │ │

│ │ └─────────────────────────────────┘ │ │

│ └───────────────────────────────────────┘ │

│ │

│ PROTECTED PAGES (MainLayout) │

│ ┌───────────────────────────────────────┐ │

│ │ ┌────────┐ ┌─────────────────────┐ │ │

│ │ │Sidebar │ │ Navbar │ │ │

│ │ │ │ ├─────────────────────┤ │ │

│ │ │ Dash │ │ │ │ │

│ │ │ Learn │ │ PAGE CONTENT │ │ │

│ │ │ Pract │ │ (changes based │ │ │

│ │ │ Proj │ │ on route) │ │ │

│ │ │ Chat │ │ │ │ │

│ │ │ Analy │ │ │ │ │

│ │ │ Sett │ │ │ │ │

│ │ └────────┘ └─────────────────────┘ │ │

│ └───────────────────────────────────────┘ │

│ │

└────────────────────────────────────────────────────┘

\`\`\`

\### How Frontend Files Connect

\`\`\`

index.js

└── App.jsx

├── AuthContext.jsx (wraps everything)

├── ThemeContext.jsx (wraps everything)

│

└── AppRoutes.jsx

│

├── AuthLayout.jsx

│ ├── Login.jsx ──────→ authService.js ──→ api.js ──→ Backend

│ ├── Signup.jsx ─────→ authService.js

│ ├── OtpVerify.jsx ──→ authService.js

│ └── ForgotPassword.jsx → authService.js

│

└── MainLayout.jsx

├── Sidebar.jsx (navigation links)

├── Navbar.jsx (notifications + profile)

│

├── Dashboard.jsx ──→ analyticsService.js ──→ api.js

│

├── LearningHome.jsx → learningService.js ──→ api.js

│ └── Lesson.jsx

│ ├── LessonContent.jsx

│ ├── Quiz.jsx → QuizQuestion.jsx

│ └── AssignmentReview.jsx

│

├── PracticeHome.jsx → practiceService.js ──→ api.js

│ └── PracticeEditor.jsx

│ ├── TextEditor.jsx

│ ├── ErrorHighlight.jsx

│ ├── HoverTooltip.jsx

│ └── PracticeResult.jsx

│

├── ProjectHome.jsx → projectService.js ──→ api.js

│ └── ProjectEditor.jsx

│ ├── TextEditor.jsx

│ ├── ErrorHighlight.jsx

│ └── CoachSidebar.jsx

│

├── AiChat.jsx ──→ chatService.js ──→ api.js

│ ├── ChatBubble.jsx

│ └── ChatInput.jsx

│

├── Analytics.jsx → analyticsService.js ──→ api.js

│ ├── AccuracyChart.jsx

│ ├── ErrorBarChart.jsx

│ ├── BadgeTimeline.jsx

│ └── StatsCard.jsx

│

└── Settings.jsx ──→ authService.js ──→ api.js

\`\`\`

\-\--

\## ⚙️ BACKEND FILE STRUCTURE

\`\`\`

backend/

│

├── main.py (FastAPI app entry point)

├── requirements.txt (All pip packages)

├── .env (Secret keys, DB URL, API keys)

│

├── config/

│ ├── \_\_init\_\_.py

│ ├── database.py (MongoDB connection setup)

│ ├── settings.py (Load .env variables)

│ └── security.py (JWT config, password hashing)

│

├── models/

│ ├── \_\_init\_\_.py

│ ├── user.py (User data model)

│ ├── learning.py (Lesson, quiz, assignment models)

│ ├── practice.py (Practice record model)

│ ├── project.py (Project/document model)

│ ├── chat.py (Chat message model)

│ ├── analytics.py (Analytics snapshot model)

│ └── pattern.py (Error pattern model)

│

├── routes/

│ ├── \_\_init\_\_.py

│ ├── auth.py (Signup, login, OTP, reset)

│ ├── learning.py (Lessons, quizzes, assignments)

│ ├── practice.py (Practice tasks, submissions)

│ ├── project.py (CRUD documents)

│ ├── chat.py (AI chat endpoint)

│ ├── analytics.py (Analytics data endpoints)

│ ├── checker.py (Spell/grammar check endpoint)

│ └── settings.py (User settings endpoints)

│

├── services/

│ ├── \_\_init\_\_.py

│ ├── auth_service.py (Auth business logic)

│ ├── email_service.py (Send OTP emails)

│ ├── llm_service.py (OpenRouter API calls)

│ ├── checker_service.py (Spell/grammar check logic)

│ ├── fallback_service.py (Edit distance fallback)

│ ├── pattern_service.py (Save/analyze error patterns)

│ ├── credit_service.py (Credit/badge calculations)

│ └── analytics_service.py (Generate analytics data)

│

├── prompts/

│ ├── \_\_init\_\_.py

│ ├── checker_prompts.py (Spell/grammar check prompts)

│ ├── practice_prompts.py (Practice analysis prompts)

│ ├── coach_prompts.py (Project coach prompts)

│ └── chat_prompts.py (AI chat system prompts)

│

├── middleware/

│ ├── \_\_init\_\_.py

│ └── auth_middleware.py (JWT verification middleware)

│

├── utils/

│ ├── \_\_init\_\_.py

│ ├── helpers.py (Common utility functions)

│ ├── validators.py (Input validation)

│ └── constants.py (Credit values, badge rules)

│

└── data/

├── lessons/ (Pre-created lesson content)

│ ├── level_01.json

│ ├── level_02.json

│ ├── \...

│ └── level_30.json

│

├── quizzes/ (Quiz questions)

│ ├── quiz_01.json

│ ├── \...

│ └── quiz_30.json

│

├── assessment/

│ └── assessment_questions.json

│

├── practice_templates/

│ └── templates.json (Practice task prompts)

│

└── dictionary/

└── words.txt (Word list for fallback)

\`\`\`

\-\--

\## 🔗 BACKEND CONNECTION MAP

\`\`\`

main.py (Entry Point)

│

├── Loads config/settings.py (.env variables)

├── Connects config/database.py (MongoDB)

├── Registers middleware/auth_middleware.py

├── Registers CORS

│

└── Registers ALL routes:

│

├── routes/auth.py

│ └── calls → services/auth_service.py

│ ├── config/security.py (JWT, bcrypt)

│ ├── config/database.py (save user)

│ └── services/email_service.py (OTP)

│

├── routes/learning.py

│ └── calls → reads data/lessons/\*.json

│ → config/database.py (save progress)

│ → services/credit_service.py (add credits)

│ → services/pattern_service.py (save errors)

│

├── routes/practice.py

│ └── calls → services/llm_service.py (analyze text)

│ └── if fails → services/fallback_service.py

│ → services/pattern_service.py (save errors)

│ → services/credit_service.py (add credits)

│ → prompts/practice_prompts.py

│

├── routes/checker.py (used by Practice + Project editors)

│ └── calls → services/checker_service.py

│ ├── services/llm_service.py (primary)

│ │ └── prompts/checker_prompts.py

│ └── services/fallback_service.py (backup)

│ → services/pattern_service.py (save data)

│

├── routes/project.py

│ └── calls → config/database.py (CRUD documents)

│ → services/checker_service.py (coach)

│ → prompts/coach_prompts.py

│

├── routes/chat.py

│ └── calls → config/database.py (get user context)

│ → services/llm_service.py (chat)

│ → prompts/chat_prompts.py

│ → config/database.py (save chat)

│

├── routes/analytics.py

│ └── calls → services/analytics_service.py

│ └── config/database.py (read patterns)

│

└── routes/settings.py

└── calls → config/database.py (update settings)

→ services/auth_service.py (change password)

\`\`\`

\### How Backend Routes Map to Frontend Services

\`\`\`

FRONTEND SERVICE → BACKEND ROUTE

──────────────────────────────────────────────

authService.js

signup() → POST /api/auth/signup

verifyOtp() → POST /api/auth/verify-otp

resendOtp() → POST /api/auth/resend-otp

login() → POST /api/auth/login

forgotPassword() → POST /api/auth/forgot-password

resetPassword() → POST /api/auth/reset-password

getProfile() → GET /api/auth/profile

updateProfile() → PUT /api/auth/profile

submitAssessment() → POST /api/auth/assessment

learningService.js

getAllLevels() → GET /api/learning/levels

getLesson() → GET /api/learning/levels/:id

submitQuiz() → POST /api/learning/quiz/:id

submitAssignment() → POST /api/learning/assignment/:id

getAssignmentReview() → GET /api/learning/assignment/:id/review

practiceService.js

getTemplates() → GET /api/practice/templates

getPracticeTask() → GET /api/practice/task/:id

submitPractice() → POST /api/practice/submit

getPracticeResult() → GET /api/practice/result/:id

getPracticeHistory() → GET /api/practice/history

projectService.js

getAllProjects() → GET /api/projects

getProject() → GET /api/projects/:id

createProject() → POST /api/projects

updateProject() → PUT /api/projects/:id

deleteProject() → DELETE /api/projects/:id

autoSave() → PUT /api/projects/:id/autosave

checkService.js

checkText() → POST /api/checker/check

getCoachSuggestions() → POST /api/checker/coach

chatService.js

sendMessage() → POST /api/chat/send

getChatHistory() → GET /api/chat/history

analyticsService.js

getOverview() → GET /api/analytics/overview

getErrorPatterns() → GET /api/analytics/errors

getProgressGraph() → GET /api/analytics/progress

getBadges() → GET /api/analytics/badges

getWeekly/Monthly() → GET /api/analytics/report/:period

settingsService.js (inside authService)

getSettings() → GET /api/settings

updateSettings() → PUT /api/settings

changePassword() → PUT /api/settings/password

\`\`\`

\-\--

\## 🗄️ MONGODB COMPLETE SETUP

\### Database Name

\`\`\`

Database: grammar_coach_db

\`\`\`

\### All Collections (Tables)

\`\`\`

grammar_coach_db/

│

├── users (User credentials + profile)

├── otp_tokens (Temporary OTP storage)

├── learning_progress (Level/lesson progress per user)

├── error_patterns (All errors tracked)

├── practice_records (Practice submissions + results)

├── projects (User documents)

├── chat_history (AI chat messages)

├── analytics_snapshots (Daily/weekly/monthly stats)

└── badges (Earned badges per user)

\`\`\`

\### Collection Structures

\#### 1. users

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"name\": \"John Doe\",

\"email\": \"john@email.com\",

\"phone\": \"+1234567890\",

\"password_hash\": \"\$2b\$12\$\...\",

\"email_verified\": true,

\"role\": \"student\",

\"created_at\": \"2025-01-15T10:00:00Z\",

\"last_login\": \"2025-01-20T08:00:00Z\",

\"profile\": {

\"current_level\": 14,

\"assessment_score\": 6,

\"strengths\": \[\"spelling\", \"basic_grammar\"\],

\"weaknesses\": \[\"homophones\", \"punctuation\"\],

\"total_credits\": 450,

\"current_streak\": 5,

\"best_streak\": 12,

\"rank\": \"grammar_enthusiast\"

},

\"settings\": {

\"theme\": \"dark\",

\"font_size\": \"medium\",

\"notifications_enabled\": true,

\"email_notifications\": true,

\"reminder_time\": \"09:00\"

}

}

\`\`\`

\#### 2. otp_tokens

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"email\": \"john@email.com\",

\"otp\": \"583921\",

\"purpose\": \"signup_verification\",

\"created_at\": \"2025-01-15T10:00:00Z\",

\"expires_at\": \"2025-01-15T10:10:00Z\",

\"used\": false

}

\`\`\`

\#### 3. learning_progress

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"level_number\": 14,

\"topic\": \"commonly_confused_words\",

\"category\": \"intermediate\",

\"status\": \"in_progress\",

\"started_at\": \"2025-01-20T10:00:00Z\",

\"completed_at\": null,

\"quiz_attempts\": \[

{

\"attempt\": 1,

\"score\": 4,

\"total\": 5,

\"time_taken_seconds\": 120,

\"answers\": \[

{

\"question_id\": \"q1\",

\"user_answer\": \"affected\",

\"correct_answer\": \"affected\",

\"is_correct\": true

},

{

\"question_id\": \"q2\",

\"user_answer\": \"affect\",

\"correct_answer\": \"effect\",

\"is_correct\": false

}

\],

\"submitted_at\": \"2025-01-20T10:15:00Z\"

}

\],

\"assignment\": {

\"submitted_text\": \"The medicine had a good affect\...\",

\"score\": 1,

\"total\": 3,

\"errors\": \[

{

\"user_wrote\": \"affect\",

\"correct\": \"effect\",

\"error_type\": \"word_confusion\",

\"explanation\": \"Need noun here, not verb\"

}

\],

\"submitted_at\": \"2025-01-20T10:25:00Z\",

\"retry_count\": 0

},

\"credits_earned\": 20

}

\`\`\`

\#### 4. error_patterns

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"error_type\": \"spelling\",

\"error_subtype\": \"letter_swap\",

\"original_word\": \"Reqeust\",

\"correct_word\": \"Request\",

\"context_sentence\": \"Subject: Reqeust for Day Off\",

\"source\": \"practice\",

\"source_id\": \"ObjectId (ref → practice_records)\",

\"occurred_at\": \"2025-01-20T14:30:00Z\",

\"frequency\": 3,

\"resolved\": false

}

\`\`\`

\#### 5. practice_records

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"task_type\": \"email\",

\"task_prompt\": \"Write an email requesting a day off\...\",

\"mode\": \"after_analysis\",

\"submitted_text\": \"Subject: Reqeust for Day Off\...\",

\"submitted_at\": \"2025-01-20T14:30:00Z\",

\"analysis\": {

\"overall_score\": 6.5,

\"category_scores\": {

\"spelling\": 7,

\"grammar\": 5,

\"sentence_structure\": 7,

\"tone\": 6,

\"completeness\": 8

},

\"errors\": \[

{

\"type\": \"spelling\",

\"subtype\": \"letter_swap\",

\"original\": \"Reqeust\",

\"correction\": \"Request\",

\"explanation\": \"Letters e and u are swapped\",

\"position\": {\"start\": 9, \"end\": 15},

\"severity\": \"minor\",

\"color\": \"red\"

},

{

\"type\": \"grammar\",

\"subtype\": \"unnecessary_preposition\",

\"original\": \"on next Friday\",

\"correction\": \"next Friday\",

\"explanation\": \"Dont use on before next/last/this + day\",

\"position\": {\"start\": 89, \"end\": 103},

\"severity\": \"moderate\",

\"color\": \"yellow\"

}

\],

\"improved_version\": \"Subject: Request for Day Off\...\",

\"strengths\": \[\"Good email structure\", \"Polite tone\"\],

\"areas_to_improve\": \[\"Watch out for letter swaps\", \"Preposition
usage\"\]

},

\"llm_response_raw\": {},

\"fallback_used\": false,

\"credits_earned\": 20,

\"retry_count\": 0

}

\`\`\`

\#### 6. projects

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"title\": \"Research Paper - Climate Change\",

\"doc_type\": \"research\",

\"content\": \"Climate change is one of the most pressing\...\",

\"word_count\": 1560,

\"created_at\": \"2025-01-18T09:00:00Z\",

\"updated_at\": \"2025-01-20T16:00:00Z\",

\"auto_saved\": true,

\"error_history\": \[

{

\"checked_at\": \"2025-01-20T16:00:00Z\",

\"errors_found\": 5,

\"errors_fixed\": 3,

\"errors_ignored\": 2,

\"error_types\": {

\"spelling\": 2,

\"grammar\": 2,

\"style\": 1

}

}

\]

}

\`\`\`

\#### 7. chat_history

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"messages\": \[

{

\"role\": \"assistant\",

\"content\": \"Hi John! I am your grammar coach\...\",

\"timestamp\": \"2025-01-20T17:00:00Z\"

},

{

\"role\": \"user\",

\"content\": \"How am I doing with my learning?\",

\"timestamp\": \"2025-01-20T17:00:15Z\"

},

{

\"role\": \"assistant\",

\"content\": \"Great question! You have completed 14 of 30 levels\...\",

\"context_used\": {

\"level\": 14,

\"recent_errors\": \[\"affect/effect\", \"letter_swaps\"\],

\"practice_scores\": \[6.5, 7.0, 8.0\]

},

\"timestamp\": \"2025-01-20T17:00:18Z\"

}

\],

\"session_date\": \"2025-01-20\"

}

\`\`\`

\#### 8. analytics_snapshots

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"period\": \"daily\",

\"date\": \"2025-01-20\",

\"stats\": {

\"accuracy\": 78.5,

\"lessons_completed\": 1,

\"quizzes_taken\": 2,

\"practice_tasks\": 1,

\"errors_made\": 8,

\"errors_fixed\": 5,

\"credits_earned\": 45,

\"time_spent_minutes\": 65,

\"words_written\": 450

},

\"top_errors\": \[

{\"type\": \"homophones\", \"count\": 3},

{\"type\": \"spelling\", \"count\": 3},

{\"type\": \"punctuation\", \"count\": 2}

\],

\"created_at\": \"2025-01-20T23:59:00Z\"

}

\`\`\`

\#### 9. badges

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId (ref → users)\",

\"badge_id\": \"first_login\",

\"badge_name\": \"First Steps\",

\"badge_icon\": \"🏅\",

\"description\": \"Complete your first login\",

\"credits_required\": 10,

\"earned_at\": \"2025-01-15T10:05:00Z\",

\"credits_at_earn\": 10

}

\`\`\`

\-\--

\## 🔗 MongoDB Indexes (for fast queries)

\`\`\`

COLLECTION INDEX PURPOSE

─────────────────────────────────────────────────────

users email (unique) Login lookup

users email_verified Filter verified

otp_tokens email + purpose OTP lookup

otp_tokens expires_at (TTL) Auto-delete expired

learning_progress user_id + level_number Get user progress

error_patterns user_id + error_type Pattern analysis

error_patterns user_id + occurred_at Timeline queries

practice_records user_id + submitted_at History sorted

projects user_id User documents

chat_history user_id + session_date Chat lookup

analytics_snapshots user_id + period + date Report queries

badges user_id Badge list

\`\`\`

\-\--

\## 🔗 COMPLETE CONNECTION DIAGRAM

\`\`\`

┌─────────────────────────────────────────────────────────────┐

│ │

│ BROWSER (User) │

│ │ │

│ ▼ │

│ ┌──────────────────────────────────────┐ │

│ │ REACT FRONTEND │ │

│ │ │ │

│ │ Pages ──→ Services ──→ api.js │ │

│ │ │ │ │

│ └───────────────────────────┼──────────┘ │

│ │ │

│ HTTP (axios)│ │

│ JSON format │ │

│ │ │

│ ┌───────────────────────────┼──────────┐ │

│ │ FASTAPI BACKEND │ │ │

│ │ ▼ │ │

│ │ main.py ──→ routes/ ──→ services/ │ │

│ │ │ │ │ │

│ │ │ ├──→ llm_service.py │

│ │ │ │ │ │

│ │ │ │ ▼ │

│ │ │ │ ┌──────────┐ │

│ │ │ │ │OpenRouter│ │

│ │ │ │ │ API │ │

│ │ │ │ └──────────┘ │

│ │ │ │ │

│ │ │ ├──→ email_service.py │

│ │ │ │ │ │

│ │ │ │ ▼ │

│ │ │ │ ┌──────────┐ │

│ │ │ │ │ SMTP │ │

│ │ │ │ │ (Gmail) │ │

│ │ │ │ └──────────┘ │

│ │ │ │ │

│ │ ▼ ▼ │

│ │ config/database.py │

│ │ │ │

│ └────────────────────┼────────────────────────────────────┘

│ │ │

│ ▼ │

│ ┌──────────────────┐ │

│ │ MONGODB ATLAS │ │

│ │ │ │

│ │ grammar_coach_db│ │

│ │ ├── users │ │

│ │ ├── otp_tokens │ │

│ │ ├── learning\... │ │

│ │ ├── error\... │ │

│ │ ├── practice\... │ │

│ │ ├── projects │ │

│ │ ├── chat\... │ │

│ │ ├── analytics.. │ │

│ │ └── badges │ │

│ └──────────────────┘ │

│ │

└──────────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 📋 .env FILES

\### Frontend .env

\`\`\`

REACT_APP_API_URL=http://localhost:8000/api

\`\`\`

\### Backend .env

\`\`\`

MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/grammar_coach_db

JWT_SECRET=your_super_secret_key_here

JWT_EXPIRY=24h

OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx

OPENROUTER_MODEL=openai/gpt-3.5-turbo

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_EMAIL=your_email@gmail.com

SMTP_PASSWORD=your_app_password

FRONTEND_URL=http://localhost:3000

\`\`\`

\## 📊 COMPLETE ANALYTICS SYSTEM DESIGN

\-\--

\## 🧠 CORE APPROACH

\`\`\`

HOW ANALYTICS WORKS:

User does activity (learn/practice/project)

│

▼

Backend processes the activity

│

▼

At the SAME TIME, backend updates analytics data

(not separate calculation, piggyback on existing actions)

│

▼

Data stored in DB (pre-calculated)

│

▼

Frontend just FETCHES and DISPLAYS

(no heavy calculation on frontend)

│

▼

Periodic aggregation for weekly/monthly

(cron job or on-demand with caching)

\`\`\`

\-\--

\## 📌 WHEN DATA GETS UPDATED (Triggers)

\`\`\`

USER ACTION → WHAT GETS UPDATED

──────────────────────────────────────────────────────

Completes a lesson → daily_stats.lessons_completed++

daily_stats.time_spent += duration

user.profile.current_level

streak calculation

Submits a quiz → daily_stats.quizzes_taken++

daily_stats.correct_answers += correct

daily_stats.total_answers += total

error_patterns (new errors added)

Submits assignment → daily_stats.assignments_completed++

error_patterns updated

credits_earned updated

Submits practice → daily_stats.practice_tasks++

daily_stats.words_written += count

practice_scores array updated

error_patterns updated

Works on project → daily_stats.project_time += duration

daily_stats.words_written += count

error tracking updated

Logs in → streak calculation

last_login updated

login_days tracking

\`\`\`

\-\--

\## 🗄️ UPDATED DATABASE COLLECTIONS FOR ANALYTICS

\### 1. Updated \`users\` collection (add these fields)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"name\": \"John Doe\",

\"email\": \"john@email.com\",

\"profile\": {

\"current_level\": 14,

\"total_levels\": 30,

\"assessment_score\": 6,

\"strengths\": \[\"spelling\", \"basic_grammar\"\],

\"weaknesses\": \[\"homophones\", \"punctuation\"\],

\"total_credits\": 450,

\"current_streak\": 5,

\"best_streak\": 12,

\"rank\": \"grammar_enthusiast\",

\"total_words_written\": 15600,

\"total_practice_done\": 23,

\"total_lessons_done\": 14,

\"total_errors_made\": 156,

\"total_errors_fixed\": 120,

\"total_time_spent_minutes\": 1200,

\"joined_at\": \"2025-01-01T00:00:00Z\",

\"last_active\": \"2025-01-20T16:00:00Z\"

}

}

\`\`\`

\### 2. \`daily_stats\` collection (NEW - replaces analytics_snapshots)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId\",

\"date\": \"2025-01-20\",

\"learning\": {

\"lessons_completed\": 1,

\"quizzes_taken\": 2,

\"quiz_correct\": 8,

\"quiz_total\": 10,

\"assignments_completed\": 1,

\"assignment_score\": 7,

\"assignment_total\": 10,

\"time_spent_minutes\": 35,

\"credits_earned\": 25

},

\"practice\": {

\"tasks_completed\": 2,

\"task_types\": \[\"email\", \"letter\"\],

\"scores\": \[6.5, 7.0\],

\"average_score\": 6.75,

\"words_written\": 450,

\"time_spent_minutes\": 20,

\"credits_earned\": 15

},

\"project\": {

\"documents_worked\": 1,

\"words_written\": 320,

\"time_spent_minutes\": 25

},

\"errors\": {

\"total_made\": 8,

\"total_fixed\": 5,

\"by_type\": {

\"spelling\": 3,

\"grammar\": 3,

\"punctuation\": 1,

\"word_confusion\": 1

}

},

\"totals\": {

\"total_time_minutes\": 80,

\"total_credits\": 40,

\"total_words\": 770,

\"accuracy_percentage\": 78.5,

\"login\": true

},

\"created_at\": \"2025-01-20T23:59:00Z\"

}

\`\`\`

\### 3. \`weekly_stats\` collection (aggregated from daily)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId\",

\"week_start\": \"2025-01-13\",

\"week_end\": \"2025-01-19\",

\"week_number\": 3,

\"year\": 2025,

\"learning\": {

\"lessons_completed\": 5,

\"quizzes_taken\": 8,

\"quiz_accuracy\": 82.5,

\"assignments_completed\": 4,

\"avg_assignment_score\": 7.2,

\"time_spent_minutes\": 180

},

\"practice\": {

\"tasks_completed\": 8,

\"avg_score\": 7.1,

\"best_score\": 8.5,

\"worst_score\": 5.0,

\"words_written\": 2400,

\"time_spent_minutes\": 120,

\"improvement_from_last_week\": 0.5

},

\"errors\": {

\"total_made\": 45,

\"total_fixed\": 35,

\"fix_rate\": 77.8,

\"most_common\": \"homophones\",

\"by_type\": {

\"spelling\": 12,

\"grammar\": 15,

\"punctuation\": 8,

\"word_confusion\": 10

},

\"improvement_from_last_week\": {

\"spelling\": -3,

\"grammar\": -2,

\"punctuation\": 0,

\"word_confusion\": -1

}

},

\"totals\": {

\"active_days\": 5,

\"total_time_minutes\": 420,

\"total_credits\": 180,

\"total_words\": 4200,

\"avg_daily_accuracy\": 79.5

},

\"generated_at\": \"2025-01-20T00:00:00Z\"

}

\`\`\`

\### 4. \`monthly_stats\` collection (aggregated from weekly)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId\",

\"month\": 1,

\"year\": 2025,

\"learning\": {

\"lessons_completed\": 14,

\"total_levels_at_start\": 8,

\"total_levels_at_end\": 14,

\"levels_gained\": 6,

\"quiz_accuracy\": 80.2,

\"assignments_completed\": 12,

\"avg_assignment_score\": 7.5

},

\"practice\": {

\"tasks_completed\": 23,

\"avg_score\": 6.8,

\"score_trend\": \[5.5, 6.2, 7.0, 7.5\],

\"best_score\": 9.0,

\"words_written\": 8500,

\"favorite_task_type\": \"email\"

},

\"errors\": {

\"total_made\": 156,

\"total_fixed\": 120,

\"fix_rate\": 76.9,

\"trend\": {

\"week1\": 52,

\"week2\": 45,

\"week3\": 38,

\"week4\": 21

},

\"most_improved\": \"spelling\",

\"needs_work\": \"punctuation\",

\"by_type_trend\": {

\"spelling\": \[15, 12, 8, 5\],

\"grammar\": \[18, 15, 14, 10\],

\"punctuation\": \[10, 10, 9, 8\],

\"word_confusion\": \[9, 8, 7, 5\]

}

},

\"totals\": {

\"active_days\": 22,

\"total_time_minutes\": 1200,

\"total_credits\": 450,

\"total_words\": 15600,

\"avg_accuracy\": 78.5

},

\"achievements\": {

\"badges_earned\": 3,

\"badge_names\": \[\"Speed Learner\", \"Error Crusher\", \"Week
Warrior\"\],

\"credits_milestone\": 400

},

\"generated_at\": \"2025-02-01T00:00:00Z\"

}

\`\`\`

\### 5. Updated \`error_patterns\` (for detailed error analytics)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId\",

\"error_type\": \"spelling\",

\"error_subtype\": \"letter_swap\",

\"original_word\": \"Reqeust\",

\"correct_word\": \"Request\",

\"context_sentence\": \"Subject: Reqeust for Day Off\",

\"source\": \"practice\",

\"source_id\": \"ObjectId\",

\"occurred_at\": \"2025-01-20T14:30:00Z\",

\"frequency\": 3,

\"resolved\": false,

\"history\": \[

{

\"date\": \"2025-01-15\",

\"source\": \"learning\",

\"corrected\": false

},

{

\"date\": \"2025-01-18\",

\"source\": \"practice\",

\"corrected\": false

},

{

\"date\": \"2025-01-20\",

\"source\": \"practice\",

\"corrected\": true

}

\]

}

\`\`\`

\### 6. Updated \`badges\` (predefined + earned)

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"badge_id\": \"first_login\",

\"badge_name\": \"First Steps\",

\"badge_icon\": \"🏅\",

\"badge_category\": \"milestone\",

\"description\": \"Complete your first login\",

\"criteria_type\": \"credits\",

\"criteria_value\": 10,

\"tier\": \"bronze\",

\"is_predefined\": true

}

\`\`\`

\`\`\`json

{

\"\_id\": \"ObjectId\",

\"user_id\": \"ObjectId\",

\"badge_id\": \"first_login\",

\"earned_at\": \"2025-01-15T10:05:00Z\",

\"credits_at_earn\": 10,

\"is_predefined\": false

}

\`\`\`

\-\--

\## ⚙️ BACKEND LOGIC: HOW CALCULATIONS HAPPEN

\### Strategy 1: Piggyback Updates (Real-time)

\`\`\`

WHEN: User submits quiz/practice/assignment

WHERE: In the same backend service function

HOW: After processing the main request, update daily_stats

Example Flow:

─────────────

User submits practice task

│

▼

practice_service.py → submit_practice()

│

├── 1. Save practice_record to DB

├── 2. Call LLM for analysis

├── 3. Save analysis results

├── 4. Extract errors → save to error_patterns

├── 5. Update daily_stats (increment counters)

├── 6. Update user.profile totals

├── 7. Check badge criteria → award if earned

└── 8. Return response to frontend

\`\`\`

\### Strategy 2: Periodic Aggregation (Scheduled)

\`\`\`

WHAT: Weekly and Monthly stats generation

WHEN:

\- Weekly: Every Monday at 00:00

\- Monthly: 1st of every month at 00:00

HOW: Backend cron job / scheduled task

Weekly Aggregation Logic:

─────────────────────────

1\. Query daily_stats for user WHERE date in last 7 days

2\. Sum up all learning metrics

3\. Sum up all practice metrics

4\. Calculate averages and percentages

5\. Compare with previous week for improvement

6\. Save to weekly_stats collection

Monthly Aggregation Logic:

─────────────────────────

1\. Query weekly_stats for user WHERE month matches

2\. Sum up all weekly metrics

3\. Calculate trends (week over week)

4\. Identify most improved and needs work areas

5\. Check achievement milestones

6\. Save to monthly_stats collection

\`\`\`

\### Strategy 3: On-Demand with Caching

\`\`\`

WHEN: User opens analytics page

HOW:

1\. Check if today\'s daily_stats exists

\- YES → return cached data

\- NO → calculate from today\'s activities, save, return

2\. Check if current week\'s weekly_stats exists

\- YES and not stale → return cached

\- NO or stale → aggregate from daily, save, return

\`\`\`

\-\--

\## 📊 WHAT TO SHOW: DASHBOARD vs ANALYTICS

\### DASHBOARD (Quick Overview)

\`\`\`

┌──────────────────────────────────────────────────────┐

│ DASHBOARD │

│ │

│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │

│ │ 🔥 Streak │ │ ⭐ Credits │ │ 📊 Level │ │

│ │ 5 days │ │ 450 │ │ 14/30 │ │

│ └─────────────┘ └─────────────┘ └──────────────┘ │

│ │

│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ │

│ │ 🎯 Accuracy │ │ ✍️ Words │ │ ⏱️ Today │ │

│ │ 78.5% │ │ 15,600 │ │ 80 min │ │

│ └─────────────┘ └─────────────┘ └──────────────┘ │

│ │

│ TODAY\'S ACTIVITY │

│ ┌──────────────────────────────────────────────┐ │

│ │ ✅ Completed Level 14 Quiz (8/10) │ │

│ │ ✅ Practice: Email Writing (Score: 6.5) │ │

│ │ 📝 Worked on: Research Paper (320 words) │ │

│ └──────────────────────────────────────────────┘ │

│ │

│ CONTINUE WHERE YOU LEFT │

│ ┌──────────────────────────────────────────────┐ │

│ │ 📖 Level 14: Commonly Confused Words │ │

│ │ Assignment pending \[→\] │ │

│ └──────────────────────────────────────────────┘ │

│ │

│ RECENT BADGES │

│ 🏅 First Steps ⚡ Speed Learner 🎯 Accuracy Pro │

│ │

│ QUICK STATS (Mini Chart - Last 7 days) │

│ Accuracy: ▁▂▃▃▅▆▇ │

│ │

│ WEAK AREAS (Quick Alert) │

│ ⚠️ Homophones - 12 errors this week │

│ ⚠️ Punctuation - 8 errors this week │

│ │

└──────────────────────────────────────────────────────┘

\`\`\`

\*\*Dashboard Data Source:\*\*

\`\`\`

user.profile → streak, credits, level, totals

daily_stats (today) → today\'s activity, time, accuracy

error_patterns → weak areas (aggregate recent)

badges (latest 3) → recent badges

learning_progress → continue where left off

\`\`\`

\-\--

\### ANALYTICS PAGE (Detailed)

\`\`\`

┌──────────────────────────────────────────────────────────┐

│ ANALYTICS \[Daily\] \[Weekly\] \[Monthly\] │

│ │

│ ═══════════════════════════════════════════════════════ │

│ 📈 PERFORMANCE OVERVIEW │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ ACCURACY TREND (Line Graph) │ │

│ │ │ │

│ │ 100%│ ╭── │ │

│ │ 80%│ ╭─────╮───╯ │ │

│ │ 60%│ ╭────╮────╯ │ │ │

│ │ 40%│ ╭────╮───╯ │ │ │

│ │ 20%│───╯ │ │ │

│ │ └──────────────────────────────────── │ │

│ │ W1 W2 W3 W4 W5 W6 W7 │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ 📚 LEARNING PROGRESS │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ LEVEL PROGRESS BAR │ │

│ │ ████████████████████░░░░░░░░░░ 14/30 (47%) │ │

│ │ │ │

│ │ Category Breakdown: │ │

│ │ Beginner ██████████ 10/10 ✅ Complete │ │

│ │ Intermediate █████░░░░░ 4/10 🔄 In Progress │ │

│ │ Advanced ░░░░░░░░░░ 0/10 🔒 Locked │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ QUIZ PERFORMANCE (Bar Chart) │ │

│ │ │ │

│ │ Level 10 ████████████████ 92% │ │

│ │ Level 11 ██████████████ 85% │ │

│ │ Level 12 ████████████ 78% │ │

│ │ Level 13 ██████████████ 82% │ │

│ │ Level 14 ████████████████ 88% │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ ✍️ PRACTICE ANALYSIS │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ PRACTICE SCORES TREND (Line Graph) │ │

│ │ │ │

│ │ 10│ │ │

│ │ 8│ ╭──● │ │

│ │ 6│ ╭──●───●───●───╯ │ │

│ │ 4│ ●───●────╯ │ │

│ │ 2│ │ │

│ │ └───────────────────────────────── │ │

│ │ T1 T2 T3 T4 T5 T6 T7 T8 │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ TASK TYPE PERFORMANCE (Radar/Spider Chart) │ │

│ │ │ │

│ │ Email │ │

│ │ 8.2 │ │

│ │ ╱ ╲ │ │

│ │ Report ╱ ╲ Letter │ │

│ │ 6.5 ╱ ████ ╲ 7.8 │ │

│ │ ╱ ████ ╲ │ │

│ │ ╲ ████ ╱ │ │

│ │ Essay ╲ ████ ╱ Conversation │ │

│ │ 5.0 ╲ ╱ 7.0 │ │

│ │ ╲ ╱ │ │

│ │ Summary │ │

│ │ 6.8 │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ 🔴 ERROR ANALYSIS │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ ERROR DISTRIBUTION (Pie/Donut Chart) │ │

│ │ │ │

│ │ ┌────────────┐ │ │

│ │ ╱ Spelling ╲ Spelling 28% │ │

│ │ │ 28% ████ │ Grammar 35% │ │

│ │ │ ████ Grammar │ Punctuation 18% │ │

│ │ │ ████ 35% │ Word Confusion 12% │ │

│ │ ╲ Punct 18% ╱ Sentence 7% │ │

│ │ └────────────┘ │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ ERROR TREND OVER TIME (Stacked Area Chart) │ │

│ │ │ │

│ │ 50│████ │ │

│ │ 40│████████ │ │

│ │ 30│████████████ │ │

│ │ 20│████████████████ ░░░░ │ │

│ │ 10│████████████████████████░░░░░░░░░░ │ │

│ │ 0│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │

│ │ └────────────────────────────────── │ │

│ │ W1 W2 W3 W4 W5 W6 │ │

│ │ │ │

│ │ ■ Spelling ■ Grammar ■ Punctuation ░ Others │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ TOP REPEATED ERRORS (Table) │ │

│ │ │ │

│ │ \# Error Type Count Status │ │

│ │ 1 affect/effect word_conf 8 ⚠️ Active │ │

│ │ 2 Reqeust spelling 5 ✅ Fixing │ │

│ │ 3 their/there word_conf 4 ⚠️ Active │ │

│ │ 4 missing comma punctuation 4 ⚠️ Active │ │

│ │ 5 its/it\'s word_conf 3 ✅ Fixing │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ ⏱️ TIME & ACTIVITY │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ DAILY ACTIVITY HEATMAP (Like GitHub) │ │

│ │ │ │

│ │ Mon ░░██░░██████░░██████████████░░████ │ │

│ │ Tue ░░████░░██████░░██████░░████████░░ │ │

│ │ Wed ████░░░░██████████░░██████░░██████ │ │

│ │ Thu ░░██████░░████████████░░██████░░██ │ │

│ │ Fri ██░░██████░░░░██████████████░░████ │ │

│ │ Sat ░░░░░░██░░░░░░██░░░░██░░░░██░░░░ │ │

│ │ Sun ░░░░░░░░░░░░░░░░░░██░░░░░░░░░░░░ │ │

│ │ │ │

│ │ ░ No activity ▓ Light █ Active ██ Very Active │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ TIME DISTRIBUTION (Bar Chart) │ │

│ │ │ │

│ │ Learning ████████████████████ 45% 540 min │ │

│ │ Practice ██████████████ 30% 360 min │ │

│ │ Projects ████████ 18% 216 min │ │

│ │ Chat ███ 7% 84 min │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ 🏆 ACHIEVEMENTS & BADGES │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ BADGE TIMELINE │ │

│ │ │ │

│ │ Jan 1 ──●── 🏅 First Steps (10 credits) │ │

│ │ Jan 3 ──●── 📚 Bookworm (5 lessons done) │ │

│ │ Jan 7 ──●── 🔥 Week Warrior (7 day streak) │ │

│ │ Jan 10 ──●── ⚡ Speed Learner (3 levels in 1 day) │ │

│ │ Jan 15 ──●── 🎯 Accuracy Pro (90%+ quiz) │ │

│ │ Jan 18 ──●── 🎖️ Error Crusher (fix 100 errors) │ │

│ │ │ │

│ │ NEXT BADGE: │ │

│ │ 🏆 Grammar Master - Need 500 credits (450/500) │ │

│ │ ████████████████████████████████████████░░ 90% │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ CREDITS GROWTH (Line Chart) │ │

│ │ │ │

│ │ 500│ ╭──● │ │

│ │ 400│ ╭─────────╯ │ │

│ │ 300│ ╭─────────╯ │ │

│ │ 200│ ╭────────╯ │ │

│ │ 100│───╯ │ │

│ │ └──────────────────────────────────── │ │

│ │ W1 W2 W3 W4 W5 W6 │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ═══════════════════════════════════════════════════════ │

│ 📊 COMPARISON & INSIGHTS │

│ ═══════════════════════════════════════════════════════ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ THIS WEEK vs LAST WEEK │ │

│ │ │ │

│ │ Accuracy 78.5% → 82.3% ↑ 3.8% 🟢 │ │

│ │ Errors 45 → 38 ↓ 7 🟢 │ │

│ │ Practice Avg 6.5 → 7.1 ↑ 0.6 🟢 │ │

│ │ Time Spent 420min → 380min ↓ 40min 🟡 │ │

│ │ Words 4200 → 4800 ↑ 600 🟢 │ │

│ │ Streak 3 → 5 ↑ 2 🟢 │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

│ ┌─────────────────────────────────────────────────────┐ │

│ │ AI INSIGHTS (Generated from patterns) │ │

│ │ │ │

│ │ 💡 You improved most in spelling this month │ │

│ │ Errors dropped from 15 to 5 per week │ │

│ │ │ │

│ │ ⚠️ Homophones still need attention │ │

│ │ affect/effect and their/there are recurring │ │

│ │ │ │

│ │ 🎯 Suggested Focus: Practice more letter writing │ │

│ │ Your score is 5.0 (lowest category) │ │

│ │ │ │

│ │ 🔥 Great consistency! 5 day streak active │ │

│ │ Keep going to unlock Week Warrior badge │ │

│ └─────────────────────────────────────────────────────┘ │

│ │

└──────────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 🔄 COMPLETE UPDATE FLOW

\`\`\`

┌──────────────────────────────────────────────────────┐

│ USER ACTION │

│ (quiz/practice/project) │

└──────────────┬───────────────────────────────────────┘

│

▼

┌──────────────────────────────────────────────────────┐

│ BACKEND SERVICE │

│ │

│ 1. Process main request │

│ 2. Save main data (practice_record, etc) │

│ 3. Extract errors → error_patterns collection │

│ 4. Update daily_stats: │

│ - Find today\'s doc (upsert if not exists) │

│ - Increment relevant counters │

│ - Recalculate today\'s accuracy │

│ 5. Update user.profile: │

│ - total_credits += earned │

│ - total_errors_made += new_errors │

│ - total_words_written += words │

│ 6. Check streak: │

│ - Compare last_active with today │

│ - If consecutive day → streak++ │

│ - If gap → streak = 1 │

│ 7. Check badges: │

│ - Query badge_definitions │

│ - If criteria met and not already earned │

│ - Award badge │

│ 8. Return response │

│ │

└──────────────────────────────────────────────────────┘

│

▼

┌──────────────────────────────────────────────────────┐

│ PERIODIC JOBS (Cron/Scheduler) │

│ │

│ DAILY (midnight): │

│ - Finalize yesterday\'s daily_stats │

│ - Mark incomplete daily_stats as final │

│ │

│ WEEKLY (Monday midnight): │

│ - Aggregate last 7 daily_stats → weekly_stats │

│ - Calculate improvement percentages │

│ - Compare with previous week │

│ │

│ MONTHLY (1st of month): │

│ - Aggregate weekly_stats → monthly_stats │

│ - Calculate trends │

│ - Generate AI insights │

│ - Check monthly achievements │

│ │

└──────────────────────────────────────────────────────┘

│

▼

┌──────────────────────────────────────────────────────┐

│ FRONTEND FETCHES │

│ │

│ Dashboard: │

│ GET /api/analytics/overview │

│ → Returns: user.profile + today\'s daily_stats │

│ → Pre-calculated, just fetch and display │

│ │

│ Analytics Page: │

│ GET /api/analytics/progress │

│ → Returns: daily/weekly/monthly stats │

│ → All pre-calculated in DB │

│ │

│ GET /api/analytics/errors │

│ → Returns: error distribution + trends │

│ → Aggregated from error_patterns │

│ │

│ GET /api/analytics/badges │

│ → Returns: earned + next available badges │

│ → Direct DB fetch │

│ │

│ GET /api/analytics/report/weekly │

│ → Returns: weekly_stats document │

│ → Pre-calculated, just fetch │

│ │

└──────────────────────────────────────────────────────┘

\`\`\`

\-\--

\## 📋 UPDATED INDEXES

\`\`\`

COLLECTION INDEX PURPOSE

───────────────────────────────────────────────────────────

daily_stats user_id + date (unique) One per user per day

weekly_stats user_id + week_start Weekly lookup

monthly_stats user_id + month + year Monthly lookup

error_patterns user_id + error_type Error analysis

error_patterns user_id + occurred_at Timeline

error_patterns user_id + frequency (desc) Top errors

badges user_id + badge_id (unique) Prevent duplicates

\`\`\`

\-\--

\## 📋 BADGE DEFINITIONS (Stored in Code or DB)

\`\`\`

BADGE CRITERIA CREDITS

─────────────────────────────────────────────────────────

🏅 First Steps First login 10

📚 Bookworm Complete 5 lessons 50

🔥 Week Warrior 7 day streak 100

⚡ Speed Learner 3 levels in 1 day 75

🎯 Accuracy Pro 90%+ on any quiz 60

🎖️ Error Crusher Fix 100 errors total 150

✍️ Word Smith Write 10,000 words 200

🏆 Grammar Master Earn 500 total credits 250

💎 Perfectionist Score 10/10 on practice 100

👑 Level King Complete all 30 levels 500

📧 Email Expert Score 8+ on 5 email tasks 120

🌟 Consistent Login 30 consecutive days 300

\`\`\`

\-\--

This is the complete analytics system. Every calculation is pre-done in
the backend, frontend just fetches and renders. I\'ve read and
documented everything. \*\*Waiting for your next instruction.\*\* 👍
# Great Questions! Let me address both:

---

## 📚 PART 1: Content for Hackathon

```
✅ Plan:
   - 5 Chapters/Lessons (one per level category)
   - Quizzes per chapter
   - Practice templates
   - Assessment questions

Simple and achievable for hackathon prototype!
```

---

## 💬 PART 2: AI Chat with DB as Memory - EXPLAINED

### The Core Question:
```
"How does AI know about the USER specifically?"
"How does it remember their mistakes and progress?"

Answer: We DON'T need MCP for this.
        We use a simpler, smarter approach called
        
        ➡️ CONTEXT INJECTION
```

---

### What is MCP (Model Context Protocol)?
```
MCP is a protocol by Anthropic that lets AI models
connect to external tools and databases DIRECTLY.

Like: AI itself queries your DB, runs functions, etc.

┌─────┐     ┌─────┐     ┌────┐
│ AI  │────▶│ MCP │────▶│ DB │
│Model│◀────│Server│◀───│    │
└─────┘     └─────┘     └────┘

Problems for us:
❌ Complex to setup
❌ Overkill for hackathon
❌ Requires MCP server setup
❌ Not all LLMs support it
❌ Harder to control what AI sees
❌ Security risk (AI directly touching DB)
```

---

### What We Use Instead: CONTEXT INJECTION
```
Much simpler, works with ANY LLM, we control everything

┌──────────────────────────────────────────────────┐
│                                                  │
│  USER: "How am I doing?"                         │
│         │                                        │
│         ▼                                        │
│  ┌─────────────┐                                 │
│  │  BACKEND    │                                 │
│  │             │                                 │
│  │ 1. Get msg  │                                 │
│  │ 2. Query DB │◀── Gets user's data from DB     │
│  │ 3. Build    │                                 │
│  │    prompt   │                                 │
│  │    with     │                                 │
│  │    context  │                                 │
│  └──────┬──────┘                                 │
│         │                                        │
│         ▼                                        │
│  ┌─────────────────────────────────────────┐     │
│  │ PROMPT SENT TO LLM:                     │     │
│  │                                         │     │
│  │ System: You are grammar coach.          │     │
│  │ User data:                              │     │
│  │ - Level: 14                             │     │
│  │ - Errors: affect/effect (8 times)       │     │
│  │ - Practice score: 6.5                   │     │
│  │ - Streak: 5 days                        │     │
│  │ - Weak: homophones, punctuation         │     │
│  │                                         │     │
│  │ User asks: "How am I doing?"            │     │
│  └──────┬──────────────────────────────────┘     │
│         │                                        │
│         ▼                                        │
│  ┌─────────────┐                                 │
│  │  LLM API    │                                 │
│  │  (OpenRouter│                                 │
│  │             │                                 │
│  │  Reads the  │                                 │
│  │  context    │                                 │
│  │  we gave it │                                 │
│  │  Answers    │                                 │
│  │  based on   │                                 │
│  │  that data  │                                 │
│  └──────┬──────┘                                 │
│         │                                        │
│         ▼                                        │
│  "Great job John! You're at level 14.            │
│   I noticed you made affect/effect               │
│   error 8 times. Let's work on that!"            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### HOW THE "MEMORY" WORKS - Step by Step
```
The AI doesn't actually remember anything.
WE give it the memory every single time.

Think of it like this:

WITHOUT CONTEXT (Bad):
─────────────────────
You: "How am I doing?"
AI:  "I don't know who you are or 
      what you've been doing."

WITH CONTEXT INJECTION (What we do):
────────────────────────────────────
Backend secretly adds before your message:

"Hey AI, here's everything about this user:
 [all their data from our DB]
 Now answer their question: How am I doing?"

AI: "You're doing great John! Level 14,
     78% accuracy, but watch out for 
     homophones - 12 errors this week!"

AI SOUNDS like it remembers.
But actually WE gave it the info each time.
```

---

### EXACT FLOW IN CODE
```python
# routes/chat.py

@app.post("/api/chat")
async def chat(user_id: str, message: str):
    
    # ─────────────────────────────────────
    # STEP 1: Query DB for user context
    # (This is our "memory" from DB)
    # ─────────────────────────────────────
    
    user_data = await db.users.find_one({"_id": user_id})
    
    error_patterns = await db.error_patterns.find(
        {"user_id": user_id}
    ).sort("frequency", -1).limit(5).to_list()
    # Top 5 most frequent errors
    
    recent_practice = await db.practice_records.find(
        {"user_id": user_id}
    ).sort("submitted_at", -1).limit(3).to_list()
    # Last 3 practice attempts
    
    learning_progress = await db.learning_progress.find(
        {"user_id": user_id, "status": "completed"}
    ).count()
    # How many lessons done
    
    # ─────────────────────────────────────
    # STEP 2: Build context JSON
    # (Clean, only what AI needs)
    # ─────────────────────────────────────
    
    user_context = {
        "name": user_data["name"],
        "current_level": user_data["profile"]["current_level"],
        "total_credits": user_data["profile"]["total_credits"],
        "current_streak": user_data["profile"]["current_streak"],
        "strengths": user_data["profile"]["strengths"],
        "weaknesses": user_data["profile"]["weaknesses"],
        "lessons_completed": learning_progress,
        "top_errors": [
            {
                "error_type": e["error_type"],
                "word": e["original_word"],
                "frequency": e["frequency"]
            }
            for e in error_patterns
        ],
        "recent_practice_scores": [
            {
                "task": p["task_type"],
                "score": p["analysis"]["overall_score"],
                "date": p["submitted_at"]
            }
            for p in recent_practice
        ]
        # NOTE: No email, password, phone!
    }
    
    # ─────────────────────────────────────
    # STEP 3: Get chat history
    # (Conversational memory - last 6 msgs)
    # ─────────────────────────────────────
    
    chat_doc = await db.chat_history.find_one(
        {"user_id": user_id}
    )
    
    recent_messages = []
    if chat_doc:
        recent_messages = chat_doc["messages"][-6:]
        # Last 6 messages (3 exchanges)
        # Don't send ALL history - token limit!
    
    # ─────────────────────────────────────
    # STEP 4: Build the full prompt
    # ─────────────────────────────────────
    
    system_prompt = f"""
    You are a friendly and encouraging grammar coach.
    
    STUDENT PROFILE:
    {json.dumps(user_context, indent=2)}
    
    RULES:
    - Always address them by name: {user_context['name']}
    - Reference their SPECIFIC errors and scores
    - Be encouraging even when pointing out mistakes
    - Suggest specific lessons or practice tasks
    - Keep responses concise and helpful
    - If asked about grammar rules, give examples
    - NEVER mention or ask for personal info
      (email, password, phone)
    - If asked something unrelated to grammar/learning,
      politely redirect to their learning journey
    """
    
    # ─────────────────────────────────────
    # STEP 5: Call LLM
    # ─────────────────────────────────────
    
    messages_to_send = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add recent conversation history
    for msg in recent_messages:
        messages_to_send.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Add current user message
    messages_to_send.append({
        "role": "user",
        "content": message
    })
    
    # Call OpenRouter
    response = await call_openrouter(messages_to_send)
    ai_reply = response["choices"][0]["message"]["content"]
    
    # ─────────────────────────────────────
    # STEP 6: Save to chat history in DB
    # ─────────────────────────────────────
    
    await db.chat_history.update_one(
        {"user_id": user_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {
                            "role": "user",
                            "content": message,
                            "timestamp": datetime.now()
                        },
                        {
                            "role": "assistant", 
                            "content": ai_reply,
                            "context_used": user_context,
                            "timestamp": datetime.now()
                        }
                    ]
                }
            }
        },
        upsert=True
    )
    
    return {"response": ai_reply}
```

---

### TWO TYPES OF MEMORY WE USE
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  TYPE 1: LONG-TERM MEMORY (From DB)                 │
│  ──────────────────────────────────                 │
│  What: User's entire learning history               │
│  Where: MongoDB collections                         │
│  How: We query DB → inject into system prompt       │
│                                                     │
│  Examples:                                          │
│  ✅ "You've made affect/effect error 8 times"       │
│  ✅ "Your best practice score was 9/10"             │
│  ✅ "You completed 14 lessons"                      │
│  ✅ "Your streak is 5 days"                         │
│                                                     │
│  Updated: Every time user does activity             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  TYPE 2: SHORT-TERM MEMORY (Chat History)           │
│  ────────────────────────────────────────           │
│  What: Current conversation context                 │
│  Where: chat_history collection in DB               │
│  How: Last 6 messages sent with each request        │
│                                                     │
│  Examples:                                          │
│  ✅ "You just asked about semicolons"               │
│  ✅ "Following up on what I said before..."         │
│  ✅ "As we discussed..."                            │
│                                                     │
│  Updated: Every message                             │
│  Limit: Last 6 messages only (token control)        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### WHY NOT MCP FOR HACKATHON?
```
MCP Approach:               Context Injection (Ours):
──────────────              ─────────────────────────
❌ Complex setup            ✅ Simple code
❌ MCP server needed        ✅ Just backend queries
❌ Limited LLM support      ✅ Works with any LLM
❌ Hard to control          ✅ We control everything
❌ Security concerns        ✅ We filter sensitive data
❌ 2-3 days to implement    ✅ Few hours to implement
❌ Overkill for prototype   ✅ Perfect for hackathon

SAME RESULT for the user experience!
User can't tell the difference.
```

---

### WHAT THE USER EXPERIENCES
```
User:  "What mistakes am I making most?"

AI:    "Hi John! Looking at your learning data,
        your most frequent errors are:
        
        1. affect/effect confusion (8 times)
           - You tend to use 'affect' where
             'effect' (noun) is needed
             
        2. Letter swaps in spelling (5 times)
           - 'Reqeust' instead of 'Request'
           
        3. Unnecessary prepositions (4 times)
           - 'on next Friday' → 'next Friday'
        
        I recommend:
        → Redo Level 14 quiz on confused words
        → Try 2 more email practice tasks
        
        You're improving though! Your accuracy
        went from 65% to 78% this month! 🎯"

This feels like AI "knows" the user.
But actually: WE gave it all this data from DB.
```

---

## ✅ FINAL ANSWER

```
❌ MCP = Overcomplicated, not needed for hackathon

✅ Context Injection = Our approach
   
   HOW IT WORKS:
   1. User sends message
   2. Backend queries DB (gets their data)
   3. Backend builds prompt WITH that data
   4. Sends to LLM with context + last 6 chat messages
   5. LLM responds as if it "knows" the user
   6. Save response to DB
   7. Next message → repeat with fresh DB query

   RESULT:
   ✅ AI acts as personal coach with full memory
   ✅ Works with OpenRouter / any LLM
   ✅ Simple to build (few hours)
   ✅ We control what AI sees (security)
   ✅ No extra infrastructure needed
   ✅ Perfect for hackathon prototype
```

---

**So for hackathon:**
- ✅ 5 chapters with quizzes
- ✅ Practice templates
- ✅ Assessment questions
- ✅ Context Injection for AI Chat (NOT MCP)

**This covers the major parts for a solid prototype!**

**Shall we now plan the 5 lesson content structure and practice templates?** 🎯