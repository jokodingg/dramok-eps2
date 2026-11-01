"""SFX tambahan + musik video 2 (sintesis numpy). Pemakaian: python make_sound2.py <public_dir>
Musik (detik sejak awal video utama): lo-fi 0-12.4 · ceria 12.4-42.1 · hening 42.1-46.1 · kejar-kejaran 46.1-54.2 ·
lembut 66.2-69.3 · ceria penutup 69.3-73.83 (revisi: omelan j5 diputar hampir penuh)."""
import numpy as np, wave, os, sys

OUT = sys.argv[1]
SR = 44100
rng = np.random.default_rng(11)
os.makedirs(os.path.join(OUT, "sfx"), exist_ok=True)

def t_(d): return np.arange(int(SR * d)) / SR
def norm(x, peak=0.9): return x / (np.max(np.abs(x)) + 1e-9) * peak
def save(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
def lowpass(x, k):
    k = max(1, int(k)); return np.convolve(x, np.ones(k) / k, mode="same")
def env(n, a=0.005, d=0.1, s=0.0, r=0.05):
    e = np.zeros(n); na = max(1, int(a * SR)); nd = min(int(d * SR), n - na); nr = int(r * SR)
    e[:na] = np.linspace(0, 1, na); e[na:na + nd] = np.linspace(1, s, nd); e[na + nd:] = s
    if 0 < nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def tone(f, d, kind="tri", a=0.005, dc=0.15, s=0.0, r=0.05):
    t = t_(d)
    if kind == "sine": w = np.sin(2 * np.pi * f * t)
    elif kind == "square": w = np.sign(np.sin(2 * np.pi * f * t)) * 0.6
    elif kind == "tri": w = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t))
    elif kind == "pluck": w = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)
    elif kind == "piano": w = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.6 for k in range(1, 6))
    return w * env(len(t), a, dc, s, r)
def mix_into(buf, x, at):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[:j - i]
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------- SFX baru
def click():
    x = np.zeros(int(SR * 0.12))
    for at, f in [(0.0, 3200), (0.045, 2400)]:
        c = np.sin(2 * np.pi * f * t_(0.012)) * np.exp(-t_(0.012) * 400)
        mix_into(x, c + lowpass(rng.standard_normal(len(c)), 2) * 0.3 * np.exp(-t_(0.012) * 500), at)
    return norm(x, 0.8)
def slide():
    d = 0.5; t = t_(d); n = lowpass(rng.standard_normal(len(t)), 9)
    return norm(n * np.sin(np.pi * t / d) ** 1.5 * (1 - 0.5 * t / d), 0.6)
def thud():
    d = 0.35; t = t_(d); f = 160 * np.exp(-t * 12) + 55
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + lowpass(rng.standard_normal(len(t)), 6) * np.exp(-t * 60) * 0.5, 0.9)
def slap():
    d = 0.25; t = t_(d); n = rng.standard_normal(len(t))
    return norm((n - lowpass(n, 6)) * np.exp(-t * 35) + np.sin(2 * np.pi * 180 * t) * np.exp(-t * 30) * 0.5, 0.95)
def bonk():
    d = 0.45; t = t_(d)
    w = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(520, 1, 16), (1310, 0.6, 22), (2210, 0.35, 30)])
    return norm(w + lowpass(rng.standard_normal(len(t)), 3) * np.exp(-t * 80) * 0.6, 0.9)
def beep():
    d = 2.68; t = t_(d)
    return np.sin(2 * np.pi * 1000 * t) * env(len(t), 0.004, 0.01, 1, 0.01) * 0.45
def squeak():
    d = 0.28; t = t_(d); f = 1500 + 900 * np.sin(np.pi * t / d)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 0.7, 0.45)
def twinkle():
    x = np.zeros(int(SR * 0.7))
    for k, m in enumerate([88, 92, 95, 100]):
        mix_into(x, tone(hz(m), 0.35, "sine", dc=0.3) * 0.5, k * 0.06)
    return norm(x, 0.5)
def stamp():
    d = 0.3; t = t_(d)
    return norm(np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 20) + 60) / SR) * np.exp(-t * 18) + lowpass(rng.standard_normal(len(t)), 4) * np.exp(-t * 50) * 0.7, 0.85)
def ting():
    d = 0.9; t = t_(d)
    return norm(sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(2093, 1, 5), (4186, 0.3, 8)]), 0.5)

for name, fn in [("click", click), ("slide", slide), ("thud", thud), ("slap", slap), ("bonk", bonk), ("beep", beep),
                 ("squeak", squeak), ("twinkle", twinkle), ("stamp", stamp), ("ting", ting)]:
    save(os.path.join(OUT, "sfx", name + ".wav"), fn())

# ------------------------------------------------------------- MUSIK
TOTAL = 73.83
mus = np.zeros(int(SR * TOTAL))
def kick(g=1.0):
    return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t_(0.18) * 18) + 45) / SR) * np.exp(-t_(0.18) * 14) * g
def hat(g=1.0):
    return lowpass(rng.standard_normal(int(SR * 0.04)), 1) * np.exp(-t_(0.04) * 90) * g
