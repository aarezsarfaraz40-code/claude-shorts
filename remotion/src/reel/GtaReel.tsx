/**
 * GtaReel — data-driven 1080x1920 news/fact reel with motion graphics.
 *
 * Everything is driven by a JSON "spec" (see reels/specs/*.json):
 *   clips     — trailer shots, full-screen 9:16 (center/cover crop, `focusX`
 *               picks which part of the wide frame stays in view)
 *   overlays  — animated graphics: hook, counter, versus, badge, bars,
 *               timeline, poll, stamp, bignumber, text, endcard
 *   captions  — word-level voiceover captions (revealed word by word)
 *   sfx       — sound effects at given times
 *
 * All text uses Montserrat (variable font, weight 900).
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { useCaptionPages } from "../hooks/useCaptionPages";

// ------------------------------------------------------------------ schema

export const GtaReelSchema = z.object({
  durationInSeconds: z.number(),
  assetBase: z.string(),
  trailer: z.string(),
  voiceover: z.string(),
  tag: z.string().default(""),
  logo: z.string().default(""),
  logoText: z.string().default("LOGO"),
  // Source frame: full size + the picture area inside the letterbox
  source: z
    .object({ w: z.number(), h: z.number(), top: z.number(), bottom: z.number() })
    .default({ w: 1280, h: 720, top: 92, bottom: 628 }),
  clips: z.array(
    z.object({
      from: z.number(),
      to: z.number(),
      src: z.number(),
      focusX: z.number().optional(),
      focusTo: z.number().optional(),
      zoom: z.enum(["in", "out"]).optional(),
    })
  ),
  overlays: z.array(z.any()),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
  sfx: z.array(z.object({ at: z.number(), file: z.string(), volume: z.number().optional() })).default([]),
  music: z.object({ file: z.string(), volume: z.number().default(0.15), startAt: z.number().default(0) }).optional(),
});
export type GtaReelProps = z.infer<typeof GtaReelSchema>;

// ------------------------------------------------------------------ theme

const C = {
  pink: "#FF3D8B",
  orange: "#FF9A3C",
  purple: "#7B2FF7",
  yellow: "#FFE14D",
  green: "#3DFF8B",
  red: "#FF3B3B",
  white: "#FFFFFF",
  dark: "#0B0614",
};
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const W = 1080;
const H = 1920;
const ZONE = { x: 40, y: 470, size: 1000 }; // design space for center graphics
// Platform safe zone (YouTube Shorts / Reels / TikTok UI never covers this):
// 60px left, 180px right (like/comment buttons), 250px top, 480px bottom.
// Symmetric, so text is centered on screen AND survives the side crop that
// YouTube/IG apply on tall (20:9) phones (~108px per side).
const SAFE = { left: 150, right: 930, top: 260, bottom: 1420 };
const SAFE_CX = (SAFE.left + SAFE.right) / 2;
// Center graphics are drawn in the 1000x1000 ZONE, then scaled into the safe zone
const GK = 0.62;
const GZ = { x: SAFE_CX - (ZONE.size * GK) / 2, y: 620 };
const S = (s: number, fps: number) => Math.round(s * fps);

const fontCSS = `
@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-style: normal; font-display: block; }
@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Italic-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-style: italic; font-display: block; }
`;

const outline = (px: number, color = "#000") =>
  `${px}px ${px}px 0 ${color}, -${px}px -${px}px 0 ${color}, ${px}px -${px}px 0 ${color}, -${px}px ${px}px 0 ${color}, 0 ${px * 2}px ${px * 5}px rgba(0,0,0,.7)`;

const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1.05,
  textTransform: "uppercase",
  letterSpacing: -1,
  ...extra,
});

// Pop-in / fade-out envelope for an overlay living between [0, dur] frames
const usePop = (dur: number, stiffness = 180) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 11, stiffness, mass: 0.8 } });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { frame, fps, inn, out, scale: inn * (0.6 + 0.4 * out), opacity: Math.min(1, inn * 1.5) * out };
};

// ------------------------------------------------------------------ full-screen video

const ClipShot: React.FC<{
  src: string;
  srcStart: number;
  dur: number;
  focusX: number;
  focusTo: number;
  zoom: "in" | "out";
  source: GtaReelProps["source"];
}> = ({ src, srcStart, dur, focusX, focusTo, zoom, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const picH = source.bottom - source.top;
  const kb = interpolate(frame, [0, dur], zoom === "in" ? [1.0, 1.1] : [1.1, 1.0], { extrapolateRight: "clamp" });
  const punch = interpolate(frame, [0, 6], [1.15, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const scale = (H / picH) * kb * punch; // cover: picture height fills the screen
  const vw = source.w * scale;
  const vh = source.h * scale;
  const fx = interpolate(frame, [0, dur], [focusX, focusTo], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const left = Math.min(0, Math.max(W - vw, W / 2 - fx * source.w * scale));
  const top = H / 2 - (source.top + picH / 2) * scale;
  const flash = interpolate(frame, [0, 4], [0.65, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={src}
        startFrom={Math.round(srcStart * fps)}
        muted
        style={{ position: "absolute", left, top, width: vw, height: vh, maxWidth: "none" }}
      />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

const FullVideo: React.FC<{ props: GtaReelProps }> = ({ props }) => {
  const { fps } = useVideoConfig();
  const src = props.assetBase + props.trailer;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {props.clips.map((c, i) => (
        <Sequence key={i} from={S(c.from, fps)} durationInFrames={Math.max(1, S(c.to - c.from, fps))}>
          <ClipShot
            src={src}
            srcStart={c.src}
            dur={S(c.to - c.from, fps)}
            focusX={c.focusX ?? 0.5}
            focusTo={c.focusTo ?? c.focusX ?? 0.5}
            zoom={c.zoom ?? (i % 2 ? "out" : "in")}
            source={props.source}
          />
        </Sequence>
      ))}
      {/* readability gradients (top for hooks, bottom for captions) + brand tint */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,4,20,.82) 0%, rgba(10,4,20,.35) 22%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 62%, rgba(10,4,20,.45) 76%, rgba(10,4,20,.85) 100%)",
        }}
      />
      <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.purple}22, transparent 40%, ${C.pink}22)` }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ chrome

const TopBar: React.FC<{ tag: string; logo: string; logoText: string }> = ({ tag, logo, logoText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const t = spring({ frame: frame - 6, fps, config: { damping: 12 } });
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          top: 90,
          width: 210,
          height: 117,
          borderRadius: 16,
          overflow: "hidden",
          border: `4px solid ${C.white}`,
          background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.white,
          boxShadow: "0 8px 30px rgba(0,0,0,.5)",
          transform: `scale(${s})`,
          transformOrigin: "left top",
          ...T(26),
        }}
      >
        {logo ? <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : logoText}
      </div>
      {tag ? <div
        style={{
          position: "absolute",
          left: SAFE.left + 214,
          top: SAFE.top + 40,
          transform: `translateX(${(1 - t) * -300}px)`,
          opacity: Math.min(1, t * 2),
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: C.red,
          padding: "10px 20px",
          borderRadius: 999,
          color: C.white,
          boxShadow: "0 8px 30px rgba(0,0,0,.4)",
          ...T(28, { letterSpacing: 1 }),
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.white, opacity: blink }} />
        {tag}
      </div> : null}
    </>
  );
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / total);
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: W, height: 14, background: "rgba(255,255,255,.2)" }}>
      <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.yellow}, ${C.pink})` }} />
    </div>
  );
};

