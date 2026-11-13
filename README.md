# Taha Oumesaoud – Portfolio (full-stack)

Frontend: `public/index.html`. Backend: `server.js` (Node + Express).
The contact form posts to `/api/contact`, which validates the message, saves it to `data/messages.json`, and emails it to you.

## Run locally
1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and fill in `SMTP_PASS` (a Gmail App Password).
4. `npm start`, then open http://localhost:3000

Without SMTP settings the site still works and messages are saved to `data/messages.json`.

## Deploy (Render, free tier)
1. Push this folder to a GitHub repository (do not commit `.env`).
2. On render.com: New > Web Service > pick the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add the variables from `.env.example` under Environment.
Note: free hosts reset the disk on redeploy, so rely on the email for messages, or add a database later.
