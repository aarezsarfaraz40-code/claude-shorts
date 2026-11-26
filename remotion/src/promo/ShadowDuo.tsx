/**
 * Shadow GTA Plays — Ned Luke (Michael) & Steven Ogg (Trevor) talk GTA 6.
 * 1080x1920, 30 fps, split screen (Ned top / Ogg bottom), GTA 6 trailer
 * cards at the seam, Mike voiceover intro/outro, logo + subscribe end on the
 * blurred video (no white screen), Montserrat captions, no background music.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DUO } from "./shadowDuoData";

type Rect = { x: number; y: number; w: number; h: number };
const SRC = { w: 1600, h: 720 };
// boxes inside the stream recording (source pixels)
const TALK_NED: Rect = { x: 170, y: 196, w: 610, h: 334 };
const TALK_OGG: Rect = { x: 816, y: 362, w: 612, h: 336 };
const GP_NED: Rect = { x: 190, y: 259, w: 292, h: 159 };
const GP_OGG: Rect = { x: 190, y: 451, w: 292, h: 159 };
const GP_GAME: Rect = { x: 520, y: 208, w: 888, h: 488 };

// timeline (reel seconds) ↔ source seconds
const INTRO = 5.2;
const SEGS = [
  { kind: "gameplay", src: [10.35, 20.6], key: "A" },
  { kind: "talk", src: [82.6, 93.6], key: "B" },
  { kind: "talk", src: [120.6, 127.9], key: "C" },
] as const;
const segStart: number[] = [];
{ let t = INTRO; for (const s of SEGS) { segStart.push(t); t += s.src[1] - s.src[0]; } }
const CLIPS_END = segStart[2] + (SEGS[2].src[1] - SEGS[2].src[0]);
const OUTRO = 6.4;
// The source screen recording is out of sync: its picture runs ~0.96 s behind
// its sound (measured: mouth opening vs speech envelope). Show picture from
// this much later in the file so lips match the voice.
const VIDEO_LAG = 0.96;
export const DUO_DURATION = Math.ceil((CLIPS_END + OUTRO) * 10) / 10;
const toReel = (seg: number, srcT: number) => segStart[seg] + (srcT - SEGS[seg].src[0]);

// GTA 6 trailer cards at the seam
const CARDS = [
  { file: "tr_aerial.mp4", at: toReel(0, 17.2), dur: 3.3 },
  { file: "tr_jl.mp4", at: toReel(1, 83.6), dur: 3.0 },
  { file: "tr_jetski.mp4", at: toReel(1, 91.2), dur: 2.4 },
  { file: "tr_lucia_hair.mp4", at: toReel(2, 125.7), dur: 2.2 },
];

const C = { yellow: "#FFD400", pink: "#FF3D8B", purple: "#C77DFF", white: "#FFFFFF", red: "#FF0033", ink: "#111214" };
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const BOUNCE = Easing.bezier(0.34, 1.5, 0.64, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.08, textTransform: "uppercase", letterSpacing: -0.5, ...extra });
const shadow = "0 5px 16px rgba(0,0,0,.85), 0 0 3px rgba(0,0,0,.95), 2px 2px 0 rgba(0,0,0,.6)";
const SAFE = { left: 150, right: 930 };

/** Shows `box` (source rect) of the stream video covering `dest`, focused at fx/fy (0-1 inside box). */
const Crop: React.FC<{ startFrom: number; box: Rect; dest: Rect; fx?: number; fy?: number }> = ({ startFrom, box, dest, fx = 0.5, fy = 0.5 }) => {
  const { fps } = useVideoConfig();
  const s = Math.max(dest.w / box.w, dest.h / box.h);
  const visW = dest.w / s, visH = dest.h / s;
  const sx = Math.min(box.x + box.w - visW, Math.max(box.x, box.x + fx * box.w - visW / 2));
  const sy = Math.min(box.y + box.h - visH, Math.max(box.y, box.y + fy * box.h - visH / 2));
  return (
    <div style={{ position: "absolute", left: dest.x, top: dest.y, width: dest.w, height: dest.h, overflow: "hidden", background: "#000" }}>
      <OffthreadVideo src={staticFile("shadow2/stream.mp4")} startFrom={Math.round(startFrom * fps)} muted style={{ position: "absolute", left: -sx * s, top: -sy * s, width: SRC.w * s, height: SRC.h * s, maxWidth: "none", filter: "contrast(1.05) saturate(1.08)" }} />
    </div>
  );
};

