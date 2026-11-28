#!/usr/bin/env python3
"""Original drift-phonk style beat for "aura" edits (copyright-free, made from scratch).
130 BPM. 2-bar filtered intro + riser, DROP on bar 3 (cowbell melody, distorted 808, hats).
Usage: python3 make_phonk.py out.wav [bars_after_drop=6]
Prints the drop time and every beat time (JSON) so the edit can cut on them."""
import sys, json, wave
import numpy as np

SR = 48000
BPM = 130.0
BEAT = 60 / BPM
BAR = 4 * BEAT
INTRO_BARS = 2
POST = int(sys.argv[2]) if len(sys.argv) > 2 else 6
TAIL = 1.6
DROP = INTRO_BARS * BAR
DUR = DROP + POST * BAR + TAIL
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)


def hz(m): return 440 * 2 ** ((m - 69) / 12)


def put(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 120 * np.exp(-t * 35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    return np.tanh(s * 2.5)


def snare():
    n = int(0.3 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 18) * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5
    return np.tanh(s * 1.8)


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n)
    s = np.diff(np.r_[0, s])  # crude high-pass
    return s * np.exp(-t * (14 if open_ else 70)) * 0.35


def cowbell(m, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    f1, f2 = hz(m), hz(m) * 1.48
    s = (np.sign(np.sin(2 * np.pi * f1 * t)) + np.sign(np.sin(2 * np.pi * f2 * t))) * 0.5
    s = np.convolve(s, np.ones(6) / 6, "same")  # soften
    return s * env(n, 0.001, 0.09) * 0.55


def b808(m, dur, slide_to=None):
    n = int(dur * SR); t = np.arange(n) / SR
    f = np.full(n, hz(m))
    if slide_to is not None:
        k = np.clip((t - dur * 0.55) / (dur * 0.3), 0, 1)
        f = hz(m) * (hz(slide_to) / hz(m)) ** k
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s = np.tanh(s * 3.0) * np.minimum(1, t / 0.005) * np.exp(-t * 1.2)
    return s * 0.8


# ---- intro: dark pad + filtered cowbell hint + riser ----
pad_n = int(DROP * SR); tt = np.arange(pad_n) / SR
pad = sum(np.sin(2 * np.pi * hz(m) * tt) + 0.5 * np.sin(2 * np.pi * hz(m) * 1.003 * tt) for m in (45, 52, 57, 60))
pad *= np.minimum(1, tt / 1.0) * 0.06
put(pad, 0, 0, 1)
MEL = [69, 69, 72, 69, 76, 74, 72, 69,  69, 69, 72, 74, 72, 69, 67, 64]  # 16 steps (8th notes) per 2 bars
for i in range(INTRO_BARS * 8):
    if i % 2 == 0:
        c = cowbell(MEL[i % 16]) * 0.35
        c = np.convolve(c, np.ones(40) / 40, "same")  # muffled (low-passed) in the intro
        put(c, i * BEAT / 2, 0.15, 1)
# riser (noise sweep) into the drop
rn = int(BAR * SR); rt = np.arange(rn) / SR
riser = rng.standard_normal(rn) * (rt / BAR) ** 2 * 0.25
put(riser, DROP - BAR, 0, 1)
put(kick() * 0.9, DROP - BEAT * 0.5, 0, 0.6)

# ---- drop ----
beats = []
for b in range(POST * 4):
    t0 = DROP + b * BEAT
    beats.append(round(t0, 4))
    if b % 2 == 0: put(kick(), t0, 0, 0.95)
    if b % 4 == 2: put(snare(), t0, 0, 0.8)
    if b % 8 == 7: put(kick(), t0 + BEAT * 0.5, 0, 0.7)
    for h in range(4):  # 16th hats with rolls
        put(hat(open_=(h == 2 and b % 4 == 3)), t0 + h * BEAT / 4, -0.2, 0.9 if h % 2 == 0 else 0.55)
for i in range(POST * 8):  # cowbell melody (8th notes)
    put(cowbell(MEL[i % 16]), DROP + i * BEAT / 2, 0.15, 1)
BASS = [(45, 45), (45, 48), (41, 41), (43, 40)]  # per bar (note, slide target)
for b in range(POST):
    m, s = BASS[b % 4]
    put(b808(m, BAR * 0.95, s if s != m else None), DROP + b * BAR, 0, 0.9)

# ---- tail: last cowbell ring + sub ----
put(cowbell(69, 0.6), DROP + POST * BAR, 0.15, 1)
put(b808(45, TAIL), DROP + POST * BAR, 0, 0.7)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print(json.dumps({"bpm": BPM, "beat": BEAT, "drop": round(DROP, 4), "duration": round(DUR, 3), "beats": beats}))
