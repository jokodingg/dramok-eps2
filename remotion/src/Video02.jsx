import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Poppins';
import {Backdrop, Big, Cam, DeskLayer, GREEN, LG, Laptop, POSE, Shape, Student, SubPill, THUNDER, Vignette, armPts} from './Video01.jsx';
import {A1, GLOW, Maskot1, SEGS, handsOf, motion} from './MaskotPreview.jsx';
import {Bat, BubbleScreen, Dust, EsCekek, GlowDefs, JoksAt, Money, STEP, Sparkle, StepArt, StudentProne} from './Story02.jsx';
import LINES from './video02-lines.json';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

/* Video 2 "Lima Ribu?!" — lanjutan video 1. Timeline dalam frame video utama (setelah cover). */
const FPS = 30;
const F = (s) => Math.round(s * FPS);
export const COVER2 = 15;
const S = [0, 291, 372, 405, 537, 672, 759, 1131, 1263, 1334, 1383, 1410, 1986, 2079, 2215];
export const MAIN2 = S[S.length - 1];
const STEP_F = [759, 838, 906, 977, 1062]; // "satu…lima" pada j2
const SCX = 60; // mahasiswa
const LX0 = 176; // laptop sebelum bergeser
const LX = 208; // laptop setelah bergeser
const JX = 140; // Joks di meja

const SFX = [
  [3, 'twinkle', 0.4], [150, 'pop', 0.5],
  [349, 'click', 0.9], [353, 'notif', 0.6], [360, 'riser', 0.4],
  [374, 'pop', 0.7], [376, 'twinkle', 0.5],
  [405, 'slide', 0.8], [419, 'thud', 0.8],
  [692, 'pop', 0.7], [748, 'whoosh', 0.6],
  [761, 'pop', 0.6], [778, 'stamp', 0.7], [838, 'pop', 0.6], [862, 'stamp', 0.7], [906, 'pop', 0.6], [910, 'keyboard', 0.4],
  [977, 'pop', 0.6], [990, 'flip', 0.5], [1062, 'pop', 0.6], [1103, 'ding', 0.6],
  [1150, 'paper', 0.6],
  [1265, 'crickets', 0.6], [1273, 'squeak', 0.5], [1295, 'squeak', 0.5], [1335, 'impact', 0.9], [1336, 'glitch', 0.4],
  [1383, 'whoosh', 0.7], [1391, 'slap', 1],
  [1411, 'ting', 0.5], [F(LINES.j5.start + LINES.j5.censor[0]), 'beep', 0.5], [1890, 'impact', 0.6], [1937, 'pop', 0.7],
  [1986, 'whoosh', 0.6], [2000, 'pop', 0.6],
  [2079, 'pop', 0.7], [2093, 'pop', 0.7], [2105, 'pop', 0.7], [2133, 'pop', 0.7], [2143, 'pop', 0.6],
];

/* adegan pukul (adegan L): pukulan beruntun 3x lalu jeda mengomel, berulang sampai teriakan terakhir j6 */
const L0 = S[11];
const J6_T = F(LINES.j6.start) - L0; // frame lokal saat teriakan terakhir
const HIT0 = 10;
const CYCLE = 88;
const hitPhase = (t) => {
  if (t < HIT0 || t >= J6_T - 12) return null;
  const c = (t - HIT0) % CYCLE;
  return c < 48 ? {ph: (c % 16) / 16, k: c % 16} : {pause: c - 48};
};
for (let t = HIT0; t < J6_T - 12; t++) {
  const h = hitPhase(t);
  if (h && h.pause == null && h.k === 5) SFX.push([L0 + t, 'bonk', 0.7]);
}
const PLAY = ['m1', 'l1', 'm2', 'j1', 'm3', 'j2', 'm4', 'j3', 'j4', 'm5a', 'j5', 'm5b', 'j6', 'l2'];

/* ---------- util ---------- */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const sp = (f, delay = 0, cfg = {}) =>
  f < delay ? 0 : spring({frame: f - delay, fps: FPS, config: {damping: 11, stiffness: 140, mass: 0.6, ...cfg}});
const mixPose = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const shake = (f, amp, dec = 0.12) => ({
  x: Math.sin(f * 2.7) * amp * Math.exp(-Math.max(0, f) * dec),
  y: Math.cos(f * 3.3) * amp * Math.exp(-Math.max(0, f) * dec),
});

