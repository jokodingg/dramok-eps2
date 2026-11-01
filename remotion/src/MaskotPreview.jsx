import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Poppins';

const {fontFamily} = loadFont('normal', {weights: ['500', '700'], subsets: ['latin']});

/* Pratinjau 2 opsi maskot Jokoding (dari sketsa user di maskot/*.jpeg):
   kedua maskot memeragakan ekspresi + gerakan tangan yang sama secara bersamaan. */

const FPS = 30;
const GREEN = '#44AA00';
const GREEN_D = '#2E7A00';
const GREEN_L = '#7BDB2E';
const THUNDER = '#322F30';
const MINT = '#F9FDF7';
const SCREEN = '#262324';
export const GLOW = '#B9FF7A';
const YELLOW = '#ffd400';

export const SEG = 75; // 2.5 detik per ekspresi
export const SEGS = [
  {key: 'halo', label: 'Halo!', eyes: ['open', 'open'], mouth: 'grin', fx: []},
  {key: 'senang', label: 'Senang', eyes: ['happy', 'happy'], mouth: 'grin', fx: ['blush', 'sparkle']},
  {key: 'kaget', label: 'Kaget', eyes: ['big', 'big'], mouth: 'o', fx: ['exclaim']},
  {key: 'sedih', label: 'Sedih', eyes: ['sad', 'sad'], mouth: 'frown', fx: ['tear']},
  {key: 'marah', label: 'Marah', eyes: ['angry', 'angry'], mouth: 'shout', fx: ['steam'], glow: '#FF6B57'},
  {key: 'bingung', label: 'Bingung', eyes: ['open', 'squint'], mouth: 'wavy', fx: ['question']},
  {key: 'nunjuk', label: 'Menunjuk', eyes: ['open', 'open'], mouth: 'smile', fx: []},
  {key: 'jempol', label: 'Jempol', eyes: ['open', 'happy'], mouth: 'grin', fx: ['sparkle']},
];
export const MASKOT_FRAMES = SEG * SEGS.length;

/* ---------- util ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
const sp = (f, delay = 0, cfg = {}) =>
  f < delay ? 0 : spring({frame: f - delay, fps: FPS, config: {damping: 11, stiffness: 140, mass: 0.6, ...cfg}});
const add = (p, dx, dy) => ({x: p.x + dx, y: p.y + dy});
const mir = (p) => ({x: -p.x, y: p.y});

/* ---------- titik acuan tiap maskot (koordinat lokal) ---------- */
export const A1 = {
  hw: 200, top: -190,
  eyes: [[-75, 35], [65, 35]], eyeW: 34, eyeH: 50, rect: false,
  mouth: [-5, 62], mouthS: 1,
  restL: {x: -160, y: 228}, restR: {x: 160, y: 218},
  wave: {x: 238, y: -20}, up: {x: 228, y: -60}, cheek: {x: 228, y: 40}, low: {x: 100, y: 255},
  fist: {x: 215, y: 185}, chin: {x: 55, y: 150}, chinR: -25, point: {x: 228, y: -45}, pointR: 45,
  thumb: {x: 228, y: 85},
};
const A2 = {
  hw: 235, top: -245,
  eyes: [[-85, 35], [95, 35]], eyeW: 34, eyeH: 46, rect: true,
  mouth: [5, 100], mouthS: 1.8,
  restL: {x: -200, y: 445}, restR: {x: 200, y: 445},
  shoulderL: {x: -185, y: 265}, shoulderR: {x: 185, y: 265},
  wave: {x: 275, y: 10}, up: {x: 265, y: -40}, cheek: {x: 258, y: 95}, low: {x: 150, y: 470},
  fist: {x: 245, y: 395}, chin: {x: 85, y: 195}, chinR: 0, point: {x: 315, y: 120}, pointR: 0,
  thumb: {x: 250, y: 250},
};

