import React from 'react';
import {Composition, Still} from 'remotion';
import {JoksStill, JOKS_POSES} from './Joks.jsx';
import {Story02, STORY02} from './Story02.jsx';
import {Video01, COVER} from './Video01.jsx';
import {Video02, COVER2, MAIN2} from './Video02.jsx';
import {MaskotPreview, MASKOT_FRAMES} from './MaskotPreview.jsx';

export const Root = () => (
  <>
    <Composition
      id="Video01"
      component={Video01}
      durationInFrames={1200 + COVER}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="Video02"
      component={Video02}
      durationInFrames={COVER2 + MAIN2}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="MaskotPreview"
      component={MaskotPreview}
      durationInFrames={MASKOT_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
    {STORY02.map((id) => (
      <Still key={id} id={`S02-${id}`} component={Story02} defaultProps={{id}} width={1080} height={1920} />
    ))}
    {JOKS_POSES.map((expr) => (
      <Still key={expr} id={`Joks-${expr}`} component={JoksStill} defaultProps={{expr}} width={1600} height={1600} />
    ))}
  </>
);
