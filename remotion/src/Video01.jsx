import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame} from 'remotion';
import {useAudioData} from '@remotion/media-utils';
import {loadFont} from '@remotion/google-fonts/Poppins';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

const FPS = 30;
const F = (s) => Math.round(s * FPS);
export const GREEN = '#44AA00';
export const THUNDER = '#322F30';
export const SKIN = '#f3c9a0';

/* ---------- data suara (durasi asli ElevenLabs) ---------- */
const LINES = {
  m1: {start: 0.3, dur: 3.87, text: 'skripsi… kita perlu ngomong. sekarang.'},
  l1: {start: 4.5, dur: 3.4, text: 'aku dari tadi di sini kok. kamu yang nggak ngetik-ngetik.'},
  m2: {start: 8.2, dur: 1.57, text: 'gilak kamu, skripsi?!'},
  l2: {start: 9.95, dur: 1.23, text: 'kamu yang gilak!'},
  m3: {start: 11.5, dur: 3.4, text: 'empat tahun loh ini, skripsi! aku sepi!'},
  l3: {start: 16.5, dur: 3.47, text: 'dospem minta revisi lagi. aku cuma nyampein.'},
  m4: {start: 20.3, dur: 3.87, text: 'revisi ketujuh?! lulus itu kan impian kita!'},
  l4: {start: 24.8, dur: 3.16, text: 'udah. tarik napas. dengerin aku dulu.'},
  l5: {
    start: 28.4,
    dur: 6.84,
    text: 'kamu punya dua pilihan: konsultasi dulu ke jokoding lewat whatsapp, atau lanjut nganggurin skripsi.',
    /* waktu tiap kata dari transkrip audio (detik sejak awal l5) */
    words: [
      [0, 'kamu'], [0.38, 'punya'], [0.64, 'dua'], [0.86, 'pilihan:'], [1.92, 'konsultasi'], [2.8, 'dulu'], [3.08, 'ke'],
      [3.26, 'jokoding'], [3.74, 'lewat'], [4.08, 'whatsapp,'], [4.52, 'atau'], [5.24, 'lanjut'], [5.74, 'nganggurin'], [6.14, 'skripsi.'],
    ],
  },
};

/* batas shot (frame) */
const S = [0, 135, 246, 298, 342, 474, 606, 738, 849, 1064, 1200];

/* efek suara: frame, file, volume */
const SFX = [
  {f: 155, src: 'keyboard', v: 0.5},
  {f: 244, src: 'whoosh', v: 0.6},
  {f: 254, src: 'impact', v: 0.9},
  {f: 255, src: 'paper', v: 0.5},
  {f: 298, src: 'glitch', v: 0.7},
  {f: 356, src: 'flip', v: 0.7},
  {f: 388, src: 'flip', v: 0.7},
  {f: 436, src: 'crickets', v: 0.6},
  {f: 474, src: 'notif', v: 0.7},
  {f: 620, src: 'impact', v: 0.7},
  {f: 664, src: 'pop', v: 0.6},
  {f: 714, src: 'pop', v: 0.5},
  {f: 714, src: 'sigh', v: 0.3},
  {f: 720, src: 'groan', v: 0.75},
  {f: 728, src: 'impact', v: 0.7},
  {f: 742, src: 'ding', v: 0.6},
  {f: 754, src: 'pop', v: 0.5},
  {f: 912, src: 'pop', v: 0.7},
  {f: 1007, src: 'pop', v: 0.7},
  {f: 1040, src: 'riser', v: 0.5},
  {f: 1064, src: 'pop', v: 0.7},
  {f: 1078, src: 'pop', v: 0.7},
  {f: 1090, src: 'pop', v: 0.7},
  {f: 1118, src: 'pop', v: 0.6},
];

/* ---------- util ---------- */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const sp = (f, delay = 0, cfg = {}) =>
  f < delay ? 0 : spring({frame: f - delay, fps: FPS, config: {damping: 11, stiffness: 140, mass: 0.6, ...cfg}});
const shake = (f, amp, dec = 0.12) => ({
  x: Math.sin(f * 2.7) * amp * Math.exp(-Math.max(0, f) * dec),
  y: Math.cos(f * 3.3) * amp * Math.exp(-Math.max(0, f) * dec),
});
const mixPose = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/* arah pandangan laptop */
export const LG = [-3.2, 0.6]; // melihat mahasiswa (kiri)
const LUP = [0, -3.2];
const LC = [0, 0.4];

/* ---------- lipsync dari amplitudo audio asli ---------- */
const VoiceCtx = createContext({});
const VoiceProvider = ({children}) => {
  const data = {};
  for (const id of Object.keys(LINES)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    data[id] = useAudioData(staticFile(`audio/${id}.mp3`));
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
  const pk = peakRms(d);
  const v = (rmsAt(w, d.sampleRate, t) * 0.5 + rmsAt(w, d.sampleRate, t - 0.04) * 0.3 + rmsAt(w, d.sampleRate, t - 0.08) * 0.2) / pk;
  return Math.min(1, Math.pow(v, 0.8) * 1.05);
};
const ampFor = (voice, ids, g) => Math.max(...ids.map((id) => ampOf(voice, id, g)));
const useAmps = (g) => {
  const voice = useContext(VoiceCtx);
  return {m: ampFor(voice, ['m1', 'm2', 'm3', 'm4'], g), l: ampFor(voice, ['l1', 'l2', 'l3', 'l4', 'l5'], g)};
};

/* ---------- kamera ---------- */
export const Cam = ({fx = 135, fy = 240, sc = 1, x = 0, y = 0, children}) => {
  const cfx = Math.min(270 - 135 / sc, Math.max(135 / sc, fx));
  const cfy = Math.min(480 - 240 / sc, Math.max(240 / sc, fy));
  return <g transform={`translate(${135 + x} ${240 + y}) scale(${sc}) translate(${-cfx} ${-cfy})`}>{children}</g>;
};

/* ---------- kamar ---------- */
const Calendar = ({day, cal}) => {
  const ease2 = cal.roll ? ease(cal.roll.p) : 0;
  const ink = THUNDER;
  const digit = (ch, y) => (
    <text x="138.5" y={142 + y} textAnchor="middle" fontSize="18" fontWeight="700" fill={ink}>{ch}</text>
  );
  return (
    <g>
      <rect x="94" y="98" width="56" height="64" rx="4" fill={day ? '#fff' : '#e9edf5'} />
      <path d="M94 114 L94 102 Q94 98 98 98 L146 98 Q150 98 150 102 L150 114 Z" fill="#ff3b3b" />
      <circle cx="104" cy="98" r="2.6" fill="#cfd8dc" />
      <circle cx="140" cy="98" r="2.6" fill="#cfd8dc" />
      <text x="122" y="109" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff">OKTOBER</text>
      {['2', '0', '2'].map((d, i) => (
        <text key={i} x={105.5 + i * 11} y="142" textAnchor="middle" fontSize="18" fontWeight="700" fill={ink}>{d}</text>
      ))}
      <clipPath id="calclip"><rect x="132.5" y="124" width="12" height="24" /></clipPath>
      <g clipPath="url(#calclip)">
        {cal.roll ? (
          <>
            {digit(cal.roll.from, 24 * ease2)}
            {digit(cal.roll.to, -24 * (1 - ease2))}
          </>
        ) : (
          digit(cal.digit, 0)
        )}
      </g>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={`a${i}`} cx={103 + i * 11} cy="152" r="1.3" fill="#b8c0c8" />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={`b${i}`} cx={103 + i * 11} cy="157" r="1.3" fill="#b8c0c8" />
      ))}
    </g>
  );
};

