/**
 * Shadow GTA Place — "He had NO IDEA she's Lucia" street-interview reel.
 * 1080x1920, 30 fps. No logo, no background music: original clip audio,
 * centered captions, light motion graphics, speaker-following crop.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTIONS, CROP_KEYS } from "./shadowData";

export const SHADOW_DURATION = 26.4;
const CLIP_END = 23.35; // after "I think you might want to say no."
const CARD_A = 15.8, CARD_B = 18.6; // white-background explainer (silent gap in the clip)
const C = { yellow: "#FFD400", pink: "#FF3D8B", ink: "#111214", white: "#FFFFFF", red: "#FF0033" };
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.08, textTransform: "uppercase", letterSpacing: -0.5, ...extra });
const shadow = "0 5px 16px rgba(0,0,0,.8), 0 0 3px rgba(0,0,0,.95), 2px 2px 0 rgba(0,0,0,.6)";
const SAFE = { left: 150, right: 930 };

// ---------------------------------------------------------------- video (speaker-following crop)
const Video: React.FC<{ t: number }> = ({ t }) => {
  const xs = CROP_KEYS.map((k) => k.t), vs = CROP_KEYS.map((k) => k.x);
  const cx = interpolate(t, xs, vs, CL); // normalized crop center
  const scale = 1920 / 1080; // fill height
  const vw = 1920 * scale;
  const zoom = 1 + 0.04 * Math.sin(t * 0.35); // gentle breathing push
  const left = Math.min(0, Math.max(1080 - vw, 540 - cx * vw));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile("shadow/clip.mp4")} muted style={{ position: "absolute", left, top: 0, width: vw, height: 1920, maxWidth: "none" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 18%, transparent 68%, rgba(0,0,0,.35) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions (1-3 words, word by word)
const YELLOW = new Set(["GTA", "6", "LUCIA", "TRUMP", "DONALD", "VEST", "NEW", "YORK", "QUESTION", "OPINION", "FIT", "CHECK"]);
const PINK = new Set(["QUEEN", "NO", "BEST", "FREE", "SPEECH"]);
const Captions: React.FC<{ t: number }> = ({ t }) => {
  const ms = t * 1000;
  if (t > CLIP_END || (t > CARD_A && t < CARD_B)) return null;
  // group words into pages of max 3 words / 900 ms
  const pages: { s: number; e: number; w: typeof CAPTIONS }[] = [];
  for (const c of CAPTIONS) {
    const last = pages[pages.length - 1];
    if (last && last.w.length < 3 && c.startMs - last.s < 900 && !/[.?!]$/.test(last.w[last.w.length - 1].text.trim())) { last.w.push(c); last.e = c.endMs; }
    else pages.push({ s: c.startMs, e: c.endMs, w: [c] });
  }
  const page = pages.find((pg, i) => ms >= pg.s && ms < Math.max(pg.e + 250, Math.min(pages[i + 1]?.s ?? 1e9, pg.e + 700)));
  if (!page) return null;
  const words = page.w.map((w) => w.text.trim());
  const longest = Math.max(...words.map((w) => w.length));
  const size = Math.floor(Math.min(84, 780 / (longest * 0.78), (2 * 780) / (words.join(" ").length * 0.74 + 2)));
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 1180, height: 220, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: "0 22px", textAlign: "center" }}>
      {page.w.map((w, i) => {
        const shown = ms >= w.startMs - 30;
        const k = p(t, w.startMs / 1000, w.startMs / 1000 + 0.18);
        const key = w.text.trim().toUpperCase().replace(/[^A-Z0-9']/g, "");
        const color = PINK.has(key) ? C.pink : YELLOW.has(key) ? C.yellow : C.white;
        return (
          <span key={i} style={{ display: "inline-block", visibility: shown ? "visible" : "hidden", color, textShadow: shadow, transform: `translateY(${(1 - k) * 22}px) scale(${0.7 + 0.3 * k})`, ...T(size) }}>{w.text.trim()}</span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- top labels (pill text)
const Pill: React.FC<{ t: number; a: number; b: number; lines: string[]; hl?: string[]; y?: number }> = ({ t, a, b, lines, hl = [], y = 640 }) => {
  if (t < a || t > b) return null;
  const k = p(t, a, a + 0.35), o = 1 - p(t, b - 0.25, b, IO);
  let idx = 0;
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: y, textAlign: "center", opacity: o }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 14px", marginBottom: 8 }}>
          {ln.split(" ").map((w, wi) => {
            const j = idx++;
            const kw = p(t, a + j * 0.07, a + j * 0.07 + 0.3);
            const isHl = hl.includes(w.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            return (
              <span key={wi} style={{ display: "inline-block", opacity: kw, transform: `translateY(${(1 - kw) * 40}px) scale(${0.6 + 0.4 * kw}) ${isHl ? "rotate(-2deg)" : ""}`, color: isHl ? "#000" : C.white, background: isHl ? C.yellow : "transparent", padding: isHl ? "0 14px" : 0, borderRadius: 10, textShadow: isHl ? "none" : shadow, ...T(66) }}>{w}</span>
            );
          })}
        </div>
      ))}
      {void k}
    </div>
  );
};

// small Lucia card popping in next to the "That's Lucia" label
const MiniCard: React.FC<{ t: number; a: number; b: number }> = ({ t, a, b }) => {
  if (t < a || t > b) return null;
  const k = interpolate(t, [a, a + 0.45], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.5, 0.64, 1) });
  const o = 1 - p(t, b - 0.25, b, IO);
  return (
    <div style={{ position: "absolute", left: 540 - 120, top: 820, width: 240, opacity: o, transform: `scale(${k}) rotate(${(1 - k) * -20 + 4}deg)` }}>
      <div style={{ borderRadius: 26, overflow: "hidden", border: "6px solid #fff", boxShadow: "0 18px 40px rgba(0,0,0,.5)", height: 300 }}>
        <Img src={staticFile("shadow/lucia_game.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ marginTop: -26, textAlign: "center" }}>
        <span style={{ background: C.yellow, color: "#000", padding: "6px 16px", borderRadius: 10, ...T(30) }}>IN GTA 6</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- white-background explainer
const Explainer: React.FC<{ t: number }> = ({ t }) => {
  if (t < CARD_A - 0.3 || t > CARD_B + 0.3) return null;
  const inn = p(t, CARD_A - 0.3, CARD_A + 0.15, IO), out = p(t, CARD_B - 0.15, CARD_B + 0.3, IO);
  const r = interpolate(inn - out, [0, 1], [0, 1500], CL);
  const a = interpolate(t, [CARD_A + 0.1, CARD_A + 0.55], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.4, 0.64, 1) });
  const b = interpolate(t, [CARD_A + 0.35, CARD_A + 0.8], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.4, 0.64, 1) });
  const eq = p(t, CARD_A + 0.7, CARD_A + 1.0);
  const title = p(t, CARD_A + 0.05, CARD_A + 0.45);
  const card = (src: string, label: string, sub: string, k: number, rot: number) => (
    <div style={{ width: 330, opacity: k, transform: `translateY(${(1 - k) * 120}px) rotate(${rot}deg) scale(${0.8 + 0.2 * k})` }}>
      <div style={{ height: 412, borderRadius: 30, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,.18)", border: "6px solid #fff" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ marginTop: 18, textAlign: "center", color: C.ink, ...T(34) }}>{label}</div>
      <div style={{ marginTop: 4, textAlign: "center", color: "#6B6E76", ...T(24, { fontWeight: 700 }) }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: "#F7F7F9" }} />
      <AbsoluteFill style={{ opacity: Math.min(inn, 1 - out) }}>
        <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 400, textAlign: "center", color: C.ink, opacity: title, transform: `translateY(${(1 - title) * 30}px)`, ...T(64) }}>
          GTA 6's <span style={{ background: C.yellow, padding: "0 12px", borderRadius: 10 }}>Lucia</span> IRL 👀
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
          {card("shadow/lucia_game.jpg", "Lucia Caminos", "in the game", a, -3)}
          <div style={{ color: C.ink, opacity: eq, transform: `scale(${0.5 + 0.5 * eq})`, ...T(80) }}>=</div>
          {card("shadow/manni_real.jpg", "Manni L. Perez", "the actress", b, 3)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- end CTA (no logo)
const EndCta: React.FC<{ t: number }> = ({ t }) => {
  if (t < CLIP_END - 0.35) return null;
  const inn = p(t, CLIP_END - 0.35, CLIP_END + 0.15, IO);
  const r = interpolate(inn, [0, 1], [0, 1500]);
  const l1 = p(t, CLIP_END + 0.1, CLIP_END + 0.5), l2 = p(t, CLIP_END + 0.25, CLIP_END + 0.7);
  const btn = interpolate(t, [CLIP_END + 0.6, CLIP_END + 1.0], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.5, 0.64, 1) });
  const tapT = CLIP_END + 1.6;
  const tapped = t >= tapT;
  const tapK = p(t, tapT, tapT + 0.3);
  const bell = Math.sin(Math.max(0, t - tapT - 0.2) * 22) * 18 * (1 - p(t, tapT + 0.2, tapT + 1.0));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: "#F7F7F9" }} />
      <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 640, textAlign: "center" }}>
        <div style={{ color: "#6B6E76", opacity: l1, transform: `translateY(${(1 - l1) * 30}px)`, ...T(48) }}>Subscribe to</div>
        <div style={{ marginTop: 10, color: C.ink, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)`, ...T(92, { letterSpacing: -2 }) }}>Shadow GTA<br /><span style={{ background: C.yellow, padding: "0 16px", borderRadius: 14 }}>Place</span></div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, transform: `scale(${btn * (tapped ? 1 - 0.08 * Math.sin(tapK * Math.PI) : 1)})` }}>
        <div style={{ padding: "26px 56px", borderRadius: 60, background: tapped ? "#E5E5EA" : C.red, color: tapped ? C.ink : C.white, boxShadow: "0 18px 40px rgba(0,0,0,.18)", ...T(46, { textTransform: "none" }) }}>{tapped ? "Subscribed ✓" : "Subscribe"}</div>
        <div style={{ fontSize: 70, transform: `rotate(${bell}deg)`, opacity: tapped ? 1 : 0.0 }}>🔔</div>
      </div>
    </AbsoluteFill>
  );
};

const SFX: { at: number; s: string; v: number }[] = [
  { at: 0.05, s: "pop", v: 0.18 }, { at: 4.7, s: "pop", v: 0.2 }, { at: CARD_A - 0.3, s: "whoosh", v: 0.22 },
  { at: CARD_A + 0.15, s: "pop", v: 0.16 }, { at: CARD_A + 0.4, s: "pop", v: 0.16 }, { at: CARD_B - 0.1, s: "whoosh", v: 0.2 },
  { at: 21.9, s: "pop", v: 0.16 }, { at: CLIP_END - 0.35, s: "whoosh", v: 0.22 }, { at: CLIP_END + 1.6, s: "tick", v: 0.3 }, { at: CLIP_END + 1.8, s: "bell", v: 0.2 },
];

export const ShadowClip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      {t < CLIP_END + 0.2 ? <Video t={t} /> : null}
      <Captions t={t} />
      <Pill t={t} a={0.05} b={3.4} lines={["He had NO IDEA", "who she was 😭"]} hl={["NO", "IDEA"]} />
      <Pill t={t} a={4.65} b={7.6} lines={["That's LUCIA", "from GTA 6 🤯"]} hl={["LUCIA"]} />
      <MiniCard t={t} a={4.9} b={7.6} />
      <Pill t={t} a={9.3} b={12.3} lines={["Asking LUCIA", "about politics 💀"]} hl={["LUCIA"]} />
      <Pill t={t} a={21.9} b={CLIP_END} lines={["She escaped like", "a 5★ wanted level 😂"]} hl={["5★"]} />
      <Explainer t={t} />
      <EndCta t={t} />
      <Sequence durationInFrames={Math.round((CLIP_END + 0.2) * fps)}>
        <Audio src={staticFile("shadow/clip.mp4")} volume={(f) => interpolate(f / fps, [CLIP_END - 0.3, CLIP_END + 0.1], [1, 0], CL)} />
      </Sequence>
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
