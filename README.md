# BambooFlow

**Same WiFi, same flow. No internet required.**

BambooFlow is not "a file sender plus a chat box".
It is a lightweight **LAN information flow** tool:

start the server, scan the QR code, connect devices on the same WiFi, then exchange messages and files in real time — no cloud account, no USB stick, no public internet.

- **Information flow, not file silos**  
  Messages, files, and live events move in one local network stream.
- **Anonymous chat on the same WiFi**  
  Devices join the same address automatically. No login. No identity binding. Connect and talk.

---

## Features

- **LAN Info Flow** — messages and files move together on the local network
- **Anonymous Chat** — same-WiFi chat with no accounts
- **File Sharing** — drag-and-drop upload, up to **8GB** per file
- **QR Connect** — scan the page QR code to join instantly
- **Live Events** — WebSocket push for messages, uploads, and online count
- **Session-scoped Files** — files survive page refresh; cleared when the service restarts
- **Manual Clear** — clear uploaded files with one click
- **Chat Export / Import** — export or import the current session chat
- **PWA Ready** — add to phone home screen
- **Lightweight** — single Node.js server, few dependencies

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 14+ (LTS recommended)

### Run

```bash
npm install
npm start
```

On Windows, you can also double-click:

```text
start.bat
```

Then open:

```text
http://localhost:3000
```

### Connect another device

1. Keep both devices on the **same WiFi**
2. Open the local URL shown on the page, or scan the QR code
3. Start anonymous chat and file transfer

---

## How It Works

1. Start BambooFlow on one computer
2. Other devices join through the local IP or QR code
3. Chat messages are broadcast in real time over WebSocket
4. Uploaded files are stored temporarily for download by devices on the same network

BambooFlow is a **local-network info flow tool**.
It is not a cloud drive, and not a sign-up chat app.

---

## Session Behavior

| Type | Page refresh | Service restart | Manual clear |
| --- | --- | --- | --- |
| Chat messages | cleared | cleared | n/a |
| Uploaded files | kept for download | auto cleared | can clear now |

Design rules:

- Chat is an **anonymous session** and stays in memory by default
- Files are **temporary while the service is running**, not long-term storage

---

## Limits

- Max file size: `8GB`
- Upload timeout: `1 hour`
- Network scope: same LAN / same WiFi

> For larger transfers, a cable, USB drive, or OS file share is usually a better fit.

---

## Project Structure

```text
BambooFlow/
├── server.js          # Express + WebSocket server
├── package.json
├── start.bat          # Windows one-click start
├── public/
│   ├── index.html     # Frontend page
│   ├── manifest.json  # PWA manifest
│   └── sw.js          # Service worker
├── README.md
└── LICENSE
```

---

## Security Note

BambooFlow is intended for **trusted local networks only** — home, dorm, office, lab.

- No login
- No permission system
- Anyone on the same WiFi can join and exchange information

**Do not expose it to the public internet.**

---

## Tech Stack

- Backend: Node.js + Express
- Realtime: WebSocket (`ws`)
- Upload: multer
- QR: qrcode
- Frontend: Vanilla HTML / CSS / JS + PWA

---

## License

[MIT](LICENSE)