export const Backdrop = ({day = false, f = 0, cal = {digit: '6', roll: null}}) => {
  const wall = day ? '#F9FDF7' : '#161d31';
  const floor = day ? '#e0f0d4' : '#0d1220';
  const ink = day ? THUNDER : '#9fb3c8';
  return (
    <g>
      <rect x="-40" y="-40" width="350" height="560" fill={wall} />
      {day && [0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <rect x="-40" y="336" width="350" height="160" fill={floor} />
      <rect x="-40" y="332" width="350" height="5" fill={day ? '#cfe3c0' : '#0a0f1a'} />
      {/* jendela */}
      <rect x="20" y="110" width="66" height="60" rx="3" fill={day ? '#cfe8bf' : '#2a3558'} />
      <rect x="24" y="114" width="58" height="52" fill={day ? '#bfe6ff' : '#0b1530'} />
      {day ? (
        <circle cx="66" cy="130" r="8" fill="#ffd54a" />
      ) : (
        <>
          <circle cx="64" cy="132" r="9" fill="#f6f0c8" />
          <circle cx="68" cy="129" r="8" fill="#0b1530" />
          {[[34, 124], [46, 150], [74, 152], [36, 144], [56, 122]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.1" fill="#fff" opacity={0.5 + 0.5 * Math.sin(f * 0.1 + i)} />
          ))}
        </>
      )}
      <line x1="53" y1="114" x2="53" y2="166" stroke={day ? '#cfe8bf' : '#2a3558'} strokeWidth="2" />
      <line x1="24" y1="140" x2="82" y2="140" stroke={day ? '#cfe8bf' : '#2a3558'} strokeWidth="2" />
      {/* kalender 2026 */}
      <g transform="translate(18 0)"><Calendar day={day} cal={cal} /></g>
      {/* jam dinding 02.00 */}
      <g transform="translate(8 24)">
      <circle cx="180" cy="128" r="14" fill={day ? '#fff' : '#222a44'} stroke={day ? THUNDER : '#9fb3c8'} strokeWidth="2" />
      <line x1="180" y1="128" x2={180 + Math.sin(Math.PI / 3) * 7} y2={128 - Math.cos(Math.PI / 3) * 7} stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <line x1="180" y1="128" x2="180" y2="117" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
      <text x="180" y="151" textAnchor="middle" fontSize="6" fontWeight="700" fill={day ? THUNDER : '#ff3b3b'}>02.00</text>
      </g>
      {/* kasur di kiri */}
      <rect x="-20" y="272" width="56" height="64" rx="8" fill={day ? '#c4e3a8' : '#25335c'} />
      <ellipse cx="10" cy="276" rx="22" ry="8" fill={day ? '#fff' : '#3a4a7a'} />
    </g>
  );
};

export const DeskLayer = ({day = false, jolt = 0}) => {
  const top = day ? '#e8cf9f' : '#6a5242';
  const front = day ? '#caa974' : '#43342b';
  const leg = day ? '#b48f5c' : '#33271f';
  return (
    <g>
      <rect x="14" y="318" width="10" height="90" fill={leg} />
      <rect x="246" y="318" width="10" height="90" fill={leg} />
      <rect x="6" y="318" width="258" height="18" fill={front} />
      <path d="M0 318 L8 296 L262 296 L270 318 Z" fill={top} />
      {!day && <polygon points="238,250 140,302 262,302" fill="#ffd27a" opacity=".13" />}
      <g transform={`translate(0 ${-jolt})`}>
        {/* lampu meja */}
        <line x1="250" y1="304" x2="244" y2="262" stroke="#555" strokeWidth="3" strokeLinecap="round" />
        <path d="M232 252 L252 250 L246 264 L236 266 Z" fill={day ? '#8bd05a' : '#ffd27a'} />
        {/* gelas kopi kosong */}
        <rect x="16" y="283" width="18" height="21" rx="3" fill="#fff" />
        <path d="M34 288 q9 4 0 12" stroke="#fff" strokeWidth="3.2" fill="none" />
        <rect x="16" y="283" width="18" height="4" rx="2" fill="#7a5a3a" />
        {/* tumpukan kertas revisi */}
        <rect x="92" y="296" width="26" height="8" fill="#fff" />
        <rect x="94" y="291" width="26" height="6" fill="#f1f1f1" transform="rotate(-4 107 294)" />
        <rect x="90" y="287" width="26" height="6" fill="#fff" transform="rotate(5 103 290)" />
      </g>
    </g>
  );
};

/* ---------- anatomi mahasiswa ---------- */
export const MOODS = {
  tired: {bo: 2, bi: -1, lid: 0.45, bags: true, mouth: 'flat'},
  yell: {bo: -4, bi: 4, lid: 0, bags: false, mouth: 'flat'},
  shock: {bo: -7, bi: -7, lid: 0, bags: false, mouth: 'o'},
  sad: {bo: 3, bi: -4, lid: 0.2, bags: true, mouth: 'frown'},
  blank: {bo: 0, bi: 0, lid: 0.15, bags: true, mouth: 'flat', pupil: 1.2},
  dream: {bo: -2, bi: -2, lid: 1, bags: false, mouth: 'smile'},
  /* video 2 */
  hope: {bo: -3, bi: -3, lid: 0, bags: true, mouth: 'smile', shine: true},
  doubt: {bo: 1, bi: 4, lid: 0.25, bags: true, mouth: 'flat'},
  awkward: {bo: -1, bi: -4, lid: 0.1, bags: true, mouth: 'smirk'},
  sly: {bo: -1, bi: 3, lid: 0.5, bags: true, mouth: 'smirk'},
};
export const POSE = {
  rest: [15, -25],
  limp: [6, 3],
  raised: [150, 35],
  slam: [20, -35],
  head: [130, 90],
  cheeks: [115, 110],
  fold: [25, -100],
};
export const armPts = (S0, s, a1, a2, L1 = 28, L2 = 26) => {
  const d1 = (a1 * Math.PI) / 180;
  const b = ((a1 + a2) * Math.PI) / 180;
  const E = [S0[0] + s * Math.sin(d1) * L1, S0[1] + Math.cos(d1) * L1];
  const H = [E[0] + s * Math.sin(b) * L2, E[1] + Math.cos(b) * L2];
  return {E, H};
};

export const Student = ({
  cx = 76, part = 'all', mood = 'tired', amp = 0, lean = 0, by = 0, tilt = 0, breath = 0, headDrop = 0,
  armL = POSE.rest, armR = POSE.rest, gaze = [0, 0], lid = null, sweat = false, tear = false, blush = 0,
  f = 0, legs = 0,
}) => {
  const m = MOODS[mood];
  const hy = 212;
  const sy = 252;
  const T = `translate(0 ${by}) rotate(${lean} ${cx} 300)`;
  const lidv = lid == null ? m.lid : lid;
  const closed = lidv > 0.95;
  const open = amp > 0.05;
  const eyeRy = Math.max(0.6, 5.6 * (1 - lidv));
  const bB = hy - 15;
  const eyeY = hy - 1;

  let mouth;
  if (open) {
    const o = Math.min(1, amp * 1.1);
    const big = mood === 'yell' || mood === 'sad';
    const rx = 6.8 - o * 1.4 + (mood === 'yell' ? 1.5 : 0);
    const ry = 1.3 + o * (big ? 9 : 6);
    mouth = (
      <g>
        <ellipse cx={cx} cy={hy + 12 + ry * 0.4} rx={rx} ry={ry} fill="#5a1a1a" />
        {ry > 4 && <ellipse cx={cx} cy={hy + 12 + ry * 0.9} rx={rx * 0.6} ry={ry * 0.4} fill="#e07a7a" />}
      </g>
    );
  } else if (m.mouth === 'o') mouth = <ellipse cx={cx} cy={hy + 15} rx="3.5" ry="4.5" fill="#5a1a1a" />;
  else if (m.mouth === 'frown')
    mouth = <path d={`M${cx - 8} ${hy + 18} Q${cx} ${hy + 10} ${cx + 8} ${hy + 18}`} stroke={THUNDER} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  else if (m.mouth === 'smile')
    mouth = <path d={`M${cx - 9} ${hy + 11} Q${cx} ${hy + 24} ${cx + 9} ${hy + 11}`} stroke={THUNDER} strokeWidth="2.4" fill="#fff" strokeLinecap="round" />;
  else if (m.mouth === 'smirk')
    mouth = <path d={`M${cx - 8} ${hy + 14} Q${cx + 1} ${hy + 18} ${cx + 9} ${hy + 10}`} stroke={THUNDER} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  else mouth = <line x1={cx - 6} y1={hy + 14} x2={cx + 6} y2={hy + 14} stroke={THUNDER} strokeWidth="2.4" strokeLinecap="round" />;

  const eye = (sx) => {
    const ex = cx + sx * 11;
    if (closed)
      return mood === 'dream' ? (
        <path key={sx} d={`M${ex - 5} ${eyeY + 1} Q${ex} ${eyeY - 6} ${ex + 5} ${eyeY + 1}`} stroke={THUNDER} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <line key={sx} x1={ex - 5} y1={eyeY} x2={ex + 5} y2={eyeY} stroke={THUNDER} strokeWidth="2.2" strokeLinecap="round" />
      );
    return (
      <g key={sx}>
        <ellipse cx={ex} cy={eyeY} rx="5.4" ry={eyeRy} fill="#fff" />
        <circle cx={ex + gaze[0]} cy={eyeY + gaze[1] + (lidv > 0.3 ? 1 : 0)} r={m.pupil || 2.3} fill="#111" />
        {m.shine && <circle cx={ex + gaze[0] - 0.9} cy={eyeY + gaze[1] - 1} r="0.9" fill="#fff" />}
        {lidv > 0.3 && <path d={`M${ex - 5.6} ${eyeY - eyeRy} Q${ex} ${eyeY - eyeRy - 2} ${ex + 5.6} ${eyeY - eyeRy} L${ex + 5.6} ${eyeY - 6} L${ex - 5.6} ${eyeY - 6} Z`} fill={SKIN} />}
      </g>
    );
  };

  const body = (
    <g transform={T}>
      <rect x={cx - 36} y="232" width="72" height="76" rx="14" fill="#4a3f6b" />
      <g transform={`translate(${Math.sin(f * 1.6) * legs} 0)`}>
        <rect x={cx - 24} y="336" width="15" height="54" rx="4" fill="#2b2f4a" />
        <rect x={cx + 9} y="336" width="15" height="54" rx="4" fill="#2b2f4a" />
        <ellipse cx={cx - 15} cy="394" rx="11" ry="5" fill="#f5f5f5" />
        <ellipse cx={cx + 17} cy="394" rx="11" ry="5" fill="#f5f5f5" />
      </g>
      <g transform={`translate(0 ${headDrop * 14}) translate(0 ${sy}) scale(1 ${1 + breath - headDrop * 0.18}) translate(0 ${-sy})`}>
        <path d={`M${cx - 32} ${sy + 6} Q${cx - 33} ${sy - 5} ${cx - 20} ${sy - 6} L${cx + 20} ${sy - 6} Q${cx + 33} ${sy - 5} ${cx + 32} ${sy + 6} L${cx + 35} 320 L${cx - 35} 320 Z`} fill={GREEN} />
        <ellipse cx={cx} cy={sy - 6} rx="17" ry="6.5" fill="#2f7f00" />
        <line x1={cx - 6} y1={sy + 1} x2={cx - 7} y2={sy + 17} stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={cx + 6} y1={sy + 1} x2={cx + 7} y2={sy + 17} stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        <text x={cx} y={sy + 38} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" opacity=".9">✱</text>
      </g>
      <rect x={cx - 6} y={sy - 18} width="12" height="14" fill="#e3b88d" />
      <g transform={`translate(0 ${headDrop * 52}) rotate(${tilt + headDrop * 4} ${cx} ${sy - 12})`}>
        <circle cx={cx - 28} cy={hy + 2} r="5.5" fill={SKIN} />
        <circle cx={cx + 28} cy={hy + 2} r="5.5" fill={SKIN} />
        <circle cx={cx} cy={hy} r="28" fill={SKIN} />
        <path d={`M${cx - 29} ${hy - 4} Q${cx - 20} ${hy - 40} ${cx + 2} ${hy - 36} Q${cx + 26} ${hy - 38} ${cx + 29} ${hy - 4} Q${cx + 18} ${hy - 24} ${cx} ${hy - 22} Q${cx - 18} ${hy - 22} ${cx - 29} ${hy - 4}Z`} fill={THUNDER} />
        {m.bags && (
          <>
            <path d={`M${cx - 16} ${eyeY + 7} Q${cx - 11} ${eyeY + 10} ${cx - 6} ${eyeY + 7}`} stroke="#8a6aa8" strokeWidth="1.6" fill="none" />
            <path d={`M${cx + 6} ${eyeY + 7} Q${cx + 11} ${eyeY + 10} ${cx + 16} ${eyeY + 7}`} stroke="#8a6aa8" strokeWidth="1.6" fill="none" />
          </>
        )}
        {eye(-1)}
        {eye(1)}
        <line x1={cx - 17} y1={bB + m.bo} x2={cx - 5} y2={bB + m.bi} stroke={THUNDER} strokeWidth="2.6" strokeLinecap="round" />
        <line x1={cx + 5} y1={bB + m.bi} x2={cx + 17} y2={bB + m.bo} stroke={THUNDER} strokeWidth="2.6" strokeLinecap="round" />
        <ellipse cx={cx - 17} cy={hy + 8} rx="5.5" ry="3" fill="#ff7a90" opacity={0.25 + blush * 0.55} />
        <ellipse cx={cx + 17} cy={hy + 8} rx="5.5" ry="3" fill="#ff7a90" opacity={0.25 + blush * 0.55} />
        {mouth}
        {tear &&
          [-1, 1].map((sx) =>
            [0, 1, 2].map((k) => {
              const y = (f * 1.7 + k * 9) % 27;
              return <ellipse key={`${sx}${k}`} cx={cx + sx * 13} cy={eyeY + 5 + y} rx="1.8" ry="2.6" fill="#7fd0ff" opacity={1 - y / 27} />;
            }),
          )}
        {sweat && <path d={`M${cx + 25} ${hy - 20 + ((f * 0.5) % 14)} q-4 6 0 8 q4 -2 0 -8z`} fill="#8fdcff" />}
        {headDrop > 0.5 && (
          <g opacity={ease((headDrop - 0.55) / 0.25)}>
            <circle cx={cx} cy={hy} r="28.5" fill={THUNDER} />
            <path d={`M${cx - 16} ${hy - 10} Q${cx} ${hy - 22} ${cx + 16} ${hy - 10}`} stroke="#5a5557" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d={`M${cx} ${hy - 4} q8 6 0 12`} stroke="#5a5557" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </g>
  );

  const sL = [cx - 26, sy + 2];
  const sR = [cx + 26, sy + 2];
  const aL = armPts(sL, -1, armL[0], armL[1]);
  const aR = armPts(sR, 1, armR[0], armR[1]);
  const arms = (
    <g transform={`${T} translate(0 ${headDrop * 14})`}>
      {[[sL, aL], [sR, aR]].map(([s0, a], i) => (
        <g key={i}>
          <polyline points={`${s0[0]},${s0[1]} ${a.E[0]},${a.E[1]} ${a.H[0]},${a.H[1]}`} fill="none" stroke={GREEN} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={a.H[0]} cy={a.H[1]} r="5.8" fill={SKIN} />
        </g>
      ))}
    </g>
  );
  if (part === 'body') return body;
  if (part === 'arms') return arms;
  return (
    <>
      {body}
      {arms}
    </>
  );
};

/* ---------- laptop berwajah (ekspresi lengkap) ---------- */
export const LFACE = {
  neutral: {r: 6, lid: 0, brow: null, pupil: 2.6, mouth: 'line'},
  worried: {r: 6, lid: 0, brow: 'worried', pupil: 2.2, mouth: 'wave'},
  smug: {r: 6, lid: 0.42, brow: 'smug', pupil: 2.6, mouth: 'smirk'},
  shock: {r: 7, lid: 0, brow: 'up', pupil: 1.5, mouth: 'o'},
  angry: {r: 6, lid: 0, brow: 'angry', pupil: 2.6, mouth: 'frown'},
  sympathetic: {r: 6.6, lid: 0.1, brow: 'worried', pupil: 3.3, shine: true, mouth: 'pout'},
  excited: {r: 7, lid: 0, brow: 'up', pupil: 3.2, shine: true, mouth: 'grin'},
  sheepish: {r: 6, lid: 0.2, brow: 'worried', pupil: 2.4, mouth: 'wave'},
  smile: {arc: true, mouth: 'smile'},
  pain: {pain: true, mouth: 'wave'},
};

export const Laptop = ({
  x = 176, y = 304, s = 0.9, rot = 0, face = 'neutral', gaze = [0, 0], screen = '#1d2b3a', amp = 0, blink = false,
  armL = null, armR = null, armGrow = 1, sweat = false, children,
}) => {
  const Fc = LFACE[face];
  const w = 130 * s;
  const h = 88 * s;
  const ey = -h / 2 - 8 * s;
  const my = -h / 2 + 16 * s;
  const eyes = [-1, 1].map((sd, i) => {
    const ex = sd * 20 * s;
    if (Fc.arc)
      return <path key={i} d={`M${ex - 6 * s} ${ey + 2 * s} Q${ex} ${ey - 6 * s} ${ex + 6 * s} ${ey + 2 * s}`} stroke="#fff" strokeWidth={3 * s} fill="none" strokeLinecap="round" />;
    if (Fc.pain) {
      const d = i === 0 ? 1 : -1;
      return <path key={i} d={`M${ex - 5 * s * d} ${ey - 5 * s} L${ex + 4 * s * d} ${ey} L${ex - 5 * s * d} ${ey + 5 * s}`} stroke="#fff" strokeWidth={2.6 * s} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    }
    const R = Fc.r * s;
    const maxOff = R - Fc.pupil * s - 0.5 * s;
    const gx = Math.max(-1, Math.min(1, gaze[0] / 3.2)) * maxOff;
    const gy = Math.max(-1, Math.min(1, gaze[1] / 3.2)) * maxOff;
    const lidH = 2 * R * Fc.lid;
    const by0 = ey - R - 5 * s;
    let brow = null;
    if (Fc.brow === 'worried') brow = sd < 0 ? [ex - 7, by0 + 3, ex + 7, by0 - 3] : [ex - 7, by0 - 3, ex + 7, by0 + 3];
    if (Fc.brow === 'up') brow = [ex - 7, by0 - 3, ex + 7, by0 - 3];
    if (Fc.brow === 'angry') brow = sd < 0 ? [ex - 8, by0 - 2, ex + 8, by0 + 4] : [ex - 8, by0 + 4, ex + 8, by0 - 2];
    if (Fc.brow === 'smug') brow = sd < 0 ? [ex - 7, by0 + 4, ex + 7, by0 + 4] : [ex - 7, by0 - 1, ex + 7, by0 - 6];
    return (
      <g key={i}>
        <ellipse cx={ex} cy={ey} rx={R} ry={blink ? 0.8 * s : R} fill="#fff" />
        {!blink && <circle cx={ex + gx} cy={ey + gy} r={Fc.pupil * s} fill="#000" />}
        {!blink && Fc.shine && <circle cx={ex + gx - 0.9 * s} cy={ey + gy - 0.9 * s} r={0.9 * s} fill="#fff" />}
        {!blink && Fc.lid > 0 && (
          <>
            <rect x={ex - R - 0.5} y={ey - R - 0.5} width={2 * R + 1} height={lidH + 0.5} fill={screen} />
            <line x1={ex - R} y1={ey - R + lidH} x2={ex + R} y2={ey - R + lidH} stroke="#fff" strokeWidth={1.6 * s} strokeLinecap="round" />
          </>
        )}
        {brow && <line x1={brow[0] * 1} y1={brow[1]} x2={brow[2] * 1} y2={brow[3]} stroke="#fff" strokeWidth={2.4 * s} strokeLinecap="round" />}
      </g>
    );
  });
  const stroke = {stroke: '#fff', strokeWidth: 3 * s, fill: 'none', strokeLinecap: 'round'};
  let mouth;
  if (amp > 0.05) mouth = <ellipse cx="0" cy={my} rx={(11 - amp * 2) * s} ry={(1.5 + Math.min(1, amp * 1.1) * 8) * s} fill="#fff" />;
  else if (Fc.mouth === 'smile') mouth = <path d={`M${-14 * s} ${my - 4 * s} Q0 ${my + 10 * s} ${14 * s} ${my - 4 * s}`} {...stroke} />;
  else if (Fc.mouth === 'frown') mouth = <path d={`M${-14 * s} ${my + 4 * s} Q0 ${my - 6 * s} ${14 * s} ${my + 4 * s}`} {...stroke} strokeLinecap="butt" />;
  else if (Fc.mouth === 'pout') mouth = <path d={`M${-7 * s} ${my + 3 * s} Q0 ${my - 3 * s} ${7 * s} ${my + 3 * s}`} {...stroke} />;
  else if (Fc.mouth === 'o') mouth = <ellipse cx="0" cy={my + 1 * s} rx={3.8 * s} ry={4.6 * s} fill="#fff" />;
  else if (Fc.mouth === 'grin') mouth = <path d={`M${-13 * s} ${my - 3 * s} Q0 ${my + 15 * s} ${13 * s} ${my - 3 * s} Z`} fill="#fff" />;
  else if (Fc.mouth === 'smirk') mouth = <path d={`M${-10 * s} ${my + 1 * s} Q${2 * s} ${my + 3 * s} ${11 * s} ${my - 3 * s}`} {...stroke} />;
  else if (Fc.mouth === 'wave')
    mouth = <path d={`M${-12 * s} ${my} q${3 * s} ${-4 * s} ${6 * s} 0 t${6 * s} 0 t${6 * s} 0 t${6 * s} 0`} {...stroke} strokeWidth={2.4 * s} />;
  else mouth = <line x1={-12 * s} y1={my} x2={12 * s} y2={my} {...stroke} />;

  const armsOut = [[armL, -1], [armR, 1]].map(([a, sd], i) => {
    if (!a || armGrow <= 0.01) return null;
    const S0 = [sd * (w / 2 + 1), -h * 0.35];
    const {E, H} = armPts(S0, sd, a[0], a[1], (13 * s + 3) * armGrow, (12 * s + 3) * armGrow);
    return (
      <g key={i}>
        <polyline points={`${S0[0]},${S0[1]} ${E[0]},${E[1]} ${H[0]},${H[1]}`} fill="none" stroke="#555" strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={H[0]} cy={H[1]} r={4.6 * Math.min(1, armGrow)} fill="#fff" stroke="#999" strokeWidth="1" />
      </g>
    );
  });

  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {armsOut}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={8 * s} fill={THUNDER} />
      <rect x={-w / 2 + 6 * s} y={-h + 6 * s} width={w - 12 * s} height={h - 12 * s} rx={4 * s} fill={screen} />
      {eyes}
      {mouth}
      {sweat && <path d={`M${w / 2 - 14 * s} ${-h + 14 * s} q${-4 * s} ${6 * s} 0 ${9 * s} q${4 * s} ${-3 * s} 0 ${-9 * s}z`} fill="#8fdcff" />}
      {children}
      <rect x={-w / 2 - 10 * s} y="0" width={w + 20 * s} height={8 * s} rx={3 * s} fill="#555" />
    </g>
  );
};

/* ---------- elemen lucu ---------- */
export const Big = ({t, y, size = 20, fill = '#ffd400', stroke = '#000', scale = 1, rot = 0}) => (
  <text x="135" y={y} textAnchor="middle" fontSize={size} fontWeight="700" fill={fill} stroke={stroke} strokeWidth="1" paintOrder="stroke"
    transform={`translate(135 ${y}) rotate(${rot}) scale(${scale}) translate(-135 ${-y})`}>
    {t}
  </text>
);
export const Vignette = ({o}) => (
  <>
    <defs>
      <radialGradient id="vig" cx="50%" cy="50%" r="65%">
        <stop offset="45%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
      </radialGradient>
    </defs>
    <rect x="-40" y="-40" width="350" height="560" fill="url(#vig)" opacity={o} />
  </>
);

const Cricket = ({tx, ty, delay, f, size = 1}) => {
  const p = Math.min(1, Math.max(0, (f - delay) / 18));
  if (f < delay) return null;
  const x = lerp(300, tx, ease(p));
  const y = ty - Math.sin(p * Math.PI) * 30;
  const idle = p >= 1 ? Math.sin((f - delay) * 0.9) * 1.2 : 0;
  const k = Math.floor((f - delay - 18) / 9);
  const showK = p >= 1 && k >= 0 && (k + Math.round(tx)) % 2 === 0;
  return (
    <g transform={`translate(${x} ${y + idle}) scale(${size})`}>
      <path d="M-5 0 L-11 -6 L-8 2" stroke="#4b6a1a" strokeWidth="1.4" fill="none" />
      <path d="M5 0 L11 -6 L8 2" stroke="#4b6a1a" strokeWidth="1.4" fill="none" />
      <path d="M5 -6 L10 -13 M7 -6 L14 -10" stroke="#4b6a1a" strokeWidth=".9" fill="none" />
      <ellipse cx="0" cy="-3" rx="8" ry="4.6" fill="#7bb02a" />
      <circle cx="6" cy="-6" r="3.4" fill="#7bb02a" />
      <circle cx="7" cy="-6.5" r="1.1" fill="#fff" />
      <circle cx="7.3" cy="-6.5" r=".5" fill="#000" />
      {showK && (
        <g transform="translate(0 -20)">
          <rect x="-13" y="-8" width="26" height="12" rx="6" fill="#fff" stroke="#999" strokeWidth=".8" />
          <text x="0" y="1" textAnchor="middle" fontSize="6.5" fontWeight="600" fill={THUNDER}>krik!</text>
        </g>
      )}
    </g>
  );
};

const Thought = ({f}) => {
  const p = sp(f, 0, {damping: 9});
  const circles = [[124, 150, 20], [152, 132, 26], [186, 126, 26], [218, 134, 24], [234, 156, 17], [210, 174, 20], [174, 178, 22], [142, 174, 20]];
  const confetti = Array.from({length: 14}, (_, i) => {
    const x = 134 + ((i * 37) % 96);
    const y = 104 + ((f * 1.2 + i * 17) % 84);
    return <rect key={i} x={x} y={y} width="3" height="3" fill={['#44AA00', '#ffd400', '#ff6b6b', '#6ec6ff'][i % 4]} transform={`rotate(${f * 6 + i * 20} ${x} ${y})`} />;
  });
  return (
    <g transform={`translate(98 190) scale(${p * 0.88}) translate(-112 -190)`}>
      <circle cx="104" cy="197" r="3.8" fill="#fff" stroke="#cfd8dc" strokeWidth="1" />
      <circle cx="110" cy="188" r="5.5" fill="#fff" stroke="#cfd8dc" strokeWidth="1" />
      {circles.map(([x, y, r], i) => <circle key={`s${i}`} cx={x} cy={y} r={r + 1.6} fill="#cfd8dc" />)}
      {circles.map(([x, y, r], i) => <circle key={`f${i}`} cx={x} cy={y} r={r} fill="#fff" />)}
      <text x="180" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill={GREEN}>WISUDA!</text>
      {confetti}
      <g transform={`translate(142 ${136 - Math.abs(Math.sin(f * 0.15)) * 6}) rotate(${-16 + Math.sin(f * 0.2) * 8})`}>
        <polygon points="-8,0 0,-4 8,0 0,4" fill="#222" />
        <line x1="6" y1="0" x2="6" y2="7" stroke="#ffd400" strokeWidth="1" />
      </g>
      <g transform={`translate(0 ${Math.sin(f * 0.18) * 1.2})`}>
        <path d="M164 182 L168 156 L192 156 L196 182 Z" fill="#2a2a3a" />
        <circle cx="180" cy="148" r="9.5" fill={SKIN} />
        <polygon points="166,141 180,135 194,141 180,147" fill="#222" />
        <line x1="192" y1="141" x2="194" y2="150" stroke="#ffd400" strokeWidth="1.2" />
        <path d="M175 150 q2 -1.5 4 0 M181 150 q2 -1.5 4 0" stroke={THUNDER} strokeWidth="1" fill="none" />
        <path d="M175 153 Q180 158 185 153" stroke={THUNDER} strokeWidth="1.2" fill="#fff" />
        <rect x="174" y="162" width="14" height="10" rx="1.5" fill={GREEN} />
        <path d="M178 165 q2 2 4 0" stroke="#fff" strokeWidth="1" fill="none" />
        <g transform="rotate(-20 200 166)">
          <rect x="196" y="160" width="14" height="5" rx="2.5" fill="#fff" stroke="#ddd" strokeWidth=".6" />
          <rect x="201" y="159.5" width="2.5" height="6" fill="#ff3b3b" />
        </g>
      </g>
    </g>
  );
};

const Steam = ({f}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const t = ((f * 1.4 + i * 14) % 42) / 42;
      return <circle key={i} cx={150 + i * 24 + Math.sin(f * 0.3 + i) * 3} cy={178 - t * 40} r={3 + t * 5} fill="#fff" opacity={0.55 * (1 - t)} />;
    })}
  </g>
);

