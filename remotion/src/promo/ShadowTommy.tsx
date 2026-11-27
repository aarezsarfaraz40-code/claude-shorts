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
  { at: 3.5, file: "shadow3/src.mp4", src: 17.1 }, // head to the old reactor
  { at: 5.2, file: "shadow3/src.mp4", src: 19.6 }, // something strange happens
  { at: 7.5, file: "shadow3/src.mp4", src: 38.55 }, // portal tears open
  { at: 9.7, file: "shadow3/src.mp4", src: 34.4 }, // walk into it
  { at: 11.2, file: "shadow3/src.mp4", src: 42.5 }, // BOOM
  { at: 11.9, file: "shadow3/src.mp4", src: 49.9 }, // land in Vice City 2002
  { at: 14.5, file: "shadow3/src.mp4", src: 60.5 }, // neon floors
  { at: 18.4, file: "shadow3/src.mp4", src: 52.3 }, // "Where the hell is this?"
  { at: 21.7, file: "shadow3/src.mp4", src: 66.0 }, // best part / make it back out
  { at: 24.2, file: "shadow3/src.mp4", src: 0.3 }, // Tommy shirt + bike
  { at: 27.5, file: "shadow3/src.mp4", src: 11.0 },
  { at: 30.9, file: "shadow3/src.mp4", src: 71.2 }, // every creator…
  { at: 33.9, file: "shadow3/src.mp4", src: 4.4 }, // full guide / comment TOMMY
  { at: 39.2, file: "shadow3/src.mp4", src: 59.5 }, // outro background (blurred)
];
export const TOMMY_DURATION = 45.4;

