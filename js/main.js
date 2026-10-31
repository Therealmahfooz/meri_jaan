/* ============ REAL BOOK PAGE-TURN ============ */
const spreads = Array.from(document.querySelectorAll('.book-spread'));
const book = document.getElementById('bookContainer');
const mobileMQ = window.matchMedia('(max-width: 767px) and (orientation: portrait)');
const $ = (s) => document.querySelector(s);
const pg = (n, side) => $(`#spread-${n} .${side}-page`);
const cover = $('#spread-0 .single-page');

// Desktop/landscape: har view = {L, R}.  Cover sirf right half me hota hai.
const DESK = [
  { R: cover },
  { L: pg(1,'left'), R: pg(1,'right') },
  { L: pg(2,'left'), R: pg(2,'right') },
  { L: pg(3,'left'), R: pg(3,'right') },
  { L: pg(4,'left'), R: pg(4,'right') }
];
// Mobile portrait: ek time par ek page
const MOB = [cover, pg(1,'left'), pg(1,'right'), pg(2,'left'), pg(2,'right'),
             pg(3,'left'), pg(3,'right'), pg(4,'left')];
const MOBMAP = [[0,0],[1,0],[1,1],[2,0],[2,1],[3,0],[3,1],[4,0]];

let idx = 0;
let locked = false;
const FLIP_MS = 1100;
const EASE = 'cubic-bezier(0.45, 0.05, 0.25, 1)';

function render() {
  const m = mobileMQ.matches;
  let s = idx, h = 0;
  if (m) [s, h] = MOBMAP[idx];
  spreads.forEach((sp, i) => {
    sp.classList.toggle('active', i === s);
    sp.classList.toggle('show-right', i === s && h === 1);
  });
  book.classList.toggle('at-front', !m && idx === 0);
}

function clonePage(node) {
  const c = node.cloneNode(true);
  c.removeAttribute('id');
  c.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  return c;
}
const el = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };

function makeFace(cls, node) {
  const f = el('face ' + cls);
  const shade = el('shade');
  f.append(clonePage(node), shade);
  return { f, shade };
}

function startStage(mono) {
  const stage = el('flip-stage' + (mono ? ' mono' : ''));
  book.classList.add('instant');
  spreads.forEach((s) => s.classList.remove('active', 'show-right'));
  book.appendChild(stage);
  return stage;
}

function finish(stage, n, done) {
  idx = n;
  render();
  stage.remove();
  requestAnimationFrame(() => requestAnimationFrame(() => book.classList.remove('instant')));
  done();
}

function flipDesktop(a, b, dir, done) {
  const A = DESK[a], B = DESK[b];
  const stage = startStage(false);
  const base = (node, side) => {
    if (!node) return;
    const c = clonePage(node);
    c.classList.add('stage-page', side);
    stage.appendChild(c);
  };
  let front, back, side;
  if (dir > 0) { base(A.L, 'L'); base(B.R, 'R'); front = A.R; back = B.L; side = 'R'; }
  else         { base(B.L, 'L'); base(A.R, 'R'); front = A.L; back = B.R; side = 'L'; }

  const leaf = el('leaf ' + side);
  const F = makeFace('front', front), K = makeFace('back', back);
  leaf.append(F.f, K.f);
  stage.appendChild(leaf);

  book.classList.toggle('at-front', b === 0);   // book beech se khisakti hai
  const end = dir > 0 ? -180 : 180;
  const opt = { duration: FLIP_MS, easing: EASE, fill: 'forwards' };
  const anim = leaf.animate(
    [{ transform: 'translateZ(1px) rotateY(0deg)' }, { transform: `translateZ(1px) rotateY(${end}deg)` }], opt);
  F.shade.animate([{ opacity: 0 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0.6 }], opt);
  K.shade.animate([{ opacity: 0.6 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0 }], opt);
  anim.onfinish = () => finish(stage, b, done);
}