/* ---------- 10 shot ---------- */
const Scene1 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {m} = useAmps(g);
  const lean = interpolate(f, [85, 125], [0, 5], clamp);
  return (
    <Cam fx={92} fy={236} sc={interpolate(f, [0, 135], [1.0, 1.4], clamp)}>
      <Backdrop f={f} />
      <Student part="body" mood="tired" amp={m} lean={lean} breath={Math.sin(f * 0.1) * 0.012} f={f} lid={f % 96 < 4 ? 1 : null} gaze={[3, 1]} />
      <DeskLayer />
      <Student part="arms" mood="tired" lean={lean} />
      <Laptop face={f < 24 ? 'neutral' : 'worried'} gaze={LG} rot={-2} blink={f % 110 < 4} sweat={f > 92} />
    </Cam>
  );
};

const Scene2 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {l} = useAmps(g);
  return (
    <Cam fx={170} fy={250} sc={interpolate(f, [0, 111], [1.3, 1.42], clamp)}>
      <Backdrop f={f} />
      <Student part="body" mood="tired" sweat f={f} gaze={[4, 1]} lid={f % 96 < 4 ? 1 : null} breath={Math.sin(f * 0.1) * 0.012} />
      <DeskLayer />
      <Student part="arms" mood="tired" />
      <Laptop face="smug" gaze={LG} amp={l} rot={-2 + Math.sin(f * 0.15) * 1.2} blink={f % 100 < 4}>
        <text x="-46" y={-9} fontSize="6" fill="#9fb3c8">BAB 3 — 0 kata {Math.floor(f / 15) % 2 === 0 ? '|' : ''}</text>
      </Laptop>
    </Cam>
  );
};

