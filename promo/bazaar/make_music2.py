#!/usr/bin/env python3
"""Energetic original promo track (120 BPM) with risers + impacts at given times.
Usage: python3 make_music2.py out.wav seconds "4.3,14.6"   (impact times in s)"""
import sys, wave
import numpy as np

SR = 48000
dur = float(sys.argv[2])
hits = [float(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 and sys.argv[3] else []
bpm = 120.0
beat = 60 / bpm
N = int(SR * dur)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def put(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(sig)); s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))
def onepole(x, a):
    y = np.empty_like(x); acc = 0.0
    aa = np.broadcast_to(np.asarray(a, dtype=float), x.shape)
    for k in range(len(x)):
        acc += aa[k] * (x[k] - acc); y[k] = acc
    return y

# sidechain pump envelope (ducks on every beat)
t_all = np.arange(N) / SR
phase = (t_all % beat) / beat
pump = 0.35 + 0.65 * np.clip(phase / 0.45, 0, 1) ** 0.6

prog = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 52, 55, 59, 64], [55, 59, 62, 66, 67]]  # Am9 Fmaj7 Cmaj7 G
bar = 4 * beat
# pads (pumped) + bass + plucks
for b in range(int(dur / bar) + 1):
    ch = prog[b % 4]; t0 = b * bar
    n = int(bar * SR) + 2000; tt = np.arange(n) / SR
    pad = sum(np.sign(np.sin(2 * np.pi * hz(m) * tt)) * 0.15 + np.sin(2 * np.pi * hz(m) * 1.004 * tt) for m in ch[1:])
    pad = onepole(pad, 0.06) * 0.03
    pad *= np.minimum(1, tt / 0.05) * np.minimum(1, (n / SR - tt) / 0.1)
    i0 = int(t0 * SR); j0 = min(N, i0 + n)
    if i0 < N:
        seg = pad[: j0 - i0] * pump[i0:j0]
        L[i0:j0] += seg * 0.9; R[i0:j0] += seg * 1.1
    # bass: root on 8ths with octave bounce
    for k in range(8):
        bt = t0 + k * beat / 2
        m = ch[0] - 24 + (12 if k % 4 == 3 else 0)
        bn = int(0.22 * SR); bt_ = np.arange(bn) / SR
        bass = np.tanh(2.2 * np.sin(2 * np.pi * hz(m) * bt_)) * np.exp(-bt_ * 9) * 0.16
        put(bass, bt)
    # plucks 16ths pattern
    pat = [0, 2, 3, 1, 4, 2, 3, 1, 0, 2, 4, 3, 1, 2, 3, 4]
    for k, p in enumerate(pat):
        bt = t0 + k * beat / 4
        if k % 2 and k % 4 != 3: continue
        m = ch[p] + 12
        pn = int(0.3 * SR); pt = np.arange(pn) / SR
        f = hz(m)
        pl = (np.sin(2 * np.pi * f * pt) + 0.4 * np.sin(4 * np.pi * f * pt)) * np.exp(-pt * 11) * 0.05
        put(pl, bt, 0.35 if k % 8 < 4 else -0.35)

# drums: kick 4-on-floor, clap 2&4, 16th hats with accents
k = 0
while k * beat < dur - beat:
    bt = k * beat
    kn = int(0.4 * SR); kt = np.arange(kn) / SR
    f = 120 * np.exp(-kt * 28) + 42
    kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 7) * 0.42
    put(kick, bt)
    if k % 2 == 1:
        cn = int(0.25 * SR); ct = np.arange(cn) / SR
        clap = rng.standard_normal(cn) * (np.exp(-ct * 30) + 0.5 * np.exp(-np.maximum(0, ct - 0.012) * 30)) * 0.09
        clap = clap - onepole(clap, 0.08)  # highpass-ish
        put(clap, bt)
    for h in range(4):
        hn = int(0.04 * SR)
        hat = np.diff(rng.standard_normal(hn + 1)) * np.exp(-np.arange(hn) / SR * 90) * (0.035 if h == 2 else 0.018)
        put(hat, bt + h * beat / 4 + (0.012 if h % 2 else 0), 0.45)
    k += 1

# risers before + impacts on hits
for h in hits:
    rn = int(1.2 * SR); rt = np.arange(rn) / SR
    noise = rng.standard_normal(rn)
    rise = (noise - onepole(noise, 0.02 + 0.5 * rt / 1.2)) * (rt / 1.2) ** 2 * 0.12
    put(rise, h - 1.2, 0.0)
    imn = int(1.4 * SR); it = np.arange(imn) / SR
    boom = np.sin(2 * np.pi * (55 * np.exp(-it * 2) + 30) * it) * np.exp(-it * 2.5) * 0.5
    crash = rng.standard_normal(imn) * np.exp(-it * 3) * 0.05
    put(boom + crash, h)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= max(1e-6, np.abs(mix).max()) / 0.9
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("ok", dur)
