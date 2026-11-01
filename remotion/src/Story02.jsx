import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Poppins';
import {Backdrop, Big, Cam, DeskLayer, GREEN, LG, Laptop, POSE, SKIN, Shape, Student, SubPill, THUNDER, Vignette, armPts} from './Video01.jsx';
import {Maskot1} from './MaskotPreview.jsx';
import {poseOf} from './Joks.jsx';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});

/* Storyboard video 2 "Lima Ribu?!": satu frame diam per shot, memakai karakter & kamar malam video 1. */

/* ---------- helper ---------- */
export const jp = (key, over = {}) => {
  const p = poseOf(key);
  return {...p, ...over, seg: {...p.seg, ...(over.seg || {})}, hands: {...p.hands, ...(over.hands || {})}};
};
/* Joks berdiri di titik (x, alas y) dengan skala s */
export const JoksAt = ({x, y, s = 0.16, p, rot = 0, children}) => (
  <g transform={`translate(${x} ${y - 295 * s}) rotate(${rot}) scale(${s})`}>
    <Maskot1 p={p} f={0} />
    {children}
  </g>
);
export const GlowDefs = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="blur"><feGaussianBlur stdDeviation="4" /></filter>
  </defs>
);
const Logo = ({light = true}) => (
  <image href={staticFile(light ? 'logo-light.png' : 'logo-color.png')} x="216" y="66" width="38" height="11.16" />
);
const Sub = ({t}) => <SubPill words={t.split(' ')} s={1} />;
export const Sparkle = ({x, y, r = 6, fill = '#ffd400'}) => (
  <path transform={`translate(${x} ${y})`} fill={fill}
    d={`M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z`} />
);
export const Money = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M-17 -8 L15 -10 L17 8 L-15 10 Z" fill="#c9a66b" stroke="#7c5f2f" strokeWidth="1" />
    <path d="M-12 -4 L-4 -5 M4 5 L12 4" stroke="#7c5f2f" strokeWidth=".8" />
    <text x="0" y="3" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#5a3f12">5.000</text>
  </g>
);
export const EsCekek = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-10 -4 Q0 -12 10 -4 L7 22 Q0 26 -7 22 Z" fill="#ff9fbf" stroke="#c2185b" strokeWidth="1.4" />
    <path d="M-6 -7 Q0 -11 6 -7" stroke="#c2185b" strokeWidth="2.4" fill="none" />
    <line x1="3" y1="-20" x2="-1" y2="6" stroke="#e5484d" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="-3" cy="10" r="1.6" fill="#fff" opacity=".8" />
    <circle cx="3" cy="15" r="1.2" fill="#fff" opacity=".8" />
  </g>
);
export const Dust = ({x, y, r}) => (
  <g>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <circle key={i} cx={x + Math.cos(i * 0.9) * r * 0.75} cy={y + Math.sin(i * 1.7) * r * 0.35} r={r * 0.42} fill="#cfc6b6" stroke="#8f8676" strokeWidth="1.5" />
    ))}
  </g>
);
/* tongkat bisbol di koordinat lokal Joks, dari tangan (hx, hy) dengan sudut ang (derajat, 0 = ke atas) */
export const Bat = ({hx, hy, ang}) => (
  <g transform={`translate(${hx} ${hy}) rotate(${ang})`}>
    <path d="M-9 30 L-11 -40 Q-30 -260 0 -300 Q30 -260 11 -40 L9 30 Z" fill="#c68a4c" stroke={THUNDER} strokeWidth="7" strokeLinejoin="round" />
    <rect x="-13" y="20" width="26" height="22" rx="6" fill={THUNDER} />
    <path d="M-4 -60 Q-12 -200 0 -270" stroke="#e7b37a" strokeWidth="7" fill="none" strokeLinecap="round" />
  </g>
);

