// Render banyak Still sekaligus dengan sekali bundling.
// Pemakaian: node render-stills.mjs <prefix-id> <folder-output>
// Contoh:    node render-stills.mjs S02- ../../video-02/storyboard
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';

const [prefix = 'S02-', outDir = 'out/stills'] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
const comps = (await getCompositions(serveUrl)).filter((c) => c.id.startsWith(prefix));
for (const composition of comps) {
  const output = path.join(outDir, `${composition.id.slice(prefix.length)}.png`);
  await renderStill({composition, serveUrl, output, imageFormat: 'png'});
  console.log('ok', output);
}