const Scene3 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {m} = useAmps(g);
  const up = ease(f / 6);
  const down = ease((f - 7) / 2.5);
  const poseA = f < 7 ? mixPose(POSE.rest, POSE.raised, up) : mixPose(POSE.raised, POSE.slam, down);
  const hit = f >= 9;
  const t = Math.max(0, f - 9);
  const jolt = hit ? 7 * Math.exp(-t * 0.22) * Math.abs(Math.cos(t * 0.8)) : 0;
  const k = shake(t, hit ? 6 : 0, 0.1);
  const lean = f < 7 ? interpolate(f, [0, 6], [0, -6], clamp) : hit ? 9 : 0;
  return (
    <>
      <Cam fx={110} fy={248} sc={interpolate(f, [0, 10, 52], [1.05, 1.25, 1.3], clamp)} x={k.x} y={k.y}>
        <Backdrop f={f} />
        <Student part="body" mood="yell" amp={m} lean={lean} legs={hit ? 2 : 0} f={f} />
        <DeskLayer jolt={jolt} />
        <Student part="arms" mood="yell" lean={lean} armL={poseA} armR={poseA} />
        {Array.from({length: 8}, (_, i) => {
          if (!hit) return null;
          const x = 104 + ((i * 13) % 20) + (i - 3.5) * 4 * t * 0.6;
          const y = 290 - (3.2 + (i % 3) * 0.9) * t * 2 + 0.16 * t * t;
          return <rect key={i} x={x} y={y} width="16" height="21" fill="#fff" opacity=".95" transform={`rotate(${t * (i % 2 ? 11 : -9)} ${x + 8} ${y + 10})`} />;
        })}
        <Laptop y={304 - jolt * 0.8 - (hit ? 6 * Math.exp(-t * 0.3) : 0)} rot={hit ? 4 * Math.exp(-t * 0.15) : -2} face={hit ? 'shock' : 'worried'} gaze={LG} sweat={hit && t > 4} />
      </Cam>
      {hit && <Big t="GILAK KAMU," y={124} size={19} scale={sp(f, 9)} rot={-3} />}
      {hit && <Big t="SKRIPSI?!" y={148} size={19} scale={sp(f, 13)} rot={2} />}
    </>
  );
};