function flipMobile(a, b, dir, done) {
  const stage = startStage(true);
  const under = clonePage(MOB[dir > 0 ? b : a]);
  under.classList.add('stage-page');
  stage.appendChild(under);
  const leaf = el('leaf mono');
  const F = makeFace('front', MOB[dir > 0 ? a : b]);
  leaf.appendChild(F.f);
  stage.appendChild(leaf);
  const opt = { duration: 850, easing: EASE, fill: 'forwards', direction: dir > 0 ? 'normal' : 'reverse' };
  const anim = leaf.animate([
    { transform: 'translateZ(1px) rotateY(0deg)', opacity: 1 },
    { transform: 'translateZ(1px) rotateY(-105deg)', opacity: 0 }], opt);
  F.shade.animate([{ opacity: 0 }, { opacity: 0.55 }], opt);
  anim.onfinish = () => finish(stage, b, done);
}

function go(dir) {
  if (locked) return;
  const m = mobileMQ.matches;
  const n = idx + dir;
  if (n < 0 || n >= (m ? MOB.length : DESK.length)) return;
  locked = true;
  playFlipSound();
  const done = () => { locked = false; };
  (m ? flipMobile : flipDesktop)(idx, n, dir, done);
}

function nextSpread() { go(1); }
function prevSpread() { go(-1); }
function goToStart() {
  if (locked) return;
  idx = 0;
  render();
}
window.nextSpread = nextSpread;
window.prevSpread = prevSpread;
window.goToStart = goToStart;

mobileMQ.addEventListener('change', () => {
  idx = mobileMQ.matches ? [0, 1, 3, 5, 7][idx] : MOBMAP[idx][0];
  render();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextSpread();
  if (e.key === 'ArrowLeft') prevSpread();
});

let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].screenX - touchStartX;
  if (diff < -60) nextSpread();
  if (diff > 60) prevSpread();
}, { passive: true });

render();

/* ============ GOLDEN DUST ============ */
(function () {
  const c = document.getElementById('dustCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let w, h;
  const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
  resize();
  addEventListener('resize', resize);
  const p = Array.from({ length: 45 }, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: Math.random() * 1.8 + 0.4, v: Math.random() * 0.3 + 0.1,
    a: Math.random() * 0.5 + 0.2, d: Math.random() * 6
  }));
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    p.forEach((q) => {
      q.y -= q.v;
      q.x += Math.sin(q.y / 40 + q.d) * 0.25;
      if (q.y < -5) { q.y = h + 5; q.x = Math.random() * w; }
      ctx.beginPath();
      ctx.fillStyle = `rgba(248,229,150,${q.a})`;
      ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();

/* ============ PROPOSAL ============ */
function dodgeNo() {
  const noBtn = document.getElementById('noBtn');
  if (!noBtn) return;
  const x = (Math.random() - 0.5) * 140;
  const y = (Math.random() - 0.5) * 60;
  noBtn.style.transform = `translate(${x}px, ${y}px)`;
}
function acceptProposal() {
  const noBtn = document.getElementById('noBtn');
  if (noBtn) noBtn.style.display = 'none';
  const msg = document.getElementById('acceptedMessage');
  if (msg) msg.style.display = 'block';
}
window.dodgeNo = dodgeNo;
window.acceptProposal = acceptProposal;

/* ============ AUDIO ============ */
/* ---- YAHAN APNI AUDIO KA NAAM DAALO ----
   Apni background music file ko `audio/` folder me rakho aur neeche naam likho.
   (mp3 / m4a / ogg / wav sab chalega)                                          */
const MUSIC_SRC = 'audio/birds_sound.mp3';  // background music ka source
const MUSIC_VOL = 0.5;      // 0 se 1 tak
const FLIP_VOL  = 1;        // page palatne ki awaaz ka volume

/* Page flip ki asli recording daalni ho to: audio/pageflip.mp3
   nahi hui to neeche wali naram natural awaaz bajegi. */
const realFlip = new Audio('audio/pageflip.mp3');
let realFlipOK = false;
realFlip.addEventListener('canplaythrough', () => (realFlipOK = true), { once: true });

let audioCtx = null, master = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = 0.9;
    master.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function noiseBuffer(sec, pink) {
  const ctx = getAudioContext();
  const n = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, max = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (pink) {
      b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048;
      d[i] = b0 + b1 + b2 + w * 0.1;
    } else d[i] = w;
    max = Math.max(max, Math.abs(d[i]));
  }
  for (let i = 0; i < n; i++) d[i] /= max;
  return buf;
}

/* ---------- Page flip: naram, asli kagaz jaisi awaaz ---------- */
function playFlipSound() {
  if (realFlipOK) {
    try { const a = realFlip.cloneNode(); a.volume = Math.min(1, 0.85 * FLIP_VOL); a.play().catch(() => {}); return; } catch (e) {}
  }
  try {
    const ctx = getAudioContext(), t = ctx.currentTime;
    const dur = mobileMQ.matches ? 0.85 : 1.1, V = FLIP_VOL;
    const soft = (at, len, type, f, q, vol) => {            // naram (pink) noise ka chhota burst
      const s = ctx.createBufferSource(); s.buffer = noiseBuffer(len + 0.05, true);
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol * V, at + len * 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, at + len);
      s.connect(fl); fl.connect(g); g.connect(master); s.start(at); s.stop(at + len + 0.05);
    };
    // 1) page uthne ki naram rustle
    soft(t, 0.22, 'bandpass', 1100, 0.8, 0.16);
    // 2) hawa me naram swish (high frequency band, isliye "hard" nahi lagega)
    const sw = ctx.createBufferSource(); sw.buffer = noiseBuffer(dur + 0.1, true);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.6;
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.exponentialRampToValueAtTime(1900, t + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(900, t + dur * 0.95);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.5 * V, t + dur * 0.38);
    sg.gain.exponentialRampToValueAtTime(0.18 * V, t + dur * 0.75);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.97);
    sw.connect(bp); bp.connect(lp); lp.connect(sg); sg.connect(master);
    sw.start(t); sw.stop(t + dur + 0.1);
    // 3) kagaz ki bahut halki fibre crackle
    for (let i = 0; i < 6; i++) soft(t + Math.random() * dur * 0.75, 0.02 + Math.random() * 0.02, 'bandpass', 1800 + Math.random() * 1400, 1, 0.04 + Math.random() * 0.06);
    // 4) page ke baithne ki halki naram thap
    soft(t + dur * 0.92, 0.13, 'lowpass', 420, 0.7, 0.2);
  } catch (e) {}
}