/* ---------- lipsync dari amplitudo audio ---------- */
const VoiceCtx = createContext({});
const VoiceProvider = ({children}) => {
  const data = {};
  for (const id of Object.keys(LINES)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    data[id] = useAudioData(staticFile(`audio2/${id}.mp3`));
  }
  return <VoiceCtx.Provider value={data}>{children}</VoiceCtx.Provider>;
};
const rmsAt = (w, sr, t, win = 0.04) => {
  const a = Math.max(0, Math.floor((t - win / 2) * sr));
  const b = Math.min(w.length, Math.floor((t + win / 2) * sr));
  if (b <= a) return 0;
  let s = 0;
  let n = 0;
  for (let i = a; i < b; i += 2) {
    s += w[i] * w[i];
    n++;
  }
  return Math.sqrt(s / n);
};
const peakCache = new WeakMap();
const peakRms = (d) => {
  let p = peakCache.get(d);
  if (p == null) {
    p = 0;
    const w = d.channelWaveforms[0];
    for (let t = 0; t < d.durationInSeconds; t += 0.04) p = Math.max(p, rmsAt(w, d.sampleRate, t));
    p = p || 1;
    peakCache.set(d, p);
  }
  return p;
};
const ampOf = (voice, id, g) => {
  const d = voice[id];
  if (!d) return 0;
  const t = (g - F(LINES[id].start)) / FPS;
  if (t < -0.05 || t > d.durationInSeconds + 0.1) return 0;
  const w = d.channelWaveforms[0];
  const v = (rmsAt(w, d.sampleRate, t) * 0.5 + rmsAt(w, d.sampleRate, t - 0.04) * 0.3 + rmsAt(w, d.sampleRate, t - 0.08) * 0.2) / peakRms(d);
  /* minimal 0.002 selama baris berjalan: penanda "sedang bicara" agar mulut Joks tidak meloncat terbuka di sela kata */
  return Math.max(0.002, Math.min(1, Math.pow(v, 0.8) * 1.05));
};
const useAmps = (g) => {
  const voice = useContext(VoiceCtx);
  const max = (ids) => Math.max(...ids.map((id) => ampOf(voice, id, g)));
  return {m: max(['m1', 'm2', 'm3', 'm4', 'm5a', 'm5b']), l: max(['l1', 'l2']), j: max(['j1', 'j2', 'j3', 'j4', 'j5', 'j6'])};
};

/* ---------- pose Joks ---------- */
const NETRAL_SEG = {key: 'netral', eyes: ['open', 'open'], mouth: 'smile', fx: []};
const joks = (key, t, f, {amp = 0, seg = {}, hands = {}, talkMouth = 'grin', ...rest} = {}) => {
  const base = key === 'netral' ? NETRAL_SEG : SEGS.find((s) => s.key === key);
  const m = key === 'netral' ? {dx: 0, dy: 0, tilt: 0, headTilt: 0, sq: 0} : motion(key, t);
  const sg = {...base, ...seg};
  const talking = amp > 0.001;
  return {
    ...m,
    hands: {...handsOf(key, t, A1), ...hands},
    seg: talking ? {...sg, mouth: talkMouth} : sg,
    t,
    blink: f % 97 < 4 ? 0.1 : 1,
    open: talking ? 0.2 + amp * 1.1 : 1,
    glow: base.glow || GLOW,
    ...rest,
  };
};

const lidOf = (f, n = 96) => (f % n < 4 ? 1 : null);

/* ---------- adegan ---------- */
const SceneA = ({from}) => {
  /* 0–9.7 s: mahasiswa mulai berharap lalu ragu (m1), laptop angkat bahu (l1), mahasiswa mengangguk (m2) */
  const f = useCurrentFrame();
  const {m, l} = useAmps(f + from);
  const doubt = f >= 24 && f < 250;
  const mood = f < 24 ? 'hope' : doubt ? 'doubt' : 'hope';
  const scratch = ease((f - 28) / 12) * (1 - ease((f - 120) / 12));
  const armR = mixPose(POSE.rest, [POSE.head[0] + Math.sin(f * 0.9) * 6 * scratch, POSE.head[1]], scratch);
  /* laptop "angkat bahu" tanpa tangan: melompat kecil & miring */
  const shrug = 6 * Math.max(0, Math.sin((f - 140) * 0.18)) * (f > 140 && f < 240 ? 1 : 0);
  const nod = f > 250 ? Math.sin((f - 250) * 0.35) * 5 * Math.exp(-(f - 250) * 0.03) : 0;
  return (
    <Cam fx={118} fy={245} sc={interpolate(f, [0, 291], [1.18, 1.3], clamp)}>
      <Backdrop f={f} />
      <Student part="body" cx={SCX} mood={mood} amp={m} f={f} tilt={nod} breath={Math.sin(f * 0.1) * 0.012} gaze={[3, 0.5]} lid={lidOf(f)} />
      <DeskLayer />
      <Student part="arms" cx={SCX} mood={mood} armR={armR} />
      <Laptop x={LX0} face={f < 137 ? 'neutral' : f < 250 ? 'smile' : 'smug'} gaze={LG} amp={l} rot={-2 + shrug * -0.5}
        blink={f % 110 < 4} y={304 - shrug} />
      {f < 30 && <Sparkle x={SCX - 18} y={204} r={6 * sp(f, 2) * (1 - ease((f - 18) / 10))} />}
    </Cam>
  );
};