const Scene4 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {l} = useAmps(g);
  const k = shake(f, 5, 0.1);
  const pop = sp(f, 0, {damping: 7, stiffness: 220});
  const hop = -Math.abs(Math.sin(f * 0.45)) * 7 * Math.exp(-f * 0.06) - pop * 6;
  return (
    <>
      <Cam fx={165} fy={250} sc={1.45} x={k.x} y={k.y}>
        <Backdrop f={f} />
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1="176" y1="250" x2={176 + Math.cos(i * 0.52 + f * 0.05) * 320} y2={250 + Math.sin(i * 0.52 + f * 0.05) * 320} stroke="#ff3b3b" strokeOpacity=".3" strokeWidth="2.5" />
        ))}
        <Student part="body" mood="shock" sweat lean={-7} legs={2} f={f} gaze={[4, 0]} />
        <DeskLayer />
        <Student part="arms" mood="shock" lean={-7} armL={POSE.cheeks} armR={POSE.cheeks} />
        <Steam f={f} />
        <Laptop y={304 + hop} s={0.95} face="angry" gaze={LG} screen="#8a1b1b" amp={l} rot={Math.sin(f * 0.9) * 2} />
      </Cam>
      <Big t="KAMU YANG GILAK!" y={122} size={17} fill="#ff6b6b" scale={sp(f, 1)} rot={-3} />
    </>
  );
};

