#!/usr/bin/env node
/* 教師 PIN 驗證的實測:起一個臨時伺服器,驗證
 *   1. 沒設定 PIN → 教師被拒(not-configured)
 *   2. PIN 錯 → 被拒並斷線;PIN 對 → 以教師身分進入並收到名單
 *   3. 學生不帶 PIN 照常加入
 *   4. 同一來源連錯 5 次後鎖住,連對的 PIN 也暫時進不去
 *   5. 設定檔(PBKDF2)模式同樣有效
 * 用法:node server/test-teacher-auth.js   (需 Node 22 以上,內建 WebSocket) */
'use strict';
const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SERVER = path.join(__dirname, 'server.js');
let failures = 0;
const ok = (cond, label) => { console.log((cond ? '  ✓ ' : '  ✗ ') + label); if (!cond) failures++; };

function startServer(port, env) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [SERVER], { env: { PATH: process.env.PATH, HOME: process.env.HOME, PORT: String(port), ...env } });
    p.stdout.on('data', d => { if (String(d).includes('已啟動')) resolve(p); });
    p.on('exit', c => reject(new Error('server exited ' + c)));
    setTimeout(() => reject(new Error('server timeout')), 5000);
  });
}
/* 送出 join,收集 1 秒內的訊息與是否被斷線 */
function tryJoin(port, join, extraWait = 0) {
  return new Promise(resolve => {
    const ws = new WebSocket('ws://127.0.0.1:' + port);
    const msgs = []; let closed = false;
    ws.onopen = () => ws.send(JSON.stringify({ t: 'join', ...join }));
    ws.onmessage = ev => msgs.push(JSON.parse(ev.data));
    ws.onclose = () => { closed = true; };
    setTimeout(() => resolve({ ws, msgs, closed }), 700 + extraWait);
  });
}

async function run() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pc13110-auth-'));
  const noFile = path.join(tmp, 'none.auth');

  console.log('【1】未設定 PIN');
  let srv = await startServer(18731, { TEACHER_AUTH_FILE: noFile });
  let r = await tryJoin(18731, { role: 'teacher', room: 'T1', pin: 'anything' });
  ok(r.msgs.some(m => m.t === 'auth' && m.reason === 'not-configured') && r.closed, '教師被拒(not-configured)並斷線');
  r = await tryJoin(18731, { role: 'student', room: 'T1', name: '學生甲' });
  ok(r.msgs.some(m => m.t === 'welcome') && !r.closed, '學生照常加入');
  r.ws.close(); srv.kill();

  console.log('【2】環境變數 TEACHER_PIN');
  srv = await startServer(18732, { TEACHER_AUTH_FILE: noFile, TEACHER_PIN: 'right-pin-2026' });
  const stu = await tryJoin(18732, { role: 'student', room: 'T2', name: '學生乙' });
  ok(stu.msgs.some(m => m.t === 'welcome') && !stu.closed, '學生不帶 PIN 照常加入');
  r = await tryJoin(18732, { role: 'teacher', room: 'T2', pin: 'wrong' });
  ok(r.msgs.some(m => m.t === 'auth' && m.reason === 'bad-pin') && r.closed, '錯 PIN 被拒並斷線');
  ok(!r.msgs.some(m => m.t === 'roster' || m.t === 'welcome'), '錯 PIN 拿不到名單');
  r = await tryJoin(18732, { role: 'teacher', room: 'T2' });
  ok(r.closed && !r.msgs.some(m => m.t === 'welcome'), '沒帶 PIN 被拒');
  r = await tryJoin(18732, { role: 'teacher', room: 'T2', pin: 'right-pin-2026' });
  ok(r.msgs.some(m => m.t === 'welcome' && m.role === 'teacher') && !r.closed, '對 PIN 以教師身分進入');
  const roster = r.msgs.find(m => m.t === 'roster');
  ok(roster && roster.players.some(p => p.name === '學生乙'), '教師收到班上名單(含學生乙)');
  /* 教師廣播,學生要收到 */
  r.ws.send(JSON.stringify({ t: 'notice', text: '集合' }));
  await new Promise(res => setTimeout(res, 300));
  ok(stu.msgs.some(m => m.t === 'notice' && m.text === '集合'), '學生收到教師廣播');
  r.ws.close(); stu.ws.close();

  console.log('【4】連錯 5 次鎖住');
  for (let i = 0; i < 5; i++) await tryJoin(18732, { role: 'teacher', room: 'T2', pin: 'bad' + i }, -500);
  r = await tryJoin(18732, { role: 'teacher', room: 'T2', pin: 'right-pin-2026' });
  ok(r.msgs.some(m => m.t === 'auth' && m.reason === 'locked') && r.closed, '鎖定期間對 PIN 也被拒(locked)');
  srv.kill();

  console.log('【5】設定檔(PBKDF2)');
  const file = path.join(tmp, 'teacher.auth');
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync('file-pin-2026', salt, 1000, 32, 'sha256');
  fs.writeFileSync(file, ['pbkdf2_sha256', 1000, salt.toString('hex'), hash.toString('hex')].join('$') + '\n', { mode: 0o600 });
  srv = await startServer(18733, { TEACHER_AUTH_FILE: file });
  r = await tryJoin(18733, { role: 'teacher', room: 'T3', pin: 'file-pin-2025' });
  ok(r.closed && r.msgs.some(m => m.reason === 'bad-pin'), '錯 PIN 被拒');
  r = await tryJoin(18733, { role: 'teacher', room: 'T3', pin: 'file-pin-2026' });
  ok(r.msgs.some(m => m.t === 'welcome' && m.role === 'teacher') && !r.closed, '對 PIN 可進入');
  r.ws.close(); srv.kill();

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(failures ? '\n失敗 ' + failures + ' 項' : '\n全部通過');
  process.exit(failures ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
