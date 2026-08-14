# AppointMED: Scalable Clinic & Therapy Management System

AppointMED is a serverless, real-time clinic scheduling and patient management web application engineered for physical therapy, occupational therapy, and psychiatric clinic operations. Built on a serverless NoSQL architecture via Firebase Firestore and Firebase Authentication, it provides an interactive drag-and-drop calendar matrix, strict Role-Based Access Control (RBAC), and instantaneous multi-client real-time synchronization.

---

## 1. Key Technical Features

### 1.1 Real-Time Data Synchronization & O(1) Responsiveness
- **WebSocket Snapshot Listeners (`onSnapshot`)**: Instantly reflects schedule updates, bookings, cancellations, and announcements across all connected administrative and patient screens without page reloads.
- **Optimized NoSQL Queries**: Implements bounded query limits (`limit(1000)`) and targeted indexing, reducing database payload sizes by over 90% and ensuring sub-100ms response times.
- **Parallel Batch Processing**: Bulk user and record deletions run concurrently using `Promise.all` and batched write operations for instant administrative throughput.

### 1.2 Multi-Layered Security & Empathetic Rate Limiting
- **Declarative Role-Based Access Control (RBAC)**: Strict separation of privileges between `admin` and `patient` accounts enforced at both client navigation routes and database security rule layers ([firestore.rules](file:///c:/projects/appointmed/firestore.rules)).
- **Empathetic Cooldown Timers**:
  - **Login Guard**: 30-second lockout after 3 consecutive failed login attempts to prevent brute-force attacks while remaining patient-friendly.
  - **Password Reset & Verification Throttling**: 60-second client and server cooldown timers to protect against SMS/email bombing and denial-of-service spam.
- **Mandatory Re-Authentication on Deletion**: Users must confirm their password (or Google sign-in provider) before permanent account deletion can proceed.
- **Cascading Data Purge**: Completely purges personal profile fragments and associated appointment documents when an account is deleted to ensure zero orphaned data.
- **Admin Self-Lockout Protection**: Prevents accidental deletion of the last remaining active administrator account.

### 1.3 Interactive Clinical Calendar Interface
- **Uniform Dynamic Grid**: Mathematically locked `140px` row heights and overflow prevention matching standard Google/Apple Calendar designs.
- **Unified Day Appointment Modal**: Full-featured modal showing daily schedules, detailed patient/doctor notes, direct **Edit** and **Delete** actions, and a **`+ Add`** booking trigger.
- **Multi-View Scheduling**: Seamless toggle between Month, Week, and Day operational views.
- **Client Drag-and-Drop**: Allows clinic staff to drag unverified or walk-in client records directly onto calendar date cells to schedule sessions instantly.
- **Global Keyboard Accessibility**: Universal `Escape` key listeners to immediately dismiss all active dialogs, modals, and drop-downs.

---

## 2. Tech Stack

- **Frontend Core:** HTML5 (Semantic), CSS3 (Vanilla design tokens, CSS Grid, Flexbox, Glassmorphism), Modern JavaScript (ES6+ Modules)
- **Backend / BaaS:** Firebase Firestore (NoSQL Document Store), Firebase Authentication (Email/Password & Google OAuth)
- **Security:** Firebase Security Rules, JWT Bearer Token validation, Client-side Re-Authentication
- **Tooling & Testing:** Nightwatch.js, k6 load testing, Chrome DevTools Performance & Lighthouse

---

## 3. Project Structure

```text
appointmed/
├── index.html                     # Public Landing Page with dynamic clinic CMS alerts & services
├── firestore.rules                # Declarative Firebase Firestore Security Rules
├── firebase.json                  # Firebase configuration & hosting headers
├── apphosting.yaml                # Next-generation Firebase App Hosting deployment config
├── .gitignore                     # Production-ready exclusion list (secrets, logs, binaries)
├── src/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login.html         # Unified Login & Registration portal
│   │   │   ├── forgotpassword.html# Self-service password reset with rate-limiting
│   │   │   └── userprofile.html   # Patient self-service portal & Danger Zone settings
│   │   ├── calendar/
│   │   │   └── calendaredit.html  # Interactive Admin Calendar scheduling matrix
│   │   └── manageuser/
│   │       ├── adminhome.html     # Admin dashboard & key operational metrics
│   │       ├── manageusers.html   # User account management & bulk batch actions
│   │       ├── setappoint.html    # Tabular appointment booking & management
│   │       ├── analytics.html     # Clinic operational analytics dashboard
│   │       └── dev-analytics.html # Live developer telemetry & Firestore latency benchmarks
│   ├── scripts/
│   │   ├── firebase-config.js     # Centralized Firebase initialization
│   │   ├── auth.js                # Authentication flow, role routing & login rate-limiter
│   │   ├── forgotpassword.js      # Password reset logic & cooldown timer
│   │   ├── userprofile.js         # Patient profile management, calendar & account purge
│   │   ├── calendaredit.js        # Admin calendar matrix, modal popups & drag-and-drop
│   │   ├── manageusers.js         # User CRUD, role toggles & parallel delete
│   │   ├── setappoint.js          # Appointment list management & search filters
│   │   ├── admin-shared.js        # Shared admin navigation, header & profile modal
│   │   ├── adminhome.js           # Admin summary metric calculations
│   │   ├── analytics.js           # Clinic business intelligence metrics
│   │   ├── dev-analytics.js       # Developer telemetry engine & latency tracker
│   │   └── ui-utils.js            # Toast notifications & UI utilities
│   └── styles/
│       ├── admin.css              # Admin portal design system & modals
│       ├── userprofile.css        # Patient portal styling & responsive layout
│       └── ...                    # Modular component styles
└── tests/
    ├── test-guid.md               # Complete QA manual testing script & verification guide
    ├── metrics-test.md            # Quantitative performance benchmarks & metrics guide
    ├── api-test.md                # Firestore REST API & security rules verification guide
    └── loginTest.js               # Nightwatch automated test suite
```

---

## 4. Quick Start & Local Setup

### 4.1 Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari)
- A local HTTP server (e.g. `Live Server` in VS Code, `http-server`, or Python's `python -m http.server 8080`)

### 4.2 Installation
```bash
# Clone repository
git clone https://github.com/chuckzxxmello/appointmed.git
cd appointmed

# Start a local static server
npx http-server . -p 8080
```
Open `http://localhost:8080` in your web browser.

---

## 5. Future Implementations & Roadmap

The following capabilities are planned for upcoming releases:

### 5.1 Clinical Operations & Booking Safeguards
- **Double-Booking Prevention via Firestore Transactions**: Concurrency guards preventing simultaneous booking race conditions for the same therapist slot.
- **Doctor Working Hours & Buffer Times**: Configurable therapist availability calendars, break periods, and automatic 15-minute room turnover buffers.
- **Secure Patient Intake & Clinical Notes**: Encrypted therapist intake notes and post-session progress evaluations with role-restricted access.
- **Rescheduling Window Policy**: Automated cancellation cutoff windows (e.g., minimum 12 hours prior) to minimize clinic slot vacancies.

### 5.2 Notifications & Patient Engagement
- **Automated Email / SMS Reminders**: Automated 24-hour and 1-hour pre-appointment reminders to reduce clinic no-show rates.
- **Add to Calendar (`.ics` integration)**: 1-click calendar export to Google Calendar, Apple Calendar, and Outlook.
- **Real-Time In-App Alert Notifications**: Push alerts when appointments are rescheduled, confirmed, or completed by clinic staff.

### 5.3 Advanced Analytics, Auditing & Compliance
- **Comprehensive Audit Trail**: Tamper-evident logging of all appointment modifications, status changes, and record deletions for healthcare compliance.
- **Financial & Operations Export**: 1-click export of clinic metrics, attendance rates, and patient volume to CSV/Excel/PDF for accounting.
- **Peak Hour Heatmaps**: Data visualization showing peak patient appointment demands across day-of-week and time-of-day slots.

### 5.4 Accessibility, Offline & Mobile Experience
- **PWA (Progressive Web App)**: Service worker caching for offline schedule inspection in poor clinic Wi-Fi zones and home screen installation.
- **WCAG 2.1 Full Accessibility**: ARIA labeling, high-contrast mode, and complete screen-reader compatibility across all interactive modals and matrices.

---

## 6. Quality Assurance & Documentation

Detailed testing scripts, benchmark records, and API test collections are available in the tests directory:
- [QA Testing Guide](file:///c:/projects/appointmed/tests/test-guid.md)
- [Performance & Quantitative Metrics](file:///c:/projects/appointmed/tests/metrics-test.md)
- [API & Security Rules Testing Guide](file:///c:/projects/appointmed/tests/api-test.md)