const Scene5 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {m} = useAmps(g);
  /* kalender: 2026 -> 2022 saat "empat tahun", lalu kembali ke 2026 */
  let cal = {digit: '6', roll: null};
  if (f >= 14 && f < 20) cal = {digit: '6', roll: {from: '6', to: '2', p: (f - 14) / 6}};
  else if (f >= 20 && f < 46) cal = {digit: '2', roll: null};
  else if (f >= 46 && f < 52) cal = {digit: '2', roll: {from: '2', to: '6', p: (f - 46) / 6}};
  const despair = ease((f - 84) / 14);
  const armPose = mixPose(POSE.head, POSE.limp, despair);
  const jitter = (1 - despair) * Math.sin(f * 1.7) * 1.6;
  const sym = f < 84;
  return (
    <>
      <Cam fx={118} fy={262} sc={interpolate(f, [0, 132], [1.2, 1.3], clamp)} x={jitter}>
        <Backdrop f={f} cal={cal} />
        <Student part="body" mood={despair > 0.5 ? 'blank' : 'sad'} amp={despair > 0.5 ? 0 : m} tear={despair < 0.5} lean={lerp(0, 4, despair)}
          by={despair * 8} tilt={despair * 12} legs={(1 - despair) * 3} f={f} gaze={[0, despair * 3]} />
        <DeskLayer />
        <Student part="arms" mood="sad" lean={lerp(0, 4, despair)} by={despair * 8} armL={armPose} armR={armPose} />
        <Laptop face={sym ? 'sympathetic' : 'sheepish'} gaze={sym ? LG : [Math.sin(f * 0.2) * 2, 2.8]} rot={sym ? -4 + Math.sin(f * 0.1) * 1.5 : 0}
          blink={f % 90 < 4} sweat={!sym && f > 100} />
        <Vignette o={ease((f - 80) / 25) * 0.8} />
        <Cricket tx={64} ty={316} delay={92} f={f} size={1.3} />
        <Cricket tx={122} ty={318} delay={100} f={f} size={1.3} />
        <Cricket tx={206} ty={318} delay={108} f={f} size={1.3} />
      </Cam>
      {f > 108 && <Big t="krik… krik…" y={128} size={15} fill="#fff" stroke="#000" scale={sp(f, 108)} />}
    </>
  );
};

const Scene6 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {l} = useAmps(g);
  const drop = sp(f, 0, {damping: 9});
  const shock = ease((f - 14) / 12);
  const excited = f < 22;
  const hop = excited ? -Math.abs(Math.sin(f * 0.5)) * 5 : 0;
  return (
    <Cam fx={128} fy={240} sc={interpolate(f, [0, 132], [1.15, 1.28], clamp)}>
      <Backdrop f={f} />
      <Student part="body" mood={shock > 0.5 ? 'shock' : 'blank'} sweat={shock > 0.5} gaze={[4, -1]} f={f} legs={shock * 2} />
      <DeskLayer />
      <Student part="arms" mood="tired" armL={mixPose(POSE.rest, POSE.cheeks, shock)} armR={mixPose(POSE.rest, POSE.cheeks, shock)} />
      <Laptop y={304 + hop} face={excited ? 'excited' : 'sheepish'} gaze={excited ? LUP : LG} amp={l} blink={!excited && f % 100 < 4} sweat={!excited && f > 40}
        rot={excited ? Math.sin(f * 0.6) * 2 : -2} />
      <g transform={`translate(${176} ${200 + (1 - drop) * -90})`} opacity={Math.min(1, drop * 2)}>
        <rect x="-62" y="-10" width="124" height="52" rx="8" fill="#fff" />
        <text x="-52" y="6" fontSize="7" fontWeight="600" fill={THUNDER}>✉ Dosen Pembimbing</text>
        <text x="-52" y="22" fontSize="9" fontWeight="700" fill="#d33">Revisi Bab 1–5 (ke-7)</text>
        <text x="-52" y="35" fontSize="6.5" fill="#777">Mohon diperbaiki sebelum...</text>
        <path d="M-6 42 L6 42 L0 50 Z" fill="#fff" />
      </g>
    </Cam>
  );
};

