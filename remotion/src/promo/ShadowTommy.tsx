/**
 * Shadow GTA Plays — "GTA 6 Tommy Vercetti shirt time-travel Easter egg".
 * 1080x1920, 30 fps, news-style reel on the user's vertical clips
 * (shadow3/src.mp4), Mike voiceover, 3D Rockstar logo, Tommy cut-out that
 * swipes up/down, purple/white word-highlight captions at ~75% height,
 * logo + subscribe end on blurred footage. No background music.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const VO = 0.3; // voiceover starts here (reel seconds)
const r = (voT: number) => VO + voT;

// [reel start, file, src start] — each shot runs until the next one starts
const SHOTS: { at: number; file: string; src: number }[] = [
  { at: 0, file: "shadow2/tr_aerial.mp4", src: 0 },
  { at: 3.1, file: "shadow3/src.mp4", src: 0.3 },
  { at: 6.9, file: "shadow3/src.mp4", src: 4.4 },
  { at: 12.9, file: "shadow3/src.mp4", src: 11.0 },
  { at: 15.0, file: "shadow3/src.mp4", src: 17.1 },
  { at: 16.6, file: "shadow3/src.mp4", src: 19.6 },
  { at: 18.6, file: "shadow3/src.mp4", src: 38.55 },
  { at: 20.8, file: "shadow3/src.mp4", src: 34.4 },
  { at: 22.2, file: "shadow3/src.mp4", src: 42.5 },
  { at: 22.9, file: "shadow3/src.mp4", src: 49.9 },
  { at: 25.0, file: "shadow3/src.mp4", src: 60.5 },
  { at: 29.5, file: "shadow3/src.mp4", src: 52.3 },
  { at: 32.7, file: "shadow3/src.mp4", src: 66.0 },
  { at: 35.3, file: "shadow3/src.mp4", src: 68.6 },
  { at: 40.6, file: "shadow3/src.mp4", src: 59.5 }, // outro background (blurred)
];
export const TOMMY_DURATION = 46.4;

// Mike's words (whisper timings, VO seconds) — spelling fixed
const WORDS: [string, number, number][] = [
  ["Rockstar", 0.0, 0.5], ["just", 0.52, 0.74], ["hid", 0.76, 0.88], ["a", 0.9, 1.0], ["time", 1.02, 1.28], ["machine", 1.3, 1.62], ["inside", 1.64, 1.9], ["GTA", 1.92, 2.3], ["6", 2.34, 2.7],
  ["and", 2.84, 3.4], ["the", 3.44, 3.56], ["key", 3.58, 3.8], ["to", 3.82, 3.98], ["it", 4.0, 4.14], ["is", 4.16, 4.54], ["a", 4.56, 4.68], ["shirt.", 4.7, 5.3],
  ["not", 5.5, 5.66], ["just", 5.68, 5.86], ["any", 5.88, 6.1], ["shirt.", 6.12, 6.6],
  ["Tommy", 6.8, 7.08], ["Vercetti's", 7.1, 7.7], ["legendary", 7.72, 8.24], ["Hawaiian", 8.26, 8.78], ["shirt.", 8.8, 9.4],
  ["yes,", 9.62, 10.1], ["the", 10.32, 10.36], ["Vice", 10.38, 10.62], ["City", 10.64, 10.9], ["legend", 10.92, 11.24], ["from", 11.26, 11.48], ["2002.", 11.5, 12.4],
  ["put", 12.94, 13.12], ["it", 13.14, 13.26], ["on,", 13.28, 13.48], ["ride", 13.5, 13.9], ["out", 13.92, 14.1], ["at", 14.12, 14.26], ["night,", 14.28, 14.48],
  ["and", 14.5, 14.74], ["head", 14.76, 14.94], ["to", 14.96, 15.08], ["the", 15.1, 15.2], ["old", 15.22, 15.38], ["reactor.", 15.4, 16.0],
  ["then", 16.14, 16.58], ["this", 16.6, 17.18], ["happens.", 17.2, 17.9],
  ["a", 18.28, 18.34], ["glowing", 18.36, 18.7], ["portal", 18.72, 19.16], ["tears", 19.18, 19.52], ["open.", 19.54, 20.2],
  ["walk", 20.54, 20.64], ["straight", 20.66, 20.98], ["into", 21.0, 21.24], ["it...", 21.26, 21.5], ["and", 21.52, 21.9], ["BOOM!", 21.92, 22.6],
  ["you", 22.82, 22.94], ["land", 22.96, 23.22], ["in", 23.24, 23.38], ["Vice", 23.4, 23.64], ["City", 23.66, 23.98], ["2002!", 24.0, 25.0],
  ["neon", 25.74, 26.14], ["floors,", 26.16, 26.8], ["pink", 26.84, 26.98], ["walls,", 27.0, 27.38], ["that", 27.4, 27.78], ["whole", 27.8, 27.96], ["retro", 27.98, 28.34], ["vibe.", 28.36, 29.0],
  ["even", 29.18, 29.36], ["Lucia", 29.38, 29.86], ["is", 29.88, 30.06], ["like...", 30.08, 30.5], ["where", 30.56, 30.76], ["the", 30.78, 30.92], ["hell", 30.94, 31.1], ["is", 31.12, 31.26], ["this?", 31.28, 32.2],
  ["every", 32.46, 32.86], ["creator", 32.88, 33.24], ["is", 33.26, 33.52], ["talking", 33.54, 33.76], ["about", 33.78, 34.02], ["this", 34.04, 34.22], ["right", 34.24, 34.4], ["now.", 34.42, 34.9],
  ["want", 35.04, 35.16], ["the", 35.18, 35.32], ["full", 35.34, 35.48], ["step-by-step", 35.5, 36.06], ["guide?", 36.08, 36.7],
  ["comment", 36.8, 37.08], ["TOMMY", 37.1, 37.5], ["and", 37.54, 37.92], ["we'll", 37.94, 38.12], ["drop", 38.14, 38.3], ["the", 38.32, 38.46], ["complete", 38.48, 38.78], ["guide", 38.8, 39.12],
  ["on", 39.14, 39.3], ["our", 39.32, 39.42], ["main", 39.44, 39.6], ["channel.", 39.62, 40.2],
];
const KEY = new Set(["rockstar", "time", "machine", "gta", "6", "tommy", "vercetti's", "hawaiian", "shirt.", "2002.", "2002!", "portal", "boom!", "vice", "city", "lucia", "tommy", "guide?", "neon", "reactor."]);
const OUTRO_AT = r(40.0);

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
const Shot: React.FC<{ file: string; src: number; dur: number; wide: boolean }> = ({ file, src, dur, wide }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = frame / fps;
  const punch = 1 + 0.05 * (1 - p(k, 0, 0.25)); // tiny punch-in on each cut
  const push = 1 + 0.04 * (k / Math.max(dur, 0.1)); // slow push
  const v = <OffthreadVideo src={staticFile(file)} startFrom={Math.round(src * fps)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  if (wide) {
    // 16:9 trailer shot → blurred fill + sharp band
    return (
      <AbsoluteFill style={{ transform: `scale(${punch * push})` }}>
        <AbsoluteFill style={{ filter: "blur(30px) brightness(.55)", transform: "scale(1.2)" }}>{v}</AbsoluteFill>
        <div style={{ position: "absolute", left: -260, right: -260, top: 960 - 340, height: 680 }}>{v}</div>
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ transform: `scale(${punch * push})` }}>{v}</AbsoluteFill>;
};

// ---------- 3D Rockstar logo ----------
const RockstarLogo: React.FC<{ t: number }> = ({ t }) => {
  const a = r(0) - 0.15, b = r(2.75);
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

// ---------- Tommy cut-out: swipes up, then back down ----------
const TommyCard: React.FC<{ t: number }> = ({ t }) => {
  const a = r(6.7), b = r(12.3);
  if (t < a - 0.1 || t > b + 0.6) return null;
  const up = p(t, a, a + 0.55, OUT);
  const down = p(t, b, b + 0.5, IN);
  const y = (1 - up) * 1300 + down * 1300;
  const float = Math.sin((t - a) * 2.2) * 8;
  const W = 720, H = W * 1294 / 1000;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(10,4,20,${0.5 * up * (1 - down)})` }} />
      <div style={{ position: "absolute", left: 540 - W / 2, top: 1340 - H + y + float, width: W, height: H, transform: `rotate(${(1 - up) * 6 - down * 6}deg)` }}>
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, rgba(181,108,255,.75) 0%, rgba(139,44,245,.35) 38%, rgba(0,0,0,0) 66%)`, transform: "scale(1.15)" }} />
        <Img src={staticFile("shadow3/tommy.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 20px 40px rgba(0,0,0,.6))" }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- portal "BOOM" flash (pink, never white) ----------
const Flash: React.FC<{ t: number }> = ({ t }) => {
  const at = r(21.92);
  const k = interpolate(t, [at - 0.05, at + 0.05, at + 0.6], [0, 0.85, 0], CL);
  if (k <= 0) return null;
  return <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, rgba(255,120,230,${k}) 0%, rgba(139,44,245,${k * 0.8}) 55%, rgba(40,0,70,${k * 0.6}) 100%)` }} />;
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
        const on = vt >= s - 0.03 && vt < (pg.words[i + 1]?.[1] ?? pg.end);
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

// ---------- "Comment TOMMY" bubble ----------
const CommentPill: React.FC<{ t: number }> = ({ t }) => {
  const a = r(36.8), b = OUTRO_AT - 0.1;
  if (t < a || t > b + 0.3) return null;
  const k = p(t, a, a + 0.4, BOUNCE) * (1 - p(t, b, b + 0.25, IN));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1230, display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.5), transform: `scale(${k})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 34px", borderRadius: 26, background: "rgba(255,255,255,.96)", boxShadow: "0 16px 40px rgba(0,0,0,.45)" }}>
        <span style={{ fontSize: 50 }}>💬</span>
        <span style={{ color: C.ink, ...T(46, { textTransform: "none" }) }}>Comment <span style={{ color: C.purple }}>"TOMMY"</span></span>
      </div>
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
  const subAt = r(40.38);
  const btn = interpolate(t, [subAt, subAt + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = r(41.6), tapped = t >= tapT;
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

export const ShadowTommy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  const blurK = p(t, OUTRO_AT - 0.4, OUTRO_AT + 0.3, IO);
  const SFX = [
    { at: r(0) - 0.1, s: "whoosh", v: 0.2 }, { at: r(6.7), s: "whoosh", v: 0.22 }, { at: r(12.3), s: "whoosh", v: 0.18 },
    { at: r(21.92) - 0.05, s: "impact", v: 0.22 }, { at: r(36.8), s: "pop", v: 0.18 },
    { at: OUTRO_AT, s: "impact", v: 0.12 }, { at: r(41.6) - 0.05, s: "tick", v: 0.3 }, { at: r(41.6) + 0.15, s: "bell", v: 0.2 },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <AbsoluteFill style={{ filter: `blur(${blurK * 26}px)`, transform: `scale(${1 + blurK * 0.06})` }}>
        {SHOTS.map((s, i) => {
          const end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : TOMMY_DURATION;
          return (
            <Sequence key={i} from={f(s.at)} durationInFrames={f(end - s.at) + 1}>
              <Shot file={s.file} src={s.src} dur={end - s.at} wide={s.file.startsWith("shadow2/")} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Flash t={t} />
      <RockstarLogo t={t} />
      <TommyCard t={t} />
      <CommentPill t={t} />
      <Captions t={t} />
      <Outro t={t} />
      <Sequence from={f(VO)}><Audio src={staticFile("shadow3/mike.wav")} /></Sequence>
      {SFX.map((c, i) => <Sequence key={`s${i}`} from={Math.max(0, f(c.at))}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>)}
    </AbsoluteFill>
  );
};
