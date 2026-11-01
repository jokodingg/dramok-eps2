# Dramok Eps 2 — "Lima Ribu?!"

Reels Instagram @jokodingg, episode 2 (lanjutan "Skripsi: Drama Dini Hari"), debut maskot J.O.K.S.
Animasi 2D dengan [Remotion](https://www.remotion.dev/) 4.0.355, 1080x1920, 30 fps, ±74 detik.

## Struktur
- `remotion/` : project Remotion
  - `src/Video02.jsx` : komposisi video 2 (timeline, adegan, SFX, lipsync)
  - `src/video02-lines.json` : teks dialog + waktu per kata
  - `src/Video01.jsx` : komponen bersama dari episode 1 (kamar, mahasiswa, laptop, kamera)
  - `src/MaskotPreview.jsx` : maskot Joks (`Maskot1`)
  - `src/Story02.jsx` : frame storyboard (Still `S02-*`)
  - `public/` : audio dialog, SFX, musik, logo
- `video-02/` : naskah, shotlist, storyboard, caption, dan skrip Python (`tools/`)

## Menjalankan
```
cd remotion
npm install
npx remotion studio src/index.jsx
npx remotion render src/index.jsx Video02 out/video-02.mp4 --codec=h264
```

Skrip `video-02/tools/`: `asr_all.py` (transkrip kata, faster-whisper), `make_lines.py` (membuat `video02-lines.json`), `make_sound2.py` (SFX + musik).