// Captions: each word appears exactly when it is spoken (word by word)
const ReelCaptions: React.FC<{ captions: GtaReelProps["captions"] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useCaptionPages(captions, 900);
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  // Auto-fit: never wider than the safe zone, max 2 lines.
  const boxW = SAFE.right - SAFE.left;
  const words = page.tokens.map((t) => t.text.trim());
  const longest = Math.max(1, ...words.map((w) => w.length));
  const chars = words.join(" ").length;
  const capSize = Math.floor(Math.min(62, boxW / (longest * 0.78), (2 * boxW) / (chars * 0.74 + 2)));
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: W - SAFE.right,
        top: 1240,
        height: 175,
        overflow: "visible",
        textAlign: "center",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        gap: "2px 30px",
      }}
    >
      {page.tokens.map((tk, i) => {
        const shown = ms >= tk.fromMs - 30;
        const active = ms >= tk.fromMs && ms < tk.toMs;
        const local = frame - Math.floor((tk.fromMs / 1000) * fps);
        const s = spring({ frame: local, fps, config: { damping: 9, stiffness: 260, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              visibility: shown ? "visible" : "hidden",
              color: active ? C.yellow : C.white,
              transform: `translateY(${(1 - s) * 30}px) scale(${0.5 + 0.5 * s})`,
              textShadow: outline(4),
              ...T(Math.max(40, capSize)),
            }}
          >
            {tk.text.trim()}
          </span>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------ overlays

type OV = { type: string; from: number; to: number; [k: string]: any };

// Full-screen dim so graphics read clearly over the video
// (Drawn full-screen by ScrimLayer in the main component, outside the
// scaled graphics area, so inside graphics this renders nothing.)
const Scrim: React.FC<{ opacity: number; strength?: number }> = () => null;
const SCRIM_TYPES: Record<string, number> = { counter: 0.55, versus: 0.55, bars: 0.65, timeline: 0.65, poll: 0.55 };
const ScrimLayer: React.FC<{ dur: number; strength: number }> = ({ dur, strength }) => {
  const { opacity } = usePop(dur);
  return <AbsoluteFill style={{ background: `rgba(10,4,20,${strength})`, opacity }} />;
};

// Hook headline: words land one by one (slide up + scale + unblur).
// `highlight` words get a tilted yellow box with black text.
const Hook: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, out } = usePop(dur);
  const lines: string[] = o.lines;
  const hl: string[] = (o.highlight ?? []).map((w: string) => w.toUpperCase());
  const stagger = o.stagger ?? 4;
  // Auto-fit: the longest line must fit inside the safe zone width
  const boxW = SAFE.right - SAFE.left;
  const longestLine = Math.max(1, ...lines.map((l) => l.length));
  const hookSize = Math.floor(Math.min((o.size ?? 96) * 0.75, boxW / (longestLine * 0.8 + 1)));
  let idx = 0;
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: W - SAFE.right, top: o.top ?? 395, textAlign: "center", opacity: out }}>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px", marginBottom: 6 }}>
          {line.split(" ").map((w, wi) => {
            const k = idx++;
            const f = frame - k * stagger;
            const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 220, mass: 0.7 } });
            const blur = interpolate(f, [0, 6], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const isHl = hl.includes(w.toUpperCase().replace(/[^A-Z0-9$%]/g, ""));
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  opacity: Math.min(1, s * 2),
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${(1 - s) * 70}px) scale(${0.4 + 0.6 * s}) ${isHl ? "rotate(-3deg)" : ""}`,
                  color: isHl ? "#000" : C.white,
                  background: isHl ? C.yellow : "transparent",
                  padding: isHl ? "2px 14px" : 0,
                  borderRadius: isHl ? 12 : 0,
                  boxShadow: isHl ? `0 10px 30px rgba(0,0,0,.5)` : "none",
                  textShadow: isHl ? "none" : outline(4),
                  ...T(hookSize),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const fmt = (v: number, decimals: number, sep: boolean) => {
  const s = v.toFixed(decimals);
  if (!sep) return s;
  const [a, b] = s.split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
};

// Big number counting up, lands with a shake + burst ring
const Counter: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, scale, opacity } = usePop(dur);
  const landF = S((o.land ?? o.from + 1.2) - o.from, fps);
  const p = interpolate(frame, [4, landF], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const v = o.start + (o.end - o.start) * p;
  const after = frame - landF;
  const shake = after >= 0 && after < 8 ? Math.sin(after * 2.5) * (8 - after) * 1.5 : 0;
  const burst = after >= 0 ? interpolate(after, [0, 14], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const color = o.color ?? C.yellow;
  return (
    <>
      {o.scrim === false ? null : <Scrim opacity={opacity} />}
      <div
        style={{
          position: "absolute",
          left: ZONE.x,
          top: ZONE.y + (o.offsetY ?? 0),
          width: ZONE.size,
          height: ZONE.size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: `scale(${scale}) translateX(${shake}px)`,
        }}
      >
        <div style={{ position: "absolute", width: 300 + burst * 700, height: 300 + burst * 700, borderRadius: "50%", border: `10px solid ${color}`, opacity: after >= 0 ? 1 - burst : 0 }} />
        <div
          style={{
            color,
            textShadow: outline(9),
            transform: `scale(${after >= 0 && after < 10 ? 1 + (10 - after) * 0.02 : 1})`,
            ...T(o.size ?? 280, { fontStyle: "italic", letterSpacing: -6, lineHeight: 1 }),
          }}
        >
          {o.prefix ?? ""}
          {fmt(v, o.decimals ?? 0, o.separator ?? true)}
          {o.suffix ?? ""}
        </div>
        {o.label ? (
          <div
            style={{
              marginTop: 18,
              color: C.white,
              background: C.pink,
              padding: "12px 32px",
              borderRadius: 16,
              transform: `rotate(-2deg) scale(${spring({ frame: frame - 8, fps, config: { damping: 10 } })})`,
              ...T(52),
            }}
          >
            {o.label}
          </div>
        ) : null}
      </div>
    </>
  );
};

// Two cards slide in from the sides; optional stamp drops at `stampAt`
const Versus: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const l = spring({ frame, fps, config: { damping: 13 } });
  const r = spring({ frame: frame - 8, fps, config: { damping: 13 } });
  const vs = spring({ frame: frame - 14, fps, config: { damping: 8, stiffness: 250 } });
  const card = (side: any, x: number, color: string) => (
    <div
      style={{
        width: 430,
        padding: "34px 20px",
        borderRadius: 30,
        background: `linear-gradient(160deg, ${color}, #1a0533)`,
        border: `5px solid ${C.white}`,
        textAlign: "center",
        transform: `translateX(${x}px)`,
        boxShadow: "0 20px 50px rgba(0,0,0,.5)",
      }}
    >
      <div style={{ color: C.white, ...T(40) }}>{side.title}</div>
      <div style={{ color: C.yellow, textShadow: outline(6), ...T(180, { fontStyle: "italic", lineHeight: 1 }) }}>{side.value}</div>
      <div style={{ color: "#ffd9ea", ...T(34) }}>{side.sub}</div>
    </div>
  );
  const stampF = o.stampAt != null ? S(o.stampAt - o.from, fps) : null;
  const st = stampF != null ? spring({ frame: frame - stampF, fps, config: { damping: 9, stiffness: 260 } }) : 0;
  return (
    <>
      <Scrim opacity={opacity} />
      <div style={{ position: "absolute", left: ZONE.x, top: ZONE.y, width: ZONE.size, height: ZONE.size, display: "flex", alignItems: "center", justifyContent: "center", gap: 40, opacity }}>
        {card(o.left, (1 - l) * -700, C.pink)}
        {card(o.right, (1 - r) * 700, C.purple)}
        <div style={{ position: "absolute", color: C.white, textShadow: outline(7, C.red), transform: `scale(${vs}) rotate(${(1 - vs) * 90}deg)`, ...T(110, { fontStyle: "italic" }) }}>VS</div>
        {stampF != null && frame >= stampF ? (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              color: C.red,
              border: `8px solid ${C.red}`,
              padding: "6px 30px",
              borderRadius: 14,
              background: "rgba(255,255,255,.94)",
              transform: `rotate(-10deg) scale(${2.4 - 1.4 * st})`,
              opacity: Math.min(1, st * 2),
              ...T(62),
            }}
          >
            {o.stampText}
          </div>
        ) : null}
      </div>
    </>
  );
};

