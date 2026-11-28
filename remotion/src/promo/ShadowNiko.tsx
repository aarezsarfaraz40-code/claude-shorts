/**
 * Shadow GTA Plays — "Niko Bellic is back in GTA 6" (GTA 4 Remaster rumour).
 * 1080x1920, 30 fps. Source: phone screen-recording of the cutscene
 * (shadow4/stream.mp4 = cropped to the 1280x640 picture, CFR, the
 * upside-down part 136.5-171 s already flipped back). Its sound runs ~2.2 s
 * AHEAD of its picture, so the one game-audio bite uses picture = audio + 2.2.
 * Actor face: shadow4/actor.mp4 (Michael Hollick, muted, face only).
 * Mike voiceover, yellow 3D Rockstar logo, purple/white captions at ~75 %,
 * quiet SFX, optional very quiet background music (MUSIC).
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const VO = 2.8; // Mike starts after the game bite
const r = (voT: number) => VO + voT;
const PIC_LAG = 2.2; // picture is late vs. sound in the recording
const BITE = { audio: 136.6, dur: 2.7 }; // Niko: "I don't have to tell you what happens next."
const MUSIC: string | null = null; // e.g. "shadow4/music.mp3" — very low volume bed
const MUSIC_VOL = 0.05;

// band where footage sits (blurred copy fills the rest)
const BAND = { y: 250, h: 1150 };
type ShotT = { at: number; file: "stream" | "actor"; src: number; fx: number };
const SHOTS: ShotT[] = [
  { at: 0, file: "stream", src: BITE.audio + PIC_LAG, fx: 0.45 },
  { at: r(0), file: "stream", src: 9.0, fx: 0.55 }, // Niko Bellic is back
  { at: r(2.0), file: "stream", src: 24.0, fx: 0.5 },
  { at: r(4.4), file: "stream", src: 66.0, fx: 0.38 }, // legend from GTA 4
  { at: r(7.2), file: "stream", src: 48.0, fx: 0.32 }, // walks in, cold as ever
  { at: r(10.5), file: "stream", src: 81.0, fx: 0.35 }, // someone is in big trouble (gun)
  { at: r(11.6), file: "stream", src: 35.5, fx: 0.66 }, // Giorgio
  { at: r(12.9), file: "stream", src: 100.0, fx: 0.33 }, // fans waited years (GTA 5)
  { at: r(16.1), file: "stream", src: 110.0, fx: 0.33 },
  { at: r(17.6), file: "stream", src: 70.0, fx: 0.4 }, // tiny Easter eggs
  { at: r(20.3), file: "actor", src: 2.3, fx: 0.5 }, // Michael Hollick
  { at: r(27.6), file: "stream", src: 151.0, fx: 0.3 }, // the Niko we grew up with
  { at: r(29.6), file: "stream", src: 130.0, fx: 0.5 }, // why bring Niko back now?
  { at: r(32.4), file: "stream", src: 94.5, fx: 0.45 }, // GTA 4 remaster rumours
  { at: r(36.5), file: "stream", src: 133.0, fx: 0.7 }, // Rockstar's first hint
  { at: r(39.5), file: "stream", src: 156.0, fx: 0.5 }, // would you play it?
  { at: r(43.3), file: "stream", src: 158.0, fx: 0.5 }, // outro background
];
export const NIKO_DURATION = 52.2;
const LOGO_A = r(37.7), LOGO_B = r(39.4);
const OUTRO_AT = r(43.5);

const WORDS: [string, number, number][] = [
  ["Niko", 0.0, 0.54],
  ["Bellic", 0.54, 0.98],
  ["is", 0.98, 1.22],
  ["back!", 1.22, 1.62],
  ["And", 2.02, 2.16],
  ["he", 2.16, 2.26],
  ["just", 2.26, 2.52],
  ["showed", 2.52, 2.76],
  ["up", 2.76, 2.98],
  ["in", 2.98, 3.1],
  ["GTA", 3.1, 3.4],
  ["6!", 3.4, 3.98],
  ["Yes,", 4.44, 4.84],
  ["the", 5.12, 5.26],
  ["legend", 5.26, 5.66],
  ["from", 5.66, 5.9],
  ["GTA", 5.9, 6.28],
  ["4!", 6.28, 6.86],
  ["In", 7.28, 7.42],
  ["this", 7.42, 7.6],
  ["cutscene,", 7.6, 8.04],
  ["Niko", 8.4, 8.6],
  ["walks", 8.6, 8.96],
  ["in,", 8.96, 9.28],
  ["cold", 9.56, 9.8],
  ["as", 9.8, 9.98],
  ["ever,", 9.98, 10.26],
  ["and", 10.56, 10.72],
  ["someone", 10.72, 11.14],
  ["is", 11.14, 11.44],
  ["in", 11.44, 11.6],
  ["big", 11.6, 12.0],
  ["trouble.", 12.0, 12.5],
  ["Fans", 12.94, 13.24],
  ["waited", 13.24, 13.58],
  ["years", 13.58, 14.12],
  ["to", 14.12, 14.4],
  ["see", 14.4, 14.56],
  ["Niko", 14.56, 14.88],
  ["in", 14.88, 15.04],
  ["GTA", 15.04, 15.36],
  ["5,", 15.36, 15.8],
  ["but", 16.14, 16.32],
  ["he", 16.32, 16.58],
  ["never", 16.58, 16.8],
  ["showed", 16.8, 17.06],
  ["up.", 17.06, 17.34],
  ["Just", 17.66, 17.82],
  ["a", 17.82, 18.0],
  ["few", 18.0, 18.16],
  ["tiny", 18.16, 18.48],
  ["Easter", 18.48, 18.84],
  ["eggs,", 18.84, 19.14],
  ["nothing", 19.38, 19.64],
  ["more.", 19.64, 19.94],
  ["This", 20.36, 20.7],
  ["is", 20.7, 20.92],
  ["Michael", 20.92, 21.22],
  ["Hollick,", 21.22, 21.68],
  ["the", 21.98, 22.04],
  ["man", 22.04, 22.24],
  ["who", 22.24, 22.4],
  ["brought", 22.4, 22.58],
  ["Niko", 22.58, 22.9],
  ["to", 22.9, 23.08],
  ["life", 23.08, 23.32],
  ["back", 23.32, 23.58],
  ["in", 23.58, 23.74],
  ["2008.", 23.74, 24.4],
  ["His", 24.8, 24.96],
  ["voice,", 24.96, 25.32],
  ["his", 25.72, 25.82],
  ["face,", 25.82, 26.18],
  ["his", 26.6, 26.72],
  ["attitude,", 26.72, 27.22],
  ["that's", 27.68, 28.02],
  ["the", 28.02, 28.16],
  ["Niko", 28.16, 28.4],
  ["we", 28.4, 28.66],
  ["all", 28.66, 28.96],
  ["grew", 28.96, 29.18],
  ["up", 29.18, 29.4],
  ["with.", 29.4, 29.64],
  ["So,", 29.64, 30.22],
  ["why", 30.52, 30.68],
  ["bring", 30.68, 30.96],
  ["Niko", 30.96, 31.24],
  ["back", 31.24, 31.5],
  ["now?", 31.5, 31.84],
  ["Rumors", 32.4, 32.7],
  ["about", 32.7, 32.94],
  ["a", 32.94, 33.1],
  ["GTA", 33.1, 33.38],
  ["4", 33.38, 33.8],
  ["remaster", 33.8, 34.4],
  ["have", 34.4, 34.62],
  ["been", 34.62, 34.74],
  ["going", 34.74, 34.94],
  ["around", 34.94, 35.28],
  ["for", 35.28, 35.48],
  ["a", 35.48, 35.6],
  ["long", 35.6, 35.88],
  ["time,", 35.88, 36.26],
  ["and", 36.56, 36.68],
  ["this", 36.68, 36.86],
  ["cameo", 36.86, 37.38],
  ["might", 37.38, 37.7],
  ["be", 37.7, 37.88],
  ["Rockstar's", 37.88, 38.46],
  ["first", 38.46, 38.72],
  ["hint.", 38.72, 39.04],
  ["Would", 39.58, 39.66],
  ["you", 39.66, 39.82],
  ["play", 39.82, 40.0],
  ["GTA", 40.0, 40.34],
  ["4", 40.34, 40.7],
  ["remastered?", 40.7, 41.38],
  ["Yes", 41.64, 41.84],
  ["or", 41.84, 42.0],
  ["no?", 42.0, 42.2],
  ["Tell", 42.54, 42.62],
  ["me", 42.62, 42.76],
  ["in", 42.76, 42.84],
  ["the", 42.84, 42.92],
  ["comments!", 42.92, 43.2],
  ["Subscribe", 43.7, 44.02],
  ["to", 44.02, 44.28],
  ["Shadow", 44.28, 44.54],
  ["GTA", 44.54, 44.9],
  ["Plays", 44.9, 45.5],
  ["for", 45.5, 45.64],
  ["more", 45.64, 45.86],
  ["videos", 45.86, 46.2],
  ["like", 46.2, 46.46],
  ["this!", 46.46, 47.18],
];
const KEY = new Set(["niko", "bellic", "back!", "6!", "4!", "legend", "big", "trouble.", "years", "5,", "never", "easter", "michael", "hollick,", "2008.", "now?", "remaster", "rockstar's", "hint.", "yes", "no?", "remastered?"]);

const C = { purple: "#8B2CF5", purple2: "#B56CFF", white: "#FFFFFF", red: "#FF0033", ink: "#0B0710" };
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IN = Easing.bezier(0.64, 0, 0.78, 0);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const BOUNCE = Easing.bezier(0.34, 1.5, 0.64, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: -0.5, ...extra });
const STROKE = "0 4px 0 #000, 0 0 3px #000, 0 6px 22px rgba(0,0,0,.85)";

// ---------- footage ----------
const SRCSIZE = { stream: { w: 1280, h: 640 }, actor: { w: 584, h: 480 } };
const Shot: React.FC<{ s: ShotT; dur: number }> = ({ s, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = frame / fps;
  const punch = 1 + 0.04 * (1 - p(k, 0, 0.3));
  const push = 1 + 0.05 * (k / Math.max(dur, 0.1));
  const file = s.file === "stream" ? "shadow4/stream.mp4" : "shadow4/actor.mp4";
  const sz = SRCSIZE[s.file];
  const sc = Math.max(1080 / sz.w, BAND.h / sz.h);
  const W = sz.w * sc, H = sz.h * sc;
  const left = Math.min(0, Math.max(1080 - W, 540 - s.fx * W));
  const v = (st: React.CSSProperties) => <OffthreadVideo src={staticFile(file)} startFrom={Math.round(s.src * fps)} muted style={{ position: "absolute", maxWidth: "none", ...st }} />;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "blur(34px) brightness(.45) saturate(1.2)", transform: "scale(1.25)" }}>{v({ left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" })}</AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: BAND.y, width: 1080, height: BAND.h, overflow: "hidden", boxShadow: "0 0 60px rgba(0,0,0,.6)" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${punch * push})` }}>
          {v({ left, top: (BAND.h - H) / 2, width: W, height: H, filter: "contrast(1.06) saturate(1.08)" })}
        </div>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 85%, rgba(0,0,0,.6) 100%)" }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- actor name tag ----------
const NameTag: React.FC<{ t: number }> = ({ t }) => {
  const a = r(20.5), b = r(27.4);
  if (t < a || t > b + 0.4) return null;
  const k = p(t, a, a + 0.45) * (1 - p(t, b, b + 0.35, IN));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1255, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 24}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", borderRadius: 18, background: "rgba(12,6,22,.82)", border: `3px solid ${C.purple2}`, boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>
        <span style={{ color: C.white, ...T(40) }}>Michael Hollick</span>
        <span style={{ color: C.purple2, ...T(26, { fontWeight: 800 }) }}>Niko · GTA IV</span>
      </div>
    </div>
  );
};

// ---------- YES / NO poll ----------
const Poll: React.FC<{ t: number }> = ({ t }) => {
  const a = r(41.6), b = OUTRO_AT - 0.1;
  if (t < a || t > b + 0.3) return null;
  const k = (d: number) => p(t, a + d, a + d + 0.4, BOUNCE) * (1 - p(t, b, b + 0.25, IN));
  const box = (txt: string, bg: string, d: number) => (
    <div style={{ padding: "16px 40px", borderRadius: 22, background: bg, color: C.white, boxShadow: "0 14px 34px rgba(0,0,0,.45)", transform: `scale(${k(d)})`, opacity: Math.min(1, k(d) * 1.5), ...T(52) }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1235, display: "flex", justifyContent: "center", gap: 30 }}>
      {box("YES 👍", C.purple, 0)}{box("NO 👎", "#2A2A30", 0.2)}
    </div>
  );
};

// ---------- 3D Rockstar logo ----------
const RockstarLogo: React.FC<{ t: number }> = ({ t }) => {
  const a = LOGO_A, b = LOGO_B;
  if (t < a || t > b + 0.4) return null;
  const inK = p(t, a, a + 0.8, OUT);
  const outK = p(t, b, b + 0.35, IN);
  const ry = (1 - inK) * -300 + Math.sin((t - a) * 1.6) * 22 + outK * 90;
  const rx = Math.sin((t - a) * 1.2) * 6;
  const sc = 0.55 + 0.45 * inK + 0.06 * (t - a);
  const sweep = interpolate(t, [a + 0.7, a + 1.6], [-60, 160], CL);
  const SIZE = 430;
  const layers = Array.from({ length: 12 }, (_, i) => 11 - i);
  const mask = { WebkitMaskImage: `url(${staticFile("shadow3/rockstar_yellow.png")})`, WebkitMaskSize: "100% 100%", maskImage: `url(${staticFile("shadow3/rockstar_yellow.png")})`, maskSize: "100% 100%" } as React.CSSProperties;
  // fake 3D (works in any renderer): squash by cos(angle), extrude sideways, slight skew for perspective
  const rad = (ry * Math.PI) / 180;
  const cx = Math.cos(rad), sx = Math.sin(rad);
  const face = cx >= 0; // front or back side
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - outK }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(252,175,23,${0.35 * inK}) 0%, rgba(139,44,245,${0.25 * inK}) 30%, rgba(0,0,0,0) 50%)` }} />
      <div style={{ position: "relative", width: SIZE, height: SIZE * 680 / 640, marginTop: -180, transform: `scale(${sc}) skewY(${-sx * 8 + rx * 0.3}deg) scaleX(${Math.max(0.04, Math.abs(cx))})` }}>
        {layers.map((i) => (
          i === 0
            ? <Img key={i} src={staticFile("shadow3/rockstar_yellow.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: face ? "none" : "brightness(.8)" }} />
            : <div key={i} style={{ position: "absolute", inset: 0, transform: `translateX(${(sx * i * 2.4) / Math.max(0.15, Math.abs(cx))}px)`, background: `rgb(${200 - i * 9},${120 - i * 7},${10})`, ...mask }} />
        ))}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(110deg, rgba(255,255,255,0) ${sweep - 18}%, rgba(255,255,255,.75) ${sweep}%, rgba(255,255,255,0) ${sweep + 18}%)`, ...mask }} />
      </div>
    </AbsoluteFill>
  );
};


// ---------- captions: white words, active word in a purple box ----------
type Page = { words: [string, number, number][]; start: number; end: number };
const PAGES: Page[] = (() => {
  const out: Page[] = [];
  let cur: [string, number, number][] = [];
  const flush = () => { if (cur.length) out.push({ words: cur, start: cur[0][1], end: cur[cur.length - 1][2] }); cur = []; };
  for (const w of WORDS) {
    cur.push(w);
    const len = cur.map((x) => x[0]).join(" ").length;
    if (/[.,!?]$/.test(w[0]) || w[0].endsWith("...") || cur.length >= 3 || len > 14) flush();
  }
  flush();
  for (let i = 0; i < out.length - 1; i++) out[i].end = Math.min(out[i + 1].start, out[i].end + 0.5);
  return out;
})();

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const vt = t - VO;
  if (t > OUTRO_AT) return null;
  const pg = PAGES.find((x) => vt >= x.start - 0.05 && vt < x.end);
  if (!pg) return null;
  const k = p(vt, pg.start - 0.05, pg.start + 0.15, BOUNCE);
  return (
    <div style={{ position: "absolute", left: 150, right: 150, top: 1440, transform: `translateY(-50%) scale(${0.85 + 0.15 * k})`, opacity: Math.min(1, k * 2), display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "6px 14px" }}>
      {pg.words.map(([w, s, e], i) => {
        const on = vt >= s && vt < (pg.words[i + 1]?.[1] ?? pg.end);
        const pop = on ? 1 + 0.08 * (1 - p(vt, s, s + 0.18)) : 1;
        const key = KEY.has(w.toLowerCase());
        return (
          <span key={i} style={{ position: "relative", padding: "2px 14px 6px", borderRadius: 16, background: on ? C.purple : "transparent", boxShadow: on ? "0 6px 0 #4A0F99, 0 10px 26px rgba(0,0,0,.5)" : "none", transform: `scale(${pop}) rotate(${on ? -2 : 0}deg)`, color: C.white, textShadow: on ? "0 3px 0 rgba(0,0,0,.35)" : STROKE, ...T(key ? 82 : 72) }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};


// ---------- outro ----------
const Outro: React.FC<{ t: number }> = ({ t }) => {
  const S = OUTRO_AT;
  if (t < S - 0.4) return null;
  const blur = p(t, S - 0.4, S + 0.3, IO);
  const logo = interpolate(t, [S, S + 0.65], [0, 1], { ...CL, easing: BOUNCE });
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  const subAt = r(43.7);
  const btn = interpolate(t, [subAt, subAt + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = r(44.9), tapped = t >= tapT;
  const tapK = p(t, tapT, tapT + 0.3);
  const bell = Math.sin(Math.max(0, t - tapT - 0.2) * 22) * 18 * (1 - p(t, tapT + 0.2, tapT + 1.0));
  const txt = p(t, S + 0.3, S + 0.8);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(10,5,18,${0.55 * blur})` }} />
      <div style={{ position: "absolute", left: 540 - 220, top: 560, width: 440, height: 440, borderRadius: 40, overflow: "hidden", opacity: Math.min(1, logo * 1.5), transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -25}deg)`, boxShadow: `0 0 ${40 + 40 * glow}px rgba(181,108,255,${0.55 + 0.3 * glow}), 0 30px 60px rgba(0,0,0,.6)`, border: `4px solid ${C.purple2}` }}>
        <Img src={staticFile("shadow2/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: btn > 0 ? 1 : 0, transform: `scale(${btn * (tapped ? 1 - 0.08 * Math.sin(tapK * Math.PI) : 1)})` }}>
        <div style={{ padding: "24px 54px", borderRadius: 60, background: tapped ? "#2A2A30" : C.red, color: C.white, boxShadow: "0 18px 40px rgba(0,0,0,.4)", ...T(46, { textTransform: "none" }) }}>{tapped ? "Subscribed ✓" : "Subscribe"}</div>
        <div style={{ fontSize: 70, transform: `rotate(${bell}deg)`, opacity: tapped ? 1 : 0 }}>🔔</div>
      </div>
      <div style={{ position: "absolute", left: 150, right: 150, top: 1300, textAlign: "center", opacity: txt, transform: `translateY(${(1 - txt) * 30}px)` }}>
        <div style={{ color: C.white, textShadow: STROKE, ...T(50) }}>Subscribe to</div>
        <div style={{ display: "inline-block", margin: "10px 0", padding: "4px 20px 8px", borderRadius: 16, background: C.purple, color: C.white, boxShadow: "0 6px 0 #4A0F99", ...T(62) }}>Shadow GTA Plays</div>
        <div style={{ color: C.white, textShadow: STROKE, ...T(40, { fontWeight: 800 }) }}>for more videos like this</div>
      </div>
    </AbsoluteFill>
  );
};


export const ShadowNiko: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const blurK = p(t, OUTRO_AT - 0.4, OUTRO_AT + 0.3, IO);
  // quiet SFX (owner: keep them soft)
  const SFX = [
    { at: r(0) - 0.1, s: "whoosh", v: 0.08 }, { at: r(20.3) - 0.1, s: "whoosh", v: 0.08 },
    { at: LOGO_A, s: "whoosh", v: 0.09 }, { at: r(41.6), s: "pop", v: 0.09 },
    { at: OUTRO_AT, s: "impact", v: 0.07 }, { at: r(44.9) - 0.05, s: "tick", v: 0.14 }, { at: r(44.9) + 0.15, s: "bell", v: 0.1 },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <AbsoluteFill style={{ filter: `blur(${blurK * 26}px)`, transform: `scale(${1 + blurK * 0.06})` }}>
        {SHOTS.map((s, i) => {
          const end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : NIKO_DURATION;
          return (
            <Sequence key={i} from={f(s.at)} durationInFrames={f(end - s.at) + 1}>
              <Shot s={s} dur={end - s.at} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(0,0,0,${0.35 * (p(t, LOGO_A, LOGO_A + 0.4) - p(t, LOGO_B, LOGO_B + 0.4))})` }} />
      <RockstarLogo t={t} />
      <NameTag t={t} />
      <Poll t={t} />
      <Captions t={t} />
      <Outro t={t} />
      {/* game-audio bite: Niko's own line */}
      <Sequence durationInFrames={f(BITE.dur)}>
        <Audio src={staticFile("shadow4/stream.mp4")} startFrom={f(BITE.audio)} volume={(fr) => interpolate(fr / fps, [0, 0.05, BITE.dur - 0.25, BITE.dur], [0, 1, 1, 0], CL)} />
      </Sequence>
      <Sequence from={f(VO)}><Audio src={staticFile("shadow4/mike.wav")} /></Sequence>
      {MUSIC && <Audio src={staticFile(MUSIC)} volume={(fr) => MUSIC_VOL * interpolate(fr / fps, [0, 1, NIKO_DURATION - 2, NIKO_DURATION], [0, 1, 1, 0], CL)} />}
      {SFX.map((c, i) => <Sequence key={`s${i}`} from={Math.max(0, f(c.at))}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>)}
    </AbsoluteFill>
  );
};