const Scene7 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {m} = useAmps(g);
  const pose =
    f < 12 ? mixPose(POSE.rest, POSE.raised, ease(f / 8)) : f < 30 ? mixPose(POSE.raised, POSE.slam, ease((f - 12) / 3)) : mixPose(POSE.slam, POSE.limp, ease((f - 30) / 14));
  const tiredT = ease((f - 36) / 14);
  const dropT = Math.min(1.08, sp(f, 112, {damping: 13, stiffness: 140}));
  const t1 = Math.max(0, f - 14);
  const t2 = Math.max(0, f - 121);
  const jolt = (f >= 14 ? 5 * Math.exp(-t1 * 0.25) * Math.abs(Math.cos(t1 * 0.8)) : 0) + (f >= 121 ? 9 * Math.exp(-t2 * 0.22) * Math.abs(Math.cos(t2 * 0.7)) : 0);
  const k1 = shake(t1, f >= 14 && f < 40 ? 4 : 0, 0.12);
  const k2 = shake(t2, f >= 121 ? 5 : 0, 0.15);
  const stamp = sp(f, 16, {damping: 8, stiffness: 220});
  const mood = f < 40 ? 'yell' : f < 58 ? 'tired' : f < 110 ? 'sad' : 'blank';
  const lface = f < 45 ? 'pain' : f < 112 ? 'sympathetic' : 'worried';
  return (
    <Cam fx={135} fy={240} sc={interpolate(f, [0, 132], [1.0, 1.06], clamp)} x={k1.x + k2.x} y={k1.y + k2.y}>
      <Backdrop f={f} />
      <Student part="body" mood={mood} amp={mood === 'blank' ? 0 : m} tear={mood === 'sad'} gaze={mood === 'sad' ? [0, -2.6] : [0, 0]}
        lean={tiredT * 3} by={tiredT * 4} tilt={mood === 'sad' ? -5 : 0} headDrop={dropT} lid={f >= 110 ? 1 : null}
        sweat={f >= 40 && f < 58} legs={f < 40 ? 2 : 0} f={f} breath={Math.sin(f * 0.1) * 0.012} />
      <DeskLayer jolt={jolt} />
      <Student part="arms" mood="tired" lean={tiredT * 3} by={tiredT * 4} headDrop={dropT} armL={mixPose(pose, POSE.fold, Math.min(1, dropT))} armR={mixPose(pose, POSE.fold, Math.min(1, dropT))} />
      <Laptop y={304 - jolt * 0.8} face={lface} gaze={LG} sweat={f < 45 || f >= 112} rot={lface === 'worried' ? -4 : -2}>
        {f >= 16 && (
          <g transform={`translate(0 -36) rotate(-9) scale(${stamp})`}>
            <rect x="-30" y="-9" width="60" height="18" rx="4" fill="rgba(255,255,255,.12)" stroke="#ff3b3b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ff3b3b">REVISI KE-7</text>
          </g>
        )}
      </Laptop>
      {f >= 58 && f < 108 && <Thought f={f - 58} />}
      {f >= 122 && (
        <text x="112" y="182" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="0.8" paintOrder="stroke"
          transform={`translate(112 182) scale(${sp(f, 122)}) rotate(${Math.sin(f * 0.4) * 3}) translate(-112 -182)`}>hadeeeh…</text>
      )}
      {f >= 108 && f < 116 && (
        <g transform={`translate(190 150) scale(${1 + (f - 108) * 0.12})`} opacity={1 - (f - 108) / 8}>
          {Array.from({length: 8}, (_, i) => (
            <line key={i} x1={Math.cos(i * 0.785) * 24} y1={Math.sin(i * 0.785) * 18} x2={Math.cos(i * 0.785) * 36} y2={Math.sin(i * 0.785) * 28} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          ))}
        </g>
      )}
    </Cam>
  );
};

const Scene8 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {l} = useAmps(g);
  const r = interpolate(f, [12, 46], [0, 440], clamp);
  const happy = f > 22;
  const rise = ease((f - 40) / 34);
  const down = 1 - rise;
  const breath = f > 74 ? Math.sin((f - 74) * 0.14) * 0.03 : 0;
  const grow = sp(f, 16, {damping: 9});
  const pat = f > 28 ? Math.sin((f - 28) * 0.4) * 10 : 0;
  return (
    <Cam fx={130} fy={250} sc={1.1}>
      <Backdrop f={f} />
      <g clipPath="url(#reveal)"><Backdrop day f={f} /></g>
      <clipPath id="reveal"><circle cx="150" cy="230" r={r} /></clipPath>
      <Student part="body" mood="tired" lean={3 * down} by={4 * down} headDrop={down} breath={breath} f={f}
        lid={down > 0.3 ? 1 : f % 96 < 4 ? 1 : null} gaze={[3, 0]} />
      <DeskLayer />
      <g clipPath="url(#reveal)"><DeskLayer day /></g>
      <Student part="arms" mood="tired" lean={3 * down} by={4 * down} headDrop={down} armL={mixPose(POSE.limp, POSE.fold, down)} armR={mixPose(POSE.limp, POSE.fold, down)} />
      <Laptop x={176} y={304} s={0.9} rot={happy ? -5 : -2} face={happy ? 'smile' : 'sympathetic'} gaze={LG}
        screen={happy ? '#2f5d1a' : '#1d2b3a'} amp={l} armGrow={grow} armL={[105 + pat, 10]} armR={[25, 20]} />
      {f < 28 && (
        <text x="0" y="0" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="0.8" paintOrder="stroke"
          opacity={1 - f / 28} transform={`translate(112 ${182 - f * 0.4}) rotate(${Math.sin(f * 0.4) * 3})`}>hadeeeh…</text>
      )}
    </Cam>
  );
};

