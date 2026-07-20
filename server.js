const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const SERVER_HOST = '0.0.0.0';
const CONFIG_FILE = path.join(__dirname, 'config.json');
const MAX_FILE_SIZE = 8 * 1024 * 1024 * 1024; // 8GB
const WS_HEARTBEAT_INTERVAL_MS = 30000;
const MAX_CHAT_MESSAGES = 1000;

function normalizeUploadDir(uploadDir) {
  if (typeof uploadDir !== 'string') {
    return '';
  }
  const trimmed = uploadDir.trim();
  if (!trimmed) {
    return '';
  }
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(__dirname, trimmed);
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        uploadDir: normalizeUploadDir(raw.uploadDir) || path.join(__dirname, 'uploads')
      };
    }
  } catch (error) {
    console.error('[Config] load failed:', error.message);
  }
  return { uploadDir: path.join(__dirname, 'uploads') };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

let config = loadConfig();
let UPLOAD_DIR = config.uploadDir;

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function cleanUploadDir() {
  try {
    ensureUploadDir();
    const entries = fs.readdirSync(UPLOAD_DIR);
    for (const name of entries) {
      const target = path.join(UPLOAD_DIR, name);
      try {
        fs.rmSync(target, { recursive: true, force: true });
      } catch (cleanError) {
        console.error('[UploadDir] cleanup failed:', target, cleanError.message);
      }
    }
    console.log('[UploadDir] cleaned on startup');
  } catch (error) {
    console.error('[UploadDir] cleanup error:', error.message);
  }
}

// Session-scoped temp storage: keep files while the service is running,
// clear leftover files when the service restarts.
cleanUploadDir();
ensureUploadDir();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function safeUploadBasename(name) {
  const base = String(name || '').replace(/\\/g, '/').split('/').pop().trim();
  const slug = base
    .normalize('NFKD')
    .replace(/[^\w\s\.\-（）()\u4e00-\u9fa5]/g, '');
  const trimmed = slug.replace(/\s+/g, '').slice(0, 80) || 'file';
  return trimmed || 'file';
}

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = safeUploadBasename(file.originalname);
    const ext = path.extname(safeName);
    const stem = path.basename(safeName, ext) || 'file';
    cb(null, `${uniqueSuffix}-${stem}${ext || ''}`);
  }
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE }
});

function isPrivateIPv4(ip) {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const preferNames = ['ethernet', 'wi-fi', 'wlan', 'wireless', 'en', 'eth'];
  const avoidNames = ['vmware', 'virtual', 'veth', 'docker', 'hyper-v', 'loopback', 'npcap', 'tailscale', 'zerotier'];
  const candidates = [];

  for (const [name, ifaceList] of Object.entries(interfaces)) {
    const lowerName = name.toLowerCase();
    const preferScore = preferNames.some((n) => lowerName.includes(n)) ? 10 : 0;
    const avoidPenalty = avoidNames.some((n) => lowerName.includes(n)) ? -20 : 0;

    for (const iface of ifaceList || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const privateScore = isPrivateIPv4(iface.address) ? 100 : 0;
        candidates.push({
          address: iface.address,
          score: privateScore + preferScore + avoidPenalty
        });
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].address;
  }

  return '127.0.0.1';
}

const clients = new Map();
const chatMessages = [];

function rememberChatMessage(message) {
  chatMessages.push(message);
  if (chatMessages.length > MAX_CHAT_MESSAGES) {
    chatMessages.splice(0, chatMessages.length - MAX_CHAT_MESSAGES);
  }
}

function broadcast(data, excludeWs = null) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (error) {
        client.terminate();
      }
    }
  });
}

function broadcastClientCount() {
  broadcast({ type: 'client-count', count: clients.size });
}

wss.on('connection', (ws) => {
  const clientId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  ws.clientId = clientId;
  ws.isAlive = true;
  clients.set(clientId, ws);

  console.log(`[WebSocket] connected: ${clientId}, total: ${clients.size}`);
  broadcastClientCount();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'text') {
        const content = typeof data.content === 'string' ? data.content.trim() : '';
        if (!content) {
          return;
        }
        const chatMessage = {
          type: 'text',
          content,
          from: clientId,
          timestamp: Date.now()
        };
        rememberChatMessage(chatMessage);
        // Include sender so everyone (including self) sees the message.
        broadcast(chatMessage);
      }
      if (data.type === 'pong') {
        ws.isAlive = true;
      }
    } catch (error) {
      console.error('[WebSocket] message parse failed:', error.message);
    }
  });

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`[WebSocket] disconnected: ${clientId}, total: ${clients.size}`);
    broadcastClientCount();
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] error:', error.message);
    clients.delete(clientId);
    broadcastClientCount();
  });
});

