/* ============================================================
 * 共用音效系統 — Web Audio API（程式生成，不依賴外部音檔）
 * ============================================================ */
const SoundFX = (() => {
  let ctx = null;
  let muted = localStorage.getItem('pc13110_sfx_muted') === '1';

  function ensureCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone({ freq = 440, type = 'sine', duration = 0.15, vol = 0.14, attack = 0.01 }) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function chord(freqs, opts = {}) {
    freqs.forEach((f, i) => setTimeout(() => tone({ freq: f, ...opts }), i * 80));
  }

  return {
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      localStorage.setItem('pc13110_sfx_muted', muted ? '1' : '0');
      return muted;
    },
    click() { tone({ freq: 760, duration: 0.06, vol: 0.07, type: 'square' }); },
    pop() { tone({ freq: 600, duration: 0.1, vol: 0.1, type: 'triangle' }); },
    tick() { tone({ freq: 1100, duration: 0.04, vol: 0.05, type: 'square' }); },
    success() { chord([523, 659, 784], { duration: 0.18, vol: 0.11, type: 'sine' }); },
    win() { chord([523, 659, 784, 1046], { duration: 0.24, vol: 0.12, type: 'sine' }); },
    error() {
      tone({ freq: 220, duration: 0.2, vol: 0.11, type: 'sawtooth' });
      setTimeout(() => tone({ freq: 175, duration: 0.2, vol: 0.11, type: 'sawtooth' }), 110);
    },
    warn() {
      tone({ freq: 860, duration: 0.1, vol: 0.09, type: 'square' });
      setTimeout(() => tone({ freq: 860, duration: 0.1, vol: 0.09, type: 'square' }), 150);
    },
    unlock() { chord([392, 523, 659, 784], { duration: 0.3, vol: 0.13, type: 'sine' }); },
  };
})();

/* 浮動的音效開關 */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.className = 'sound-toggle';
  btn.innerHTML = SoundFX.isMuted() ? '🔇' : '🔊';
  btn.title = SoundFX.isMuted() ? '音效：關' : '音效：開';
  btn.setAttribute('aria-label', '切換音效');
  btn.addEventListener('click', () => {
    const m = SoundFX.toggle();
    btn.innerHTML = m ? '🔇' : '🔊';
    btn.title = m ? '音效：關' : '音效：開';
    if (!m) SoundFX.click();
  });
  document.body.appendChild(btn);
});