// Rating badge that slams in (e.g. "IGN 10/10")
const Badge: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const s = spring({ frame, fps, config: { damping: 8, stiffness: 260, mass: 0.9 } });
  const shine = interpolate(frame, [6, 26], [-300, 900], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: o.x ?? 190, top: o.y ?? 700, width: 700, opacity, transform: `scale(${2.2 - 1.2 * s}) rotate(${o.rotate ?? -4}deg)` }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 36, background: o.color ?? C.red, border: `8px solid ${C.white}`, padding: "26px 0", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,.6)" }}>
        <div style={{ color: C.white, ...T(68, { letterSpacing: 4 }) }}>{o.title}</div>
        <div style={{ color: C.yellow, textShadow: outline(7), ...T(200, { fontStyle: "italic", lineHeight: 0.95 }) }}>{o.value}</div>
        <div style={{ position: "absolute", top: 0, left: shine, width: 120, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)", transform: "skewX(-20deg)" }} />
      </div>
    </div>
  );
};

// Animated bar chart; each bar can start growing at its own time `at`
const Bars: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const items: any[] = o.items;
  const min = o.min ?? 0;
  const max = o.max ?? Math.max(...items.map((i) => i.value));
  const barH = Math.min(150, 760 / items.length - 20);
  return (
    <>
      <Scrim opacity={opacity} strength={0.65} />
      <div style={{ position: "absolute", left: ZONE.x + 30, top: ZONE.y + 30, width: ZONE.size - 60, opacity }}>
        {o.title ? <div style={{ color: C.white, textAlign: "center", textShadow: outline(5), marginBottom: 30, ...T(76) }}>{o.title}</div> : null}
        {items.map((it, i) => {
          const startF = S((it.at ?? o.from + i * 0.4) - o.from, fps);
          const g = spring({ frame: frame - startF, fps, config: { damping: 16, stiffness: 90 } });
          const frac = Math.max(0.04, (it.value - min) / (max - min));
          const shown = it.value * Math.min(1, g);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 20, height: barH, opacity: Math.min(1, g * 3) }}>
              <div style={{ width: 330, color: C.white, textShadow: outline(4), ...T(o.labelSize ?? 52, { lineHeight: 1 }) }}>{it.label}</div>
              <div style={{ flex: 1, height: "100%" }}>
                <div
                  style={{
                    width: `${frac * 100 * Math.min(1, g)}%`,
                    height: "100%",
                    borderRadius: 18,
                    background: it.highlight ? `linear-gradient(90deg, ${C.orange}, ${C.yellow})` : `linear-gradient(90deg, ${C.purple}, ${it.color ?? C.pink})`,
                    boxShadow: it.highlight ? `0 0 40px ${C.yellow}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 16,
                  }}
                >
                  <span style={{ color: C.white, textShadow: outline(5), whiteSpace: "nowrap", ...T(Math.min(90, barH * 0.75), { fontStyle: "italic" }) }}>
                    {(it.prefix ?? "") + fmt(shown, it.decimals ?? 0, true) + (it.suffix ?? "")}
                    {it.crown && g > 0.95 ? " 👑" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// Vertical timeline; items appear at `at`; state "fail" crosses out
const Timeline: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const items: any[] = o.items;
  const lineP = interpolate(frame, [0, Math.max(1, dur * 0.7)], [0, 1], { extrapolateRight: "clamp" });
  return (
    <>
      <Scrim opacity={opacity} strength={0.65} />
      <div style={{ position: "absolute", left: ZONE.x, top: ZONE.y, width: ZONE.size, height: ZONE.size, opacity }}>
        {o.title ? <div style={{ position: "absolute", top: 40, width: "100%", textAlign: "center", color: C.white, textShadow: outline(5), ...T(76) }}>{o.title}</div> : null}
        <div style={{ position: "absolute", left: 120, top: 220, width: 12, height: 680 * lineP, background: C.white, borderRadius: 6 }} />
        {items.map((it, i) => {
          const f = S((it.at ?? o.from + i) - o.from, fps);
          const s = spring({ frame: frame - f, fps, config: { damping: 11 } });
          const failF = it.failAt != null ? S(it.failAt - o.from, fps) : null;
          const failed = it.state === "fail" && (failF == null || frame >= failF);
          const y = 230 + i * (640 / Math.max(1, items.length - 1));
          return (
            <div key={i} style={{ position: "absolute", left: 80, top: y - 40, display: "flex", alignItems: "center", gap: 40, transform: `translateX(${(1 - s) * 600}px)`, opacity: Math.min(1, s * 2) }}>
              <div style={{ width: 92, height: 92, borderRadius: 46, background: failed ? C.red : it.state === "ok" ? C.green : C.yellow, border: `6px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", ...T(48) }}>
                {failed ? "✕" : it.state === "ok" ? "✓" : "•"}
              </div>
              <div>
                <div style={{ color: failed ? "#bbb" : C.white, textDecoration: failed ? "line-through" : "none", textDecorationColor: C.red, textDecorationThickness: 8, textShadow: outline(5), ...T(80, { fontStyle: "italic" }) }}>{it.label}</div>
                {it.sub ? <div style={{ color: failed ? C.red : C.yellow, ...T(36) }}>{it.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// Poll; options pop in. `pct` only if you have real numbers.
const Poll: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const opts: any[] = o.options;
  return (
    <>
      <Scrim opacity={opacity} />
      <div style={{ position: "absolute", left: ZONE.x + 60, top: ZONE.y + 140, width: ZONE.size - 120, opacity }}>
        <div style={{ color: C.white, textAlign: "center", textShadow: outline(6), marginBottom: 50, ...T(84) }}>{o.question}</div>
        {opts.map((op, i) => {
          const s = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 10 } });
          const hasPct = typeof op.pct === "number";
          const fill = hasPct ? interpolate(frame, [12 + i * 6, 40 + i * 6], [0, op.pct], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <div key={i} style={{ position: "relative", height: 130, marginBottom: 30, borderRadius: 65, overflow: "hidden", border: `6px solid ${C.white}`, background: "rgba(255,255,255,.15)", transform: `scale(${s})` }}>
              <div style={{ position: "absolute", inset: 0, width: `${fill}%`, background: i === 0 ? C.green : C.red, opacity: 0.85 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px", color: C.white, textShadow: outline(4), ...T(58) }}>
                <span>{op.label}</span>
                <span>{hasPct ? `${Math.round(fill)}%` : op.emoji ?? ""}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// Rotated rubber stamp (e.g. "ESTIMATE", "THEORY", "NOT CONFIRMED")
const Stamp: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 260 } });
  return (
    <div
      style={{
        position: "absolute",
        left: o.x ?? 560,
        top: o.y ?? 1360,
        color: o.color ?? C.red,
        border: `6px solid ${o.color ?? C.red}`,
        padding: "4px 22px",
        borderRadius: 12,
        background: "rgba(255,255,255,.94)",
        transform: `rotate(${o.rotate ?? -8}deg) scale(${2.2 - 1.2 * s})`,
        opacity: Math.min(1, s * 2) * opacity,
        ...T(o.size ?? 44),
      }}
    >
      {o.text}
    </div>
  );
};

// Giant number for countdown lists (5, 4, 3...)
const BigNumber: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const s = spring({ frame, fps, config: { damping: 7, stiffness: 220 } });
  return (
    <div style={{ position: "absolute", left: o.x ?? 60, top: o.y ?? 470, color: C.yellow, textShadow: outline(10, C.pink), transform: `scale(${s}) rotate(${(1 - s) * 40 - 8}deg)`, opacity, ...T(300, { fontStyle: "italic" }) }}>
      {o.text}
    </div>
  );
};

// Small label (e.g. source line); slides up
const TextLine: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const s = spring({ frame, fps, config: { damping: 12 } });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: o.y ?? 1360, textAlign: "center", opacity, transform: `translateY(${(1 - s) * 80}px)` }}>
      <span style={{ color: o.color ?? C.white, background: o.bg ?? "rgba(0,0,0,.65)", padding: "10px 26px", borderRadius: 16, lineHeight: 1.5, ...T(o.size ?? 52, { fontWeight: 800, textTransform: o.upper === false ? "none" : "uppercase", letterSpacing: 0 }) }}>
        {o.text}
      </span>
    </div>
  );
};

const EndCard: React.FC<{ o: OV; logo: string; logoText: string }> = ({ o, logo, logoText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 10 } });
  const pulse = 1 + Math.sin(frame / 4) * 0.04;
  const words: string[] = String(o.line1).split(" ");
  const shine = interpolate(frame, [10, 34], [-200, 1000], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `rgba(11,6,20,${0.85 * Math.min(1, s)})` }}>
      <div style={{ position: "absolute", left: SAFE.left, width: SAFE.right - SAFE.left, top: 420, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative", width: 760, height: 424, borderRadius: 28, overflow: "hidden", border: `6px solid ${C.white}`, background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, transform: `scale(${s}) rotate(${(1 - s) * -8}deg)`, boxShadow: `0 0 80px ${C.pink}`, ...T(64) }}>
          {logo ? <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : logoText}
          <div style={{ position: "absolute", top: 0, left: shine, width: 140, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)", transform: "skewX(-20deg)" }} />
        </div>
        <div style={{ marginTop: 50, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {words.map((w, i) => {
            const ws = spring({ frame: frame - 8 - i * 4, fps, config: { damping: 11, stiffness: 220 } });
            return (
              <span key={i} style={{ display: "inline-block", color: C.white, textShadow: outline(5), opacity: Math.min(1, ws * 2), transform: `translateY(${(1 - ws) * 60}px) scale(${0.5 + 0.5 * ws})`, ...T(74) }}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 26, color: "#000", background: C.yellow, padding: "14px 40px", borderRadius: 999, transform: `scale(${pulse * spring({ frame: frame - 20, fps, config: { damping: 10 } })})`, ...T(44) }}>
          {o.line2}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Overlay: React.FC<{ o: OV; props: GtaReelProps }> = ({ o, props }) => {
  const { fps } = useVideoConfig();
  const dur = S(o.to - o.from, fps);
  switch (o.type) {
    case "hook": return <Hook o={o} dur={dur} />;
    case "counter": return <Counter o={o} dur={dur} />;
    case "versus": return <Versus o={o} dur={dur} />;
    case "badge": return <Badge o={o} dur={dur} />;
    case "bars": return <Bars o={o} dur={dur} />;
    case "timeline": return <Timeline o={o} dur={dur} />;
    case "poll": return <Poll o={o} dur={dur} />;
    case "stamp": return <Stamp o={o} dur={dur} />;
    case "bignumber": return <BigNumber o={o} dur={dur} />;
    case "text": return <TextLine o={o} dur={dur} />;
    case "endcard": return <EndCard o={o} logo={props.logo ? props.assetBase + props.logo : ""} logoText={props.logoText} />;
    default: return null;
  }
};

// ------------------------------------------------------------------ main

export const GtaReel: React.FC<GtaReelProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const overlays = props.overlays as OV[];
  const ends = overlays.filter((o) => o.type === "endcard");
  const endStart = ends.length ? Math.min(...ends.map((e) => e.from)) : Infinity;
  const captions = props.captions.filter((c) => c.startMs / 1000 < endStart);
  // Draw scrim-type graphics first so hooks stay on top
  const order = (o: OV) => (o.type === "text" || o.type === "stamp" ? 1 : 0);
  const graphics = overlays.filter((o) => o.type !== "endcard" && o.type !== "hook").sort((a, b) => order(a) - order(b));
  const hooks = overlays.filter((o) => o.type === "hook");
  const scrims = overlays.filter((o) => SCRIM_TYPES[o.type] != null && o.scrim !== false);
  const music = props.music;
  const musicStart = music ? Math.round((music.startAt ?? 0) * fps) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <FullVideo props={props} />
      {scrims.map((o, i) => (
        <Sequence key={`sc${i}`} from={S(o.from, fps)} durationInFrames={Math.max(1, S(o.to - o.from, fps))}>
          <ScrimLayer dur={S(o.to - o.from, fps)} strength={SCRIM_TYPES[o.type]} />
        </Sequence>
      ))}
      {/* center graphics, scaled into the safe zone */}
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${GZ.x - ZONE.x * GK}px, ${GZ.y - ZONE.y * GK}px) scale(${GK})` }}>
        {graphics.map((o, i) => (
          <Sequence key={i} from={S(o.from, fps)} durationInFrames={Math.max(1, S(o.to - o.from, fps))}>
            <Overlay o={o} props={props} />
          </Sequence>
        ))}
      </AbsoluteFill>
      {hooks.map((o, i) => (
        <Sequence key={`h${i}`} from={S(o.from, fps)} durationInFrames={Math.max(1, S(o.to - o.from, fps))}>
          <Overlay o={o} props={props} />
        </Sequence>
      ))}
      <ReelCaptions captions={captions} />
      <TopBar tag={props.tag} logo={props.logo ? props.assetBase + props.logo : ""} logoText={props.logoText} />
      {ends.map((o, i) => (
        <Sequence key={`e${i}`} from={S(o.from, fps)}>
          <Overlay o={o} props={props} />
        </Sequence>
      ))}
      <ProgressBar total={durationInFrames} />
      <Audio src={props.assetBase + props.voiceover} />
      {music ? (
        <Audio
          src={props.assetBase + music.file}
          startFrom={musicStart}
          volume={(f) =>
            (music.volume ?? 0.15) *
            interpolate(f, [0, 4, durationInFrames - 45, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          }
        />
      ) : null}
      {props.sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={S(s.at, fps)}>
          <Audio src={props.assetBase + s.file} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