const SceneB = () => {
  /* POV layar laptop: kursor ke kontak Jokoding, ragu, klik, layar flash hijau */
  const f = useCurrentFrame();
  const mv = ease(f / 30);
  const hes = f > 30 && f < 55 ? Math.sin((f - 30) * 0.8) * 4 : 0;
  const cx = lerp(214, 170, mv) + hes;
  const cy = lerp(300, 168, mv);
  const clicked = f >= 58;
  const ripple = clicked ? ease((f - 58) / 10) : 0;
  const flash = interpolate(f, [62, 66, 76], [0, 0.85, 0.35], clamp);
  const bulge = 1 + 0.05 * ease((f - 68) / 13);
  return (
    <>
      <rect width="270" height="480" fill="#0b0f19" />
      <g transform={`translate(135 228) scale(${bulge}) translate(-135 -228)`}>
        <rect x="8" y="88" width="254" height="270" rx="10" fill={THUNDER} />
        <rect x="16" y="96" width="238" height="254" rx="5" fill="#1d2b3a" />
        <rect x="30" y="110" width="210" height="226" rx="8" fill="#111b21" />
        <rect x="30" y="110" width="210" height="28" rx="8" fill="#202c33" />
        <image href={staticFile('whatsapp.svg')} x="38" y="115" width="18" height="18" />
        <text x="62" y="128" fontSize="9.5" fontWeight="700" fill="#e9edef">WhatsApp</text>
        <rect x="36" y="146" width="198" height="36" rx="6" fill={clicked ? '#31474f' : '#2a3942'} stroke={GREEN} strokeWidth={mv > 0.9 ? 1.6 : 0} />
        <circle cx="54" cy="164" r="12" fill="#F9FDF7" />
        <image href={staticFile('logo-color.png')} x="44.5" y="161.2" width="19" height="5.6" />
        <text x="72" y="161" fontSize="9" fontWeight="700" fill="#e9edef">Jokoding</text>
        <text x="72" y="173" fontSize="7" fill="#8696a0">Konsultasi gratis, chat aja dulu</text>
        {[0, 1, 2].map((i) => (
          <g key={i} opacity=".5">
            <circle cx="54" cy={204 + i * 40} r="12" fill="#3b4a54" />
            <rect x="72" y={197 + i * 40} width="90" height="6" rx="3" fill="#3b4a54" />
            <rect x="72" y={208 + i * 40} width="130" height="5" rx="2.5" fill="#2f3b44" />
          </g>
        ))}
        {clicked && <circle cx={cx} cy={cy} r={4 + ripple * 14} fill="none" stroke={GREEN} strokeWidth="2" opacity={1 - ripple} />}
        <path transform={`translate(${cx} ${cy}) scale(${clicked && f < 62 ? 0.85 : 1})`} d="M0 0 l0 16 l4 -4 l3.5 7 l3 -1.5 l-3.5 -7 l5.5 0 z" fill="#fff" stroke="#000" strokeWidth="1" />
        <rect x="16" y="96" width="238" height="254" rx="5" fill="#b9ff7a" opacity={flash} />
        <rect x="8" y="356" width="254" height="12" rx="4" fill="#555" />
      </g>
    </>
  );
};

const SceneC = () => {
  /* Joks menyembul keluar dari layar laptop */
  const f = useCurrentFrame();
  const k = ease(f / 14);
  const s = lerp(0.04, 0.16, ease(f / 12));
  const y = f < 14 ? lerp(272, 226, k) : 226 - 12 * ease((f - 14) / 19);
  const cheeks = ease(f / 6);
  return (
    <Cam fx={135} fy={245} sc={1.1}>
      <Backdrop f={f} />
      <Student part="body" cx={SCX} mood="shock" lean={-7 * cheeks} f={f} />
      <DeskLayer />
      <Student part="arms" cx={SCX} mood="shock" lean={-7 * cheeks} armL={mixPose(POSE.rest, POSE.cheeks, cheeks)} armR={mixPose(POSE.rest, POSE.cheeks, cheeks)} />
      <polygon points="128,226 224,226 250,120 102,120" fill="#b9ff7a" opacity={0.16 * k} />
      <Laptop x={LX0} s={0.9} face="shock" screen="#2f5d1a" gaze={[0, -3]} />
      <JoksAt x={LX0} y={y} s={s} p={joks('senang', f + 6, f, {seg: {fx: ['sparkle']}, sq: f < 14 ? -0.08 : 0})} />
    </Cam>
  );
};

const SceneD = ({from}) => {
  /* laptop tergeser ke kanan, Joks mendarat di tengah meja, menyapa (j1) */
  const f = useCurrentFrame();
  const {j} = useAmps(f + from);
  const lx = lerp(LX0, LX, ease(f / 12));
  const lrot = f < 12 ? 6 * Math.sin((Math.PI * f) / 12) : 3 * Math.exp(-(f - 12) * 0.15) * Math.sin((f - 12) * 0.7);
  const fly = Math.min(1, f / 14);
  const jx = lerp(LX0, JX, ease(fly));
  const jy = f < 14 ? lerp(214, 304, fly * fly) : 304;
  const land = f >= 14 ? 0.22 * Math.exp(-(f - 14) * 0.22) * Math.cos((f - 14) * 0.7) : -0.06;
  const p = f < 14 ? joks('senang', 20, f, {sq: land}) : joks('halo', f - 14, f, {amp: j, sq: land});
  const letters = [37, 46, 55, 62];
  const fadeL = 1 - ease((f - 118) / 10);
  const shock = f < 34;
  return (
    <Cam fx={128} fy={245} sc={1.08}>
      <Backdrop f={f} />
      <Student part="body" cx={SCX} mood={shock ? 'shock' : 'hope'} lean={lerp(-7, 0, ease((f - 20) / 14))} gaze={[3, 0]} f={f} lid={lidOf(f + 30)} />
      <DeskLayer />
      <Student part="arms" cx={SCX} mood={shock ? 'shock' : 'hope'} lean={lerp(-7, 0, ease((f - 20) / 14))}
        armL={mixPose(POSE.cheeks, POSE.rest, ease((f - 24) / 10))} armR={mixPose(POSE.cheeks, POSE.rest, ease((f - 24) / 10))} />
      {f < 14 && [0, 1, 2].map((i) => <line key={i} x1={lx - 75 + i * 3} y1={236 + i * 18} x2={lx - 58 + i * 3} y2={236 + i * 18} stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity={0.55 * (1 - fly)} />)}
      <Laptop x={lx} s={lerp(0.9, 0.85, ease(f / 12))} rot={lrot} face={f < 18 ? 'pain' : f < 50 ? 'sheepish' : 'smile'} gaze={[-3, 0]} blink={f % 100 < 4} />
      <JoksAt x={jx} y={jy} s={0.16} p={p} />
      {/* J.O.K.S (gaya akronim AI seperti J.A.R.V.I.S) */}
      {letters.map((lf, i) => {
        const lx2 = JX - 36 + i * 24;
        return (
          <g key={i} opacity={fadeL} transform={`translate(${lx2} 196) scale(${sp(f, lf, {damping: 8})}) translate(${-lx2} -196)`}>
            <text x={lx2} y={200} textAnchor="middle" fontSize="16" fontWeight="700" fill="#7bdb2e" stroke="#000" strokeWidth="1.4" paintOrder="stroke">
              {'JOKS'[i]}
            </text>
            {i < 3 && <circle cx={lx2 + 12} cy={198} r="1.8" fill="#7bdb2e" stroke="#000" strokeWidth=".6" />}
          </g>
        );
      })}
    </Cam>
  );
};

