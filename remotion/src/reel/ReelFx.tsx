/**
 * Extra motion-graphics for GtaReel, modeled on the reference reels:
 *   Logo3D     — 3D flip-in logo (Rockstar / GTA VI) with float + glare
 *   InfoCard   — 3D card with a character still or actor photo + name plate
 *   Grid4      — 2x2 grid of live clips, number badges, red ✕ at given times
 *   FocusBox   — gold corner brackets that snap around a region
 *   NumBadge   — round number badge (1, 2, 3 ...)
 *   Wipe       — pink/purple gradient swipe transition
 *   ChannelEnd — search bar typing the channel name + channel card + subscribe tap
 *
 * Canvas components (Grid4, FocusBox, NumBadge, Wipe, ChannelEnd) use real
 * 1080x1920 pixel coordinates and stay inside the safe zone.
 */
import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const FONT = "'MontserratV', 'Montserrat', sans-serif";
const C = { pink: "#FF3D8B", purple: "#7B2FF7", yellow: "#FFD400", red: "#E8343B", white: "#FFFFFF", gold: "#F5C542" };
export const SAFE = { left: 150, right: 930, top: 260, bottom: 1420 };
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1.05,
  textTransform: "uppercase",
  letterSpacing: -0.5,
  ...extra,
});
const soft = "0 4px 14px rgba(0,0,0,.75), 0 0 3px rgba(0,0,0,.9)";

const useEnv = (dur: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 6, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { frame, fps, out };
};

type O = { [k: string]: any };

// ---------------------------------------------------------------- Logo3D
// Lives in the 1000x1000 design ZONE (scaled into the safe zone by GtaReel).
export const Logo3D: React.FC<{ o: O; dur: number; src: string }> = ({ o, dur, src }) => {
  const { frame, fps, out } = useEnv(dur);
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 120, mass: 0.9 } });
  const rotY = (1 - s) * -85 + Math.sin(frame / 18) * 6;
  const rotX = 8 + Math.cos(frame / 22) * 3;
  const bob = Math.sin(frame / 14) * 10;
  const glare = interpolate(frame, [8, 34], [-60, 160], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const w = o.width ?? 700;
  const x = o.x ?? 500 - w / 2 + 40; // design-space left (ZONE starts at x=40)
  const y = o.y ?? 520;
  return (
    <div style={{ position: "absolute", left: x, top: y + bob, width: w, perspective: 1400, opacity: out * Math.min(1, s * 2) }}>
      <div
        style={{
          position: "relative",
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${0.5 + 0.5 * s})`,
          transformStyle: "preserve-3d",
          filter: `drop-shadow(0 25px 30px rgba(0,0,0,.55)) drop-shadow(0 0 30px ${o.glow ?? "rgba(255,61,139,.55)"})`,
        }}
      >
        <Img src={src} style={{ width: "100%", display: "block" }} />
        {/* glare sweep, clipped by the logo's own alpha */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, transparent ${glare - 20}%, rgba(255,255,255,.75) ${glare}%, transparent ${glare + 20}%)`,
            WebkitMaskImage: `url(${src})`,
            WebkitMaskSize: "100% 100%",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- InfoCard
// Character still or actor photo on a 3D card + name plate. Design space.
export const InfoCard: React.FC<{ o: O; dur: number; src: string }> = ({ o, dur, src }) => {
  const { frame, fps, out } = useEnv(dur);
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const p = spring({ frame: frame - 6, fps, config: { damping: 11, stiffness: 200 } });
  const tilt = (o.side === "right" ? 1 : -1) * (6 + Math.sin(frame / 20) * 2);
  const w = o.width ?? 520;
  const h = w * 1.25;
  const x = o.x ?? 500 - w / 2 + 40;
  const y = o.y ?? 470 + 40;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, perspective: 1200, opacity: out }}>
      <div
        style={{
          transform: `rotateY(${(1 - s) * 90 + tilt}deg) rotateX(4deg) scale(${0.7 + 0.3 * s})`,
          transformStyle: "preserve-3d",
          borderRadius: 36,
          overflow: "hidden",
          border: `7px solid ${C.white}`,
          boxShadow: `0 30px 60px rgba(0,0,0,.6), 0 0 50px ${o.glow ?? "rgba(255,61,139,.6)"}`,
          width: w,
          height: h,
          background: "#111",
        }}
      >
        <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(0,0,0,.65))" }} />
      </div>
      <div style={{ marginTop: -60, display: "flex", flexDirection: "column", alignItems: "center", transform: `translateY(${(1 - p) * 60}px) scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, p * 2) }}>
        <div style={{ background: C.yellow, color: "#000", padding: "10px 26px", borderRadius: 14, boxShadow: "0 10px 25px rgba(0,0,0,.5)", transform: "rotate(-2deg)", ...T(o.nameSize ?? 58) }}>{o.name}</div>
        {o.sub ? <div style={{ marginTop: 12, color: C.white, textShadow: soft, textAlign: "center", ...T(o.subSize ?? 36, { fontWeight: 800 }) }}>{o.sub}</div> : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Grid4
const NumCircle: React.FC<{ n: number | string; size?: number }> = ({ n, size = 64 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: "rgba(20,14,24,.85)",
      border: `4px solid ${C.gold}`,
      color: C.white,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 6px 16px rgba(0,0,0,.5)",
      ...T(size * 0.5),
    }}
  >
    {n}
  </div>
);

const RedX: React.FC<{ size?: number; s: number }> = ({ size = 74, s }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: C.red,
      border: "5px solid #fff",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`,
      boxShadow: "0 6px 16px rgba(0,0,0,.5)",
      ...T(size * 0.55),
    }}
  >
    ✕
  </div>
);