const Scene9 = ({from}) => {
  const f = useCurrentFrame();
  const g = f + from;
  const {l} = useAmps(g);
  const a = sp(f, 63);
  const b = sp(f, 158);
  const pointA = f > 56 && f < 154 ? Math.sin(f * 0.35) * 8 : 0;
  const pointB = f > 154 ? Math.sin(f * 0.35) * 8 : 0;
  const wob = f > 164 ? Math.sin((f - 164) * 0.5) * 2.4 * Math.exp(-(f - 164) * 0.015) : 0;
  const pulse = 1 + (f > 73 ? 0.022 * Math.sin((f - 73) * 0.2) : 0);
  const lfAce = f > 158 ? 'sympathetic' : 'smile';
  return (
    <Cam>
      <rect x="-40" y="-40" width="350" height="560" fill="#F9FDF7" />
      {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <rect x="-40" y="336" width="350" height="160" fill="#e6f4dc" />
      <g transform={`translate(0 ${Math.sin(f * 0.1) * 1.5})`}>
        <Laptop x={127} y={186} s={0.78} face={lfAce} gaze={f > 158 ? [2.8, 2.8] : [-2.6, 2.6]} screen="#2f5d1a" amp={l}
          armL={[40 + (a > 0.1 ? pointA : 0), -8]} armR={[40 + pointB, -8]} />
      </g>
      <g transform={`translate(69 258) scale(${a * pulse}) translate(-69 -258)`} opacity={Math.min(1, a * 2)}>
        <rect x="16" y="202" width="106" height="112" rx="12" fill="#fff" stroke={GREEN} strokeWidth="3" />
        <circle cx="32" cy="218" r="9" fill={GREEN} />
        <text x="32" y="222" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">A</text>
        <image href={staticFile('logo-color.png')} x="26" y="236" width="86" height="25.2" />
        <text x="69" y="284" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={THUNDER}>Konsultasi dulu</text>
        <text x="69" y="298" textAnchor="middle" fontSize="8" fill="#5b5859">via WhatsApp</text>
        {f > 73 && <text x="112" y="214" fontSize="10" fill={GREEN} transform={`rotate(${f * 4} 112 211)`}>✱</text>}
      </g>
      <g transform={`translate(185 258) rotate(${wob}) scale(${b}) translate(-185 -258)`} opacity={Math.min(1, b * 2)}>
        <rect x="132" y="202" width="106" height="112" rx="12" fill="#e3e3e3" />
        <circle cx="148" cy="218" r="9" fill={THUNDER} />
        <text x="148" y="222" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">B</text>
        <clipPath id="bface"><rect x="148" y="222" width="74" height="52" /></clipPath>
        <g clipPath="url(#bface)">
          <g transform="translate(185 252) scale(.42) translate(-76 -250)">
            <Student part="body" cx={76} mood="sad" sweat tear f={f} lid={null} />
          </g>
        </g>
        <text x="185" y="284" textAnchor="middle" fontSize="9" fontWeight="700" fill={THUNDER}>Lanjut nganggurin</text>
        <text x="185" y="298" textAnchor="middle" fontSize="9" fontWeight="700" fill={THUNDER}>skripsi</text>
      </g>
    </Cam>
  );
};

export const Shape = ({type, x, y, size, color, rot}) => {
  const t = `translate(${x} ${y}) rotate(${rot})`;
  if (type === 'asterisk') return <text transform={t} fontSize={size} fill={color} fontWeight="700" textAnchor="middle">✱</text>;
  if (type === 'cross') return <text transform={t} fontSize={size} fill={color} fontWeight="700" textAnchor="middle">✖</text>;
  if (type === 'hash') return <text transform={t} fontSize={size} fill={color} fontWeight="700" textAnchor="middle">#</text>;
  return <rect transform={t} x={-size / 3} y={-size / 3} width={size * 0.66} height={size * 0.66} fill={color} />;
};

const Scene10 = () => {
  const f = useCurrentFrame();
  const bounce = Math.sin(f * 0.25) * 3;
  const shine = ((f - 26) % 60) / 60;
  const pill = (delay) => sp(f, delay, {damping: 8, stiffness: 190});
  const shapes = [
    ['asterisk', 14, 130, 20, GREEN, 1], ['cross', 250, 100, 16, THUNDER, -1], ['hash', 12, 232, 16, THUNDER, 1],
    ['diamond', 252, 214, 18, GREEN, -1], ['asterisk', 18, 326, 14, THUNDER, -1], ['cross', 250, 150, 12, GREEN, 1],
  ];
  return (
    <Cam>
      <rect x="-40" y="-40" width="350" height="560" fill="#F9FDF7" />
      {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <rect x="-40" y="336" width="350" height="160" fill="#e6f4dc" />
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
        <text x="68" y="168" fontSize="10.5" fontWeight="700" fill="#fff">Konsultasi dulu ke Jokoding</text>
        <clipPath id="pillA"><rect x="24" y="142" width="212" height="44" rx="22" /></clipPath>
        <g clipPath="url(#pillA)">
          <rect x={lerp(-20, 260, shine)} y="130" width="22" height="70" fill="#fff" opacity=".28" transform={`rotate(20 ${lerp(-20, 260, shine)} 164)`} />
        </g>
      </g>
      <g transform={`translate(130 212) scale(${pill(26)}) translate(-130 -212)`}>
        <rect x="24" y="190" width="212" height="44" rx="22" fill="#fff" stroke={THUNDER} strokeWidth="2" />
        <circle cx="48" cy="212" r="12" fill={THUNDER} />
        <text x="48" y="217" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">B</text>
        <text x="68" y="216" fontSize="10.5" fontWeight="700" fill={THUNDER}>Lanjut nganggurin skripsi</text>
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
    </Cam>
  );
};

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9, Scene10];

/* ---------- overlay: judul, logo, subtitle ---------- */
const chunksFor = (text, max = 26) => {
  const out = [];
  let cur = [];
  text.split(' ').forEach((w) => {
    if (cur.length && cur.join(' ').length + w.length + 1 > max) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  });
  if (cur.length) out.push(cur);
  return out;
};

export const SubPill = ({words, s}) => {
  const width = Math.min(236, words.join(' ').length * 6.3 + 22);
  return (
    <g transform={`translate(135 335) scale(${s}) translate(-135 -335)`}>
      <rect x={135 - width / 2} y="322" width={width} height="26" rx="6" fill="rgba(0,0,0,.6)" />
      <text x="135" y="339.5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#ffd400">
        {words.map((w, i) => (
          <tspan key={i} fill={/jokoding/.test(w) ? '#6fd31f' : '#ffd400'}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </tspan>
        ))}
      </text>
    </g>
  );
};

const Subtitle = ({g}) => {
  for (const id of Object.keys(LINES)) {
    const L = LINES[id];
    const a = L.start * FPS;
    const len = L.dur * FPS;
    if (g < a - 1 || g >= a + len + 4) continue;
    if (L.words) {
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
    const chunks = chunksFor(L.text);
    const weights = chunks.map((c) => c.join(' ').length + 2);
    const total = weights.reduce((x, y) => x + y, 0);
    const pos = Math.min(0.999, Math.max(0, (g - a) / (len * 0.97)));
    let acc = 0;
    let idx = chunks.length - 1;
    let startFrac = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (pos < (acc + weights[i]) / total) {
        idx = i;
        startFrac = acc / total;
        break;
      }
      acc += weights[i];
    }
    const local = g - (a + startFrac * len * 0.97);
    const s = interpolate(local, [0, 3], [0.88, 1], clamp);
    const words = chunks[idx];
    const width = Math.min(236, words.join(' ').length * 6.3 + 22);
    return (
      <g transform={`translate(135 335) scale(${s}) translate(-135 -335)`}>
        <rect x={135 - width / 2} y="322" width={width} height="26" rx="6" fill="rgba(0,0,0,.6)" />
        <text x="135" y="339.5" textAnchor="middle" fontSize="11" fontWeight="600" fill="#ffd400">
          {words.map((w, i) => (
            <tspan key={i} fill={/jokoding/.test(w) ? '#6fd31f' : '#ffd400'}>
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </tspan>
          ))}
        </text>
      </g>
    );
  }
  return null;
};

const Overlay = ({g}) => {
  const mint = interpolate(g, [766, 788], [0, 1], clamp);
  return (
    <svg viewBox="0 0 270 480" width="1080" height="1920" style={{position: 'absolute', inset: 0, fontFamily}}>
      <image href={staticFile('logo-light.png')} x="216" y="66" width="38" height="11.16" opacity={1 - mint} />
      <image href={staticFile('logo-color.png')} x="216" y="66" width="38" height="11.16" opacity={mint} />
      <Subtitle g={g} />
    </svg>
  );
};

/* ---------- cover Reels: frame diam di awal (adegan banting meja shot 3 + judul) ---------- */
export const COVER = 15; // 0,5 detik

const Cover = () => {
  const t = 11; // sesaat setelah meja dibanting
  const jolt = 7 * Math.exp(-t * 0.22) * Math.abs(Math.cos(t * 0.8));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg viewBox="0 0 270 480" width="1080" height="1920" style={{fontFamily}}>
        <Cam fx={115} fy={246} sc={1.42}>
          <Backdrop f={20} />
          <Student part="body" mood="yell" amp={0.9} lean={9} legs={2} f={20} />
          <DeskLayer jolt={jolt} />
          <Student part="arms" mood="yell" lean={9} armL={POSE.slam} armR={POSE.slam} />
          {[[48, 262, -20], [158, 250, 14], [40, 300, 25], [176, 290, -12]].map(([x, y, r], i) => (
            <rect key={i} x={x} y={y} width="16" height="21" fill="#fff" opacity=".95" transform={`rotate(${r} ${x + 8} ${y + 10})`} />
          ))}
          <Laptop y={304 - jolt * 0.8 - 6 * Math.exp(-t * 0.3)} rot={4 * Math.exp(-t * 0.15)} face="shock" gaze={LG} sweat />
        </Cam>
        <Vignette o={0.6} />
        <defs>
          <linearGradient id="coverFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.75" />
          </linearGradient>
        </defs>
        <rect x="0" y="290" width="270" height="190" fill="url(#coverFade)" />
        <Big t="SKRIPSI" y={343} size={36} rot={-3} />
        <Big t="vs AKU" y={373} size={30} fill="#fff" rot={2} />
        <image href={staticFile('logo-light.png')} x="216" y="66" width="38" height="11.16" />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- komposisi utama ---------- */
export const Video01 = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Sequence durationInFrames={COVER}>
      <Cover />
    </Sequence>
    <Sequence from={COVER}>
      <Main />
    </Sequence>
  </AbsoluteFill>
);

const Main = () => {
  const g = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <VoiceProvider>
        {SCENES.map((Scene, i) => (
          <Sequence key={i} from={S[i]} durationInFrames={S[i + 1] - S[i]}>
            <AbsoluteFill>
              <svg viewBox="0 0 270 480" width="1080" height="1920" style={{fontFamily}}>
                <Scene from={S[i]} />
              </svg>
            </AbsoluteFill>
          </Sequence>
        ))}
      </VoiceProvider>
      <Overlay g={g} />

      <Audio src={staticFile('music.wav')} volume={0.22} />
      {Object.keys(LINES).map((id) => (
        <Sequence key={id} from={F(LINES[id].start)}>
          <Audio src={staticFile(`audio/${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((e, i) => (
        <Sequence key={i} from={e.f}>
          <Audio src={staticFile(`sfx/${e.src}.wav`)} volume={e.v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