const SceneE = ({from}) => {
  /* mahasiswa canggung (m3) */
  const f = useCurrentFrame();
  const {m} = useAmps(f + from);
  const sc = ease(f / 8);
  return (
    <Cam fx={113} fy={245} sc={1.25}>
      <Backdrop f={f} />
      <Student part="body" cx={SCX} mood="awkward" amp={m} sweat f={f} gaze={[3, 0]} lid={lidOf(f + 50)} breath={Math.sin(f * 0.1) * 0.012} />
      <DeskLayer />
      <Student part="arms" cx={SCX} mood="awkward" armR={mixPose(POSE.rest, [POSE.head[0] + Math.sin(f * 0.8) * 7, POSE.head[1]], sc)} />
      <Laptop x={LX} s={0.85} face="smile" blink={f % 100 < 4} />
      <JoksAt x={JX} y={304} s={0.16} p={joks('netral', f, f, {seg: {fx: ['blush']}, dy: Math.sin(f * 0.12) * 3})} />
    </Cam>
  );
};

const SceneF = ({from}) => {
  /* Joks menunjuk ke atas, mahasiswa mendongak, bubble layar putih muncul, lalu kamera masuk ke bubble */
  const f = useCurrentFrame();
  const {j} = useAmps(f + from);
  const up = ease((f - 6) / 10);
  const rest = handsOf('netral', f, A1).R;
  const R = {x: lerp(rest.x, 205, up), y: lerp(rest.y, -255, up), r: 0, shape: up > 0.5 ? 'point' : 'mitt'};
  const look = ease((f - 14) / 10);
  const bub = sp(f, 20, {damping: 9});
  const z = 1 + 2.4 * ease((f - 70) / 17);
  const white = ease((f - 78) / 9);
  return (
    <>
      <g transform={`translate(135 135) scale(${z}) translate(-135 -135)`}>
        <Cam fx={135} fy={245} sc={1.12}>
          <Backdrop f={f} />
          <Student part="body" cx={SCX} mood="hope" gaze={[lerp(3, 2, look), lerp(0, -3.6, look)]} tilt={-5 * look} f={f} />
          <DeskLayer />
          <Student part="arms" cx={SCX} mood="hope" />
          <Laptop x={LX} s={0.85} face="excited" gaze={[lerp(-3, -1.5, look), lerp(0, -3, look)]} />
          <JoksAt x={JX} y={304} s={0.16} p={joks('netral', f, f, {amp: j, seg: {mouth: 'grin'}, hands: {R}})} />
        </Cam>
        <g transform={`translate(175 206) scale(${bub}) translate(-175 -206)`} opacity={Math.min(1, bub * 2)}>
          <BubbleScreen />
        </g>
      </g>
      <rect width="270" height="480" fill="#F9FDF7" opacity={white} />
    </>
  );
};

