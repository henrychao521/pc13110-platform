/* ============================================================
 * PC13110 工程實驗室 — 多人連線伺服器
 * 純 Node.js,零相依套件(不需 npm install)。
 * 啟動:  node server/server.js
 * 連接埠: 8732(可用環境變數 PORT 覆寫)
 * 用途:  讓多位學生在像素實驗室裡同時看到彼此的角色。
 * ============================================================ */

'use strict';
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8732;

/* ---------- 教師 PIN(role:teacher 必須驗證) ----------
 * 做法沿用生活科技乙版平台的教師密碼:只存 PBKDF2 雜湊、檔案放在 repo 之外、權限 0600。
 * 兩種設定方式(擇一,環境變數優先):
 *   1. 環境變數  TEACHER_PIN=xxxxxx node server/server.js
 *   2. 設定檔    node server/set-teacher-pin.js   (寫到 ~/.config/pc13110/teacher.auth)
 * 兩者都沒設定時,教師端一律被拒(學生端不受影響)。 */
const AUTH_FILE = process.env.TEACHER_AUTH_FILE ||
  path.join(os.homedir(), '.config', 'pc13110', 'teacher.auth');
const PIN_MIN_LEN = 6;
function teacherAuthMode() {
  if (process.env.TEACHER_PIN) return 'env';
  try { if (fs.readFileSync(AUTH_FILE, 'utf8').trim()) return 'file'; } catch (e) { /* 沒有檔案 */ }
  return null;
}
function safeEqual(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
function checkTeacherPin(pin) {
  pin = String(pin || '');
  if (!pin) return false;
  if (process.env.TEACHER_PIN) {
    /* 兩邊都先雜湊再比,避免長度不同時提早回傳洩漏長度 */
    const h = s => crypto.createHash('sha256').update(s).digest();
    return crypto.timingSafeEqual(h(pin), h(process.env.TEACHER_PIN));
  }
  let line;
  try { line = fs.readFileSync(AUTH_FILE, 'utf8').trim(); } catch (e) { return false; }
  const [algo, iters, saltHex, hashHex] = line.split('$');
  if (algo !== 'pbkdf2_sha256' || !iters || !saltHex || !hashHex) return false;
  const calc = crypto.pbkdf2Sync(pin, Buffer.from(saltHex, 'hex'), +iters, hashHex.length / 2, 'sha256');
  return safeEqual(calc.toString('hex'), hashHex);
}
/* 同一來源 IP 連續錯 5 次,鎖 60 秒 */
const failLog = new Map();   /* ip -> { n, until } */
const FAIL_MAX = 5, LOCK_MS = 60000;
function isLocked(ip) {
  const f = failLog.get(ip);
  return !!(f && f.until > Date.now());
}
function noteFail(ip) {
  const f = failLog.get(ip) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= FAIL_MAX) { f.until = Date.now() + LOCK_MS; f.n = 0; }
  failLog.set(ip, f);
}
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

/* socket -> player */
const clients = new Map();
let nextId = 1;

/* ---------- WebSocket 訊框編解碼(server 端,不需遮罩) ---------- */
function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let off = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
  else if (len === 127) { if (buf.length < 10) return null; len = Number(buf.readBigUInt64BE(2)); off = 10; }
  let mask;
  if (masked) { if (buf.length < off + 4) return null; mask = buf.subarray(off, off + 4); off += 4; }
  if (buf.length < off + len) return null;
  let payload = buf.subarray(off, off + len);
  if (masked) {
    const out = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i & 3];
    payload = out;
  }
  return { opcode, payload, total: off + len };
}
function encodeFrame(data, opcode) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | (opcode || 0x1), len]);
  } else if (len < 65536) {
    header = Buffer.allocUnsafe(4);
    header[0] = 0x80 | (opcode || 0x1); header[1] = 126; header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.allocUnsafe(10);
    header[0] = 0x80 | (opcode || 0x1); header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}
function send(socket, obj) {
  try { socket.write(encodeFrame(JSON.stringify(obj))); } catch (e) { /* ignore */ }
}
function snap(p) { return { id: p.id, name: p.name, look: p.look, x: p.x, y: p.y, f: p.f }; }

/* ---------- 房間(班級)輔助 ---------- */
function studentsIn(room) {
  return [...clients.values()].filter(p => p.room === room && p.role === 'student' && p.joined);
}
function teachersIn(room) {
  return [...clients.values()].filter(p => p.room === room && p.role === 'teacher');
}
function broadcastRoom(room, exceptSocket, obj) {
  for (const p of clients.values())
    if (p.room === room && p.socket !== exceptSocket) send(p.socket, obj);
}
function sendRoster(room) {
  const list = studentsIn(room).map(p => ({ id: p.id, name: p.name, x: p.x, y: p.y }));
  for (const tch of teachersIn(room)) send(tch.socket, { t: 'roster', players: list });
}

