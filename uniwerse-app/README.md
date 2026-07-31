# UniWerse — Campus Event Management

A unified React (Vite) rebuild of the UniWerse click-through prototypes:
**Onboarding → Student → Society POC**. The Super Admin flow has been
removed entirely, as requested.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## What's inside

```
src/
  context/
    AuthContext.jsx      # login/session state (accessType, role, email)
    ToastContext.jsx     # global toast notifications
  components/common/
    ProtectedRoute.jsx   # guards /student and /society by role
    HexDeco.jsx          # decorative hex-line SVGs used on onboarding screens
  data/
    mockData.js          # shared mock events / attendees / tasks
  pages/
    onboarding/           # Entry -> Role -> Guest -> Login screens
    student/              # Home feed, Event detail, Calendar, Notifications, Chatbot
    society/              # Dashboard, Create Event, Attendees, QR Check-in, Task Board
  styles/
    tokens.css            # design tokens (colors, radius, shadow)
    global.css            # shared buttons/cards/pills/tags/toast used everywhere
```

## How the flow works

1. **Entry** (`/`) - choose IGDTUW Member or Guest/Outsider.
2. **Role** (`/role`) - IGDTUW members pick Student, Society POC, or Faculty.
3. **Guest** (`/guest`) - guests see a permissions summary before continuing.
4. **Login** (`/login`) - email/password gate. IGDTUW emails must end in
   `@igdtuw.ac.in`. On success:
   - **Student** -> `/student` (event feed, calendar, notifications, chatbot)
   - **Society POC** -> `/society` (dashboard, create event, attendees, QR check-in, task board)
   - **Faculty** -> shows a "coming soon" toast (no dashboard was in the original scope)
   - **Guest** -> shows a "coming soon" toast (guest browsing wasn't in the original scope)

Session state (`accessType`, `role`, `email`) is kept in `sessionStorage`,
so a refresh keeps you logged in, and `/student` or `/society` redirect
back to `/` if you land there without the right role.

## Notes on removed scope

The original prototype included a fourth flow, **Super Admin**, which has
been removed completely per your request - there's no route, page, or
reference to it left in the codebase.
