/**
 * Shadow GTA Plays — Niko Bellic "aura" edit (music edit, no voiceover).
 * 1080x1920, 30 fps, ~20 s on an ORIGINAL phonk beat (aura/phonk.wav, made
 * by promo/aura/make_phonk.py — copyright-free; owner may swap a trending
 * sound in-app, cuts sit on a 130 BPM grid).
 * Intro: smooth slow-mo Niko (minterpolated), B&W, slow push + letterbox.
 * Drop: cut every 2 beats, then every beat; zoom punch + shake + red flash on
 * kicks. Outro: dreamy slow-mo + "LEGENDS NEVER DIE". Text centred at ~75 %.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AURA, AURA_SHOTS, AuraShot } from "./nikoAuraData";

export const AURA_DURATION = AURA.duration;
const { beat: BT, drop: DROP } = AURA;
const FAST_AT = DROP + 16 * BT; // cuts every beat from here
const OUTRO_AT = AURA_SHOTS[AURA_SHOTS.length - 1].at;

const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const RED = "#E0182D";

const FILES = { stream: "shadow4/stream.mp4", slow_a: "aura/slow_a.mp4", slow_b: "aura/slow_b.mp4" };
const SRCW = 1280, SRCH = 640;

// kicks (every 2 beats after the drop) drive punches / shake / flashes
const kickAge = (t: number) => {
  if (t < DROP) return 99;
  const n = Math.floor((t - DROP) / (2 * BT));
  return t - (DROP + n * 2 * BT);
};

const Shot: React.FC<{ s: AuraShot; dur: number; grade: string }> = ({ s, dur, grade }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = frame / fps;
  const slow = s.file !== "stream";
  const punch = slow ? 1 : 1 + 0.14 * (1 - p(k, 0, 0.28));
  const push = 1 + (slow ? 0.18 : 0.05) * (k / Math.max(dur, 0.1));
  const sc = (1920 / SRCH) * 1.12 * punch * push;
  const W = SRCW * sc, H = SRCH * sc;
  const i = Math.min(s.fx.length - 1, k * s.rate * 5);
  const i0 = Math.floor(i), i1 = Math.min(s.fx.length - 1, i0 + 1);
  const fx = s.fx[i0] + (s.fx[i1] - s.fx[i0]) * (i - i0);
  const left = Math.min(0, Math.max(1080 - W, 540 - fx * W));
  const top = 1920 * 0.4 - H * 0.4;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(FILES[s.file])} startFrom={slow ? 0 : Math.round(s.src * fps)} playbackRate={s.rate} muted
        style={{ position: "absolute", left, top, width: W, height: H, maxWidth: "none", filter: grade }} />
    </AbsoluteFill>
  );
};

const BigText: React.FC<{ t: number; at: number; until: number; text: string; size: number; y: number; color?: string; track?: number }> = ({ t, at, until, text, size, y, color = "#fff", track = -4 }) => {
  if (t < at - 0.02 || t > until + 0.25) return null;
  const k = p(t, at, at + 0.18);
  const o = 1 - p(t, until, until + 0.22);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: y, transform: `translateY(-50%) scale(${1.25 - 0.25 * k})`, opacity: Math.min(k * 1.6, 1) * o, textAlign: "center",
      fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 0.95, letterSpacing: track, color, textTransform: "uppercase",
      textShadow: `0 0 30px rgba(0,0,0,.8), 0 0 ${color === RED ? 40 : 18}px ${color === RED ? "rgba(224,24,45,.6)" : "rgba(255,255,255,.35)"}` }}>{text}</div>
  );
};

export const NikoAura: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const ka = kickAge(t);
  const live = t >= DROP && t < OUTRO_AT;
  const shakeAmp = live ? 14 * Math.exp(-ka * 9) : 0;
  const sx = Math.sin(t * 93) * shakeAmp, sy = Math.cos(t * 71) * shakeAmp;
  const flash = live ? 0.28 * Math.exp(-ka * 14) : 0;
  // grade: intro / outro colder B&W, drop keeps a bit of red
  const sat = t < DROP || t >= OUTRO_AT ? 0.05 : 0.45;
  const grade = `grayscale(${1 - sat}) contrast(1.35) brightness(${t < DROP ? 0.9 : 0.97})`;
  const bars = t < DROP ? 1 - p(t, DROP - 0.25, DROP) : t >= OUTRO_AT ? p(t, OUTRO_AT, OUTRO_AT + 0.6) : 0;
  const introFade = p(t, 0, 0.6);
  const endFade = p(t, AURA.duration - 0.6, AURA.duration);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
        {AURA_SHOTS.map((s, i) => {
          const end = i + 1 < AURA_SHOTS.length ? AURA_SHOTS[i + 1].at : AURA.duration;
          return (
            <Sequence key={i} from={f(s.at)} durationInFrames={f(end) - f(s.at) + 1}>
              <Shot s={s} dur={end - s.at} grade={grade} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 45%, rgba(0,0,0,.75) 100%)" }} />
      {/* red kick flash (never white) */}
      <AbsoluteFill style={{ background: RED, opacity: flash, mixBlendMode: "screen" }} />
      {/* cinematic bars */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 170 * bars, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170 * bars, background: "#000" }} />

      {/* intro whisper text */}
      <BigText t={t} at={1.4} until={DROP - 0.3} text="he's back." size={70} y={1440} track={2} />
      {/* drop */}
      <BigText t={t} at={DROP} until={DROP + 2 * BT - 0.05} text="NIKO" size={260} y={1440} />
      <BigText t={t} at={DROP + 2 * BT} until={DROP + 4 * BT - 0.05} text="BELLIC" size={230} y={1440} color={RED} />
      <BigText t={t} at={DROP + 8 * BT} until={DROP + 10 * BT - 0.05} text="GTA VI" size={230} y={1440} />
      {/* outro */}
      <BigText t={t} at={OUTRO_AT + 0.3} until={AURA.duration - 0.5} text="legends" size={150} y={1330} />
      <BigText t={t} at={OUTRO_AT + 0.3 + 2 * BT} until={AURA.duration - 0.5} text="never" size={150} y={1470} />
      <BigText t={t} at={OUTRO_AT + 0.3 + 4 * BT} until={AURA.duration - 0.5} text="die." size={150} y={1610} color={RED} />
      <BigText t={t} at={OUTRO_AT + 0.3 + 6 * BT} until={AURA.duration - 0.4} text="shadow gta plays" size={34} y={1780} track={6} />

      <AbsoluteFill style={{ background: "#000", opacity: Math.max(1 - introFade, endFade) }} />
      <Audio src={staticFile("aura/phonk.wav")} />
    </AbsoluteFill>
  );
};