/* ---------- gerak badan & tangan per ekspresi ---------- */
export const motion = (key, t) => {
  const m = {dx: 0, dy: 0, tilt: 0, headTilt: 0, sq: 0};
  switch (key) {
    case 'halo':
      m.dy = -Math.abs(Math.sin(t * 0.16)) * 8;
      m.tilt = 4 + Math.sin(t * 0.12) * 2;
      break;
    case 'senang': {
      const j = Math.abs(Math.sin(t * 0.2));
      m.dy = -j * 32;
      m.sq = j < 0.2 ? ((0.2 - j) / 0.2) * 0.07 : -j * 0.03;
      break;
    }
    case 'kaget':
      m.dy = t < 14 ? -46 * Math.sin((Math.PI * t) / 14) : 0;
      m.dx = t >= 14 ? Math.sin(t * 2.6) * 4 * Math.exp(-(t - 14) * 0.05) : 0;
      m.sq = t < 14 ? -0.05 : 0;
      m.headTilt = -3;
      break;
    case 'sedih':
      m.dy = 16 * ease(t / 15) + Math.sin(t * 0.08) * 2;
      m.headTilt = -7 * ease(t / 15) + Math.sin(t * 0.06) * 2;
      m.sq = 0.03 * ease(t / 15);
      break;
    case 'marah':
      m.dx = Math.sin(t * 2.9) * 3;
      m.dy = 6 + Math.cos(t * 3.3) * 2;
      m.sq = 0.04;
      break;
    case 'bingung':
      m.headTilt = 11 * ease(t / 12) + Math.sin(t * 0.1) * 2;
      m.dy = Math.sin(t * 0.1) * 3;
      break;
    case 'nunjuk':
      m.tilt = 6 * ease(t / 10);
      m.dx = 8 * ease(t / 10);
      m.dy = -Math.abs(Math.sin(t * 0.2)) * 4;
      break;
    case 'jempol':
      m.sq = (1 - sp(t, 0, {damping: 8})) * 0.08;
      m.dy = -Math.abs(Math.sin(t * 0.15)) * 6;
      break;
    default:
  }
  return m;
};

const H = (p, r = 0, shape = 'mitt') => ({x: p.x, y: p.y, r, shape});
export const handsOf = (key, t, A) => {
  const idle = (side) => add(side < 0 ? A.restL : A.restR, 0, Math.sin(t * 0.13 + (side < 0 ? 0 : 1.3)) * 5);
  let L = H(idle(-1));
  let R = H(idle(1));
  switch (key) {
    case 'halo':
      R = H(add(A.wave, 0, Math.sin(t * 0.3) * 6), Math.sin(t * 0.45) * 28 + 10);
      break;
    case 'senang': {
      const j = Math.abs(Math.sin(t * 0.2));
      L = H(add(mir(A.up), 0, -j * 14), -20);
      R = H(add(A.up, 0, -j * 14), 20);
      break;
    }
    case 'kaget': {
      const sx = t >= 14 ? Math.sin(t * 2.6) * 3 : 0;
      L = H(add(mir(A.cheek), sx, 0), 15);
      R = H(add(A.cheek, sx, 0), -15);
      break;
    }
    case 'sedih':
      L = H(add(mir(A.low), Math.sin(t * 0.1) * 3, 0), 15);
      R = H(add(A.low, -Math.sin(t * 0.1) * 3, 0), -15);
      break;
    case 'marah': {
      const k = Math.sin(t * 3.1) * 5;
      L = H(add(mir(A.fist), 0, k), 0, 'fist');
      R = H(add(A.fist, 0, -k), 0, 'fist');
      break;
    }
    case 'bingung':
      R = H(add(A.chin, 0, Math.sin(t * 0.5) * 4), A.chinR);
      break;
    case 'nunjuk':
      R = H(add(A.point, Math.max(0, Math.sin(t * 0.35)) * 10, 0), A.pointR, 'point');
      break;
    case 'jempol':
      R = H(add(A.thumb, 0, (1 - sp(t, 2)) * 40), 0, 'thumb');
      break;
    default:
  }
  return {L, R};
};

const mixHand = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), r: lerp(a.r, b.r, k), shape: k < 0.5 ? a.shape : b.shape});

export const pose = (f, A) => {
  const i = Math.min(SEGS.length - 1, Math.floor(f / SEG));
  const t = f - i * SEG;
  const seg = SEGS[i];
  let m = motion(seg.key, t);
  let hands = handsOf(seg.key, t, A);
  if (i > 0 && t < 10) {
    const k = ease(t / 10);
    const pm = motion(SEGS[i - 1].key, SEG);
    const ph = handsOf(SEGS[i - 1].key, SEG, A);
    m = Object.fromEntries(Object.keys(m).map((key) => [key, lerp(pm[key], m[key], k)]));
    hands = {L: mixHand(ph.L, hands.L, k), R: mixHand(ph.R, hands.R, k)};
  }
  const blink = Math.max(0.08, t < 6 ? Math.abs(t - 3) / 3 : t >= 44 && t < 50 ? Math.abs(t - 47) / 3 : 1);
  const open = seg.key === 'halo' && t > 6 && t < 50 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 0.5)) : 1;
  return {...m, hands, seg, t, blink, open, glow: seg.glow || GLOW};
};

