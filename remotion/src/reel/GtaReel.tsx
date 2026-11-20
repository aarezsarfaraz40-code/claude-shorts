/**
 * GtaReel — data-driven 1080x1920 news/fact reel with motion graphics.
 *
 * Everything is driven by a JSON "spec" (see reels/specs/*.json):
 *   clips     — trailer shots shown in the center card (seconds)
 *   overlays  — animated graphics: hook, counter, versus, badge, bars,
 *               timeline, poll, stamp, bignumber, text, endcard
 *   captions  — word-level voiceover captions
 *   sfx       — sound effects at given times
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
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFaceCSS } from "../styles/fonts";
import { useCaptionPages } from "../hooks/useCaptionPages";

// ------------------------------------------------------------------ schema

export const GtaReelSchema = z.object({
  durationInSeconds: z.number(),
  assetBase: z.string(),
  trailer: z.string(),
  voiceover: z.string(),
  tag: z.string().default("GTA 6 NEWS"),
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
      zoom: z.enum(["in", "out"]).optional(),
    })
  ),
  overlays: z.array(z.any()),
  captions: z.array(z.object({ text: z.string(), startMs: z.number(), endMs: z.number() })),
  sfx: z.array(z.object({ at: z.number(), file: z.string(), volume: z.number().optional() })).default([]),
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
const FONT = "'Montserrat', sans-serif";
const DISPLAY = "'Bangers', 'Montserrat', sans-serif";
const CARD = { x: 40, y: 470, size: 1000 };
const S = (s: number, fps: number) => Math.round(s * fps);

const outline = (px: number, color = "#000") =>
  `${px}px ${px}px 0 ${color}, -${px}px -${px}px 0 ${color}, ${px}px -${px}px 0 ${color}, -${px}px ${px}px 0 ${color}, 0 ${px * 2}px ${px * 4}px rgba(0,0,0,.6)`;

// Pop-in / pop-out envelope for an overlay living between [0, dur] frames
const usePop = (dur: number, stiffness = 180) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 11, stiffness, mass: 0.8 } });
  const out = interpolate(frame, [dur - 6, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { frame, fps, inn, out, scale: inn * (0.6 + 0.4 * out), opacity: Math.min(1, inn * 1.5) * out };
};

// ------------------------------------------------------------------ background

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const hue = Math.sin(t * 0.4) * 20;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${160 + hue}deg, #1a0533 0%, #3b0a4f 35%, #a3195b 70%, #ff7a3c 100%)`,
      }}
    >
      {/* moving diagonal stripes */}
      <AbsoluteFill
        style={{
          opacity: 0.12,
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 4px, transparent 4px 60px)",
          backgroundPosition: `${(frame * 2) % 600}px 0`,
        }}
      />
      {/* floating glow orbs */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 540 + Math.sin(t * (0.3 + i * 0.07) + i * 2) * 420;
        const y = 960 + Math.cos(t * (0.25 + i * 0.05) + i) * 820;
        const r = 160 + i * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - r,
              top: y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: i % 2 ? C.pink : C.orange,
              opacity: 0.18,
              filter: "blur(60px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ video card

const ClipShot: React.FC<{
  src: string;
  srcStart: number;
  dur: number;
  focusX: number;
  zoom: "in" | "out";
  source: GtaReelProps["source"];
}> = ({ src, srcStart, dur, focusX, zoom, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const picH = source.bottom - source.top;
  const base = CARD.size / picH; // fill card height with the picture area
  const kb = interpolate(frame, [0, dur], zoom === "in" ? [1.0, 1.12] : [1.12, 1.0], {
    extrapolateRight: "clamp",
  });
  // Entry "punch" + flash
  const punch = interpolate(frame, [0, 5], [1.18, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const scale = base * kb * punch;
  const vw = source.w * scale;
  const vh = source.h * scale;
  const cx = focusX * source.w * scale;
  const left = CARD.size / 2 - cx;
  const top = CARD.size / 2 - ((source.top + picH / 2) * scale);
  const clampedLeft = Math.min(0, Math.max(CARD.size - vw, left));
  const flash = interpolate(frame, [0, 4], [0.7, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={src}
        startFrom={Math.round(srcStart * fps)}
        muted
        style={{ position: "absolute", left: clampedLeft, top, width: vw, height: vh, maxWidth: "none" }}
      />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

const VideoCard: React.FC<{ props: GtaReelProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const src = props.assetBase + props.trailer;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.size,
        height: CARD.size,
        borderRadius: 44,
        overflow: "hidden",
        transform: `scale(${0.85 + 0.15 * enter})`,
        boxShadow: `0 0 0 6px ${C.white}, 0 0 60px 10px ${C.pink}aa, 0 30px 80px rgba(0,0,0,.6)`,
        background: "#000",
      }}
    >
      {props.clips.map((c, i) => (
        <Sequence key={i} from={S(c.from, fps)} durationInFrames={Math.max(1, S(c.to - c.from, fps))}>
          <ClipShot
            src={src}
            srcStart={c.src}
            dur={S(c.to - c.from, fps)}
            focusX={c.focusX ?? 0.5}
            zoom={c.zoom ?? (i % 2 ? "out" : "in")}
            source={props.source}
          />
        </Sequence>
      ))}
      {/* subtle vignette */}
      <AbsoluteFill
        style={{ background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,.45) 100%)" }}
      />
    </div>
  );
};

// ------------------------------------------------------------------ chrome

const TopBar: React.FC<{ tag: string; logo: string; logoText: string }> = ({ tag, logo, logoText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.3;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 50,
          top: 70,
          transform: `translateX(${(1 - s) * -400}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: C.red,
          padding: "14px 28px",
          borderRadius: 999,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 38,
          color: C.white,
          letterSpacing: 2,
          boxShadow: "0 8px 30px rgba(0,0,0,.4)",
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: 9, background: C.white, opacity: blink }} />
        {tag}
      </div>
      <div
        style={{
          position: "absolute",
          right: 50,
          top: 50,
          width: 130,
          height: 130,
          borderRadius: 65,
          overflow: "hidden",
          transform: `scale(${s}) rotate(${(1 - s) * 180}deg)`,
          border: `5px solid ${C.white}`,
          background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 30,
          color: C.white,
          boxShadow: "0 8px 30px rgba(0,0,0,.5)",
        }}
      >
        {logo ? <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : logoText}
      </div>
    </>
  );
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const p = Math.min(1, frame / total);
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: 1080, height: 14, background: "rgba(255,255,255,.2)" }}>
      <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.yellow}, ${C.pink})` }} />
    </div>
  );
};

const ReelCaptions: React.FC<{ captions: GtaReelProps["captions"] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useCaptionPages(captions, 700);
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs);
  if (!page) return null;
  const local = frame - Math.floor((page.startMs / 1000) * fps);
  const s = spring({ frame: local, fps, config: { damping: 10, stiffness: 220, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: 1530,
        height: 260,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        gap: "8px 30px",
        transform: `scale(${0.7 + 0.3 * s}) translateY(${(1 - s) * 40}px)`,
      }}
    >
      {page.tokens.map((tk, i) => {
        const active = ms >= tk.fromMs && ms < tk.toMs;
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 82,
              textTransform: "uppercase",
              color: active ? C.yellow : C.white,
              transform: active ? "scale(1.12) rotate(-2deg)" : "none",
              display: "inline-block",
              textShadow: outline(5),
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

const Scrim: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: "absolute",
      left: CARD.x,
      top: CARD.y,
      width: CARD.size,
      height: CARD.size,
      borderRadius: 44,
      background: "rgba(10,4,20,.62)",
      opacity,
    }}
  />
);

// Words appear one by one with a bounce; `highlight` words go yellow
const Hook: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, out } = usePop(dur);
  const lines: string[] = o.lines;
  const hl: string[] = (o.highlight ?? []).map((w: string) => w.toUpperCase());
  let idx = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: o.top ?? 190,
        textAlign: "center",
        opacity: out,
      }}
    >
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 20px" }}>
          {line.split(" ").map((w, wi) => {
            const k = idx++;
            const s = spring({ frame: frame - k * 3, fps, config: { damping: 9, stiffness: 200 } });
            const isHl = hl.includes(w.toUpperCase().replace(/[^A-Z0-9$]/g, ""));
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  fontFamily: DISPLAY,
                  fontSize: o.size ?? 104,
                  lineHeight: 1.05,
                  color: isHl ? C.yellow : C.white,
                  transform: `scale(${s}) translateY(${(1 - s) * 60}px) rotate(${(1 - s) * -12}deg)`,
                  textShadow: outline(6),
                  letterSpacing: 2,
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

// Big number counting up, lands with a shake + burst
const Counter: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, scale, opacity } = usePop(dur);
  const landF = S((o.land ?? o.from + 1.2) - o.from, fps);
  const p = interpolate(frame, [4, landF], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const v = o.start + (o.end - o.start) * p;
  const after = frame - landF;
  const shake = after >= 0 && after < 8 ? Math.sin(after * 2.5) * (8 - after) * 1.5 : 0;
  const burst = after >= 0 ? interpolate(after, [0, 14], [0, 1], { extrapolateRight: "clamp" }) : 0;
  const color = o.color ?? C.yellow;
  return (
    <>
      <Scrim opacity={opacity * (o.scrim === false ? 0 : 1)} />
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y + (o.offsetY ?? 0),
          width: CARD.size,
          height: CARD.size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: `scale(${scale}) translateX(${shake}px)`,
        }}
      >
        {/* burst ring */}
        <div
          style={{
            position: "absolute",
            width: 300 + burst * 700,
            height: 300 + burst * 700,
            borderRadius: "50%",
            border: `10px solid ${color}`,
            opacity: after >= 0 ? 1 - burst : 0,
          }}
        />
        {o.top_label ? (
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 52, color: C.white, textShadow: outline(4), marginBottom: 10 }}>
            {o.top_label}
          </div>
        ) : null}
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: o.size ?? 300,
            lineHeight: 1,
            color,
            textShadow: outline(10),
            transform: `scale(${after >= 0 && after < 10 ? 1 + (10 - after) * 0.02 : 1})`,
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
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 54,
              color: C.white,
              background: C.pink,
              padding: "10px 30px",
              borderRadius: 16,
              transform: `rotate(-2deg) scale(${spring({ frame: frame - 8, fps, config: { damping: 10 } })})`,
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
        width: 420,
        padding: "34px 20px",
        borderRadius: 30,
        background: `linear-gradient(160deg, ${color}, #1a0533)`,
        border: `5px solid ${C.white}`,
        textAlign: "center",
        transform: `translateX(${x}px)`,
        boxShadow: "0 20px 50px rgba(0,0,0,.5)",
      }}
    >
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, lineHeight: 1.1 }}>{side.title}</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 190, color: C.yellow, lineHeight: 1, textShadow: outline(6) }}>{side.value}</div>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: "#ffd9ea" }}>{side.sub}</div>
    </div>
  );
  const stampF = o.stampAt != null ? S(o.stampAt - o.from, fps) : null;
  const st = stampF != null ? spring({ frame: frame - stampF, fps, config: { damping: 9, stiffness: 260 } }) : 0;
  return (
    <>
      <Scrim opacity={opacity} />
      <div
        style={{
          position: "absolute",
          left: CARD.x,
          top: CARD.y,
          width: CARD.size,
          height: CARD.size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          opacity,
        }}
      >
        {card(o.left, (1 - l) * -700, C.pink)}
        {card(o.right, (1 - r) * 700, C.purple)}
        <div
          style={{
            position: "absolute",
            fontFamily: DISPLAY,
            fontSize: 120,
            color: C.white,
            textShadow: outline(7, C.red),
            transform: `scale(${vs}) rotate(${(1 - vs) * 90}deg)`,
          }}
        >
          VS
        </div>
        {stampF != null && frame >= stampF ? (
          <div
            style={{
              position: "absolute",
              bottom: 120,
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 64,
              color: C.red,
              border: `8px solid ${C.red}`,
              padding: "6px 30px",
              borderRadius: 14,
              background: "rgba(255,255,255,.92)",
              transform: `rotate(-10deg) scale(${2.4 - 1.4 * st})`,
              opacity: Math.min(1, st * 2),
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
    <div
      style={{
        position: "absolute",
        left: o.x ?? 190,
        top: o.y ?? 640,
        width: 700,
        opacity,
        transform: `scale(${2.2 - 1.2 * s}) rotate(${o.rotate ?? -4}deg)`,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 36,
          background: o.color ?? C.red,
          border: `8px solid ${C.white}`,
          padding: "26px 0",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,.6)",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 70, color: C.white, letterSpacing: 4 }}>{o.title}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 210, lineHeight: 0.95, color: C.yellow, textShadow: outline(7) }}>{o.value}</div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: shine,
            width: 120,
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)",
            transform: "skewX(-20deg)",
          }}
        />
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
  const barH = Math.min(120, 760 / items.length - 20);
  return (
    <>
      <Scrim opacity={opacity} />
      <div style={{ position: "absolute", left: CARD.x + 40, top: CARD.y + 40, width: CARD.size - 80, opacity }}>
        {o.title ? (
          <div style={{ fontFamily: DISPLAY, fontSize: 84, color: C.white, textAlign: "center", textShadow: outline(5), marginBottom: 30 }}>
            {o.title}
          </div>
        ) : null}
        {items.map((it, i) => {
          const startF = S((it.at ?? o.from + i * 0.4) - o.from, fps);
          const g = spring({ frame: frame - startF, fps, config: { damping: 16, stiffness: 90 } });
          const frac = Math.max(0.04, (it.value - min) / (max - min));
          const shown = it.value * Math.min(1, g);
          const color = it.highlight ? C.yellow : it.color ?? C.pink;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: 20, height: barH, opacity: Math.min(1, g * 3) }}>
              <div style={{ width: 280, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, textShadow: outline(3) }}>
                {it.label}
              </div>
              <div style={{ flex: 1, height: "100%", position: "relative" }}>
                <div
                  style={{
                    width: `${frac * 100 * Math.min(1, g)}%`,
                    height: "100%",
                    borderRadius: 18,
                    background: it.highlight
                      ? `linear-gradient(90deg, ${C.orange}, ${C.yellow})`
                      : `linear-gradient(90deg, ${C.purple}, ${color})`,
                    boxShadow: it.highlight ? `0 0 40px ${C.yellow}` : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 16,
                  }}
                >
                  <span style={{ fontFamily: DISPLAY, fontSize: barH * 0.7, color: C.white, textShadow: outline(4) }}>
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

// Horizontal timeline; items appear at `at`; state "fail" cracks/greys out
const Timeline: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const items: any[] = o.items;
  const lineP = interpolate(frame, [0, S(dur / fps * 0.7, fps)], [0, 1], { extrapolateRight: "clamp" });
  return (
    <>
      <Scrim opacity={opacity} />
      <div style={{ position: "absolute", left: CARD.x, top: CARD.y, width: CARD.size, height: CARD.size, opacity }}>
        {o.title ? (
          <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: DISPLAY, fontSize: 84, color: C.white, textShadow: outline(5) }}>
            {o.title}
          </div>
        ) : null}
        <div style={{ position: "absolute", left: 120, top: 220, width: 12, height: 680 * lineP, background: C.white, borderRadius: 6 }} />
        {items.map((it, i) => {
          const f = S((it.at ?? o.from + i) - o.from, fps);
          const s = spring({ frame: frame - f, fps, config: { damping: 11 } });
          const failF = it.failAt != null ? S(it.failAt - o.from, fps) : null;
          const failed = it.state === "fail" && (failF == null || frame >= failF);
          const y = 230 + i * (640 / Math.max(1, items.length - 1 || 1));
          return (
            <div key={i} style={{ position: "absolute", left: 80, top: y - 40, display: "flex", alignItems: "center", gap: 40, transform: `translateX(${(1 - s) * 600}px)`, opacity: Math.min(1, s * 2) }}>
              <div style={{ width: 92, height: 92, borderRadius: 46, background: failed ? C.red : it.state === "ok" ? C.green : C.yellow, border: `6px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontFamily: FONT, fontWeight: 800, color: "#000" }}>
                {failed ? "✕" : it.state === "ok" ? "✓" : "•"}
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 92, lineHeight: 1, color: failed ? "#bbb" : C.white, textDecoration: failed ? "line-through" : "none", textDecorationColor: C.red, textDecorationThickness: 8, textShadow: outline(5) }}>
                  {it.label}
                </div>
                {it.sub ? <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 38, color: failed ? C.red : C.yellow }}>{it.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// Poll with options that pop in and fake vote bars filling
const Poll: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const opts: any[] = o.options;
  return (
    <>
      <Scrim opacity={opacity} />
      <div style={{ position: "absolute", left: CARD.x + 60, top: CARD.y + 120, width: CARD.size - 120, opacity }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 96, color: C.white, textAlign: "center", textShadow: outline(6), marginBottom: 50 }}>
          {o.question}
        </div>
        {opts.map((op, i) => {
          const s = spring({ frame: frame - 6 - i * 6, fps, config: { damping: 10 } });
          const hasPct = typeof op.pct === "number";
          const fill = hasPct ? interpolate(frame, [12 + i * 6, 40 + i * 6], [0, op.pct], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <div key={i} style={{ position: "relative", height: 130, marginBottom: 30, borderRadius: 65, overflow: "hidden", border: `6px solid ${C.white}`, background: "rgba(255,255,255,.15)", transform: `scale(${s})` }}>
              <div style={{ position: "absolute", inset: 0, width: `${fill}%`, background: i === 0 ? C.green : C.red, opacity: 0.85 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px", fontFamily: FONT, fontWeight: 800, fontSize: 60, color: C.white, textShadow: outline(4) }}>
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
        top: o.y ?? 1330,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: o.size ?? 46,
        color: o.color ?? C.red,
        border: `6px solid ${o.color ?? C.red}`,
        padding: "4px 22px",
        borderRadius: 12,
        background: "rgba(255,255,255,.92)",
        transform: `rotate(${o.rotate ?? -8}deg) scale(${2.2 - 1.2 * s})`,
        opacity: Math.min(1, s * 2) * opacity,
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
    <div
      style={{
        position: "absolute",
        left: o.x ?? 60,
        top: o.y ?? 420,
        fontFamily: DISPLAY,
        fontSize: 260,
        color: C.yellow,
        textShadow: outline(10, C.pink),
        transform: `scale(${s}) rotate(${(1 - s) * 40 - 8}deg)`,
        opacity,
      }}
    >
      {o.text}
    </div>
  );
};

// Plain animated text line (slide + fade), for labels on top of the card
const TextLine: React.FC<{ o: OV; dur: number }> = ({ o, dur }) => {
  const { frame, fps, opacity } = usePop(dur);
  const s = spring({ frame, fps, config: { damping: 12 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top: o.y ?? 1350,
        textAlign: "center",
        opacity,
        transform: `translateY(${(1 - s) * 80}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: o.size ?? 56,
          color: o.color ?? C.white,
          background: o.bg ?? "rgba(0,0,0,.65)",
          padding: "10px 26px",
          borderRadius: 16,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
          lineHeight: 1.5,
        }}
      >
        {o.text}
      </span>
    </div>
  );
};

const EndCard: React.FC<{ o: OV; dur: number; logo: string; logoText: string }> = ({ o, dur, logo, logoText }) => {
  const { frame, fps } = usePop(dur + 100);
  const s = spring({ frame, fps, config: { damping: 10 } });
  const pulse = 1 + Math.sin(frame / 4) * 0.04;
  return (
    <AbsoluteFill style={{ background: `rgba(11,6,20,${0.85 * Math.min(1, s)})`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 300, height: 300, borderRadius: 150, overflow: "hidden", border: `10px solid ${C.white}`, background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 70, color: C.white, transform: `scale(${s}) rotate(${(1 - s) * 360}deg)`, boxShadow: `0 0 80px ${C.pink}` }}>
        {logo ? <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : logoText}
      </div>
      <div style={{ marginTop: 60, fontFamily: DISPLAY, fontSize: 110, color: C.white, textShadow: outline(7), textAlign: "center", transform: `translateY(${(1 - s) * 200}px)` }}>
        {o.line1}
      </div>
      <div style={{ marginTop: 30, fontFamily: FONT, fontWeight: 800, fontSize: 58, color: "#000", background: C.yellow, padding: "18px 50px", borderRadius: 999, transform: `scale(${pulse * s})` }}>
        {o.line2}
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
    case "endcard": return <EndCard o={o} dur={dur} logo={props.logo ? props.assetBase + props.logo : ""} logoText={props.logoText} />;
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
  return (
    <AbsoluteFill style={{ backgroundColor: C.dark }}>
      <style dangerouslySetInnerHTML={{ __html: fontFaceCSS }} />
      <Background />
      <VideoCard props={props} />
      {overlays
        .filter((o) => o.type !== "endcard")
        .map((o, i) => (
          <Sequence key={i} from={S(o.from, fps)} durationInFrames={Math.max(1, S(o.to - o.from, fps))}>
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
      {props.sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={S(s.at, fps)}>
          <Audio src={props.assetBase + s.file} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