// Mike's words (whisper timings, VO seconds) — spelling fixed
const WORDS: [string, number, number][] = [
  ["Rockstar", 0.0, 0.48],
  ["just", 0.48, 0.72],
  ["hid", 0.72, 0.9],
  ["a", 0.9, 1.02],
  ["time", 1.02, 1.32],
  ["machine", 1.32, 1.66],
  ["inside", 1.66, 1.96],
  ["GTA", 1.96, 2.32],
  ["6!", 2.32, 2.9],
  ["Head", 3.36, 3.54],
  ["to", 3.54, 3.68],
  ["the", 3.68, 3.78],
  ["old", 3.78, 4.04],
  ["reactor", 4.04, 4.42],
  ["at", 4.42, 4.64],
  ["night,", 4.64, 4.88],
  ["and", 5.08, 5.34],
  ["something", 5.34, 5.72],
  ["strange", 5.72, 6.18],
  ["happens.", 6.18, 6.74],
  ["A", 7.3, 7.42],
  ["glowing", 7.42, 7.82],
  ["portal", 7.82, 8.32],
  ["tears", 8.32, 8.7],
  ["open.", 8.7, 9.18],
  ["walk", 9.56, 9.8],
  ["straight", 9.8, 10.16],
  ["into", 10.16, 10.44],
  ["it...", 10.44, 10.64],
  ["and", 10.94, 11.04],
  ["BOOM!", 11.04, 11.46],
  ["You", 12.0, 12.12],
  ["land", 12.12, 12.36],
  ["in", 12.36, 12.52],
  ["Vice", 12.52, 12.8],
  ["City,", 12.8, 13.16],
  ["2002!", 13.36, 14.22],
  ["Neon", 14.8, 15.2],
  ["floors,", 15.2, 15.52],
  ["pink", 15.92, 16.08],
  ["walls,", 16.08, 16.5],
  ["that", 16.78, 16.9],
  ["whole", 16.9, 17.04],
  ["retro", 17.04, 17.46],
  ["vibe.", 17.46, 17.8],
  ["Even", 18.16, 18.38],
  ["Lucia", 18.38, 18.82],
  ["is", 18.82, 19.04],
  ["like,", 19.04, 19.24],
  ["where", 19.58, 19.76],
  ["the", 19.76, 19.92],
  ["hell", 19.92, 20.22],
  ["is", 20.22, 20.4],
  ["this?", 20.4, 21.1],
  ["But", 21.52, 21.68],
  ["the", 21.68, 21.82],
  ["best", 21.82, 22.02],
  ["part?", 22.02, 22.26],
  ["When", 22.7, 22.82],
  ["you", 22.82, 22.92],
  ["make", 22.92, 23.08],
  ["it", 23.08, 23.18],
  ["back", 23.18, 23.34],
  ["out,", 23.34, 23.66],
  ["you", 23.88, 24.0],
  ["unlock", 24.0, 24.26],
  ["Tommy", 24.26, 24.64],
  ["Vercetti's", 24.64, 25.28],
  ["legendary", 25.28, 25.78],
  ["Hawaiian", 25.78, 26.3],
  ["shirt.", 26.3, 26.76],
  ["And", 26.98, 27.24],
  ["his", 27.24, 27.38],
  ["bike", 27.38, 27.68],
  ["too!", 27.68, 28.02],
  ["Yes,", 28.02, 28.7],
  ["the", 29.04, 29.12],
  ["Vice", 29.12, 29.38],
  ["City", 29.38, 29.68],
  ["legend", 29.68, 30.02],
  ["from", 30.02, 30.26],
  ["2002!", 30.26, 31.58],
  ["Every", 31.8, 32.1],
  ["creator", 32.1, 32.46],
  ["is", 32.46, 32.72],
  ["talking", 32.72, 32.96],
  ["about", 32.96, 33.22],
  ["this", 33.22, 33.42],
  ["right", 33.42, 33.6],
  ["now.", 33.6, 33.84],
  ["Want", 34.18, 34.32],
  ["the", 34.32, 34.48],
  ["full", 34.48, 34.64],
  ["step-by-step", 34.64, 35.24],
  ["guide?", 35.24, 35.52],
  ["Comment", 35.92, 36.2],
  ["TOMMY,", 36.2, 36.68],
  ["and", 37.02, 37.08],
  ["we'll", 37.08, 37.26],
  ["drop", 37.26, 37.44],
  ["the", 37.44, 37.62],
  ["complete", 37.62, 37.94],
  ["guide", 37.94, 38.28],
  ["on", 38.28, 38.46],
  ["our", 38.46, 38.58],
  ["main", 38.58, 38.78],
  ["channel.", 38.78, 39.18],
  ["Subscribe", 39.54, 39.84],
  ["to", 39.84, 40.12],
  ["Shadow", 40.12, 40.38],
  ["GTA", 40.38, 40.72],
  ["Plays", 40.72, 41.26],
  ["for", 41.26, 41.42],
  ["more", 41.42, 41.62],
  ["videos", 41.62, 41.94],
  ["like", 41.94, 42.18],
  ["this!", 42.18, 42.86],
];
const KEY = new Set(["rockstar", "time", "machine", "gta", "6", "tommy", "vercetti's", "hawaiian", "shirt.", "2002.", "2002!", "portal", "boom!", "vice", "city", "lucia", "tommy", "guide?", "neon", "reactor", "bike", "best", "unlock", "TOMMY,".toLowerCase(), "boom!"]);
const OUTRO_AT = r(39.3);

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
  const a = r(24.2), b = r(26.85);
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
  const at = r(11.04);
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

// ---------- "Comment TOMMY" bubble ----------
const CommentPill: React.FC<{ t: number }> = ({ t }) => {
  const a = r(35.92), b = OUTRO_AT - 0.1;
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
  const subAt = r(39.54);
  const btn = interpolate(t, [subAt, subAt + 0.4], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = r(40.7), tapped = t >= tapT;
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
    { at: r(0) - 0.1, s: "whoosh", v: 0.2 }, { at: r(24.2), s: "whoosh", v: 0.22 }, { at: r(26.85), s: "whoosh", v: 0.18 },
    { at: r(11.04) - 0.05, s: "impact", v: 0.22 }, { at: r(35.92), s: "pop", v: 0.18 },
    { at: OUTRO_AT, s: "impact", v: 0.12 }, { at: r(40.7) - 0.05, s: "tick", v: 0.3 }, { at: r(40.7) + 0.15, s: "bell", v: 0.2 },
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