const TOP: Rect = { x: 0, y: 0, w: 1080, h: 960 };
const BOT: Rect = { x: 0, y: 960, w: 1080, h: 960 };
const TalkSplit: React.FC<{ srcFrom: number }> = ({ srcFrom }) => (
  <AbsoluteFill>
    <Crop startFrom={srcFrom} box={TALK_NED} dest={TOP} fx={0.48} fy={0.46} />
    <Crop startFrom={srcFrom} box={TALK_OGG} dest={BOT} fx={0.51} fy={0.36} />
    <div style={{ position: "absolute", left: 0, top: 956, width: 1080, height: 8, background: "#000" }} />
  </AbsoluteFill>
);
// gameplay part of the stream: game on top, the person who is SPEAKING below
// (Ned asks until src 15.9 s, then Ogg answers), soft crossfade between them
const SPEAKER_SWITCH = 15.9;
const GameplaySplit: React.FC<{ srcFrom: number }> = ({ srcFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const srcT = srcFrom + frame / fps;
  const k = interpolate(srcT, [SPEAKER_SWITCH - 0.15, SPEAKER_SWITCH + 0.2], [0, 1], { ...CL, easing: IO });
  return (
    <AbsoluteFill style={{ background: "#0d0b12" }}>
      <Crop startFrom={srcFrom} box={GP_GAME} dest={TOP} fx={0.5} fy={0.5} />
      <AbsoluteFill style={{ opacity: 1 - k }}><Crop startFrom={srcFrom} box={GP_NED} dest={BOT} fx={0.5} fy={0.42} /></AbsoluteFill>
      <AbsoluteFill style={{ opacity: k }}><Crop startFrom={srcFrom} box={GP_OGG} dest={BOT} fx={0.5} fy={0.42} /></AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 956, width: 1080, height: 8, background: "#000" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions (Montserrat, max 3 words)
type Word = { text: string; startMs: number; endMs: number };
const YELLOW = new Set(["GTA", "6", "MICHAEL", "TREVOR", "NED", "LUKE", "STEVEN", "OGG", "GRAPHICS", "BONNIE", "CLYDE", "SIX", "SHADOW", "PLAYS"]);
const PINK = new Set(["PHENOMENAL", "BLOW", "RAMPAGE", "LOVERS", "FLOW", "SUBSCRIBE", "STEALING"]);
const words: Word[] = [
  ...DUO.mikeA,
  ...SEGS.flatMap((s, i) => DUO[s.key].map((w) => ({ ...w, startMs: w.startMs + (segStart[i] - s.src[0]) * 1000, endMs: w.endMs + (segStart[i] - s.src[0]) * 1000 }))),
];
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t > CLIPS_END) return null;
  const ms = t * 1000;
  const pages: { s: number; e: number; w: Word[] }[] = [];
  for (const c of words) {
    const last = pages[pages.length - 1];
    if (last && last.w.length < 3 && c.startMs - last.s < 900 && !/[.?!,]$/.test(last.w[last.w.length - 1].text.trim())) { last.w.push(c); last.e = c.endMs; }
    else pages.push({ s: c.startMs, e: c.endMs, w: [c] });
  }
  const page = pages.find((pg, i) => ms >= pg.s && ms < Math.min(pages[i + 1]?.s ?? 1e9, pg.e + 700));
  if (!page) return null;
  const ws = page.w.map((w) => w.text.trim());
  const longest = Math.max(...ws.map((w) => w.length));
  const size = Math.floor(Math.min(80, 780 / (longest * 0.78), (2 * 780) / (ws.join(" ").length * 0.74 + 2)));
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 690, height: 170, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: "0 20px", textAlign: "center" }}>
      {page.w.map((w, i) => {
        const shown = ms >= w.startMs - 30;
        const k = p(t, w.startMs / 1000, w.startMs / 1000 + 0.18);
        const key = w.text.trim().toUpperCase().replace(/[^A-Z0-9'-]/g, "");
        const color = PINK.has(key) ? C.pink : YELLOW.has(key) ? C.yellow : C.white;
        return <span key={i} style={{ display: "inline-block", visibility: shown ? "visible" : "hidden", color, textShadow: shadow, transform: `translateY(${(1 - k) * 22}px) scale(${0.7 + 0.3 * k})`, ...T(size) }}>{w.text.trim()}</span>;
      })}
    </div>
  );
};

