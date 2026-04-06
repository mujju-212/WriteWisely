# Commit Plan

## Confirmed already pushed (before notifications)

1. ca4e3c0 - backend: improve learning content loading and analytics level/settings handling
Files in this commit:
- backend/models/schemas.py
- backend/models/user.py
- backend/routes/analytics.py
- backend/routes/learning.py

2. 7b74dbc - backend: add conversation-based chat routes and chat indexes
Files in this commit:
- backend/config.py
- backend/routes/chat.py

Important: no notification UI files were included in these 2 pushed commits.

## Remaining planned commits (not pushed yet)

3. frontend: theme infrastructure and dashboard styling base
Planned files:
- frontend/src/App.jsx
- frontend/src/context/ThemeContext.jsx
- frontend/src/index.css
- frontend/src/pages/Dashboard.css
- frontend/src/components/ProfileDropdown.jsx
- frontend/src/pages/Analytics.jsx

4. frontend: dashboard runtime upgrades (chat manager + settings wiring + in-app modals)
Planned files:
- frontend/src/pages/Dashboard.jsx
- frontend/src/services/api.js

5. frontend: learning/practice/projects icon and ui consistency pass
Planned files:
- frontend/src/pages/LearningHome.jsx
- frontend/src/pages/Lesson.jsx
- frontend/src/pages/PracticeHome.jsx
- frontend/src/pages/PracticeEditor.jsx
- frontend/src/pages/Projects.jsx

6. notifications: dark theme + view-all + icon compatibility + backend limit
Planned files:
- frontend/src/components/NotificationBell.jsx
- frontend/src/components/NotificationItem.jsx
- frontend/src/services/dataService.js
- backend/routes/notifications.py

Scope of commit 6:
- Theme-aware notification dropdown (light and dark).
- In-panel View All toggle instead of dead route jump.
- Backend limit query support and frontend limit wiring.
- Mixed icon compatibility (Font Awesome class + legacy emoji fallback).

Suggested message for commit 6:
- frontend: improve notifications theme, view-all, and icon rendering compatibility
