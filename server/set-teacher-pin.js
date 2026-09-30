#!/usr/bin/env node
/* ============================================================
 * 設定教師 PIN(給 server.js 驗證 role:teacher 用)
 *
 * PIN 由老師自己在終端機輸入;這支程式只把 PBKDF2 雜湊寫進
 * ~/.config/pc13110/teacher.auth(權限 0600,在 repo 之外),
 * 明碼不會出現在任何檔案或日誌。忘記 PIN 只能重跑一次設新的。
 *
 * 用法:
 *   node server/set-teacher-pin.js            設定／更改 PIN
 *   node server/set-teacher-pin.js --status   只看目前狀態
 *   node server/set-teacher-pin.js --remove   移除(教師端將無法連線)
 * 設定檔位置可用環境變數 TEACHER_AUTH_FILE 覆寫。
 * ============================================================ */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const AUTH_FILE = process.env.TEACHER_AUTH_FILE ||
  path.join(os.homedir(), '.config', 'pc13110', 'teacher.auth');
const ITERATIONS = 240000;
const MIN_LEN = 6;

function askHidden(prompt) {
  return new Promise(resolve => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onData = ch => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData);
          process.stdout.write('\n'); resolve(buf); return;
        } else if (c === '\u0003') { process.stdout.write('\n'); process.exit(130); }
        else if (c === '\u007f' || c === '\b') buf = buf.slice(0, -1);
        else buf += c;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  const arg = process.argv[2];
  if (arg === '--status') {
    if (!fs.existsSync(AUTH_FILE)) { console.log('✗ 尚未設定教師 PIN(教師端無法連線)。'); return 1; }
    const mode = (fs.statSync(AUTH_FILE).mode & 0o777).toString(8);
    console.log('✓ 已設定　檔案:' + AUTH_FILE + '　權限:0' + mode);
    if (mode !== '600') console.log('  ⚠ 權限不是 0600,建議重跑一次這支程式修正。');
    return 0;
  }
  if (arg === '--remove') {
    if (fs.existsSync(AUTH_FILE)) { fs.unlinkSync(AUTH_FILE); console.log('已移除。教師端現在無法連線,直到重新設定。'); }
    else console.log('本來就沒有設定。');
    return 0;
  }
  if (!process.stdin.isTTY) {
    console.error('✗ 請在終端機直接執行,PIN 才不會留在指令紀錄或管線裡。');
    return 2;
  }
  console.log('設定教師 PIN(至少 ' + MIN_LEN + ' 碼,數字或英文皆可)');
  if (fs.existsSync(AUTH_FILE)) console.log('(已有設定,繼續會覆蓋舊的)');
  const pin = await askHidden('PIN(輸入時不會顯示):');
  if (pin.length < MIN_LEN) { console.error('✗ 至少要 ' + MIN_LEN + ' 碼,沒有做任何更動。'); return 2; }
  if (pin !== await askHidden('再輸入一次確認:')) { console.error('✗ 兩次不一致,沒有做任何更動。'); return 2; }
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(pin, salt, ITERATIONS, 32, 'sha256');
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true, mode: 0o700 });
  fs.writeFileSync(AUTH_FILE, ['pbkdf2_sha256', ITERATIONS, salt.toString('hex'), hash.toString('hex')].join('$') + '\n',
    { mode: 0o600 });
  fs.chmodSync(AUTH_FILE, 0o600);
  console.log('✓ 已設定:' + AUTH_FILE + '(權限 0600)。伺服器每次驗證都會重讀,不必重啟。');
  return 0;
}
main().then(code => process.exit(code));
