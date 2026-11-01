"""Transkrip semua audio di <audio_dir> dengan faster-whisper (timing per kata) -> JSON.
Pemakaian: python asr_all.py <audio_dir> <out.json>"""
import json, os, subprocess, sys, wave
import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("small", device="cpu", compute_type="int8")
res = {}
for name in sorted(os.listdir(src)):
    if not name.endswith(".mp3"):
        continue
    wav = os.path.join(os.environ.get("TEMP", "."), "asr_tmp.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(src, name), "-ac", "1", "-ar", "16000", wav], check=True)
    w = wave.open(wav)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    w.close()
    # awal & akhir suara (ambang -40 dB, jendela 20 ms)
    win = 320
    rms = np.array([np.sqrt(np.mean(a[i:i + win] ** 2)) for i in range(0, len(a) - win, win)])
    on = np.where(rms > 0.01)[0]
    segs, _ = m.transcribe(a, language="id", word_timestamps=True, beam_size=5)
    words = [[round(x.start, 2), round(x.end, 2), x.word.strip()] for s in segs for x in s.words]
    res[name[:-4]] = {
        "dur": round(len(a) / 16000, 3),
        "voiceStart": round(on[0] * 0.02, 2) if len(on) else 0,
        "voiceEnd": round((on[-1] + 1) * 0.02, 2) if len(on) else 0,
        "words": words,
    }
    print(name, res[name[:-4]]["dur"], res[name[:-4]]["voiceStart"], res[name[:-4]]["voiceEnd"], " ".join(w[2] for w in words))
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