def section(a, b, fade_in=0.4, fade_out=0.5):
    e = np.zeros_like(mus); i0, i1 = int(a * SR), int(b * SR)
    e[i0:i1] = 1
    fi = int(fade_in * SR); fo = int(fade_out * SR)
    e[i0:i0 + fi] = np.linspace(0, 1, fi); e[i1 - fo:i1] = np.linspace(1, 0, fo)
    return e

# 1) lo-fi penuh harap, 78 BPM, Cmaj7 - Am7 - Fmaj7 - G
lofi = np.zeros_like(mus); beat = 60 / 78
chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]
b = 0
while b * beat < 12.4:
    at = b * beat; ch = chords[(b // 4) % 4]
    if b % 4 == 0:
        for m in ch: mix_into(lofi, tone(hz(m), beat * 4, "sine", a=0.3, dc=1.0, s=0.6, r=0.6) * 0.09, at)
        mix_into(lofi, tone(hz(ch[0] - 24), beat * 4, "sine", a=0.05, dc=1.2, s=0.4) * 0.3, at)
    mix_into(lofi, tone(hz(ch[(b * 2) % 4] + 12), 0.4, "pluck", a=0.004, dc=0.3) * 0.07, at + beat * 0.5)
    if b % 2 == 0: mix_into(lofi, kick(0.3), at)
    mix_into(lofi, hat(0.05), at + beat / 2)
    b += 1
mus += lofi * section(0, 12.4, 0.8, 0.6)

# 2) ceria memantul, 116 BPM, C G Am F (lebih pelan di bawah penjelasan Joks)
bright = np.zeros_like(mus); beat2 = 60 / 116; s2 = 12.4
chords2 = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
nb = int((42.1 - s2) / beat2) + 1
for b in range(nb):
    at = s2 + b * beat2; ch = chords2[(b // 4) % 4]
    for k, m in enumerate(ch + [ch[1] + 12]):
        mix_into(bright, tone(hz(m + 12), beat2 * 0.45, "pluck", a=0.002, dc=0.2) * 0.12, at + k * beat2 / 4)
    if b % 4 == 0: mix_into(bright, tone(hz(ch[0] - 12), beat2 * 4, "tri", a=0.02, dc=0.6, s=0.5) * 0.3, at)
    if b % 2 == 0: mix_into(bright, kick(0.35), at)
    mix_into(bright, hat(0.1), at + beat2 / 2)
duck = np.ones_like(mus); i0, i1 = int(22.4 * SR), int(37.7 * SR); duck[i0:i1] = 0.6
mus += bright * section(12.4, 42.1, 0.3, 0.25) * duck

# 3) kejar-kejaran kartun: piano cepat 168 BPM, oom-pah + lari kromatik
chase = np.zeros_like(mus); beat3 = 60 / 168; s3 = 46.1
bass = [43, 50, 43, 50, 45, 52, 47, 50]
run = [67, 68, 69, 70, 71, 72, 71, 70, 69, 68, 67, 66, 67, 71, 74, 79]
nb = int((66.2 - s3) / beat3) + 1
for b in range(nb):
    at = s3 + b * beat3
    tr = [0, 2, 5, 3][(b // 32) % 4]
    if b % 2 == 0: mix_into(chase, tone(hz(bass[(b // 2) % 8] + tr), beat3 * 0.8, "piano", a=0.003, dc=0.2) * 0.35, at)
    else: mix_into(chase, sum(tone(hz(m), beat3 * 0.6, "piano", a=0.003, dc=0.15) for m in [62 + tr, 65 + tr, 69 + tr]) * 0.12, at)
    for k in range(2):
        mix_into(chase, tone(hz(run[(b * 2 + k) % 16] + 12 + tr), beat3 * 0.45, "piano", a=0.002, dc=0.12) * 0.13, at + k * beat3 / 2)
    if b % 2 == 0: mix_into(chase, kick(0.3), at)
duck3 = np.ones_like(mus); duck3[int(47.2 * SR):int(66.0 * SR)] = 0.7
mus += chase * section(46.1, 66.2, 0.05, 0.6) * duck3

# 4) lembut di bawah laptop, lalu 5) ceria penutup
soft = np.zeros_like(mus)
for k, m in enumerate([60, 64, 67, 72]):
    mix_into(soft, tone(hz(m), 3.2, "sine", a=0.4, dc=2.6, s=0.5, r=0.5) * 0.08, 66.2 + k * 0.08)
mus += soft * section(66.2, 69.3, 0.5, 0.3)
end = np.zeros_like(mus)
for b in range(int((TOTAL - 69.3) / beat2) + 1):
    at = 69.3 + b * beat2; ch = chords2[b // 4 % 4]
    for k, m in enumerate(ch): mix_into(end, tone(hz(m + 12), beat2 * 0.45, "pluck", a=0.002, dc=0.2) * 0.14, at + k * beat2 / 4)
    if b % 2 == 0: mix_into(end, kick(0.35), at)
mus += end * section(69.3, TOTAL, 0.1, 0.9)

save(os.path.join(OUT, "music2.wav"), norm(mus, 0.8))
print("done")
