"""Buat data dialog video 2 (start, durasi, teks naskah, timing per kata) dari asr.json.
Teks subtitle memakai naskah; timing kata diambil dari Whisper bila jumlah kata sama, selain itu manual/proporsional.
Pemakaian: python make_lines.py <asr.json> <out.json>"""
import json, sys

asr = json.load(open(sys.argv[1], encoding="utf-8"))

# m5 dipecah dua (public/audio2/m5a.mp3 = 0-1,95 dtk, m5b.mp3 = 1,95 dtk-akhir)
asr["m5a"] = {"dur": 1.95, "words": []}
asr["m5b"] = {"dur": 1.446, "words": []}

# omelan Joks: hanya bagian tengah yang disensor (dibisukan + bunyi "tiit")
J5_CENSOR = [4.78, 7.46]  # detik relatif terhadap awal j5 (jeda hening sebelum "gonore" & sesudah "AIDS")
J5_TEXT = ("dasar kamu miskin, sulit, susah, ripuh, busung lapar, homeless, #@$%! #@$%! #@$%! #@$%! "
           "rumah kardus, meninggal aja kamu ya, gak ngotak! sana sini minta murah! revisi aja belom kelar")

# detik sejak awal video utama (setelah cover)
LINES = [
    ("m1", 0.3, "emang kalau aku konsul ke jokoding… skripsiku pasti selesai?"),
    ("l1", 4.55, "ya enggak juga sih. tapi apa salahnya dicoba dulu?"),
    ("m2", 8.4, "…iya juga sih."),
    ("j1", 13.8, "haii! aku J.O.K.S, joks! ada yang bisa kubantu?"),
    ("m3", 18.0, "eh… aku mau konsul soal skripsiku. bisa bantu aku?"),
    ("j2", 22.4, "bisa dong! gampang, cuma lima langkah. satu, konsultasi dulu, gratis. dua, deal harga, bisa nego. "
                 "tiga, tim jokoding bantu garap. empat, kamu cek, kurang sreg? revisi. lima, serah terima. beres!"),
    ("m4", 37.85, "oke oke… kalau lima ribu, skripsiku bisa selesai nggak?"),
    ("j3", 42.9, "lima ribu?"),
    ("j4", 44.5, "lima ribu?!"),
    ("j5", 47.2, J5_TEXT),
    ("m5a", 47.2 + J5_CENSOR[0] + 0.1, "aduh! ampun,"),
    ("m5b", 61.45, "ampun, joks!"),
    ("j6", 63.0, "lima ribu mah buat beli es cekek aja, masss!!"),
    ("l2", 66.5, "joks udah marah nih. apa pilihanmu?"),
]
MANUAL = {
    "j1": [[0, "haii!"], [0.76, "aku"], [0.94, "J.O.K.S,"], [2.12, "joks!"], [2.98, "ada"], [3.08, "yang"], [3.2, "bisa"], [3.34, "kubantu?"]],
    "m5a": [[0, "aduh!"], [1.08, "ampun,"]],
    "m5b": [[0.23, "ampun,"], [0.83, "joks!"]],
    "j6": [[0, "lima"], [0.2, "ribu"], [0.4, "mah"], [0.84, "buat"], [1.22, "beli"], [1.56, "es"], [1.8, "cekek"], [2.12, "aja,"], [2.42, "masss!!"]],
}

out = {}
for id_, start, text in LINES:
    a = asr[id_]
    words = text.split()
    if id_ in MANUAL:
        wt = MANUAL[id_]
    elif len(a["words"]) == len(words):
        wt = [[w[0], t] for w, t in zip(a["words"], words)]
    else:
        print("proporsional:", id_, len(a["words"]), len(words))
        span = a["voiceEnd"] - a["voiceStart"]
        tot = sum(len(w) + 1 for w in words)
        acc, wt = 0, []
        for w in words:
            wt.append([round(a["voiceStart"] + span * acc / tot, 2), w])
            acc += len(w) + 1
    out[id_] = {"start": start, "dur": a["dur"], "text": text, "words": wt}
out["j5"]["censor"] = J5_CENSOR
json.dump(out, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(out))
