# 🎋 BambooFlow

**Local network file sharing — no internet required.**

BambooFlow is a lightweight file transfer tool for your WiFi network. Share files between devices without cloud services, USB drives, or internet access. Just start the server, scan the QR code, and transfer.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

## ✨ Features

- 📁 **File Upload & Download** — Drag & drop or click to upload (up to 1GB per file)
- 📱 **QR Code** — Scan with your phone to connect instantly
- 🔔 **Real-time Notifications** — WebSocket alerts when files arrive
- 📲 **PWA Support** — Install as a native-like app on your phone
- 🗂️ **File Browser** — View and download all uploaded files
- ⚙️ **Configurable** — Custom upload directory via config
- 🪶 **Lightweight** — Single server.js, ~10KB, 5 dependencies

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 14+ (LTS recommended)

### Run

**Windows (double-click):**

```
BambooFlow.bat
```

**Command line:**

```bash
npm install
node server.js
```

Then open `http://localhost:3000` in your browser.

### Connect from another device

1. Make sure both devices are on the **same WiFi network**
2. Open `http://<your-local-ip>:3000` on the other device
3. Or scan the QR code shown on the main page

## 📂 Project Structure

```
BambooFlow/
├── server.js          # Main server (Express + WebSocket)
├── package.json       # Dependencies
├── public/
│   ├── index.html     # Frontend (single-file PWA)
│   ├── manifest.json  # PWA manifest
│   └── sw.js          # Service worker
├── BambooFlow.bat     # One-click start (Windows)
├── start.bat          # Start server
├── stop.bat           # Stop server
├── keep-alive.bat     # Auto-restart watchdog
├── run.bat            # Minimal start (no UI)
└── .gitignore
```

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Real-time:** WebSocket (ws)
- **QR Code:** qrcode
- **File Upload:** multer (streaming to disk)
- **Frontend:** Vanilla HTML/CSS/JS + PWA

## ⚠️ Security Note

BambooFlow is designed for **trusted local networks only** (home, office, lab). It has **no authentication mechanism** — anyone on the same WiFi can upload and download files. Do not expose it to the public internet.

## 🔧 Configuration

Edit `config.json` to change the upload directory:

```json
{
  "uploadDir": "D:/MyFiles"
}
```

Or use the web UI to change it at runtime.

**Default upload location:** `./uploads/`

## 📱 Mobile Usage

BambooFlow is a PWA (Progressive Web App):

1. Open the URL on your phone
2. Tap "Add to Home Screen" (iOS) or "Install" (Android)
3. Use it like a native app

## 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

## 📄 License

[MIT](LICENSE)

---

Made with 🎋 by the family