// ---------------------------------------------------------------- seam card (GTA 6 trailer)
const SeamCard: React.FC<{ file: string; at: number; dur: number; t: number }> = ({ file, at, dur, t }) => {
  if (t < at || t > at + dur) return null;
  const k = interpolate(t, [at, at + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const o = 1 - p(t, at + dur - 0.25, at + dur, IO);
  const w = 720, h = w / 2.39;
  return (
    <div style={{ position: "absolute", left: 540 - w / 2, top: 1000 - h / 2, width: w, opacity: o, transform: `scale(${0.7 + 0.3 * k}) rotate(${(1 - k) * -4}deg)` }}>
      <div style={{ width: w, height: h, borderRadius: 26, overflow: "hidden", border: "5px solid #fff", boxShadow: "0 20px 50px rgba(0,0,0,.6)" }}>
        <OffthreadVideo src={staticFile(`shadow2/${file}`)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 18, top: -22 }}><span style={{ background: C.yellow, color: "#000", padding: "4px 14px", borderRadius: 10, ...T(30) }}>GTA 6</span></div>
    </div>
  );
};

// ---------------------------------------------------------------- name labels (intro)
const NameTag: React.FC<{ t: number; a: number; y: number; name: string; role: string }> = ({ t, a, y, name, role }) => {
  if (t > INTRO + 0.2) return null;
  const k = interpolate(t, [a, a + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const o = 1 - p(t, INTRO - 0.2, INTRO + 0.2, IO);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: o * Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})` }}>
      <div style={{ background: "rgba(10,8,14,.85)", borderRadius: 16, padding: "8px 22px", textAlign: "center", border: `3px solid ${C.purple}`, display: "flex", alignItems: "baseline", gap: 14 }}>
        <div style={{ color: C.white, ...T(38) }}>{name}</div>
        <div style={{ color: C.yellow, ...T(24, { fontWeight: 800 }) }}>{role}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- outro: blur + logo + subscribe
const Outro: React.FC<{ t: number }> = ({ t }) => {
  const S = CLIPS_END;
  if (t < S - 0.4) return null;
  const blur = p(t, S - 0.4, S + 0.3, IO);
  const logo = interpolate(t, [S + 0.1, S + 0.75], [0, 1], { ...CL, easing: BOUNCE });
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  const q = p(t, S + 0.4, S + 0.8);
  const subAt = S + 3.25; // Mike says "Subscribe"
  const btn = interpolate(t, [subAt, subAt + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = subAt + 1.0, tapped = t >= tapT;
  const tapK = p(t, tapT, tapT + 0.3);
  const bell = Math.sin(Math.max(0, t - tapT - 0.2) * 22) * 18 * (1 - p(t, tapT + 0.2, tapT + 1.0));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(8,6,12,${0.55 * blur})` }} />
      <div style={{ position: "absolute", left: 540 - 230, top: 330, width: 460, height: 460, borderRadius: 40, overflow: "hidden", opacity: Math.min(1, logo * 1.5), transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -25}deg)`, boxShadow: `0 0 ${40 + 40 * glow}px rgba(199,125,255,${0.55 + 0.3 * glow}), 0 30px 60px rgba(0,0,0,.6)`, border: `4px solid ${C.purple}` }}>
        <Img src={staticFile("shadow2/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 860, textAlign: "center", opacity: q * (1 - p(t, subAt - 0.2, subAt + 0.1)), transform: `translateY(${(1 - q) * 30}px)` }}>
        <span style={{ color: C.white, textShadow: shadow, ...T(54) }}>Michael & Trevor back in <span style={{ color: C.yellow }}>GTA 6</span>? 👀</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: btn > 0 ? 1 : 0, transform: `scale(${btn * (tapped ? 1 - 0.08 * Math.sin(tapK * Math.PI) : 1)})` }}>
        <div style={{ padding: "26px 56px", borderRadius: 60, background: tapped ? "#2A2A30" : C.red, color: C.white, boxShadow: "0 18px 40px rgba(0,0,0,.4)", ...T(46, { textTransform: "none" }) }}>{tapped ? "Subscribed ✓" : "Subscribe"}</div>
        <div style={{ fontSize: 70, transform: `rotate(${bell}deg)`, opacity: tapped ? 1 : 0 }}>🔔</div>
      </div>
    </AbsoluteFill>
  );
};

export const ShadowDuo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const blurK = p(t, CLIPS_END - 0.4, CLIPS_END + 0.3, IO);
  const SFX = [
    { at: 0.05, s: "pop", v: 0.16 }, { at: 1.75, s: "pop", v: 0.14 }, { at: 2.3, s: "pop", v: 0.14 },
    ...CARDS.map((c) => ({ at: c.at, s: "pop", v: 0.16 })),
    { at: CLIPS_END - 0.4, s: "whoosh", v: 0.22 }, { at: CLIPS_END + 0.1, s: "impact", v: 0.14 },
    { at: CLIPS_END + 4.25, s: "tick", v: 0.3 }, { at: CLIPS_END + 4.45, s: "bell", v: 0.2 },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <AbsoluteFill style={{ filter: `blur(${blurK * 24}px)`, transform: `scale(${1 + blurK * 0.06})` }}>
        <Sequence durationInFrames={f(INTRO) + 2}><TalkSplit srcFrom={40.0} /></Sequence>
        {SEGS.map((s, i) => (
          <Sequence key={i} from={f(segStart[i])} durationInFrames={f(s.src[1] - s.src[0]) + (i === SEGS.length - 1 ? f(OUTRO) : 2)}>
            {s.kind === "talk" ? <TalkSplit srcFrom={s.src[0] + VIDEO_LAG} /> : <GameplaySplit srcFrom={s.src[0] + VIDEO_LAG} />}
          </Sequence>
        ))}
      </AbsoluteFill>
      {CARDS.map((c, i) => <SeamCard key={i} {...c} t={t} />)}
      <NameTag t={t} a={1.75} y={858} name="Ned Luke" role="Michael · GTA 5" />
      <NameTag t={t} a={2.3} y={972} name="Steven Ogg" role="Trevor · GTA 5" />
      <Captions t={t} />
      <Outro t={t} />
      {SEGS.map((s, i) => (
        <Sequence key={`a${i}`} from={f(segStart[i])} durationInFrames={f(s.src[1] - s.src[0])}>
          <Audio src={staticFile("shadow2/stream.mp4")} startFrom={f(s.src[0])} volume={(fr) => interpolate(fr / fps, [0, 0.08, s.src[1] - s.src[0] - 0.12, s.src[1] - s.src[0]], [0, 1, 1, 0], CL)} />
        </Sequence>
      ))}
      <Sequence from={f(0.1)}><Audio src={staticFile("shadow2/mike_a.wav")} /></Sequence>
      <Sequence from={f(CLIPS_END + 0.1)}><Audio src={staticFile("shadow2/mike_c.wav")} /></Sequence>
      {SFX.map((c, i) => <Sequence key={`s${i}`} from={f(c.at)}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>)}
    </AbsoluteFill>
  );
};