/* mahasiswa tengkurap di lantai (anatomi & warna sama dengan Student) */
export const StudentProne = ({x = 60, y = 360}) => (
  <g>
    <ellipse cx={x + 70} cy={y + 14} rx="95" ry="9" fill="#000" opacity=".3" />
    {/* kaki */}
    <rect x={x + 100} y={y - 8} width="56" height="13" rx="4" fill="#2b2f4a" />
    <rect x={x + 100} y={y + 3} width="60" height="13" rx="4" fill="#2b2f4a" transform={`rotate(-6 ${x + 100} ${y + 9})`} />
    <ellipse cx={x + 160} cy={y - 4} rx="6" ry="9" fill="#f5f5f5" />
    <ellipse cx={x + 163} cy={y + 8} rx="6" ry="9" fill="#f5f5f5" />
    {/* hoodie */}
    <rect x={x + 22} y={y - 18} width="86" height="34" rx="14" fill={GREEN} />
    <text x={x + 68} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" opacity=".9">✱</text>
    {/* kepala (belakang kepala, rambut) */}
    <circle cx={x + 8} cy={y - 6} r="24" fill={THUNDER} />
    <path d={`M${x - 6} ${y - 18} Q${x + 8} ${y - 28} ${x + 22} ${y - 16}`} stroke="#5a5557" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx={x + 8} cy={y + 16} r="5" fill={SKIN} />
    {/* lengan melindungi kepala */}
    <polyline points={`${x + 30},${y - 14} ${x + 14},${y - 34} ${x - 4},${y - 26}`} fill="none" stroke={GREEN} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={`${x + 34},${y - 6} ${x + 26},${y - 30} ${x + 10},${y - 36}`} fill="none" stroke="#3a8f00" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={x - 4} cy={y - 26} r="5.8" fill={SKIN} />
    <circle cx={x + 10} cy={y - 36} r="5.8" fill={SKIN} />
  </g>
);

/* Adegan pukul (dipakai cover, shot 9b, shot 10) */
const BeatScene = ({censor = true, text = true}) => {
  const p = jp('marah', {hands: {R: {x: 150, y: -150, r: -20, shape: 'fist'}, L: {x: -215, y: 120, r: 0, shape: 'fist'}}});
  return (
    <Cam fx={128} fy={320} sc={1.45}>
      <Backdrop />
      <DeskLayer />
      <Dust x={166} y={345} r={36} />
      <StudentProne x={86} y={362} />
      <Dust x={120} y={374} r={18} />
      <JoksAt x={148} y={346} s={0.2} p={p}>
        <Bat hx={150} hy={-150} ang={-40} />
        {censor && (
          <g>
            <rect x={-80} y={36} width={150} height={56} fill="#000" />
            <text x={-5} y={74} textAnchor="middle" fontSize="38" fontWeight="700" fill="#fff">#@$%!</text>
          </g>
        )}
      </JoksAt>
      <Sparkle x={70} y={322} r={7} />
      <Sparkle x={186} y={318} r={9} />
      <Sparkle x={42} y={352} r={5} />
      {text && <text x={190} y={290} fontSize="15" fontWeight="700" fill="#fff" stroke="#000" strokeWidth="1.4" paintOrder="stroke" transform="rotate(12 190 290)">BLETAK!</text>}
    </Cam>
  );
};

/* "bubble chat" berbentuk layar putih di atas kepala, muncul saat Joks menunjuk ke atas */
export const BubbleScreen = () => (
  <g>
    <path d="M166 176 L184 206 L184 176 Z" fill="#F9FDF7" stroke={THUNDER} strokeWidth="2.5" strokeLinejoin="round" />
    <rect x="28" y="92" width="214" height="86" rx="12" fill="#F9FDF7" stroke={THUNDER} strokeWidth="2.5" />
    <rect x="166.5" y="174" width="16" height="5" fill="#F9FDF7" />
    <path d="M29.5 104 Q29.5 93.5 40 93.5 L230 93.5 Q240.5 93.5 240.5 104 L240.5 110 L29.5 110 Z" fill={GREEN} />
    {[0, 1, 2].map((i) => <circle key={i} cx={40 + i * 8} cy="102" r="2.4" fill="#fff" opacity=".9" />)}
    <text x="232" y="105" textAnchor="end" fontSize="6.5" fontWeight="600" fill="#fff">alur order</text>
    <text x="135" y="133" textAnchor="middle" fontSize="13" fontWeight="700" fill={THUNDER}>5 langkah order di</text>
    <image href={staticFile('logo-color.png')} x="96" y="139" width="78" height="22.9" />
    {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={119 + i * 8} cy="170" r="2.3" fill={i % 2 ? THUNDER : GREEN} />)}
  </g>
);

