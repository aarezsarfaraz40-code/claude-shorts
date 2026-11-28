#!/usr/bin/env python3
"""Synthesize an original, royalty-free background track (Apple-style minimal pop).
Usage: python3 make_music.py out.wav [seconds] [bpm] [drums_from_bar]"""
import sys, numpy as np, wave
SR = 48000
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 45
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 100
beat = 60 / bpm
N = int(SR * dur)
L = np.zeros(N); R = np.zeros(N)

def note(f):  # midi -> hz
    return 440 * 2 ** ((f - 69) / 12)

def env(n, a, d, s, r, total):
    e = np.ones(n) * s
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, max(ai, 1))[:min(ai, n)]
    e[ai:ai + di] = np.linspace(1, s, max(di, 1))[:max(0, min(di, n - ai))]
    if ri < n: e[-ri:] *= np.linspace(1, 0, ri)
    return e

def add(buf_l, buf_r, sig, t, pan=0.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N: return
    buf_l[i:j] += sig[: j - i] * (1 - max(0, pan)); buf_r[i:j] += sig[: j - i] * (1 + min(0, pan))

def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(x); acc = 0.0
    for k in range(len(x)):
        acc = (1 - a) * x[k] + a * acc; y[k] = acc
    return y

# chord progression (Cmaj9 - Am7 - Fmaj7 - G6), 2 bars each
prog = [[48, 55, 64, 67, 71, 74], [45, 52, 60, 64, 67, 72], [41, 48, 57, 60, 64, 69], [43, 50, 59, 62, 64, 71]]
bar = 4 * beat
t = 0.0; ci = 0
while t < dur:
    ch = prog[ci % 4]; length = 2 * bar
    n = int(min(length, dur - t) * SR) + int(0.5 * SR)
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * note(m) * tt) * 0.5 + np.sin(2 * np.pi * note(m) * 1.003 * tt) * 0.5 for m in ch[1:])
    pad *= env(n, 0.6, 0.5, 0.7, 0.8, n) * 0.035
    add(L, R, pad, t, -0.2); add(L, R, pad, t + 0.01, 0.2)
    # sub bass on root
    bass = np.sin(2 * np.pi * note(ch[0] - 12) * tt) * env(n, 0.02, 0.3, 0.6, 0.4, n) * 0.12
    add(L, R, bass, t)
    # plucks: arpeggio 8ths
    for k in range(16):
        bt = t + k * beat / 2
        if bt >= dur: break
        m = ch[1 + (k * 3) % 5] + (12 if k % 4 == 3 else 0)
        pn = int(0.45 * SR); pt = np.arange(pn) / SR
        f = note(m)
        pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt) + 0.12 * np.sin(6 * np.pi * f * pt)) * np.exp(-pt * 7) * 0.06
        add(L, R, pl, bt, 0.3 if k % 2 else -0.3)
    t += length; ci += 1

# drums start after the intro (bar 2), stop 2 beats before the end
start = (float(sys.argv[4]) if len(sys.argv) > 4 else 2) * bar
k = 0
while start + k * beat < dur - 2 * beat:
    bt = start + k * beat
    kn = int(0.35 * SR); kt = np.arange(kn) / SR
    if k % 4 in (0, 2):  # kick
        f = 110 * np.exp(-kt * 30) + 45
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kt * 9) * 0.32
        add(L, R, kick, bt)
    if k % 4 in (1, 3):  # soft clap
        cn = int(0.18 * SR); noise = np.random.randn(cn) * np.exp(-np.arange(cn) / SR * 25) * 0.07
        add(L, R, noise, bt)
    for h in (0, 0.5):  # hats
        hn = int(0.05 * SR); hat = np.diff(np.random.randn(hn + 1)) * np.exp(-np.arange(hn) / SR * 80) * 0.025
        add(L, R, hat, bt + h * beat, 0.4)
    k += 1

# gentle stereo master + fade out
mix = np.stack([L, R], 1)
mix /= max(1e-6, np.abs(mix).max()) / 0.85
fo = int(2.5 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
fi = int(0.3 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', dur, 's')
