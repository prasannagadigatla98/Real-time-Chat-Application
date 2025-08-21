# Prasanna Chat (Frontend-only)

A lightweight real-time chat demo you can open in multiple browser tabs. Uses React (CDN), CSS, and BroadcastChannel/localStorage for cross-tab sync.

## Run locally

Option A – with Node (recommended):
```powershell
cd "C:\Users\Admin\Desktop\Chat application"
npx --yes http-server . -p 5173 -c-1
```
Open: http://localhost:5173

Option B – open directly:
- Double-click `index.html` (works, but a local server is recommended).

## Use it
- You are `prasanna`. Contacts: `Chat A`, `Chat B`, `Chat C`, `Chat D`.
- Open two+ tabs to simulate conversations.
- Type and press Enter to send. Click 🙂 Emoji to insert emojis.
- Per-message status: Sent → Delivered → Seen.
- Reactions: 👍 ❤️ 😂 🔥 🎉 ✨ on each message.
- Each chat has a unique neon accent and background gradient.

## Tech
- React 18 UMD + Babel Standalone (no build step)
- Cross-tab transport: `BroadcastChannel` with `localStorage` fallback
- Persistent store: `localStorage`

## Files
- `index.html` – HTML + script tags (React, Babel) + app mount
- `styles.css` – neon/glassmorphism theme, animations
- `app.jsx` – React app (contacts, messages, emoji picker, reactions, status)

## Troubleshooting
- If the page is blank, hard refresh (Ctrl+Shift+R).
- If `npx http-server` fails, install Node.js or use Option B.
