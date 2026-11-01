// Render beberapa frame dari satu komposisi sekaligus (sekali bundling).
// Pemakaian: node render-frames.mjs <id-komposisi> <folder-output> <frame...>
import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderStill} from '@remotion/renderer';

const [id, outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.jsx')});
const composition = await selectComposition({serveUrl, id});
for (const fr of frames.map(Number)) {
  const output = path.join(outDir, `f${String(fr).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame: fr, imageFormat: 'png'});
  console.log('ok', output);
}