/* ---------- wajah layar ---------- */
const Eye = ({x, y, w, h, kind, side, blink, color, rect, twitch = 0}) => {
  const sw = w * 0.32;
  if (kind === 'happy') {
    const d = rect
      ? `M ${x - w / 2} ${y + h * 0.15} L ${x} ${y - h * 0.3} L ${x + w / 2} ${y + h * 0.15}`
      : `M ${x - w / 2} ${y + h * 0.15} Q ${x} ${y - h * 0.6} ${x + w / 2} ${y + h * 0.15}`;
    return <path d={d} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (blink < 0.25) {
    return <line x1={x - w / 2} y1={y} x2={x + w / 2} y2={y} stroke={color} strokeWidth={sw * 0.7} strokeLinecap="round" />;
  }
  const big = kind === 'big';
  const ww = big ? w * 1.2 : w;
  const hh = (big ? h * 1.25 : h) * blink;
  const body = rect ? (
    <rect x={x - ww / 2} y={y - hh / 2} width={ww} height={hh} rx={ww * 0.18} fill={color} />
  ) : (
    <ellipse cx={x} cy={y} rx={ww / 2} ry={hh / 2} fill={color} />
  );
  /* kelopak: [bagian dalam, bagian luar] yang tertutup, pecahan dari tinggi mata */
  const lid = {sad: [0.1, 0.45], angry: [0.5, 0.1], squint: [0.45, 0.45]}[kind];
  let lidEl = null;
  if (kind === 'twitch') {
    /* mata datar setengah tertutup; twitch (0-1) = seberapa jauh kelopak atas & bawah menutup.
       Bentuk mata dipotong lewat clipPath (bukan ditimpa), supaya glow tidak memperlihatkan kotak penutup. */
    const xin = x - side * w * 0.8;
    const xout = x + side * w * 0.8;
    const top = y - hh / 2 + h * twitch;
    const bot = y + hh / 2 - h * twitch * 0.35;
    const id = `twitch${side}`;
    return (
      <g>
        <clipPath id={id}>
          <polygon points={`${xout},${top + h * 0.05} ${xin},${top - h * 0.03} ${xin},${bot} ${xout},${bot}`} />
        </clipPath>
        <g clipPath={`url(#${id})`}>{body}</g>
      </g>
    );
  }
  if (lid) {
    const xin = x - side * w * 0.8;
    const xout = x + side * w * 0.8;
    const yin = y - hh / 2 + h * lid[0];
    const yout = y - hh / 2 + h * lid[1];
    const b = h * 0.3;
    lidEl = (
      <g>
        <polygon points={`${xout},${yout} ${xin},${yin} ${xin},${y - h * 1.2} ${xout},${y - h * 1.2}`} fill={SCREEN} />
        <line x1={xout} y1={yout - b} x2={xin} y2={yin - b} stroke={color} strokeWidth={sw * 0.6} strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      {body}
      {big && <circle cx={x - ww * 0.18} cy={y - hh * 0.2} r={w * 0.13} fill="#fff" opacity={0.9} />}
      {big && (
        <path d={`M ${x - w * 0.5} ${y - hh / 2 - h * 0.25} Q ${x} ${y - hh / 2 - h * 0.5} ${x + w * 0.5} ${y - hh / 2 - h * 0.25}`}
          stroke={color} strokeWidth={sw * 0.55} fill="none" strokeLinecap="round" />
      )}
      {lidEl}
    </g>
  );
};

const Mouth = ({x, y, s, kind, open, color, rect}) => {
  const st = {stroke: color, strokeWidth: 5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round'};
  let el = null;
  switch (kind) {
    case 'smile':
      el = rect ? <rect x={-15} y={-5} width={30} height={10} rx={2} fill={color} /> : <path d="M -14 -3 Q 0 11 14 -3" {...st} />;
      break;
    case 'grin':
      el = (
        <path transform={`scale(1 ${open})`} fill={color}
          d={rect ? 'M -16 -6 L 16 -6 L 16 2 Q 16 12 6 12 L -6 12 Q -16 12 -16 2 Z' : 'M -16 -5 L 16 -5 Q 15 14 0 14 Q -15 14 -16 -5 Z'} />
      );
      break;
    case 'o':
      el = (
        <g>
          <ellipse cx={0} cy={2} rx={9} ry={12} fill={color} />
          <ellipse cx={0} cy={3} rx={4} ry={6} fill={SCREEN} />
        </g>
      );
      break;
    case 'frown':
      el = <path d="M -13 8 Q 0 -6 13 8" {...st} />;
      break;
    case 'shout':
      el = (
        <g transform={`scale(1 ${open})`}>
          <path d="M -17 -7 L 17 -7 L 12 13 L -12 13 Z" fill={color} strokeLinejoin="round" />
          <line x1={-14} y1={-1} x2={14} y2={-1} stroke={SCREEN} strokeWidth={3} />
        </g>
      );
      break;
    case 'flat':
      el = <line x1={-12} y1={2} x2={12} y2={2} {...st} />;
      break;
    case 'wavy':
      el = <path d="M -15 3 Q -8 -5 0 3 Q 8 11 15 3" {...st} />;
      break;
    default:
  }
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{el}</g>;
};

const Face = ({p, A}) => {
  const {seg} = p;
  return (
    <g filter="url(#glow)">
      {seg.fx.includes('blush') &&
        A.eyes.map(([x, y], k) => (
          <ellipse key={k} cx={x} cy={y + A.eyeH * 0.7} rx={A.eyeW * 0.6} ry={A.eyeW * 0.25} fill="#ff7aa8" opacity={0.55} />
        ))}
      {A.eyes.map(([x, y], k) => (
        <Eye key={k} x={x + (p.eyeShake ? p.eyeShake[k][0] : 0)} y={y + (p.eyeShake ? p.eyeShake[k][1] : 0)} w={A.eyeW} h={A.eyeH}
          kind={seg.eyes[k]} side={k === 0 ? -1 : 1} blink={p.blink} color={p.glow} rect={A.rect} twitch={p.twitch ? p.twitch[k] : 0} />
      ))}
      <Mouth x={A.mouth[0]} y={A.mouth[1]} s={A.mouthS} kind={seg.mouth} open={p.open} color={p.glow} rect={A.rect} />
    </g>
  );
};

/* ---------- efek di sekitar kepala ---------- */
const Star4 = ({x, y, r, fill}) => (
  <path transform={`translate(${x} ${y})`} fill={fill}
    d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`} />
);

const Fx = ({p, A, clipId}) => {
  const {seg, t} = p;
  const fin = Math.min(1, t / 6);
  return (
    <g opacity={fin}>
      {seg.fx.includes('tear') && (
        <g clipPath={`url(#${clipId})`}>
          {A.eyes.flatMap(([x, y], e) =>
            [0, 1, 2].map((k) => {
              const ph = (t * 0.04 + k / 3 + e * 0.15) % 1;
              return (
                <path key={`${e}-${k}`} transform={`translate(${x} ${y + A.eyeH * 0.45 + ph * 70})`} opacity={1 - ph}
                  d="M 0 -9 Q 7 0 7 4 A 7 7 0 0 1 -7 4 Q -7 0 0 -9 Z" fill="#7FD3FF" />
              );
            }),
          )}
        </g>
      )}
      {seg.fx.includes('steam') &&
        [-1, 1].flatMap((side) =>
          [0, 1].map((k) => {
            const ph = (t * 0.035 + k * 0.5 + (side > 0 ? 0.25 : 0)) % 1;
            return (
              <circle key={`${side}-${k}`} cx={side * (A.hw * 0.6 + ph * 30)} cy={A.top + 10 - ph * 90} r={14 + ph * 20}
                fill="#fff" stroke="#c9c9c9" strokeWidth={4} opacity={(1 - ph) * 0.9} />
            );
          }),
        )}
      {seg.fx.includes('question') && (
        <g transform={`translate(${A.hw * 0.75} ${A.top - 20 + Math.sin(t * 0.15) * 6}) scale(${sp(t, 4)}) rotate(12)`}>
          <text textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={96} fill={YELLOW}
            stroke={THUNDER} strokeWidth={6} paintOrder="stroke">?</text>
          <text x={-60} y={-30} textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={56} fill={YELLOW}
            stroke={THUNDER} strokeWidth={5} paintOrder="stroke" opacity={ease((t - 14) / 6)}>?</text>
        </g>
      )}
      {seg.fx.includes('exclaim') && (
        <g transform={`translate(${A.hw * 0.75} ${A.top - 10}) scale(${sp(t, 2, {damping: 7})}) rotate(10)`}>
          <text textAnchor="middle" fontFamily={fontFamily} fontWeight={700} fontSize={110} fill={YELLOW}
            stroke={THUNDER} strokeWidth={6} paintOrder="stroke">!</text>
        </g>
      )}
      {seg.fx.includes('sparkle') &&
        [[-A.hw - 30, A.top + 60], [A.hw + 25, A.top + 10], [A.hw * 0.25, A.top - 50]].map(([x, y], k) => (
          <Star4 key={k} x={x} y={y} r={22 * (0.55 + 0.45 * Math.sin(t * 0.3 + k * 2))} fill={YELLOW} />
        ))}
    </g>
  );
};

/* ---------- OPSI 1: kepala awan + visor, tangan oval, badan lengkung ---------- */
const HEAD1 =
  'M -188 132 L -195 -45 C -197 -120 -95 -132 -64 -70 C -58 -165 40 -205 115 -180 C 185 -160 205 -105 198 -40 L 192 128 Q 190 140 176 140 L -174 142 Q -188 142 -188 132 Z';
const BODY1 =
  'M -75 295 L -75 215 Q -75 165 -25 165 L 25 165 Q 75 165 75 215 L 75 295 L 30 295 L 30 258 Q 30 236 8 236 L -8 236 Q -30 236 -30 258 L -30 295 Z';

const Hand1 = ({h}) => {
  const fist = h.shape === 'fist';
  const nub = {fill: GREEN, stroke: THUNDER, strokeWidth: 5};
  return (
    <g transform={`translate(${h.x} ${h.y}) rotate(${h.r})`}>
      {h.shape === 'point' && <ellipse cx={0} cy={-42} rx={9} ry={22} {...nub} />}
      {h.shape === 'thumb' && <ellipse cx={-4} cy={-40} rx={10} ry={20} {...nub} />}
      <ellipse cx={0} cy={0} rx={fist ? 25 : 21} ry={fist ? 25 : 30} fill={GREEN} stroke={THUNDER} strokeWidth={6} />
      <path d={fist ? 'M -12 -12 Q -4 -18 4 -16' : 'M -10 -16 Q -6 -22 0 -23'} stroke={GREEN_L} strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
};

export const Maskot1 = ({p, f}) => {
  const headBob = Math.sin(f * 0.1) * 4;
  const bodySq = p.sq;
  return (
    <g transform={`translate(${p.dx} ${p.dy})`}>
      <g transform={`translate(0 295) scale(${1 + bodySq} ${1 - bodySq}) translate(0 -295)`}>
        <path d={BODY1} fill={GREEN_D} stroke={THUNDER} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -55 210 Q -55 185 -30 183" stroke={GREEN} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(0 ${headBob + bodySq * 60}) rotate(${p.tilt + p.headTilt} 0 100)`}>
        <path d={HEAD1} fill={GREEN} stroke={THUNDER} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -172 -30 C -172 -80 -140 -100 -108 -98" stroke={GREEN_L} strokeWidth={11} fill="none" strokeLinecap="round" />
        <path d="M 10 -150 C 40 -170 80 -172 110 -162" stroke={GREEN_L} strokeWidth={11} fill="none" strokeLinecap="round" />
        <clipPath id="clip1">
          <rect x={-150} y={-30} width={290} height={135} rx={26} />
        </clipPath>
        <rect x={-150} y={-30} width={290} height={135} rx={26} fill={SCREEN} stroke={THUNDER} strokeWidth={6} />
        <path d="M -128 -12 L -70 -12" stroke="#fff" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
        <Face p={p} A={A1} />
        <Fx p={p} A={A1} clipId="clip1" />
      </g>
      <Hand1 h={p.hands.L} />
      <Hand1 h={p.hands.R} />
    </g>
  );
};

/* ---------- OPSI 2: kepala awan + bintang, layar D, badan segitiga, lengan kapsul, alas melayang ---------- */
const HEAD2 =
  'M -225 60 C -250 -60 -200 -118 -150 -110 C -110 -105 -92 -90 -84 -70 C -70 -170 0 -210 68 -182 C 90 -250 200 -262 216 -150 C 232 -60 242 60 215 120 C 180 192 -170 200 -205 130 Z';
const FACE2 =
  'M -178 -22 L 186 -32 Q 200 -32 198 -12 C 195 118 110 166 5 166 C -100 166 -182 120 -192 0 Q -193 -22 -178 -22 Z';
const TORSO2 =
  'M -135 235 Q 0 220 140 235 Q 152 237 149 262 C 140 380 90 485 0 490 C -90 485 -140 380 -149 262 Q -151 237 -135 235 Z';
const BASE2 = 'M -85 640 C -92 572 -50 540 0 540 C 50 540 92 572 85 640 Q 0 654 -85 640 Z';

const Arm2 = ({h, S}) => {
  let vx = h.x - S.x;
  let vy = h.y - S.y;
  const len = Math.hypot(vx, vy) || 1;
  vx /= len;
  vy /= len;
  const L = 140;
  const ang = (Math.atan2(vy, vx) * 180) / Math.PI;
  const finger = (a, from, flen, key) => {
    const r = (a * Math.PI) / 180;
    const x1 = h.x + Math.cos(r) * from;
    const y1 = h.y + Math.sin(r) * from;
    const x2 = x1 + Math.cos(r) * flen;
    const y2 = y1 + Math.sin(r) * flen;
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={THUNDER} strokeWidth={24} strokeLinecap="round" />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={GREEN} strokeWidth={13} strokeLinecap="round" />
      </g>
    );
  };
  const base = ang + h.r;
  let fingers;
  if (h.shape === 'point') fingers = [finger(base - 35, 44, 3, 0), finger(base, 44, 44, 1), finger(base + 35, 44, 3, 2)];
  else if (h.shape === 'fist') fingers = [finger(base - 28, 42, 2, 0), finger(base, 42, 2, 1), finger(base + 28, 42, 2, 2)];
  else if (h.shape === 'thumb') fingers = [finger(base - 25, 42, 2, 0), finger(base + 25, 42, 2, 1), finger(-90, 40, 30, 2)];
  else fingers = [finger(base - 38, 44, 16, 0), finger(base, 46, 20, 1), finger(base + 38, 44, 16, 2)];
  const sx = h.x - vx * L;
  const sy = h.y - vy * L;
  return (
    <g>
      {fingers}
      <line x1={sx} y1={sy} x2={h.x} y2={h.y} stroke={THUNDER} strokeWidth={62} strokeLinecap="round" />
      <line x1={sx} y1={sy} x2={h.x} y2={h.y} stroke={GREEN} strokeWidth={49} strokeLinecap="round" />
      <line x1={sx - vy * 10} y1={sy + vx * 10} x2={lerp(sx, h.x, 0.5) - vy * 10} y2={lerp(sy, h.y, 0.5) + vx * 10}
        stroke={GREEN_L} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

const Maskot2 = ({p, f}) => {
  const headBob = Math.sin(f * 0.12) * 7;
  const torsoBob = Math.sin(f * 0.12 - 0.7) * 6;
  const baseBob = Math.sin(f * 0.12 - 1.4) * 5;
  const tw = 0.6 + 0.4 * Math.sin(f * 0.25);
  return (
    <g transform={`translate(${p.dx} ${p.dy * 1.3})`}>
      <g transform={`translate(0 ${baseBob})`}>
        {[0, 1, 2].map((k) => {
          const o = 0.3 + 0.7 * ((Math.sin(f * 0.3 - k * 1.2) + 1) / 2);
          const w = 70 - k * 14;
          const y = 690 + k * 32;
          return <path key={k} d={`M ${-w} ${y} Q 0 ${y + 22} ${w} ${y}`} stroke={THUNDER} strokeWidth={7} fill="none" strokeLinecap="round" opacity={o} />;
        })}
        <path d={BASE2} fill={GREEN_D} stroke={THUNDER} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -55 595 Q -45 565 -10 560" stroke={GREEN} strokeWidth={9} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(0 ${torsoBob}) rotate(${p.tilt * 0.5} 0 360) translate(0 490) scale(${1 + p.sq} ${1 - p.sq}) translate(0 -490)`}>
        <path d={TORSO2} fill={GREEN} stroke={THUNDER} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -110 268 C -108 340 -80 400 -45 440" stroke={GREEN_L} strokeWidth={11} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(0 ${headBob + p.sq * 80}) rotate(${p.tilt + p.headTilt} 0 150)`}>
        <path d={HEAD2} fill={GREEN} stroke={THUNDER} strokeWidth={8} strokeLinejoin="round" />
        <path d="M -205 0 C -215 -60 -190 -100 -150 -98" stroke={GREEN_L} strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d="M 105 -205 C 140 -228 180 -220 196 -180" stroke={GREEN_L} strokeWidth={12} fill="none" strokeLinecap="round" />
        <Star4 x={-12} y={-130} r={20 * tw + 6} fill={YELLOW} />
        <clipPath id="clip2">
          <path d={FACE2} />
        </clipPath>
        <path d={FACE2} fill={SCREEN} stroke={THUNDER} strokeWidth={6} strokeLinejoin="round" />
        <path d="M -160 -6 L -90 -8" stroke="#fff" strokeOpacity={0.14} strokeWidth={7} strokeLinecap="round" />
        <Face p={p} A={A2} />
        <Fx p={p} A={A2} clipId="clip2" />
      </g>
      <g transform={`translate(0 ${torsoBob})`}>
        <Arm2 h={p.hands.L} S={A2.shoulderL} />
        <Arm2 h={p.hands.R} S={A2.shoulderR} />
      </g>
    </g>
  );
};

/* ---------- komposisi ---------- */
const COL1 = {x: 285, y: 1057, s: 1.03, floor: 1362};
const COL2 = {x: 800, y: 789, s: 0.78, floor: 1362};

export const MaskotPreview = () => {
  const f = useCurrentFrame();
  const p1 = pose(f, A1);
  const p2 = pose(f, A2);
  const {seg, t} = p1;
  const idx = SEGS.indexOf(seg);
  const pill = sp(t, 0, {damping: 9});
  const shadow = (dy) => Math.max(0.55, 1 + dy / 120);

  return (
    <AbsoluteFill style={{backgroundColor: MINT, fontFamily}}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="dots" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="18" r="2.4" fill={GREEN} opacity="0.12" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#dots)" />
        <line x1={540} y1={520} x2={540} y2={1400} stroke={GREEN} strokeOpacity={0.18} strokeWidth={3} strokeDasharray="10 14" />

        <text x={540} y={300} textAnchor="middle" fontSize={64} fontWeight={700} fill={GREEN}>MASKOT JOKODING</text>
        <text x={540} y={360} textAnchor="middle" fontSize={32} fontWeight={500} fill={THUNDER} opacity={0.75}>
          2 opsi · ekspresi & gerakan tangan
        </text>

        <ellipse cx={COL1.x} cy={COL1.floor} rx={170 * shadow(p1.dy)} ry={22 * shadow(p1.dy)} fill={THUNDER} opacity={0.14} />
        <ellipse cx={COL2.x} cy={COL2.floor + 20} rx={120 * (0.9 + 0.1 * Math.sin(f * 0.12 - 1.4))} ry={18} fill={THUNDER} opacity={0.12} />

        <g transform={`translate(${COL1.x} ${COL1.y}) scale(${COL1.s})`}>
          <Maskot1 p={p1} f={f} />
        </g>
        <g transform={`translate(${COL2.x} ${COL2.y}) scale(${COL2.s})`}>
          <Maskot2 p={p2} f={f} />
        </g>

        {[COL1, COL2].map((c, k) => (
          <g key={k} transform={`translate(${c.x} 1455)`}>
            <rect x={-110} y={-42} width={220} height={66} rx={33} fill={k === 0 ? GREEN : THUNDER} />
            <text textAnchor="middle" y={4} fontSize={34} fontWeight={700} fill={MINT}>OPSI {k + 1}</text>
          </g>
        ))}

        <g transform={`translate(540 1590) scale(${0.6 + 0.4 * pill})`}>
          <rect x={-200} y={-50} width={400} height={92} rx={46} fill="#fff" stroke={GREEN} strokeWidth={5} />
          <text textAnchor="middle" y={14} fontSize={44} fontWeight={700} fill={THUNDER}>{seg.label}</text>
        </g>
        <text x={540} y={1690} textAnchor="middle" fontSize={26} fontWeight={500} fill={THUNDER} opacity={0.55}>
          {idx + 1} / {SEGS.length}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