const SceneG = ({from}) => {
  /* layar penuh: 5 panel alur order mengikuti hitungan Joks */
  const f = useCurrentFrame();
  const g = f + from;
  const {j} = useAmps(g);
  let n = 1;
  STEP_F.forEach((sf, i) => {
    if (g >= sf) n = i + 1;
  });
  const ts = g - STEP_F[n - 1];
  const s = STEP[n - 1];
  const enter = f < 12 ? lerp(0.5, 1, ease(f / 12)) : 1;
  const art = sp(ts, 0, {damping: 10});
  const jp = joks('netral', f, f, {amp: j, seg: {mouth: 'grin'}, hands: {R: {x: 230, y: 60 + Math.sin(f * 0.3) * 12, r: 120, shape: 'point'}}});
  return (
    <>
      <rect width="270" height="480" fill="#F9FDF7" />
      {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <g transform={`translate(135 206) scale(${enter}) translate(-135 -206)`}>
        <rect x="18" y="92" width="234" height="228" rx="14" fill="#fff" stroke={THUNDER} strokeWidth="2.5" />
        <path d="M19.5 106 Q19.5 93.5 32 93.5 L238 93.5 Q250.5 93.5 250.5 106 L250.5 114 L19.5 114 Z" fill={GREEN} />
        <text x="60" y="107" fontSize="7" fontWeight="600" fill="#fff">alur order jokoding</text>
        {[1, 2, 3, 4, 5].map((i) => <circle key={i} cx={198 + i * 8} cy="104" r={i === n ? 3.2 : 2.6} fill="#fff" opacity={i <= n ? 1 : 0.35} />)}
        <g transform={`translate(42 136) scale(${sp(ts, 0, {damping: 8})}) translate(-42 -136)`}>
          <circle cx="42" cy="136" r="13" fill={n % 2 ? GREEN : THUNDER} />
          <text x="42" y="140.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">0{n}</text>
        </g>
        <text x={62 + (1 - ease(ts / 8)) * 14} y="141" fontSize="14" fontWeight="700" fill={THUNDER} opacity={ease(ts / 6)}>{s.t}</text>
        <g transform={`translate(135 220) scale(${art}) translate(-135 -220)`} opacity={Math.min(1, art * 2)}>
          <StepArt n={n} />
        </g>
        <JoksAt x={36} y={93 + Math.sin(f * 0.15) * 1.5} s={0.062} p={jp} />
      </g>
    </>
  );
};

const SceneH = ({from}) => {
  /* mahasiswa licik menyodorkan uang Rp5.000 (m4) */
  const f = useCurrentFrame();
  const {m} = useAmps(f + from);
  const k = ease((f - 8) / 12);
  const arm = mixPose(POSE.rest, [95, -75], k);
  const {H} = armPts([SCX + 26, 254], 1, arm[0], arm[1]);
  const stare = f > 52;
  return (
    <Cam fx={116} fy={245} sc={interpolate(f, [0, 132], [1.25, 1.36], clamp)}>
      <Backdrop f={f} />
      <Student part="body" cx={SCX} mood="sly" amp={m} gaze={[3, 0]} f={f} breath={Math.sin(f * 0.1) * 0.012} />
      <DeskLayer />
      <Student part="arms" cx={SCX} mood="sly" armR={arm} />
      {k > 0.5 && <Money x={H[0] + 4} y={H[1] - 12} rot={-14 + Math.sin(f * 0.5) * 6} s={1.2} />}
      <Laptop x={LX} s={0.85} face={f > 60 ? 'worried' : 'neutral'} gaze={[-3, 1]} blink={f % 100 < 4} />
      <JoksAt x={JX + 34} y={304} s={0.16} p={joks('netral', f, f, {seg: stare ? {mouth: 'flat'} : {}, dy: Math.sin(f * 0.12) * 3})} />
    </Cam>
  );
};

const SceneI = ({from}) => {
  /* close-up muka Joks, datar, mata berkedut (j3) */
  const f = useCurrentFrame();
  const {j} = useAmps(f + from);
  /* mata datar setengah tertutup; mata kanan berkedut cepat dalam dua semburan (kelopak atas-bawah bergetar) */
  const burst = (f >= 10 && f < 24) || (f >= 32 && f < 46);
  const spasm = burst ? 0.28 * Math.abs(Math.sin(f * 1.35)) : 0;
  const jit = burst ? [Math.sin(f * 2.9) * 1.2, Math.cos(f * 3.7) * 1.4] : [0, 0];
  const s = lerp(0.82, 0.9, ease(f / 71));
  const p = joks('netral', f, f, {
    seg: {eyes: ['twitch', 'twitch'], mouth: 'flat'}, amp: j * 0.6, blink: 1,
    twitch: [0.3, 0.3 + spasm], eyeShake: [[0, 0], jit],
  });
  const vein = burst ? 1 + 0.15 * Math.sin(f * 1.35) : ease((f - 4) / 6);
  return (
    <>
      <rect width="270" height="480" fill="#161d31" />
      <g transform={`translate(${135 + 5 * s} ${250 - 37 * s}) scale(${s})`}>
        <Maskot1 p={p} f={0} />
        {/* urat kesal di kepala, berdenyut saat mata berkedut */}
        <g transform={`translate(118 -96) scale(${vein})`} opacity={Math.min(1, vein)}>
          {[0, 90, 180, 270].map((r) => (
            <path key={r} transform={`rotate(${r})`} d="M 6 -20 Q 6 -6 20 -6" stroke="#FF6B57" strokeWidth="7" fill="none" strokeLinecap="round" />
          ))}
        </g>
      </g>
      {burst && <text x="206" y="168" fontSize="10" fontWeight="700" fill="#fff" opacity=".85" transform="rotate(10 206 168)">ngiik</text>}
      <text x="40" y="380" fontSize="9" fontWeight="600" fill="#9fb3c8" opacity={1 - ease((f - 22) / 6)}>krik… krik…</text>
    </>
  );
};

const SceneJ = ({from}) => {
  /* meledak: LIMA RIBU?! (j4) */
  const f = useCurrentFrame();
  const {j} = useAmps(f + from);
  const k = shake(f, 6, 0.05);
  const s = 0.86 + 0.06 * sp(f, 0, {damping: 6});
  const p = joks('marah', f + 10, f, {amp: j, talkMouth: 'shout'});
  return (
    <>
      <rect width="270" height="480" fill="#1d1420" />
      <g transform={`translate(${135 + 5 * s + k.x} ${250 - 37 * s + k.y}) rotate(-3) scale(${s})`}>
        <Maskot1 p={p} f={0} />
      </g>
      {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={i % 2 ? 0 : 270} y1={110 + i * 34} x2={i % 2 ? 30 : 240} y2={116 + i * 34} stroke="#fff" strokeWidth="2" opacity=".55" />)}
      <Big t="LIMA RIBU?!" y={392} size={34} rot={-4} scale={sp(f, 1, {damping: 7})} />
    </>
  );
};