/* ---------- 訊息處理 ---------- */
function handleMessage(player, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch (e) { return; }
  if (msg.t === 'join') {
    if (player.joined) return;                       /* 一條連線只能加入一次,不能中途改身分 */
    if (msg.role === 'teacher') {
      /* 驗證失敗就回 auth 訊息並斷線;不會退回成學生身分 */
      const deny = reason => {
        send(player.socket, { t: 'auth', ok: false, reason });
        log('教師驗證失敗(' + reason + ') 來源 ' + player.ip);
        setTimeout(() => player.socket.end(), 50);
      };
      if (!teacherAuthMode()) return deny('not-configured');
      if (isLocked(player.ip)) return deny('locked');
      if (!checkTeacherPin(msg.pin)) { noteFail(player.ip); return deny(isLocked(player.ip) ? 'locked' : 'bad-pin'); }
      failLog.delete(player.ip);
    }
    player.room = String(msg.room || 'PUBLIC').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) || 'PUBLIC';
    player.role = msg.role === 'teacher' ? 'teacher' : 'student';
    player.name = String(msg.name || '訪客').slice(0, 12);
    player.look = msg.look || null;
    player.x = +msg.x || player.x;
    player.y = +msg.y || player.y;
    player.joined = true;
    if (player.role === 'teacher') {
      send(player.socket, { t: 'welcome', id: player.id, role: 'teacher', players: [] });
      sendRoster(player.room);
      log('教師進入 班級[' + player.room + ']');
    } else {
      const others = studentsIn(player.room).filter(p => p !== player).map(snap);
      send(player.socket, { t: 'welcome', id: player.id, players: others });
      broadcastRoom(player.room, player.socket, { t: 'join', ...snap(player) });
      sendRoster(player.room);
      log('+ ' + player.name + ' 加入 班級[' + player.room + '](學生 ' + studentsIn(player.room).length + ' 人)');
    }
  } else if (msg.t === 'move') {
    player.x = +msg.x; player.y = +msg.y; player.f = msg.f | 0;
    broadcastRoom(player.room, player.socket, { t: 'state', id: player.id, x: player.x, y: player.y, f: player.f });
  } else if (msg.t === 'notice' && player.role === 'teacher') {
    const text = String(msg.text || '').slice(0, 80);
    if (text) broadcastRoom(player.room, player.socket, { t: 'notice', text });
  } else if (msg.t === 'summon' && player.role === 'teacher') {
    broadcastRoom(player.room, player.socket, { t: 'summon', x: +msg.x || 380, y: +msg.y || 260 });
  } else if (msg.t === 'chat' && player.role === 'student') {
    const text = String(msg.text || '').slice(0, 60);
    if (text) broadcastRoom(player.room, player.socket, { t: 'chat', id: player.id, text });
  }
}

/* ---------- 連線生命週期 ---------- */
function onConnect(socket) {
  const player = { id: nextId++, room: 'PUBLIC', role: 'student', joined: false,
    name: '', look: null, x: 380, y: 260, f: 0, socket, ip: socket.remoteAddress || '?' };
  clients.set(socket, player);
  let buf = Buffer.alloc(0);

  socket.on('data', d => {
    buf = Buffer.concat([buf, d]);
    let frame;
    while ((frame = decodeFrame(buf))) {
      buf = buf.subarray(frame.total);
      if (frame.opcode === 0x8) { socket.end(); return; }            /* close */
      else if (frame.opcode === 0x9) socket.write(encodeFrame(frame.payload, 0xA)); /* ping→pong */
      else if (frame.opcode === 0x1) handleMessage(player, frame.payload.toString('utf8'));
    }
  });
  const drop = () => {
    if (!clients.has(socket)) return;
    clients.delete(socket);
    if (!player.joined) return;   /* 沒加入就斷線(例如教師驗證失敗),不必通知 */
    broadcastRoom(player.room, socket, { t: 'leave', id: player.id });
    sendRoster(player.room);
    log('- ' + (player.name || '訪客') + ' 離開 班級[' + player.room + ']');
  };
  socket.on('close', drop);
  socket.on('error', drop);
}

/* ---------- HTTP + Upgrade ---------- */
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('PC13110 工程實驗室多人伺服器運作中。線上人數:' + clients.size);
});
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );
  socket.setNoDelay(true);
  onConnect(socket);
});

/* 每 25 秒對所有連線送 ping,維持手機等裝置的閒置連線 */
setInterval(() => {
  for (const p of clients.values()) {
    try { p.socket.write(encodeFrame('', 0x9)); } catch (e) { /* ignore */ }
  }
}, 25000);

/* 每 1.5 秒把學生名單與位置推給各班級的教師端 */
setInterval(() => {
  const rooms = new Set([...clients.values()].map(p => p.room));
  for (const room of rooms) if (teachersIn(room).length) sendRoster(room);
}, 1500);

function log(m) { console.log('[' + new Date().toLocaleTimeString() + '] ' + m); }
function lanIPs() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const name of Object.keys(ifs))
    for (const i of ifs[name])
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
  return out;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log(' PC13110 工程實驗室 — 多人連線伺服器已啟動');
  console.log(' 本機:      ws://localhost:' + PORT);
  lanIPs().forEach(ip => console.log(' 區域網路:  ws://' + ip + ':' + PORT + '   (手機連這個)'));
  const mode = teacherAuthMode();
  console.log(' 教師 PIN:  ' + (mode === 'env' ? '已設定(環境變數 TEACHER_PIN)'
    : mode === 'file' ? '已設定(' + AUTH_FILE + ')'
    : '尚未設定 —— 教師端將無法連線。請執行 node server/set-teacher-pin.js'));
  if (mode === 'env' && process.env.TEACHER_PIN.length < PIN_MIN_LEN)
    console.log(' ⚠ TEACHER_PIN 少於 ' + PIN_MIN_LEN + ' 碼,建議改長一點');
  console.log(' 停止伺服器:Ctrl + C');
  console.log('======================================================');
});