/* panel layar penuh tiap langkah order (suara Joks tetap menjelaskan) */
export const STEP = [
  {t: 'Konsultasi gratis', c: '"konsultasi dulu, gratis"'},
  {t: 'Deal harga', c: '"deal harga, bisa nego"'},
  {t: 'Dibantu garap', c: '"tim jokoding bantu garap"'},
  {t: 'Cek & revisi', c: '"kamu cek, kurang sreg? revisi"'},
  {t: 'Serah terima', c: '"serah terima. beres!"'},
];
const Avatar = ({x, y, r = 16, happy = false}) => (
  <g>
    <circle cx={x - r} cy={y + 1} r={r * 0.2} fill={SKIN} />
    <circle cx={x + r} cy={y + 1} r={r * 0.2} fill={SKIN} />
    <circle cx={x} cy={y} r={r} fill={SKIN} />
    <path d={`M${x - r} ${y - 2} Q${x - r * 0.7} ${y - r * 1.4} ${x} ${y - r * 1.25} Q${x + r * 0.9} ${y - r * 1.35} ${x + r} ${y - 2} Q${x + r * 0.6} ${y - r * 0.85} ${x} ${y - r * 0.8} Q${x - r * 0.6} ${y - r * 0.8} ${x - r} ${y - 2}Z`} fill={THUNDER} />
    <circle cx={x - r * 0.38} cy={y} r={r * 0.12} fill="#111" />
    <circle cx={x + r * 0.38} cy={y} r={r * 0.12} fill="#111" />
    <path d={`M${x - r * 0.35} ${y + r * 0.4} Q${x} ${y + r * (happy ? 0.85 : 0.55)} ${x + r * 0.35} ${y + r * 0.4}`} stroke={THUNDER} strokeWidth={r * 0.1} fill={happy ? '#fff' : 'none'} strokeLinecap="round" />
  </g>
);
const Bubble = ({x, y, w, t, me}) => (
  <g>
    <rect x={x} y={y} width={w} height="14" rx="4" fill={me ? '#d9fdd3' : '#fff'} />
    <text x={x + 4} y={y + 9.5} fontSize="6" fill="#111b21">{t}</text>
  </g>
);
const Gear = ({x, y, r, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={r} fill="none" stroke={GREEN} strokeWidth={r * 0.45} strokeDasharray={`${r * 0.5} ${r * 0.42}`} />
    <circle r={r * 0.78} fill={GREEN} />
    <circle r={r * 0.3} fill="#fff" />
  </g>
);
export const StepArt = ({n}) => {
  switch (n) {
    case 1:
      return (
        <g>
          <rect x="88" y="150" width="94" height="140" rx="12" fill={THUNDER} />
          <rect x="93" y="160" width="84" height="122" rx="4" fill="#efeae2" />
          <rect x="93" y="160" width="84" height="16" fill="#008069" />
          <circle cx="102" cy="168" r="5" fill="#F9FDF7" />
          <text x="111" y="171" fontSize="6.5" fontWeight="700" fill="#fff">Jokoding</text>
          <Bubble x={118} y={184} w={55} t="kak, mau konsul" me />
          <Bubble x={97} y={203} w={60} t="boleh! cerita dulu" />
          <Bubble x={114} y={222} w={59} t="skripsi bab 3…" me />
          <Bubble x={97} y={241} w={56} t="siap, kita bahas" />
          <image href={staticFile('whatsapp.svg')} x="168" y="270" width="26" height="26" />
          <g transform="rotate(-12 206 172)">
            <rect x="178" y="160" width="58" height="22" rx="4" fill="none" stroke={GREEN} strokeWidth="2.5" />
            <text x="207" y="176" textAnchor="middle" fontSize="11" fontWeight="700" fill={GREEN}>GRATIS</text>
          </g>
          <Avatar x={56} y={232} r={16} />
        </g>
      );
    case 2:
      return (
        <g>
          <Avatar x={62} y={210} r={18} />
          <JoksAt x={208} y={238} s={0.1} p={jp('senang', {seg: {fx: []}})} />
          <g transform="rotate(-10 135 192)">
            <path d="M105 178 L150 178 L168 192 L150 206 L105 206 Z" fill="#ffd400" stroke={THUNDER} strokeWidth="2" strokeLinejoin="round" />
            <circle cx="155" cy="192" r="3" fill={THUNDER} />
            <text x="126" y="197" textAnchor="middle" fontSize="12" fontWeight="700" fill={THUNDER}>Rp</text>
          </g>
          <path d="M95 228 L175 228 M95 228 l7 -5 M95 228 l7 5 M175 236 L95 236 M175 236 l-7 -5 M175 236 l-7 5" stroke={THUNDER} strokeWidth="2" strokeLinecap="round" />
          <text x="135" y="252" textAnchor="middle" fontSize="9" fontWeight="600" fill="#5b5859">nego</text>
          <g transform="rotate(-8 135 276)">
            <rect x="104" y="264" width="62" height="24" rx="5" fill="none" stroke={GREEN} strokeWidth="2.5" />
            <text x="135" y="281" textAnchor="middle" fontSize="13" fontWeight="700" fill={GREEN}>DEAL!</text>
          </g>
        </g>
      );
    case 3:
      return (
        <g>
          <rect x="74" y="156" width="124" height="86" rx="6" fill={THUNDER} />
          <rect x="80" y="162" width="112" height="74" rx="3" fill="#1d2b3a" />
          {[['#7bdb2e', 40], ['#ffd400', 62], ['#8fdcff', 50], ['#7bdb2e', 30], ['#ff9fbf', 56], ['#8fdcff', 44]].map(([c, w], i) => (
            <rect key={i} x={88 + (i % 3 === 1 ? 8 : 0)} y={170 + i * 10} width={w} height="4" rx="2" fill={c} />
          ))}
          <rect x="120" y="242" width="32" height="8" fill="#555" />
          <rect x="104" y="250" width="64" height="5" rx="2" fill="#555" />
          <Gear x={216} y={170} r={11} />
          <Gear x={230} y={192} r={7} rot={20} />
          <JoksAt x={54} y={256} s={0.1} p={jp('netral', {seg: {mouth: 'grin'}, hands: {R: {x: 230, y: 120, r: 60, shape: 'mitt'}}})} />
          <rect x="60" y="268" width="150" height="10" rx="5" fill="#e3e8df" />
          <rect x="60" y="268" width="98" height="10" rx="5" fill={GREEN} />
          <text x="216" y="277" fontSize="8" fontWeight="700" fill={THUNDER}>65%</text>
        </g>
      );
    case 4:
      return (
        <g>
          <path d="M84 150 L172 150 L188 166 L188 290 L84 290 Z" fill="#fff" stroke={THUNDER} strokeWidth="2" strokeLinejoin="round" />
          <path d="M172 150 L172 166 L188 166" fill="none" stroke={THUNDER} strokeWidth="2" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x="108" y={180 + i * 20} width={i === 2 ? 50 : 66} height="5" rx="2.5" fill="#cfd6cb" />
              {i !== 2 && <path d={`M93 ${182 + i * 20} l4 4 l7 -8`} stroke={GREEN} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          ))}
          <ellipse cx="132" cy="222" rx="36" ry="10" fill="none" stroke="#e5484d" strokeWidth="2" />
          <path d="M172 226 Q214 228 210 200 Q206 180 186 188" stroke="#e5484d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M186 188 l8 -6 M186 188 l9 3" stroke="#e5484d" strokeWidth="2.4" strokeLinecap="round" />
          <text x="214" y="244" textAnchor="middle" fontSize="10" fontWeight="700" fill="#e5484d">revisi</text>
          <circle cx="64" cy="250" r="14" fill="none" stroke={THUNDER} strokeWidth="3.5" />
          <line x1="54" y1="260" x2="44" y2="272" stroke={THUNDER} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case 5:
      return (
        <g>
          <path d="M58 182 L84 182 L90 190 L122 190 L122 236 L58 236 Z" fill={GREEN} stroke={THUNDER} strokeWidth="2" strokeLinejoin="round" />
          <rect x="62" y="196" width="56" height="36" rx="3" fill="#7bdb2e" />
          <text x="90" y="250" textAnchor="middle" fontSize="7" fontWeight="600" fill={THUNDER}>skripsi_final</text>
          <path d="M132 212 L172 212 M172 212 l-8 -6 M172 212 l-8 6" stroke={THUNDER} strokeWidth="3" strokeLinecap="round" />
          <Avatar x={206} y={208} r={20} happy />
          <Sparkle x={232} y={184} r={6} />
          <circle cx="135" cy="272" r="16" fill={GREEN} />
          <path d="M127 272 l6 6 l11 -12" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x="160" y="277" fontSize="13" fontWeight="700" fill={GREEN}>beres!</text>
        </g>
      );
    default:
      return null;
  }
};
const StepPanel = ({n}) => {
  const s = STEP[n - 1];
  return (
    <>
      <rect width="270" height="480" fill="#F9FDF7" />
      {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
      <rect x="18" y="92" width="234" height="228" rx="14" fill="#fff" stroke={THUNDER} strokeWidth="2.5" />
      <path d="M19.5 106 Q19.5 93.5 32 93.5 L238 93.5 Q250.5 93.5 250.5 106 L250.5 114 L19.5 114 Z" fill={GREEN} />
      <text x="60" y="107" fontSize="7" fontWeight="600" fill="#fff">alur order jokoding</text>
      {[1, 2, 3, 4, 5].map((i) => <circle key={i} cx={198 + i * 8} cy="104" r="2.6" fill="#fff" opacity={i <= n ? 1 : 0.35} />)}
      <circle cx="42" cy="136" r="13" fill={n % 2 ? GREEN : THUNDER} />
      <text x="42" y="140.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">0{n}</text>
      <text x="62" y="141" fontSize="14" fontWeight="700" fill={THUNDER}>{s.t}</text>
      <StepArt n={n} />
      <JoksAt x={36} y={93} s={0.062} p={jp('netral', {seg: {mouth: 'grin'}, hands: {R: {x: 230, y: 60, r: 120, shape: 'point'}}})} />
      <Sub t={s.c.replace(/"/g, '')} />
      <Logo light={false} />
    </>
  );
};

/* posisi tetap untuk adegan bersama Joks */
const SCX = 60; // mahasiswa
const LX = 208; // laptop
const JX = 140; // Joks di meja

const Shot = ({id}) => {
  switch (id) {
    case 'cover':
      return (
        <>
          <BeatScene censor={false} text={false} />
          <Vignette o={0.6} />
          <Big t="LIMA RIBU?!" y={150} size={34} rot={-3} />
          <rect x="105" y="100" width="60" height="17" rx="8.5" fill={GREEN} />
          <text x="135" y="112.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">PART 2</text>
          <Logo />
        </>
      );
    case 's1':
      return (
        <>
          <Cam fx={100} fy={240} sc={1.3}>
            <Backdrop />
            <Student part="body" mood="doubt" gaze={[3, -1]} />
            <DeskLayer />
            <Student part="arms" mood="doubt" armR={POSE.head} />
            <Laptop face="neutral" gaze={LG} rot={-2} />
            <Sparkle x={42} y={196} r={5} />
          </Cam>
          <Sub t="emang kalau aku konsul ke jokoding…" />
          <Logo />
        </>
      );
    case 's2':
      return (
        <>
          <Cam fx={135} fy={250} sc={1.15}>
            <Backdrop />
            <Student part="body" mood="hope" gaze={[3, 0]} tilt={6} />
            <DeskLayer />
            <Student part="arms" mood="hope" />
            <Laptop face="smile" armL={[105, 75]} armR={[105, 75]} armGrow={1.5} rot={-2} />
          </Cam>
          <Sub t="tapi apa salahnya dicoba dulu?" />
          <Logo />
        </>
      );
    case 's3': {
      return (
        <>
          <rect width="270" height="480" fill="#0b0f19" />
          <rect x="8" y="88" width="254" height="270" rx="10" fill={THUNDER} />
          <rect x="16" y="96" width="238" height="254" rx="5" fill="#1d2b3a" />
          <rect x="30" y="110" width="210" height="226" rx="8" fill="#111b21" />
          <rect x="30" y="110" width="210" height="28" rx="8" fill="#202c33" />
          <image href={staticFile('whatsapp.svg')} x="38" y="115" width="18" height="18" />
          <text x="62" y="128" fontSize="9.5" fontWeight="700" fill="#e9edef">WhatsApp</text>
          <rect x="36" y="146" width="198" height="36" rx="6" fill="#2a3942" stroke={GREEN} strokeWidth="1.6" />
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
          <circle cx="170" cy="168" r="10" fill="none" stroke={GREEN} strokeWidth="2" />
          <path d="M170 168 l0 16 l4 -4 l3.5 7 l3 -1.5 l-3.5 -7 l5.5 0 z" fill="#fff" stroke="#000" strokeWidth="1" />
          <rect x="8" y="356" width="254" height="12" rx="4" fill="#555" />
          <Logo />
        </>
      );
    }
    case 's4a': {
      /* Joks menyembul keluar dari layar laptop (laptop masih di posisi awal video 1) */
      const p = jp('senang', {seg: {fx: ['sparkle']}});
      return (
        <>
          <Cam fx={135} fy={245} sc={1.12}>
            <Backdrop />
            <Student part="body" cx={SCX} mood="shock" lean={-7} />
            <DeskLayer />
            <Student part="arms" cx={SCX} mood="shock" lean={-7} armL={POSE.cheeks} armR={POSE.cheeks} />
            <polygon points="128,226 224,226 250,120 102,120" fill="#b9ff7a" opacity=".16" />
            <Laptop x={176} s={0.9} face="shock" screen="#2f5d1a" gaze={[0, -3]} />
            <JoksAt x={176} y={236} s={0.15} p={p} />
            <Sparkle x={130} y={170} r={6} />
            <Sparkle x={222} y={160} r={5} fill="#b9ff7a" />
          </Cam>
          <Logo />
        </>
      );
    }
    case 's4b': {
      /* laptop bergeser ke kanan memberi ruang; Joks mendarat di tengah meja dan menyapa */
      const p = jp('halo');
      return (
        <>
          <Cam fx={135} fy={245} sc={1.12}>
            <Backdrop />
            <Student part="body" cx={SCX} mood="shock" lean={-4} gaze={[3, 0]} />
            <DeskLayer />
            <Student part="arms" cx={SCX} mood="shock" lean={-4} />
            {[0, 1, 2].map((i) => <line key={i} x1={238 + i * 3} y1={240 + i * 18} x2={262 + i * 3} y2={240 + i * 18} stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />)}
            <Laptop x={LX} s={0.85} face="sheepish" gaze={[-3, 0]} rot={4} />
            <JoksAt x={JX} y={304} s={0.16} p={p} />
            {['J', 'O', 'K', 'S'].map((c, i) => (
              <text key={c} x={JX - 30 + i * 20} y={200} textAnchor="middle" fontSize="16" fontWeight="700" fill="#7bdb2e" stroke="#000" strokeWidth="1.4" paintOrder="stroke">{c}</text>
            ))}
          </Cam>
          <Sub t="haii! aku j-o-k-s, joks!" />
          <Logo />
        </>
      );
    }
    case 's5':
      return (
        <>
          <Cam fx={100} fy={245} sc={1.25}>
            <Backdrop />
            <Student part="body" cx={SCX + 12} mood="awkward" sweat f={6} gaze={[3, 0]} />
            <DeskLayer />
            <Student part="arms" cx={SCX + 12} mood="awkward" armR={POSE.head} />
            <Laptop x={LX} s={0.85} face="smile" />
            <JoksAt x={JX + 14} y={304} s={0.16} p={jp('netral', {seg: {fx: ['blush']}})} />
          </Cam>
          <Sub t="aku mau konsul soal skripsiku." />
          <Logo />
        </>
      );
    case 's6a': {
      /* Joks menunjuk ke atas, mahasiswa melihat ke atas, "bubble" berbentuk layar putih muncul */
      const p = jp('netral', {seg: {mouth: 'grin'}, hands: {R: {x: 205, y: -255, r: 0, shape: 'point'}}});
      return (
        <>
          <Cam fx={135} fy={245} sc={1.12}>
            <Backdrop />
            <Student part="body" cx={SCX} mood="hope" gaze={[2, -3.6]} tilt={-5} />
            <DeskLayer />
            <Student part="arms" cx={SCX} mood="hope" />
            <Laptop x={LX} s={0.85} face="excited" gaze={[-1.5, -3]} />
            <JoksAt x={JX} y={304} s={0.16} p={p} />
          </Cam>
          <BubbleScreen />
          <Sub t="bisa dong! gampang, cuma lima langkah." />
          <Logo />
        </>
      );
    }
    case 'step1':
    case 'step2':
    case 'step3':
    case 'step4':
    case 'step5':
      return <StepPanel n={Number(id.slice(4))} />;
    case 's7': {
      const sR = [SCX + 26, 254];
      const {H} = armPts(sR, 1, 95, -75);
      return (
        <>
          <Cam fx={100} fy={245} sc={1.25}>
            <Backdrop />
            <Student part="body" cx={SCX} mood="sly" gaze={[3, 0]} />
            <DeskLayer />
            <Student part="arms" cx={SCX} mood="sly" armR={[95, -75]} />
            <Money x={H[0] + 4} y={H[1] - 12} rot={-14} s={1.2} />
            <Laptop x={LX} s={0.85} face="neutral" gaze={[-3, 1]} />
            <JoksAt x={JX + 34} y={304} s={0.16} p={jp('netral', {seg: {mouth: 'flat'}})} />
          </Cam>
          <Sub t="skripsiku bisa selesai nggak?" />
          <Logo />
        </>
      );
    }
    case 's8a':
    case 's8b': {
      const mad = id === 's8b';
      const p = mad ? jp('marah') : jp('netral', {seg: {eyes: ['open', 'squint'], mouth: 'flat'}});
      const s = 0.82;
      return (
        <>
          <rect width="270" height="480" fill="#161d31" />
          <g transform={`translate(${135 + 5 * s + (mad ? 3 : 0)} ${250 - 37 * s}) rotate(${mad ? -3 : 0}) scale(${s})`}>
            <Maskot1 p={p} f={0} />
          </g>
          {!mad && (
            <>
              <text x="200" y="196" fontSize="11" fontWeight="700" fill="#fff" transform="rotate(10 200 196)">ngiik</text>
              <path d="M184 205 l8 -4 M186 214 l9 0 M184 223 l8 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              <text x="40" y="380" fontSize="9" fontWeight="600" fill="#9fb3c8">krik… krik…</text>
            </>
          )}
          {mad && <Big t="LIMA RIBU?!" y={392} size={34} rot={-4} />}
          {mad && [0, 1, 2, 3].map((i) => <line key={i} x1={i % 2 ? 0 : 270} y1={130 + i * 40} x2={i % 2 ? 26 : 244} y2={136 + i * 40} stroke="#fff" strokeWidth="2" opacity=".6" />)}
          <Sub t={mad ? 'lima ribu?!' : 'lima ribu?'} />
          <Logo />
        </>
      );
    }
    case 's9a': {
      const p = jp('marah', {hands: {L: {x: -250, y: 40, r: -70, shape: 'mitt'}}});
      return (
        <>
          <Cam fx={110} fy={245} sc={1.2}>
            <Backdrop />
            <Student part="body" cx={SCX} mood="shock" lean={-9} tilt={-10} />
            <DeskLayer />
            <Student part="arms" cx={SCX} mood="shock" lean={-9} armL={POSE.raised} armR={POSE.raised} />
            <Money x={SCX - 2} y={214} rot={-20} s={1.6} />
            <Laptop x={LX} s={0.85} face="shock" gaze={[-3, 0]} />
            <JoksAt x={JX + 18} y={304} s={0.17} p={p} />
            {[0, 1, 2].map((i) => <line key={i} x1={JX - 10} y1={232 + i * 7} x2={SCX + 30} y2={220 + i * 7} stroke="#fff" strokeWidth="1.4" strokeDasharray="5 5" opacity=".7" />)}
          </Cam>
          <Big t="PLAK!" y={140} size={30} fill="#fff" rot={-8} />
          <Logo />
        </>
      );
    }
    case 's9b':
      return (
        <>
          <BeatScene />
          <g transform="translate(48 150) rotate(-10)">
            <EsCekek x={0} y={0} s={1.5} />
          </g>
          <Sub t="buat beli es cekek aja, masss!!" />
          <Logo />
        </>
      );
    case 's10':
      return (
        <>
          <g filter="url(#blur)">
            <BeatScene censor={false} text={false} />
          </g>
          <rect width="270" height="480" fill="#000" opacity=".3" />
          <line x1="110" y1="0" x2="110" y2="150" stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" strokeDasharray="4 6" />
          <line x1="160" y1="0" x2="160" y2="150" stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" strokeDasharray="4 6" />
          <Laptop x={135} y={268} s={1.15} face="sheepish" gaze={[0, 1]} sweat />
          <Sub t="joks udah marah nih." />
          <Logo />
        </>
      );
    case 's11': {
      const shapes = [
        ['asterisk', 14, 130, 20, GREEN], ['cross', 250, 100, 16, THUNDER], ['hash', 12, 232, 16, THUNDER],
        ['diamond', 252, 214, 18, GREEN], ['asterisk', 18, 326, 14, THUNDER], ['cross', 250, 150, 12, GREEN],
      ];
      return (
        <>
          <rect width="270" height="480" fill="#F9FDF7" />
          {[0, 40, 80, 120, 160, 200, 240].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="480" stroke={GREEN} strokeOpacity=".07" />)}
          <rect y="336" width="270" height="144" fill="#e6f4dc" />
          {shapes.map(([type, x, y, size, color], i) => <Shape key={i} type={type} x={x} y={y} size={size} color={color} rot={i * 20} />)}
          <text x="130" y="122" textAnchor="middle" fontSize="22" fontWeight="700" fill={THUNDER}>APA PILIHANMU?</text>
          <path d="M58 130 q9 -6 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0" stroke={GREEN} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <rect x="24" y="142" width="212" height="44" rx="22" fill={GREEN} />
          <circle cx="48" cy="164" r="12" fill="#fff" />
          <text x="48" y="169" textAnchor="middle" fontSize="14" fontWeight="700" fill={GREEN}>A</text>
          <text x="68" y="168" fontSize="10.5" fontWeight="700" fill="#fff">Belajar bareng Joks</text>
          <JoksAt x={212} y={184} s={0.075} p={jp('jempol', {seg: {fx: []}})} />
          <rect x="24" y="190" width="212" height="44" rx="22" fill="#fff" stroke={THUNDER} strokeWidth="2" />
          <circle cx="48" cy="212" r="12" fill={THUNDER} />
          <text x="48" y="217" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">B</text>
          <text x="68" y="216" fontSize="10.5" fontWeight="700" fill={THUNDER}>Beli es cekek</text>
          <EsCekek x={212} y={208} s={0.9} />
          <text x="130" y="266" textAnchor="middle" fontSize="11" fontWeight="600" fill="#5b5859">Komentar di bawah</text>
          <text x="130" y="282" textAnchor="middle" fontSize="14" fontWeight="700" fill={GREEN}>↓</text>
          <rect x="40" y="294" width="180" height="28" rx="14" fill="#fff" stroke={GREEN} strokeWidth="2" />
          <image href={staticFile('whatsapp.svg')} x="47" y="297.5" width="21" height="21" />
          <text x="74" y="312" fontSize="9.5" fontWeight="700" fill={THUNDER}>Chat WhatsApp (link di bio)</text>
          <rect x="40" y="326" width="180" height="26" rx="13" fill={THUNDER} />
          <text x="130" y="343" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">Lihat portofolio: <tspan fill="#6fd31f">jokoding.id</tspan></text>
          <Logo light={false} />
        </>
      );
    }
    default:
      return null;
  }
};

export const STORY02 = ['cover', 's1', 's2', 's3', 's4a', 's4b', 's5', 's6a', 'step1', 'step2', 'step3', 'step4', 'step5', 's7', 's8a', 's8b', 's9a', 's9b', 's10', 's11'];

export const Story02 = ({id}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <svg viewBox="0 0 270 480" width="1080" height="1920" style={{fontFamily}}>
      <GlowDefs />
      <Shot id={id} />
    </svg>
  </AbsoluteFill>
);