const SceneK = () => {
  /* uang dilempar ke muka mahasiswa: PLAK! */
  const f = useCurrentFrame();
  const throwK = ease(f / 5);
  const hit = f >= 9;
  const fly = ease((f - 2) / 7);
  const mx = lerp(JX - 20, SCX - 2, fly);
  const my = lerp(250, 214, fly) - Math.sin(Math.PI * fly) * 18;
  const k = shake(f - 9, hit ? 5 : 0, 0.12);
  const p = joks('marah', 30, f, {hands: {L: {x: lerp(-215, -250, throwK), y: lerp(185, 40, throwK), r: -70, shape: 'mitt'}}});
  return (
    <>
      <Cam fx={110} fy={245} sc={1.2} x={k.x} y={k.y}>
        <Backdrop f={f} />
        <Student part="body" cx={SCX} mood="shock" lean={hit ? -9 : 0} tilt={hit ? -10 : 0} f={f} />
        <DeskLayer />
        <Student part="arms" cx={SCX} mood="shock" lean={hit ? -9 : 0} armL={hit ? POSE.raised : POSE.rest} armR={hit ? POSE.raised : POSE.rest} />
        <Laptop x={LX} s={0.85} face="shock" gaze={[-3, 0]} />
        <JoksAt x={JX + 18} y={304} s={0.17} p={p} />
        {f >= 2 && <Money x={hit ? SCX - 2 : mx} y={hit ? 214 : my} rot={hit ? -20 : f * 40} s={hit ? 1.6 : 1.2} />}
      </Cam>
      {hit && <Big t="PLAK!" y={140} size={30} fill="#fff" rot={-8} scale={sp(f, 9, {damping: 7})} />}
    </>
  );
};

