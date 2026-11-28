/**
 * Bazaar Retail — "One store. Every need." categories showcase.
 * Apple/olafmotion style, 60 fps, no voiceover, 17 s.
 * Icon → headline → bento grid → camera dives into each category (whip-pans)
 * → pulls back out to the grid → tiles collapse into the icon → green bloom → logo.
 * Smoothness rules: no hard cuts, handovers only between identical frames,
 * camera never freezes, in-out easing.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";

export const CATS_DURATION = 17;
export const CATS_FPS = 60;

const B = { bg: "#ECECF1", ink: "#111214", sub: "#6B6E76", green: "#173D2E", green2: "#215440", gold: "#BF9F62", cream: "#F5F1E6", white: "#FFFFFF" };
const INTER = "'InterV', 'Inter', system-ui, sans-serif";
const fontCSS = `@font-face { font-family: 'InterV'; src: url('${staticFile("fonts/Inter-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const img = (n: string) => staticFile(`bazaar/${n}`);
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const p = (t: number, a: number, b: number, e = IO) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

const CATS = [
  { name: "Fashion", tint: "#F2E8DF", a: { src: "cat/fashion_a.jpg", n: "Crystal Ladies Watch" }, b: { src: "cat/fashion_b.jpg", n: "Beanie & Neck Warmer" } },
  { name: "Beauty", tint: "#F7E3EA", a: { src: "cat/beauty_a.jpg", n: "Mini Lipstick Tray" }, b: { src: "cat/beauty_b.jpg", n: "Shea Butter Lotion" } },
  { name: "Gadgets", tint: "#E2E8F1", a: { src: "cat/gadgets_a.jpg", n: "Air Mouse Remote" }, b: { src: "cat/gadgets_b.jpg", n: "Mini WiFi Camera" } },
  { name: "Kids", tint: "#FFF0D2", a: { src: "cat/kids_a.jpg", n: "LED Drawing Board" }, b: { src: "cat/kids_b.jpg", n: "Swimming Fish Toy" } },
  { name: "Home", tint: "#E4EEE4", a: { src: "cat/home_a.jpg", n: "Digital Alarm Clock" }, b: { src: "cat/home_b.jpg", n: "Folding Wardrobe" } },
  { name: "Car", tint: "#E8E5F0", a: { src: "cat/car_a.jpg", n: "Memory Foam Cushion" }, b: { src: "cat/car_b.jpg", n: "3-Channel Dash Cam" } },
];

// bento grid geometry (2 x 3)
const TW = 360, TH = 420, GAP = 24;
const GX = 540 - (TW * 2 + GAP) / 2, GY = 960 - (TH * 3 + GAP * 2) / 2;
const tile = (i: number) => ({ x: GX + (i % 2) * (TW + GAP), y: GY + Math.floor(i / 2) * (TH + GAP) });
const COVER = Math.max(1080 / TW, 1920 / TH) * 1.02; // scale where one tile fills the screen

// category scene timing
const SCENE0 = 4.3, SCENE = 1.45, WHIP = 0.45;
const sceneStart = (i: number) => SCENE0 + i * SCENE;
const PULL = sceneStart(CATS.length) - 0.05; // ≈ 13.0 s

// ------------------------------------------------------------------ act A: icon, headline, grid, camera dive / pull-out
const GridAct: React.FC<{ t: number }> = ({ t }) => {
  const showIntro = t < 4.32;
  const showOutro = t > PULL - 0.02 && t < 14.75;
  if (!showIntro && !showOutro) return null;
  // icon pop + headline
  const pop = interpolate(t, [0.05, 0.75], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.35, 0.64, 1) });
  const iconUp = p(t, 0.75, 1.35);
  const l1 = p(t, 0.85, 1.45, OUT), l2 = p(t, 1.15, 1.75, OUT);
  const headOut = p(t, 1.95, 2.45);
  const tilesIn = (i: number) => p(t, 2.15 + i * 0.07, 2.75 + i * 0.07, OUT);
  // camera: slow push on the grid, dive into tile 0; later pull out from tile 5
  const push = mix(1, 1.05, p(t, 2.7, 3.55, Easing.linear));
  const dive = p(t, 3.5, 4.3, Easing.bezier(0.7, 0, 0.35, 1));
  const pull = 1 - p(t, PULL, PULL + 0.85, Easing.bezier(0.65, 0, 0.3, 1));
  const focus = showIntro ? 0 : CATS.length - 1;
  const camK = showIntro ? dive : pull;
  const f = tile(focus);
  const fx = f.x + TW / 2, fy = f.y + TH / 2;
  const s = showIntro ? mix(push, COVER, dive) : mix(1.04, COVER, pull);
  const tx = mix(540 - fx * 1, 540 - fx * s, 1) * camK + (1 - camK) * (540 - 540 * s);
  const ty = mix(960 - fy * 1, 960 - fy * s, 1) * camK + (1 - camK) * (960 - 960 * s);
  // collapse into icon after the pull-out
  const collapse = p(t, 13.95, 14.55, Easing.bezier(0.7, 0, 0.3, 1));
  const content = showIntro ? 1 - p(t, 3.7, 4.1) : p(t, PULL + 0.3, PULL + 0.8);
  const iconBack = p(t, 14.25, 14.6, OUT);
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <AbsoluteFill style={{ transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        {CATS.map((c, i) => {
          const g = tile(i);
          const k = showIntro ? tilesIn(i) : 1;
          const cx = mix(g.x, 540 - TW / 2, collapse), cy = mix(g.y, 960 - TH / 2, collapse);
          const sc = mix(1, 0.3, collapse);
          return (
            <div key={i} style={{ position: "absolute", left: cx, top: cy, width: TW, height: TH, borderRadius: 44, background: c.tint, overflow: "hidden", opacity: k * (1 - collapse), transform: `translateY(${(1 - k) * 160}px) scale(${(0.85 + 0.15 * k) * sc}) rotate(${(1 - k) * (i % 2 ? 6 : -6)}deg)`, filter: `blur(${(1 - k) * 14}px)`, boxShadow: "0 18px 40px rgba(0,0,0,.08)" }}>
              <div style={{ position: "absolute", left: 28, top: 26, fontFamily: INTER, fontWeight: 800, fontSize: 46, letterSpacing: -1.2, color: B.ink, opacity: content }}>{c.name}</div>
              <div style={{ position: "absolute", left: 40, right: 40, bottom: 34, height: 250, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 10px 24px rgba(0,0,0,.08)", opacity: content }}>
                <Img src={img(c.a.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      {showIntro ? (
        <AbsoluteFill style={{ transform: `scale(${mix(1, 1.08, p(t, 0, 2.2, Easing.linear))})` }}>
          {/* headline */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 124, letterSpacing: -4.5, color: B.ink, lineHeight: 1.05, opacity: 1 - headOut, transform: `translateY(${-headOut * 120}px) scale(${1 - headOut * 0.1})`, filter: `blur(${headOut * 16}px)` }}>
            <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 60}px)`, filter: `blur(${(1 - l1) * 14}px)` }}>One store.</div>
            <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 60}px)`, filter: `blur(${(1 - l2) * 14}px)`, color: B.green }}>Every need.</div>
          </div>
          {/* icon */}
          <div style={{ position: "absolute", left: 540 - 85, top: mix(960 - 85, 640, iconUp) - headOut * 160, width: 170, height: 170, borderRadius: 44, background: `linear-gradient(160deg, ${B.green2}, ${B.green})`, transform: `scale(${pop * (1 - headOut * 0.4)})`, opacity: 1 - headOut, boxShadow: "0 24px 50px rgba(23,61,46,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Img src={img("br_logo.png")} style={{ width: "72%" }} />
          </div>
        </AbsoluteFill>
      ) : null}
      {showOutro ? (
        <div style={{ position: "absolute", left: 540 - 85, top: 960 - 85, width: 170, height: 170, borderRadius: 44, background: `linear-gradient(160deg, ${B.green2}, ${B.green})`, transform: `scale(${iconBack})`, opacity: iconBack, boxShadow: "0 24px 50px rgba(23,61,46,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Img src={img("br_logo.png")} style={{ width: "72%" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ act B: full-screen category scenes with whip-pans
const ProductCard: React.FC<{ src: string; n: string; x: number; y: number; w: number; rot: number; k: number; t: number; seed: number }> = ({ src, n, x, y, w, rot, k, t, seed }) => {
  const fl = Math.sin(t * 1.4 + seed) * 10;
  return (
    <div style={{ position: "absolute", left: x, top: y + fl + (1 - k) * 220, width: w, opacity: k, transform: `rotate(${rot * k + Math.sin(t + seed) * 1.2}deg) scale(${0.9 + 0.1 * k})`, filter: `blur(${(1 - k) * 12}px)` }}>
      <div style={{ borderRadius: 40, background: B.white, padding: 18, boxShadow: "0 30px 70px rgba(0,0,0,.12)" }}>
        <div style={{ height: w - 36, borderRadius: 28, overflow: "hidden", background: "#f5f5f5" }}>
          <Img src={img(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ padding: "18px 8px 6px", fontFamily: INTER, fontWeight: 700, fontSize: 32, color: B.ink, letterSpacing: -0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</div>
      </div>
    </div>
  );
};

const CategoryAct: React.FC<{ t: number }> = ({ t }) => {
  if (t < 4.28 || t > PULL + 0.02) return null;
  // background color glides between category tints
  const pos = Math.max(0, Math.min(CATS.length - 1, (t - SCENE0 - (SCENE - WHIP)) / SCENE + 0)); // rough index for color
  const bgK = CATS.map((_, i) => i);
  let bg = CATS[0].tint;
  for (let i = 1; i < CATS.length; i++) {
    const w = p(t, sceneStart(i) - WHIP, sceneStart(i));
    bg = interpolateColors(w, [0, 1], [bg, CATS[i].tint]);
  }
  void pos; void bgK;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {CATS.map((c, i) => {
        const s0 = sceneStart(i);
        const enter = i === 0 ? 1 : p(t, s0 - WHIP, s0);
        const exit = i === CATS.length - 1 ? 0 : p(t, sceneStart(i + 1) - WHIP, sceneStart(i + 1));
        if (t < s0 - WHIP - 0.02 || (i < CATS.length - 1 && t > sceneStart(i + 1) + 0.02)) return null;
        const x = (1 - enter) * 1150 - exit * 1150;
        const lastFade = i === CATS.length - 1 ? 1 - p(t, PULL - 0.4, PULL - 0.02) : 1;
        const local = t - s0;
        const word = (i === 0 ? p(t, 4.34, 4.9, OUT) : p(t, s0 - 0.15, s0 + 0.35, OUT)) * lastFade;
        const ca = (i === 0 ? p(t, 4.44, 5.0, OUT) : p(t, s0 - 0.05, s0 + 0.45, OUT)) * lastFade;
        const cb = (i === 0 ? p(t, 4.56, 5.12, OUT) : p(t, s0 + 0.08, s0 + 0.58, OUT)) * lastFade;
        const push = 1 + 0.035 * p(t, s0 - WHIP, s0 + SCENE, Easing.linear);
        // the last scene shrinks back into its grid tile (identical tint) for the pull-out
        return (
          <AbsoluteFill key={i} style={{ transform: `translateX(${x}px) scale(${push})` }}>
            <div style={{ position: "absolute", left: 175, top: 300, fontFamily: INTER, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: B.gold, opacity: word }}>{`0${i + 1} — 06`}</div>
            <div style={{ position: "absolute", left: 170, top: 350, fontFamily: INTER, fontWeight: 800, fontSize: 160, letterSpacing: -7, color: B.ink, lineHeight: 1, opacity: word, transform: `translateY(${(1 - word) * 80}px)`, filter: `blur(${(1 - word) * 18}px)` }}>{c.name}</div>
            <ProductCard src={c.a.src} n={c.a.n} x={170} y={600} w={440} rot={-4} k={ca} t={t} seed={i * 2} />
            <ProductCard src={c.b.src} n={c.b.n} x={470} y={880} w={440} rot={4} k={cb} t={t} seed={i * 2 + 1} />
            {void local}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ act C: bloom + logo
const End: React.FC<{ t: number }> = ({ t }) => {
  if (t < 14.45) return null;
  const bloom = p(t, 14.5, 15.2);
  const R = mix(85, 1500, bloom);
  const logo = p(t, 14.95, 15.65, OUT);
  const line = p(t, 15.25, 15.85, OUT);
  const url = p(t, 15.5, 16.1, OUT);
  const drift = mix(1, 1.05, p(t, 15, 17, Easing.linear));
  const shine = mix(-300, 900, p(t, 15.6, 16.4, Easing.linear));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - R, top: 960 - R, width: R * 2, height: R * 2, borderRadius: mix(44, 1500, bloom), background: `radial-gradient(circle, ${B.green2}, ${B.green} 65%)`, opacity: p(t, 14.45, 14.55) }} />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <div style={{ position: "absolute", left: 540 - 280, top: 600, width: 560, overflow: "hidden", opacity: logo, transform: `scale(${0.88 + 0.12 * logo})`, filter: `blur(${(1 - logo) * 18}px)` }}>
          <Img src={img("br_logo.png")} style={{ width: "100%" }} />
          <div style={{ position: "absolute", top: 0, left: shine, width: 120, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent)", transform: "skewX(-20deg)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 60, letterSpacing: 12, color: B.cream, opacity: logo }}>BAZAAR RETAIL</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1140, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 40, color: B.cream, opacity: line * 0.85, transform: `translateY(${(1 - line) * 20}px)` }}>Shop every category</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1215, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 44, color: B.gold, opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>bazaarretail.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ sound + root
const SFX: { at: number; s: string; v: number }[] = [
  { at: 0.05, s: "click", v: 0.2 }, { at: 0.85, s: "swish_short", v: 0.18 }, { at: 1.15, s: "swish_short", v: 0.18 },
  { at: 1.95, s: "swish_long", v: 0.22 }, ...[0, 1, 2, 3, 4, 5].map((i) => ({ at: 2.15 + i * 0.07, s: "click", v: 0.1 })),
  { at: 3.5, s: "swish_long", v: 0.3 },
  ...[1, 2, 3, 4, 5].map((i) => ({ at: sceneStart(i) - WHIP, s: "swish_short", v: 0.3 })),
  { at: PULL, s: "swish_long", v: 0.28 }, { at: 13.95, s: "swish_short", v: 0.22 }, { at: 14.3, s: "bloom", v: 0.12 },
  { at: 15.6, s: "sfx_bell", v: 0.14 },
];

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <CategoryAct t={t} />
      <GridAct t={t} />
      <End t={t} />
    </AbsoluteFill>
  );
};

export const BazaarCategories: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <CameraMotionBlur samples={5} shutterAngle={180}>
        <Scene />
      </CameraMotionBlur>
      <Audio src={staticFile("bazaar/music4.wav")} volume={(f) => 0.6 * interpolate(f, [0, 3, durationInFrames - 60, durationInFrames], [0, 1, 1, 0], CL)} />
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)}><Audio src={staticFile(`bazaar/${c.s}.wav`)} volume={c.v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
