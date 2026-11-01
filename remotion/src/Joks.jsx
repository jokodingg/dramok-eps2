import React from 'react';
import {AbsoluteFill} from 'remotion';
import {A1, GLOW, Maskot1, SEG, SEGS, handsOf, pose} from './MaskotPreview.jsx';

/* Joks (maskot Jokoding, opsi 1): satu pose diam per ekspresi, latar transparan untuk ekspor PNG. */

/* frame lokal per ekspresi: saat efek sudah tampil penuh dan mata terbuka */
const PICK = {halo: 20, senang: 13, kaget: 30, sedih: 30, marah: 30, bingung: 30, nunjuk: 30, jempol: 30};

const NETRAL = {
  dx: 0, dy: 0, tilt: 0, headTilt: 0, sq: 0,
  hands: handsOf('netral', 0, A1),
  seg: {key: 'netral', eyes: ['open', 'open'], mouth: 'smile', fx: []},
  t: 20, blink: 1, open: 1, glow: GLOW,
};

export const JOKS_POSES = ['netral', ...SEGS.map((s) => s.key)];

export const poseOf = (key) => {
  if (key === 'netral') return NETRAL;
  const i = SEGS.findIndex((s) => s.key === key);
  return pose(i * SEG + PICK[key], A1);
};

export const JoksStill = ({expr}) => (
  <AbsoluteFill>
    <svg viewBox="0 0 1600 1600" width={1600} height={1600}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(800 860) scale(2)">
        <Maskot1 p={poseOf(expr)} f={0} />
      </g>
    </svg>
  </AbsoluteFill>
);