/* adegan pukul; t = frame lokal adegan L */
const BeatScene2 = ({t, censor = false, cam = true, amp = 0}) => {
  const h = hitPhase(t);
  const swinging = !!h && h.pause == null; // pause bisa bernilai 0, jadi jangan cek dengan !h.pause
  const ph = swinging ? h.ph : 0;
  /* sudut tongkat: 0 = ke atas; memukul ke kiri-bawah (kepala mahasiswa) */
  const ang = swinging
    ? ph < 0.3 ? lerp(20, -135, ease(ph / 0.3)) : lerp(-135, 20, ease((ph - 0.3) / 0.7))
    : h && h.pause != null ? 20 + Math.sin(h.pause * 0.35) * 14 // jeda: tongkat diacung-acungkan sambil mengomel
    : 25;
  const strike = swinging && h.k >= 5 && h.k < 9;
  const tsHit = swinging ? h.k - 5 : 99;
  const yell = t >= J6_T;
  const batIn = sp(t, 0, {damping: 8});
  const k = shake(tsHit, strike ? 3 : 0, 0.2);
  const p = joks('marah', t + 10, t, {
    amp,
    hands: {L: {x: -180, y: -40, r: 0, shape: 'fist'}, R: {x: yell ? 200 : 150, y: yell ? -170 : -60 + (h && h.pause != null ? Math.sin(h.pause * 0.5) * 20 : 0), r: 0, shape: 'fist'}},
    seg: {fx: ['steam']}, talkMouth: 'shout',
  });
  /* kamera: dekat ke Joks saat bagian disensor & saat teriakan terakhir */
  const c0 = F(LINES.j5.censor[0]) + F(LINES.j5.start) - L0;
  const c1 = F(LINES.j5.censor[1]) + F(LINES.j5.start) - L0;
  const zoom = Math.max(yell ? ease((t - J6_T) / 10) : 0, ease((t - c0) / 8) * (1 - ease((t - c1) / 10)) * 0.8);
  const body = (
    <>
      <Backdrop f={t} />
      <DeskLayer />
      <g transform={`rotate(${Math.sin(t * 0.4) * 4} 166 345)`}>
        <Dust x={166} y={345} r={36 + Math.sin(t * 0.5) * 3} />
      </g>
      <g transform={`translate(${strike ? Math.sin(t * 3) * 1.5 : 0} 0)`}>
        <StudentProne x={86} y={362} />
      </g>
      <Dust x={120 + Math.sin(t * 0.7) * 3} y={374} r={18} />
      <JoksAt x={148} y={346 + (strike ? 2 : 0)} s={0.2} p={p}>
        <g transform={`translate(-180 -40) scale(${batIn}) translate(180 40)`}>
          <Bat hx={-180} hy={-40} ang={ang} />
        </g>
        {censor && (
          /* kotak sensor tepat di mulut (mata tetap terlihat) */
          <g transform={`rotate(${Math.sin(t * 1.7) * 3} -5 64)`}>
            <rect x={-48} y={46} width={86} height={36} rx={4} fill="#000" />
            <text x={-5} y={72} textAnchor="middle" fontSize="24" fontWeight="700" fill="#fff">#@$%!</text>
          </g>
        )}
      </JoksAt>
      {[[70, 322, 7], [186, 318, 9], [42, 352, 5]].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${t * 6 * (i % 2 ? 1 : -1)} ${x} ${y})`}><Sparkle x={x} y={y} r={r} /></g>
      ))}
      {swinging && tsHit >= 0 && tsHit < 10 && (
        <text x={190} y={290} fontSize="15" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="1.4" paintOrder="stroke"
          transform={`translate(205 285) rotate(12) scale(${sp(tsHit, 0, {damping: 7})}) translate(-205 -285)`}>BLETAK!</text>
      )}
    </>
  );
  if (!cam) return body;
  return (
    <Cam fx={lerp(128, 146, zoom)} fy={lerp(320, 300, zoom)} sc={lerp(1.45, 1.75, zoom)} x={k.x} y={k.y}>
      {body}
    </Cam>
  );
};

const SceneL = ({from}) => {
  const f = useCurrentFrame();
  const {j} = useAmps(f + from);
  const t5 = (f + from - F(LINES.j5.start)) / FPS;
  const censor = t5 >= LINES.j5.censor[0] && t5 < LINES.j5.censor[1];
  const esF = F(LINES.j6.start + 1.56) - from; // kata "es cekek"
  const es = sp(f, esF, {damping: 8});
  return (
    <>
      <BeatScene2 t={f} censor={censor} amp={j} />
      {f >= esF && (
        <g transform={`translate(52 160) rotate(-10) scale(${es})`}>
          <EsCekek x={0} y={0} s={1.5} />
          <Sparkle x={22} y={-20} r={6} />
        </g>
      )}
    </>
  );
};

const SceneM = ({from}) => {
  /* adegan blur, laptop turun dari atas bicara ke penonton (l2) */
  const f = useCurrentFrame();
  const {l} = useAmps(f + from);
  /* laptop muncul dari bawah ke atas */
  const rise = sp(f, 4, {damping: 10, stiffness: 120});
  const y = lerp(580, 272, rise);
  const blur = 4 * ease(f / 10);
  return (
    <>
      <defs>
        <filter id="blurM" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={blur} /></filter>
      </defs>
      <g filter="url(#blurM)">
        <BeatScene2 t={J6_T + 30 + f * 0.3} />
      </g>
      <rect width="270" height="480" fill="#000" opacity={0.3 * ease(f / 10)} />
      <Laptop x={135} y={y} s={1.15} face="sheepish" gaze={[0, 1]} sweat amp={l} blink={f % 70 < 4} rot={Math.sin(f * 0.2) * 2 * (1 - rise * 0.6)} />
    </>
  );
};

const SceneN = () => {
  /* end card, format sama dengan video 1 */
  const f = useCurrentFrame();
  const bounce = Math.sin(f * 0.25) * 3;
  const shine = ((f - 26) % 60) / 60;
  const pill = (delay) => sp(f, delay, {damping: 8, stiffness: 190});
  const shapes = [
    ['asterisk', 14, 130, 20, GREEN, 1], ['cross', 250, 100, 16, THUNDER, -1], ['hash', 12, 232, 16, THUNDER, 1],
    ['diamond', 252, 214, 18, GREEN, -1], ['asterisk', 18, 326, 14, THUNDER, -1], ['cross', 250, 150, 12, GREEN, 1],
  ];
  return (
    <>
      <rect width="270" height="480" fill="#F9FDF7" />
      {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <rect y="336" width="270" height="144" fill="#e6f4dc" />
      {shapes.map(([type, x, y, size, color, d], i) => (
        <g key={i} opacity={sp(f, 8 + i * 3)}>
          <Shape type={type} x={x} y={y + Math.sin(f * 0.08 + i) * 3} size={size} color={color} rot={f * 1.5 * d} />
        </g>
      ))}
      <g transform={`translate(130 118) rotate(${Math.sin(f * 0.12) * 1.5}) scale(${pill(0)}) translate(-130 -118)`}>
        <text x="130" y="122" textAnchor="middle" fontSize="22" fontWeight="700" fill={THUNDER}>APA PILIHANMU?</text>
        <path d="M58 130 q9 -6 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" stroke={GREEN} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(130 164) scale(${pill(14)}) translate(-130 -164)`}>
        <rect x="24" y="142" width="212" height="44" rx="22" fill={GREEN} />
        <circle cx="48" cy="164" r="12" fill="#fff" />
        <text x="48" y="169" textAnchor="middle" fontSize="14" fontWeight="700" fill={GREEN}>A</text>
        <text x="68" y="168" fontSize="10.5" fontWeight="700" fill="#fff">Belajar bareng Joks</text>
        <clipPath id="pillA2"><rect x="24" y="142" width="212" height="44" rx="22" /></clipPath>
        <g clipPath="url(#pillA2)">
          <rect x={lerp(-20, 260, shine)} y="130" width="22" height="70" fill="#fff" opacity=".28" transform={`rotate(20 ${lerp(-20, 260, shine)} 164)`} />
        </g>
      </g>
      <g transform={`translate(130 212) scale(${pill(26)}) translate(-130 -212)`}>
        <rect x="24" y="190" width="212" height="44" rx="22" fill="#fff" stroke={THUNDER} strokeWidth="2" />
        <circle cx="48" cy="212" r="12" fill={THUNDER} />
        <text x="48" y="217" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">B</text>
        <text x="68" y="216" fontSize="10.5" fontWeight="700" fill={THUNDER}>Beli es cekek</text>
      </g>
      <g opacity={sp(f, 40)}>
        <text x="130" y={266} textAnchor="middle" fontSize="11" fontWeight="600" fill="#5b5859">Komentar di bawah</text>
        <text x="130" y={282 + bounce} textAnchor="middle" fontSize="14" fontWeight="700" fill={GREEN}>↓</text>
      </g>
      <g transform={`translate(130 308) scale(${pill(54)}) translate(-130 -308)`}>
        <rect x="40" y="294" width="180" height="28" rx="14" fill="#fff" stroke={GREEN} strokeWidth="2" />
        <image href={staticFile('whatsapp.svg')} x="47" y="297.5" width="21" height="21" />
        <text x="74" y="312" fontSize="9.5" fontWeight="700" fill={THUNDER}>Chat WhatsApp (link di bio)</text>
      </g>
      <g transform={`translate(130 337) scale(${pill(64)}) translate(-130 -337)`}>
        <rect x="40" y="326" width="180" height="26" rx="13" fill={THUNDER} />
        <text x="130" y="343" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">Lihat portofolio: <tspan fill="#6fd31f">jokoding.id</tspan></text>
      </g>
    </>
  );
};