const wsHeartbeatTimer = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, WS_HEARTBEAT_INTERVAL_MS);

app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    return next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有文件' });
  }

  const fileInfo = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    timestamp: Date.now()
  };

  console.log(`[Upload] ${fileInfo.originalName}, ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`);

  broadcast({
    type: 'file',
    file: fileInfo
  });

  return res.json({ success: true, file: fileInfo });
});

app.get('/api/files', (req, res) => {
  ensureUploadDir();
  fs.readdir(UPLOAD_DIR, (err, files) => {
    if (err) {
      return res.json({ files: [] });
    }

    const fileInfos = files
      .map((filename) => {
        const filepath = path.join(UPLOAD_DIR, filename);
        try {
          const stats = fs.statSync(filepath);
          if (!stats.isFile()) {
            return null;
          }
          return {
            filename,
            size: stats.size,
            created: stats.birthtime
          };
        } catch (statError) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return res.json({ files: fileInfos });
  });
});

app.post('/api/cleanup', (req, res) => {
  cleanUploadDir();
  broadcast({ type: 'files-cleared' });
  return res.json({ success: true });
});

app.get('/api/export-chat', (req, res) => {
  const lines = chatMessages.map((message) => {
    const time = new Date(message.timestamp || Date.now()).toISOString();
    const from = message.from || 'unknown';
    const content = String(message.content || '').replace(/\r?\n/g, '\\n');
    return `[${time}] ${from}: ${content}`;
  });

  res.type('text/plain; charset=utf-8').send(lines.join('\n'));
});

app.post('/api/import-chat', express.text({ type: '*/*', limit: '2mb' }), (req, res) => {
  const text = typeof req.body === 'string' ? req.body : '';
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let imported = 0;

  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]\s+([^:]+):\s*(.*)$/);
    const timestamp = match ? Date.parse(match[1]) : Date.now();
    const from = match ? match[2].trim() : 'imported';
    const content = (match ? match[3] : line).replace(/\\n/g, '\n').trim();

    if (!content) {
      continue;
    }

    rememberChatMessage({
      type: 'text',
      content,
      from: from || 'imported',
      timestamp: Number.isNaN(timestamp) ? Date.now() : timestamp
    });
    imported += 1;
  }

  broadcast({ type: 'chat-imported', imported });
  res.json({ success: true, imported });
});

app.get('/api/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).send('文件不存在');
  }

  return res.download(filepath);
});

app.get('/api/info', (req, res) => {
  const localIP = getLocalIP();
  return res.json({
    ip: localIP,
    port: PORT,
    url: `http://${localIP}:${PORT}`
  });
});

app.get('/api/qrcode', async (req, res) => {
  const localIP = getLocalIP();
  const url = `http://${localIP}:${PORT}`;

  try {
    const qrcodeDataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2
    });
    return res.json({ qrcode: qrcodeDataUrl, url });
  } catch (error) {
    return res.status(500).json({ error: '生成二维码失败' });
  }
});

app.get('/api/config', (req, res) => {
  return res.json({
    uploadDir: UPLOAD_DIR,
    defaultDir: path.join(os.homedir(), 'Downloads', 'BambooFlow')
  });
});

app.post('/api/config/upload-dir', (req, res) => {
  const uploadDir = normalizeUploadDir(req.body.uploadDir);

  if (!uploadDir) {
    return res.status(400).json({ error: '请提供存储路径' });
  }

  if (!path.isAbsolute(uploadDir)) {
    return res.status(400).json({ error: '存储路径必须是绝对路径' });
  }

  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    UPLOAD_DIR = uploadDir;
    config.uploadDir = uploadDir;
    saveConfig(config);

    return res.json({ success: true, uploadDir: UPLOAD_DIR });
  } catch (error) {
    return res.status(500).json({ error: `设置存储路径失败: ${error.message}` });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `文件过大, 最大${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
      });
    }
    return res.status(400).json({ error: `上传失败: ${err.message}` });
  }

  if (err) {
    console.error('[HTTP] unhandled error:', err.message);
    return res.status(500).json({ error: '服务器内部错误' });
  }

  return next();
});

server.requestTimeout = 60 * 60 * 1000;

server.listen(PORT, SERVER_HOST, () => {
  const localIP = getLocalIP();
  console.log('\n========================================');
  console.log('BambooFlow 服务已启动');
  console.log('========================================');
  console.log(`电脑访问: http://localhost:${PORT}`);
  console.log(`手机访问: http://${localIP}:${PORT}`);
  console.log(`文件保存目录: ${UPLOAD_DIR}`);
  console.log('========================================\n');
});

server.on('error', (error) => {
  console.error('[Server] start failed:', error.message);
});

process.on('SIGINT', () => {
  clearInterval(wsHeartbeatTimer);
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});