/* ============ BACKGROUND MUSIC (website khulte hi) ============ */
const bgm = new Audio(MUSIC_SRC);
bgm.loop = true;
bgm.volume = MUSIC_VOL;
bgm.preload = 'auto';

const audioToggle = document.getElementById('audioToggle');
const audioStatus = document.getElementById('audioStatus');
let wantMusic = true;      // user ne band nahi kiya hai
let bgmMissing = false;

function setStatus(text, active) {
  if (audioStatus) audioStatus.textContent = text;
  if (audioToggle) audioToggle.classList.toggle('music-active', !!active);
}

function tryPlay() {
  if (bgmMissing) return Promise.resolve(false);
  return bgm.play().then(() => { setStatus('Music: On', true); return true; })
                   .catch(() => {
                     if (bgm.error) { bgmMissing = true; setStatus('Add music', false); }
                     else setStatus('Tap for music', false);
                     return false;
                   });
}

bgm.addEventListener('error', () => { bgmMissing = true; setStatus('Add music', false); });

// 1) page khulte hi chalane ki koshish (kuch browsers allow karte hain)
tryPlay();

// 2) Browser autoplay rok de to pehle tap / click / swipe / key par chalu
function unlockOnce(e) {
  if (e.target && e.target.closest && e.target.closest('#audioToggle')) return; // button ka apna kaam hai
  if (!wantMusic || !bgm.paused) return cleanup();
  tryPlay().then((ok) => { if (ok) cleanup(); });
}
const unlockEvents = ['pointerdown', 'touchend', 'click', 'keydown'];
function cleanup() { unlockEvents.forEach((ev) => document.removeEventListener(ev, unlockOnce, true)); }
unlockEvents.forEach((ev) => document.addEventListener(ev, unlockOnce, true));

// 3) Top-right button: music ruk / chalu
if (audioToggle) {
  audioToggle.addEventListener('click', () => {
    if (bgmMissing) return;
    if (bgm.paused) { wantMusic = true; tryPlay(); }
    else { wantMusic = false; bgm.pause(); setStatus('Music: Off', false); }
  });
}

// Tab chhodne par ruk jaye, wapas aane par chalu
document.addEventListener('visibilitychange', () => {
  if (document.hidden) bgm.pause();
  else if (wantMusic && !bgmMissing) tryPlay();
});