const SCENES = [SceneA, SceneB, SceneC, SceneD, SceneE, SceneF, SceneG, SceneH, SceneI, SceneJ, SceneK, SceneL, SceneM, SceneN];

/* ---------- overlay: logo + subtitle ---------- */
const Subtitle = ({g}) => {
  if (g >= S[13]) return null;
  for (const id of PLAY) {
    const L = LINES[id];
    const a = L.start * FPS;
    if (g < a - 1 || g >= a + L.dur * FPS + 4) continue;
    const t = (g - a) / FPS;
    const ch = [];
    let cur = [];
    L.words.forEach((wd) => {
      if (cur.length && cur.map((x) => x[1]).join(' ').length + wd[1].length + 1 > 26) {
        ch.push(cur);
        cur = [];
      }
      cur.push(wd);
    });
    if (cur.length) ch.push(cur);
    let idx = -1;
    for (let i = 0; i < ch.length; i++) if (t >= ch[i][0][0]) idx = i;
    if (idx < 0) continue;
    const s = interpolate((t - ch[idx][0][0]) * FPS, [0, 3], [0.88, 1], clamp);
    return <SubPill words={ch[idx].map((x) => x[1])} s={s} />;
  }
  return null;
};
const Overlay = ({g}) => {
  const light = !((g >= S[6] && g < S[7]) || g >= S[13]);
  return (
    <svg viewBox="0 0 270 480" width="1080" height="1920" style={{position: 'absolute', inset: 0, fontFamily}}>
      <image href={staticFile(light ? 'logo-light.png' : 'logo-color.png')} x="216" y="66" width="38" height="11.16" />
      <Subtitle g={g} />
    </svg>
  );
};

const Main = () => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <VoiceProvider>
        {SCENES.map((Scene, i) => (
          <Sequence key={i} from={S[i]} durationInFrames={S[i + 1] - S[i]}>
            <AbsoluteFill>
              <svg viewBox="0 0 270 480" width="1080" height="1920" style={{fontFamily}}>
                <GlowDefs />
                <Scene from={S[i]} />
              </svg>
            </AbsoluteFill>
          </Sequence>
        ))}
      </VoiceProvider>
      <Overlay g={g} />
      <Audio src={staticFile('music2.wav')} volume={0.2} />
      {PLAY.map((id) => {
        const c = LINES[id].censor;
        /* bagian yang disensor dibisukan (bunyi "tiit" diputar sebagai SFX) */
        const vol = c ? (fr) => (fr / FPS >= c[0] && fr / FPS < c[1] ? 0 : 1) : 1;
        return (
          <Sequence key={id} from={F(LINES[id].start)}>
            <Audio src={staticFile(`audio2/${id}.mp3`)} volume={vol} />
          </Sequence>
        );
      })}
      {SFX.map(([fr, src, v], i) => (
        <Sequence key={i} from={fr}>
          <Audio src={staticFile(`sfx/${src}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- cover 0,5 detik ---------- */
const Cover = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 270 480" width="1080" height="1920" style={{fontFamily}}>
      <GlowDefs />
      <BeatScene2 t={14} />
      <Vignette o={0.6} />
      <Big t="LIMA RIBU?!" y={150} size={34} rot={-3} />
      <rect x="105" y="100" width="60" height="17" rx="8.5" fill={GREEN} />
      <text x="135" y="112.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">PART 2</text>
      <image href={staticFile('logo-light.png')} x="216" y="66" width="38" height="11.16" />
    </svg>
  </AbsoluteFill>
);

export const Video02 = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={COVER2}>
      <Cover />
    </Sequence>
    <Sequence from={COVER2}>
      <Main />
    </Sequence>
  </AbsoluteFill>
);
