/**
 * Shadow GTA Plays — owner's own edited Steven Ogg interview (untouched in the middle).
 * Added: 4.7 s intro (Ogg's face moving, muted, name tag over the burned-in
 * captions, Mike: "Trevor from GTA 5, Steven Ogg, is talking about GTA 6!")
 * and a 4.1 s outro (blurred group shot, logo + subscribe, Mike CTA).
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const INTRO = 4.7, MAIN = 43.3, OUTRO = 4.1;
export const OGG_DURATION = INTRO + MAIN + OUTRO;
const MAIN_END = INTRO + MAIN;
const FONT = "'MontserratV', 'Montserrat', sans-serif";
const fontCSS = `@font-face { font-family: 'MontserratV'; src: url('${staticFile("fonts/Montserrat-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const IN = Easing.bezier(0.64, 0, 0.78, 0);
const BOUNCE = Easing.bezier(0.34, 1.5, 0.64, 1);
const p = (t: number, a: number, b: number, e = OUT) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const PURPLE = "#8B2CF5", PURPLE2 = "#B56CFF";
const T = (size: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.1, textTransform: "uppercase", ...extra });
const STROKE = "0 4px 0 #000, 0 0 3px #000, 0 6px 22px rgba(0,0,0,.85)";

export const OggInterview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const f = (s: number) => Math.round(s * fps);
  // intro overlays
  const tag = p(t, 0.3, 0.75, BOUNCE) * (1 - p(t, INTRO - 0.35, INTRO - 0.05, IN));
  const hook = p(t, 2.5, 2.85, BOUNCE) * (1 - p(t, INTRO - 0.35, INTRO - 0.05, IN));
  // outro
  const o = t - MAIN_END;
  const logo = interpolate(o, [0.05, 0.6], [0, 1], { ...CL, easing: BOUNCE });
  const glow = 0.5 + 0.5 * Math.sin(t * 4);
  const btn = interpolate(o, [0.15, 0.55], [0, 1], { ...CL, easing: BOUNCE });
  const tapT = 1.6, tapped = o >= tapT;
  const tapK = p(o, tapT, tapT + 0.3);
  const bell = Math.sin(Math.max(0, o - tapT - 0.2) * 22) * 18 * (1 - p(o, tapT + 0.2, tapT + 1.0));
  const txt = p(o, 0.3, 0.8);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      {/* intro: Ogg moving, muted, slow push */}
      <Sequence durationInFrames={f(INTRO) + 1}>
        <AbsoluteFill style={{ transform: `scale(${1.04 + 0.06 * p(t, 0, INTRO, (x) => x)})` }}>
          <OffthreadVideo src={staticFile("shadow5/src.mp4")} startFrom={f(10.2)} playbackRate={0.85} muted style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
      </Sequence>
      {/* the owner's edit, untouched */}
      <Sequence from={f(INTRO)} durationInFrames={f(MAIN)}>
        <OffthreadVideo src={staticFile("shadow5/src.mp4")} style={{ width: "100%", height: "100%" }} />
      </Sequence>
      {/* outro: blurred group shot */}
      <Sequence from={f(MAIN_END)}>
        <AbsoluteFill style={{ filter: "blur(22px) brightness(.55)", transform: "scale(1.08)" }}>
          <OffthreadVideo src={staticFile("shadow5/src.mp4")} startFrom={f(28.0)} muted style={{ width: "100%", height: "100%" }} />
        </AbsoluteFill>
      </Sequence>

      {/* intro name tag (covers the burned-in captions of the muted preview) */}
      {t < INTRO && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1440, display: "flex", justifyContent: "center", opacity: Math.min(1, tag * 1.4), transform: `translateY(-50%) scale(${0.85 + 0.15 * tag})` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 40px 20px", borderRadius: 26, background: "rgba(12,6,22,.9)", border: `4px solid ${PURPLE2}`, boxShadow: `0 0 40px rgba(181,108,255,.45), 0 16px 40px rgba(0,0,0,.6)` }}>
              <span style={{ color: "#fff", ...T(64) }}>Steven Ogg</span>
              <span style={{ marginTop: 6, padding: "4px 18px 6px", borderRadius: 12, background: PURPLE, color: "#fff", ...T(34) }}>Trevor · GTA 5</span>
            </div>
          </div>
          <div style={{ position: "absolute", left: 150, right: 150, top: 1630, textAlign: "center", opacity: Math.min(1, hook * 1.4), transform: `translateY(-50%) scale(${0.85 + 0.15 * hook})` }}>
            <span style={{ color: "#fff", textShadow: STROKE, ...T(56) }}>talks <span style={{ padding: "0 14px 4px", borderRadius: 14, background: PURPLE, textShadow: "none" }}>GTA 6</span></span>
          </div>
        </>
      )}

      {/* outro overlays */}
      {o >= 0 && (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 540 - 220, top: 560, width: 440, height: 440, borderRadius: 40, overflow: "hidden", opacity: Math.min(1, logo * 1.5), transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -25}deg)`, boxShadow: `0 0 ${40 + 40 * glow}px rgba(181,108,255,${0.55 + 0.3 * glow}), 0 30px 60px rgba(0,0,0,.6)`, border: `4px solid ${PURPLE2}` }}>
            <Img src={staticFile("shadow2/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, opacity: btn > 0 ? 1 : 0, transform: `scale(${btn * (tapped ? 1 - 0.08 * Math.sin(tapK * Math.PI) : 1)})` }}>
            <div style={{ padding: "24px 54px", borderRadius: 60, background: tapped ? "#2A2A30" : "#FF0033", color: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,.4)", ...T(46, { textTransform: "none" }) }}>{tapped ? "Subscribed ✓" : "Subscribe"}</div>
            <div style={{ fontSize: 70, transform: `rotate(${bell}deg)`, opacity: tapped ? 1 : 0 }}>🔔</div>
          </div>
          <div style={{ position: "absolute", left: 150, right: 150, top: 1300, textAlign: "center", opacity: txt, transform: `translateY(${(1 - txt) * 30}px)` }}>
            <div style={{ color: "#fff", textShadow: STROKE, ...T(50) }}>Subscribe to</div>
            <div style={{ display: "inline-block", margin: "10px 0", padding: "4px 20px 8px", borderRadius: 16, background: PURPLE, color: "#fff", boxShadow: "0 6px 0 #4A0F99", ...T(62) }}>Shadow GTA Plays</div>
            <div style={{ color: "#fff", textShadow: STROKE, ...T(40, { fontWeight: 800 }) }}>for more videos like this</div>
          </div>
        </AbsoluteFill>
      )}

      {/* Mike: intro line (0-4.45 s of mike.wav) and CTA (4.6 s on) */}
      <Sequence from={f(0.15)} durationInFrames={f(4.45)}><Audio src={staticFile("shadow5/mike.wav")} /></Sequence>
      <Sequence from={f(MAIN_END + 0.1)}><Audio src={staticFile("shadow5/mike.wav")} startFrom={f(4.6)} /></Sequence>
      <Sequence from={f(MAIN_END) - 2}><Audio src={staticFile("bazaar/sfx_whoosh.wav")} volume={0.08} /></Sequence>
      <Sequence from={f(MAIN_END + 1.6) - 2}><Audio src={staticFile("bazaar/sfx_tick.wav")} volume={0.14} /></Sequence>
    </AbsoluteFill>
  );
};
