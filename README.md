# Worker Management V2

V2 adds:
- Firebase Authentication (Email/Password)
- Firebase Realtime Database
- Cloud worker data
- Cloud attendance data
- Real camera QR scanning
- Morning / afternoon attendance
- Payroll 1–15 and 16–end of month

## Setup
1. Create a Firebase project.
2. Enable Authentication > Sign-in method > Email/Password.
3. Create Realtime Database.
4. Add a Web App under Project Settings > Your apps.
5. Copy the Web App config into `firebase-config.js`.
6. Upload all files to GitHub Pages.
7. Open the HTTPS GitHub Pages URL.
8. Create the first Admin account.

## Database structure
workers/{workerId}
attendance/{YYYY-MM-DD}/{workerId}

## Important
The QR value must be the worker ID, e.g. WABC123.
Camera scanning requires HTTPS and browser camera permission.
For production, Firebase Realtime Database Security Rules should be configured before real worker data is used.