export const Grid4: React.FC<{ o: O; dur: number; trailer: string; source: { w: number; h: number; top: number; bottom: number } }> = ({ o, dur, trailer, source }) => {
  const { frame, fps, out } = useEnv(dur);
  const items: O[] = o.items;
  const gap = 18;
  const gw = SAFE.right - SAFE.left;
  const gh = SAFE.bottom - SAFE.top - 40;
  const cw = (gw - gap) / 2;
  const ch = (gh - gap) / 2;
  const bg = spring({ frame, fps, config: { damping: 14 } });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "linear-gradient(170deg, #f2b7a8 0%, #c47ab8 45%, #7a5ab8 100%)", opacity: bg }} />
      {items.map((it, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const startF = it.at != null ? Math.round((it.at - o.from) * fps) : i * 4;
        const s = spring({ frame: frame - startF, fps, config: { damping: 12, stiffness: 160 } });
        const xF = it.xAt != null ? Math.round((it.xAt - o.from) * fps) : null;
        const xs = xF != null ? spring({ frame: frame - xF, fps, config: { damping: 9, stiffness: 240 } }) : 0;
        const failed = xF != null && frame >= xF;
        const picH = source.bottom - source.top;
        const scale = ch / picH;
        const vw = source.w * scale;
        const fx = it.focusX ?? 0.5;
        const left = Math.min(0, Math.max(cw - vw, cw / 2 - fx * vw));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: SAFE.left + col * (cw + gap),
              top: SAFE.top + 20 + row * (ch + gap),
              width: cw,
              height: ch,
              borderRadius: 26,
              overflow: "hidden",
              border: `4px solid ${failed ? C.red : "rgba(255,255,255,.9)"}`,
              boxShadow: "0 18px 40px rgba(0,0,0,.35)",
              transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 80}px)`,
              opacity: Math.min(1, s * 2),
              filter: failed ? "grayscale(1) brightness(.7)" : "none",
              background: "#000",
            }}
          >
            <OffthreadVideo src={trailer} startFrom={Math.round(it.src * fps)} muted style={{ position: "absolute", left, top: -source.top * scale, width: vw, height: source.h * scale, maxWidth: "none" }} />
            <div style={{ position: "absolute", left: 14, top: 14 }}><NumCircle n={it.n ?? i + 1} /></div>
            {xF != null && frame >= xF ? <div style={{ position: "absolute", right: 14, top: 14 }}><RedX s={xs} /></div> : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- FocusBox
export const FocusBox: React.FC<{ o: O; dur: number }> = ({ o, dur }) => {
  const { frame, fps, out } = useEnv(dur);
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 180 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.015;
  const x = o.x ?? 290, y = o.y ?? 600, w = o.w ?? 500, h = o.h ?? 400;
  const L = Math.min(w, h) * 0.22;
  const sc = (1.25 - 0.25 * s) * pulse;
  const corner = (st: React.CSSProperties) => <div style={{ position: "absolute", width: L, height: L, borderColor: C.gold, borderStyle: "solid", borderWidth: 0, ...st }} />;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: out * Math.min(1, s * 2), transform: `scale(${sc})`, filter: "drop-shadow(0 0 10px rgba(245,197,66,.8))" }}>
      {corner({ left: 0, top: 0, borderLeftWidth: 7, borderTopWidth: 7, borderTopLeftRadius: 14 })}
      {corner({ right: 0, top: 0, borderRightWidth: 7, borderTopWidth: 7, borderTopRightRadius: 14 })}
      {corner({ left: 0, bottom: 0, borderLeftWidth: 7, borderBottomWidth: 7, borderBottomLeftRadius: 14 })}
      {corner({ right: 0, bottom: 0, borderRightWidth: 7, borderBottomWidth: 7, borderBottomRightRadius: 14 })}
      {o.label ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: -70, textAlign: "center" }}>
          <span style={{ background: "rgba(10,8,14,.8)", color: C.white, padding: "8px 18px", borderRadius: 10, ...T(36) }}>{o.label}</span>
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- NumBadge
export const NumBadge: React.FC<{ o: O; dur: number }> = ({ o, dur }) => {
  const { frame, fps, out } = useEnv(dur);
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  return (
    <div style={{ position: "absolute", left: o.x ?? SAFE.left + 10, top: o.y ?? SAFE.top + 10, opacity: out, transform: `scale(${s}) rotate(${(1 - s) * -120}deg)` }}>
      <NumCircle n={o.n} size={o.size ?? 96} />
    </div>
  );
};

// ---------------------------------------------------------------- Wipe
export const Wipe: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, dur], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  const x = interpolate(p, [0, 1], [-1300, 1300]);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, left: x, width: 1300, height: 2400, transform: "skewX(-12deg)", background: "linear-gradient(90deg, rgba(255,140,160,0) 0%, #f7b6a6 20%, #d58bd0 50%, #8f6bd1 80%, rgba(143,107,209,0) 100%)", filter: "blur(10px)" }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- ChannelEnd
export const ChannelEnd: React.FC<{ o: O; logo: string; trailer: string; source: { w: number; h: number; top: number; bottom: number } }> = ({ o, logo, trailer, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const name: string = o.channel ?? "GTA HIGHEST";
  const typed = Math.max(0, Math.min(name.length, Math.floor((frame - 8) / 2)));
  const bar = spring({ frame, fps, config: { damping: 13 } });
  const card = spring({ frame: frame - 8 - name.length * 2, fps, config: { damping: 12 } });
  const tapF = 8 + name.length * 2 + 26;
  const tapped = frame >= tapF;
  const tapS = spring({ frame: frame - tapF, fps, config: { damping: 8, stiffness: 300 } });
  const cursor = Math.floor(frame / 8) % 2 === 0;
  const vidS = spring({ frame: frame - tapF + 6, fps, config: { damping: 13 } });
  const W = SAFE.right - SAFE.left;
  const picH = source.bottom - source.top;
  const vh = 380;
  const scale = vh / picH;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backdropFilter: "blur(18px)", background: "rgba(40,20,50,.55)" }} />
      {/* search bar */}
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 20, width: W, transform: `translateY(${(1 - bar) * -120}px)`, opacity: bar, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 70, height: 50, borderRadius: 14, background: "#FF0033", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 0, height: 0, borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderLeft: "20px solid #fff", marginLeft: 4 }} />
        </div>
        <div style={{ flex: 1, height: 72, borderRadius: 36, background: "rgba(255,255,255,.18)", border: `3px solid ${C.gold}`, display: "flex", alignItems: "center", padding: "0 26px", color: C.white, ...T(36, { textTransform: "none", fontWeight: 800 }) }}>
          🔍&nbsp;&nbsp;{name.slice(0, typed)}{cursor && typed < name.length + 1 ? "|" : ""}
        </div>
      </div>
      {/* channel card */}
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 140, width: W, display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, card * 2), transform: `translateY(${(1 - card) * 80}px) scale(${0.8 + 0.2 * card})` }}>
        <div style={{ width: 200, height: 200, borderRadius: 100, overflow: "hidden", border: `6px solid ${C.gold}`, flexShrink: 0, boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
          <Img src={logo} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 55%", transform: "scale(1.9)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.white, textShadow: soft, ...T(66, { textTransform: "none" }) }}>
            {name.split(" ").map((w, i) => <span key={i} style={{ color: i === 1 ? C.yellow : C.white }}>{w}{i === 0 ? " " : ""}</span>)}
          </div>
          <div style={{ marginTop: 8, color: "rgba(255,255,255,.85)", ...T(30, { textTransform: "none", fontWeight: 700 }) }}>{o.sub ?? "Daily GTA 6 news & updates"}</div>
          <div style={{ marginTop: 16, display: "inline-block", padding: "14px 34px", borderRadius: 40, background: tapped ? "rgba(255,255,255,.25)" : "#fff", color: tapped ? "#fff" : "#000", transform: `scale(${tapped ? 0.9 + 0.1 * tapS : 1})`, ...T(32, { textTransform: "none", fontWeight: 800 }) }}>
            {tapped ? "Subscribed ✓" : "Subscribe"}
          </div>
        </div>
      </div>
      {/* tap ripple */}
      {tapped ? (
        <div style={{ position: "absolute", left: SAFE.left + 330, top: SAFE.top + 350, width: 40 + tapS * 160, height: 40 + tapS * 160, marginLeft: -tapS * 80, marginTop: -tapS * 80, borderRadius: "50%", border: "5px solid #fff", opacity: 1 - tapS }} />
      ) : null}
      {/* video teaser */}
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 470, width: W, height: vh, borderRadius: 26, overflow: "hidden", border: "4px solid rgba(255,255,255,.9)", opacity: Math.min(1, vidS * 2), transform: `translateY(${(1 - vidS) * 120}px)` }}>
        <OffthreadVideo src={trailer} startFrom={Math.round((o.teaserSrc ?? 141) * fps)} muted style={{ position: "absolute", left: (W - source.w * scale) / 2, top: -source.top * scale, width: source.w * scale, height: source.h * scale, maxWidth: "none" }} />
        <div style={{ position: "absolute", left: 20, top: 20, background: "rgba(0,0,0,.6)", color: "#fff", padding: "8px 16px", borderRadius: 10, ...T(30) }}>{o.teaser ?? "MORE GTA 6 UPDATES"}</div>
      </div>
      <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top + 880, width: W, textAlign: "center", color: C.white, textShadow: soft, opacity: Math.min(1, vidS * 2), ...T(54) }}>
        {o.line1 ?? "FOLLOW FOR MORE"}
      </div>
    </AbsoluteFill>
  );
};
