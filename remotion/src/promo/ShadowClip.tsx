/**
 * Shadow GTA Plays — "He had NO IDEA she's Lucia" street-interview reel.
 * 1080x1920, 30 fps. No logo, no background music. Clip audio + "Mike"
 * (ElevenLabs gaming voice) for intro / explainer / outro. Centered captions,
 * light motion graphics, speaker-following crop. The clip's silent gap is cut.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTIONS, CROP_KEYS, MIKE } from "./shadowData";

// ---------------------------------------------------------------- timeline (reel seconds)
const INTRO_END = 4.6;            // Mike A over a still
const A_SRC = [0, 15.75];         // clip part A (source seconds)
const A_START = INTRO_END, A_END = A_START + (A_SRC[1] - A_SRC[0]);
const EXPL_END = A_END + 3.75;    // white explainer + Mike B
const B_SRC = [18.6, 23.35];      // clip part B
const B_START = EXPL_END, B_END = B_START + (B_SRC[1] - B_SRC[0]);
const END_TOTAL = B_END + 6.7;    // end card + Mike C
export const SHADOW_DURATION = Math.ceil(END_TOTAL * 10) / 10;
const MIKE_AT = { A: 0.12, B: A_END + 0.2, C: B_END + 0.1 };

const C = { yellow: "#FFD400", pink: "#FF3D8B", ink: "#111214", white: "#FFFFFF", red: "#FF0033", grey: "#6B6E76", paper: "#F7F7F9" };
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const BOUNCE = Easing.bezier(0.34, 1.5, 0.64, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.08, textTransform: "uppercase", letterSpacing: -0.5, ...extra });
const shadow = "0 5px 16px rgba(0,0,0,.8), 0 0 3px rgba(0,0,0,.95), 2px 2px 0 rgba(0,0,0,.6)";
const SAFE = { left: 150, right: 930 };

const srcTime = (t: number): number | null => {
  if (t >= A_START && t < A_END) return A_SRC[0] + (t - A_START);
  if (t >= B_START && t < B_END) return B_SRC[0] + (t - B_START);
  return null;
};

// ---------------------------------------------------------------- clip video (speaker-following crop)
const ClipPart: React.FC<{ srcFrom: number; t: number }> = ({ srcFrom, t }) => {
  const { fps } = useVideoConfig();
  const st = srcTime(t) ?? srcFrom;
  const cx = interpolate(st, CROP_KEYS.map((k) => k.t), CROP_KEYS.map((k) => k.x), CL);
  const vw = 1920 * (1920 / 1080);
  const left = Math.min(0, Math.max(1080 - vw, 540 - cx * vw));
  const zoom = 1;
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <OffthreadVideo src={staticFile("shadow/clip.mp4")} startFrom={Math.round(srcFrom * fps)} muted style={{ position: "absolute", left, top: 0, width: vw, height: 1920, maxWidth: "none" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.3) 0%, transparent 18%, transparent 66%, rgba(0,0,0,.35) 100%)" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- captions
type Word = { text: string; startMs: number; endMs: number };
const YELLOW = new Set(["GTA", "6", "LUCIA", "CAMINOS", "MANNI", "L", "PEREZ", "TRUMP", "DONALD", "VEST", "NEW", "YORK", "FIVE-STAR", "SHADOW", "PLAYS", "FIT", "CHECK"]);
const PINK = new Set(["QUEEN", "NO", "BEST", "FREE", "SPEECH", "BRO", "DODGED", "SUBSCRIBE"]);
const Captions: React.FC<{ words: Word[]; t: number }> = ({ words, t }) => {
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
  const size = Math.floor(Math.min(84, 780 / (longest * 0.78), (2 * 780) / (ws.join(" ").length * 0.74 + 2)));
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 1180, height: 220, display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center", gap: "0 22px", textAlign: "center" }}>
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
const clipWords = (srcA: number, srcB: number, reelStart: number): Word[] =>
  CAPTIONS.filter((c) => c.startMs / 1000 >= srcA && c.startMs / 1000 < srcB).map((c) => ({ ...c, startMs: c.startMs + (reelStart - srcA) * 1000, endMs: c.endMs + (reelStart - srcA) * 1000 }));
const mikeWords = (k: "A" | "B" | "C"): Word[] => MIKE[k].map((c) => ({ ...c, startMs: c.startMs + MIKE_AT[k] * 1000, endMs: c.endMs + MIKE_AT[k] * 1000 }));
const ALL_WORDS: Word[] = [...mikeWords("A"), ...clipWords(A_SRC[0], A_SRC[1], A_START), ...mikeWords("B"), ...clipWords(B_SRC[0], B_SRC[1], B_START), ...mikeWords("C")];

// ---------------------------------------------------------------- labels
const Pill: React.FC<{ t: number; a: number; b: number; lines: string[]; hl?: string[]; y?: number }> = ({ t, a, b, lines, hl = [], y = 640 }) => {
  if (t < a || t > b) return null;
  const o = 1 - p(t, b - 0.25, b, IO);
  let idx = 0;
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: y, textAlign: "center", opacity: o }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 14px", marginBottom: 8 }}>
          {ln.split(" ").map((w, wi) => {
            const j = idx++;
            const kw = p(t, a + j * 0.07, a + j * 0.07 + 0.3);
            const isHl = hl.includes(w.toUpperCase().replace(/[^A-Z0-9★]/g, ""));
            return <span key={wi} style={{ display: "inline-block", opacity: kw, transform: `translateY(${(1 - kw) * 40}px) scale(${0.6 + 0.4 * kw}) ${isHl ? "rotate(-2deg)" : ""}`, color: isHl ? "#000" : C.white, background: isHl ? C.yellow : "transparent", padding: isHl ? "0 14px" : 0, borderRadius: 10, textShadow: isHl ? "none" : shadow, ...T(66) }}>{w}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

const LuciaCard: React.FC<{ t: number; a: number; b: number; x: number; y: number; w: number; tag: string }> = ({ t, a, b, x, y, w, tag }) => {
  if (t < a || t > b) return null;
  const k = interpolate(t, [a, a + 0.45], [0, 1], { ...CL, easing: BOUNCE });
  const o = 1 - p(t, b - 0.25, b, IO);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: `scale(${k}) rotate(${(1 - k) * -20 + 4}deg)` }}>
      <div style={{ borderRadius: 26, overflow: "hidden", border: "6px solid #fff", boxShadow: "0 18px 40px rgba(0,0,0,.5)", height: w * 1.3 }}>
        <Img src={staticFile("shadow/lucia_game.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
      </div>
      <div style={{ marginTop: -26, textAlign: "center" }}><span style={{ background: C.yellow, color: "#000", padding: "6px 16px", borderRadius: 10, ...T(30) }}>{tag}</span></div>
    </div>
  );
};

// ---------------------------------------------------------------- intro still (Mike A)
const Intro: React.FC<{ t: number }> = ({ t }) => {
  if (t > INTRO_END + 0.35) return null;
  const out = p(t, INTRO_END - 0.05, INTRO_END + 0.35, IO);
  const zoom = 1.08 + 0.1 * p(t, 0, INTRO_END, Easing.linear);
  return (
    <AbsoluteFill style={{ opacity: 1 - out, background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Img src={staticFile("shadow/manni_real.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, objectFit: "cover", filter: "brightness(.9)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.25), transparent 30%, transparent 60%, rgba(0,0,0,.45))" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- white explainer (Mike B)
const Explainer: React.FC<{ t: number }> = ({ t }) => {
  const A = A_END, Bt = EXPL_END;
  if (t < A - 0.3 || t > Bt + 0.3) return null;
  const inn = p(t, A - 0.3, A + 0.15, IO), out = p(t, Bt - 0.15, Bt + 0.3, IO);
  const r = interpolate(inn - out, [0, 1], [0, 1500], CL);
  const a = interpolate(t, [A + 0.1, A + 0.55], [0, 1], { ...CL, easing: BOUNCE });
  const b = interpolate(t, [A + 0.45, A + 0.9], [0, 1], { ...CL, easing: BOUNCE });
  const eq = p(t, A + 0.8, A + 1.1);
  const title = p(t, A + 0.05, A + 0.45);
  const card = (src: string, label: string, sub: string, k: number, rot: number, pos: string) => (
    <div style={{ width: 330, opacity: k, transform: `translateY(${(1 - k) * 120}px) rotate(${rot}deg) scale(${0.8 + 0.2 * k})` }}>
      <div style={{ height: 412, borderRadius: 30, overflow: "hidden", boxShadow: "0 24px 50px rgba(0,0,0,.18)", border: "6px solid #fff" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
      </div>
      <div style={{ marginTop: 18, textAlign: "center", color: C.ink, ...T(34) }}>{label}</div>
      <div style={{ marginTop: 4, textAlign: "center", color: C.grey, ...T(24, { fontWeight: 700 }) }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: C.paper }} />
      <AbsoluteFill style={{ opacity: Math.min(inn, 1 - out) }}>
        <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 400, textAlign: "center", color: C.ink, opacity: title, transform: `translateY(${(1 - title) * 30}px)`, ...T(64) }}>
          GTA 6's <span style={{ background: C.yellow, padding: "0 12px", borderRadius: 10 }}>Lucia</span> IRL 👀
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 24 }}>
          {card("shadow/lucia_game.jpg", "Lucia Caminos", "in the game", a, -3, "50% 20%")}
          <div style={{ color: C.ink, opacity: eq, transform: `scale(${0.5 + 0.5 * eq})`, ...T(80) }}>=</div>
          {card("shadow/manni_real.jpg", "Manni L. Perez", "the actress", b, 3, "50% 30%")}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- end CTA (no logo, Mike C)
const EndCta: React.FC<{ t: number; cEnd: number }> = ({ t, cEnd }) => {
  const S = B_END;
  if (t < S - 0.35) return null;
  const inn = p(t, S - 0.35, S + 0.15, IO);
  const r = interpolate(inn, [0, 1], [0, 1500]);
  const switchT = S + cEnd;
  const joke = p(t, S + 0.15, S + 0.5) * (1 - p(t, switchT - 0.3, switchT, IO));
  const cta = p(t, switchT - 0.1, switchT + 0.3);
  const btn = interpolate(t, [switchT + 0.3, switchT + 0.7], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = switchT + 1.1, tapped = t >= tapT;
  const tapK = p(t, tapT, tapT + 0.3);
  const bell = Math.sin(Math.max(0, t - tapT - 0.2) * 22) * 18 * (1 - p(t, tapT + 0.2, tapT + 1.0));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - r, top: 960 - r, width: r * 2, height: r * 2, borderRadius: "50%", background: C.paper }} />
      <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 560, textAlign: "center", opacity: joke, transform: `translateY(${(1 - joke) * 30}px)` }}>
        <div style={{ color: C.ink, ...T(70) }}>She escaped like a</div>
        <div style={{ marginTop: 14 }}><span style={{ background: C.yellow, color: "#000", padding: "4px 20px", borderRadius: 14, ...T(90) }}>5★ wanted level</span></div>
        <div style={{ marginTop: 10, fontSize: 110 }}>😂</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.left, right: 1080 - SAFE.right, top: 600, textAlign: "center", opacity: cta, transform: `translateY(${(1 - cta) * 40}px)` }}>
        <div style={{ color: C.grey, ...T(48) }}>Subscribe to</div>
        <div style={{ marginTop: 10, color: C.ink, ...T(92, { letterSpacing: -2 }) }}>Shadow GTA<br /><span style={{ background: C.yellow, padding: "0 16px", borderRadius: 14 }}>Plays</span></div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1070, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, transform: `scale(${btn * (tapped ? 1 - 0.08 * Math.sin(tapK * Math.PI) : 1)})` }}>
        <div style={{ padding: "26px 56px", borderRadius: 60, background: tapped ? "#E5E5EA" : C.red, color: tapped ? C.ink : C.white, boxShadow: "0 18px 40px rgba(0,0,0,.18)", ...T(46, { textTransform: "none" }) }}>{tapped ? "Subscribed ✓" : "Subscribe"}</div>
        <div style={{ fontSize: 70, transform: `rotate(${bell}deg)`, opacity: tapped ? 1 : 0 }}>🔔</div>
      </div>
    </AbsoluteFill>
  );
};

export const ShadowClip: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  // Mike C: the joke ends at the word before "Subscribe" → switch the end card there
  const subWord = MIKE.C.find((w) => /subscribe/i.test(w.text));
  const cEnd = subWord ? subWord.startMs / 1000 + MIKE_AT.C - B_END : 3.9;
  const SFX: { at: number; s: string; v: number }[] = [
    { at: 0.05, s: "pop", v: 0.18 }, { at: INTRO_END - 0.05, s: "whoosh", v: 0.2 },
    { at: A_END - 0.3, s: "whoosh", v: 0.22 }, { at: A_END + 0.15, s: "pop", v: 0.16 },
    { at: A_END + 0.5, s: "pop", v: 0.16 }, { at: EXPL_END - 0.1, s: "whoosh", v: 0.2 }, { at: B_END - 0.35, s: "whoosh", v: 0.22 },
    { at: B_END + cEnd + 1.1, s: "tick", v: 0.3 }, { at: B_END + cEnd + 1.3, s: "bell", v: 0.2 },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <Sequence from={f(A_START)} durationInFrames={f(A_END - A_START) + 6}><ClipPart srcFrom={A_SRC[0]} t={t} /></Sequence>
      <Sequence from={f(B_START)} durationInFrames={f(B_END - B_START) + 6}><ClipPart srcFrom={B_SRC[0]} t={t} /></Sequence>
      <Intro t={t} />
      <Captions words={ALL_WORDS} t={t} />
      <Pill t={t} a={0.1} b={INTRO_END} lines={["He had NO IDEA", "who she was 😭"]} hl={["NO", "IDEA"]} y={330} />
      <Explainer t={t} />
      <EndCta t={t} cEnd={cEnd} />
      <Sequence from={f(A_START)} durationInFrames={f(A_END - A_START)}><Audio src={staticFile("shadow/clip.mp4")} startFrom={f(A_SRC[0])} /></Sequence>
      <Sequence from={f(B_START)} durationInFrames={f(B_END - B_START)}><Audio src={staticFile("shadow/clip.mp4")} startFrom={f(B_SRC[0])} volume={(fr) => interpolate(fr / fps, [B_END - B_START - 0.3, B_END - B_START], [1, 0], CL)} /></Sequence>
      <Sequence from={f(MIKE_AT.A)}><Audio src={staticFile("shadow/mike_a.wav")} /></Sequence>
      <Sequence from={f(MIKE_AT.B)}><Audio src={staticFile("shadow/mike_b.wav")} /></Sequence>
      <Sequence from={f(MIKE_AT.C)}><Audio src={staticFile("shadow/mike_c.wav")} /></Sequence>
      {SFX.map((c, i) => <Sequence key={i} from={f(c.at)}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>)}
    </AbsoluteFill>
  );
};
