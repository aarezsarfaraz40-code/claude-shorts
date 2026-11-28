/**
 * Bazaar Retail — "Gift Smart" v2. Apple/olafmotion style, 60 fps, no VO.
 * Rules: no hard cuts (every scene grows from the previous element), the
 * camera never stops (slow drift/push during holds), in-out easing everywhere.
 * Timeline in SECONDS (t = frame / fps).
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";

export const GIFTS2_DURATION = 17;
export const GIFTS2_FPS = 60;

const B = { bg: "#ECECF1", ink: "#111214", sub: "#6B6E76", green: "#173D2E", green2: "#215440", gold: "#BF9F62", cream: "#F5F1E6", white: "#FFFFFF" };
const INTER = "'InterV', 'Inter', system-ui, sans-serif";
const fontCSS = `@font-face { font-family: 'InterV'; src: url('${staticFile("fonts/Inter-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const img = (n: string) => staticFile(`bazaar/${n}`);
const CL = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const IO = Easing.bezier(0.65, 0, 0.35, 1); // smooth in-out
const OUT = Easing.bezier(0.22, 1, 0.36, 1); // soft out
const IN = Easing.bezier(0.55, 0, 0.9, 0.3); // accelerate
const p = (t: number, a: number, b: number, e = IO) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

const ROWS = ["Fashion", "Beauty", "Gadgets", "Kids", "Watches", "Winter", "Gifts", "Skincare", "Home & Living"];
const ROW_SRC: Record<string, string> = { Fashion: "p04.jpg", Beauty: "p09.jpg", Gadgets: "p20.jpg", Kids: "p00.jpg", Watches: "p11.jpg", Winter: "p04.jpg", Skincare: "p09.jpg", "Home & Living": "p11.jpg" };
const GIFT = 6;
const ROW_H = 172;
const CARDS = [
  { tag: "For Her", src: "p09.jpg", name: "Matte Lipstick Set", price: "Rs. 2,449" },
  { tag: "For Him", src: "p20.jpg", name: "Air Mouse Remote", price: "Rs. 1,985" },
  { tag: "For Kids", src: "p00.jpg", name: "Kids Steering Toy", price: "Rs. 1,909" },
  { tag: "For Winter", src: "p04.jpg", name: "Winter Warm Socks", price: "Rs. 1,197" },
];
// icon resting point (center of the headline) — the camera zooms into it
const ICON = { x: 540, y: 930, size: 150 };

// ------------------------------------------------------------------ act 1: list -> icon -> headline -> camera dive
const Act1: React.FC<{ t: number }> = ({ t }) => {
  if (t > 4.2) return null;
  // list scroll: lands the Gifts row on y=930
  const target = ICON.y - (GIFT * ROW_H + ROW_H / 2);
  const scroll = mix(target + 3000, target, p(t, 0, 1.35, OUT));
  const others = p(t, 1.05, 1.7); // other rows leave
  // icon: in the row, lifts (anticipation), arcs to center
  const rowY = scroll + GIFT * ROW_H + ROW_H / 2;
  const lift = p(t, 1.15, 1.5);
  const fly = p(t, 1.45, 2.25);
  const ix = mix(120 + 62, ICON.x, fly);
  const iy = mix(rowY, ICON.y, fly) - Math.sin(fly * Math.PI) * 120 - lift * (1 - fly) * 18;
  const isz = mix(124, ICON.size, fly) * (1 + lift * (1 - fly) * 0.12);
  // headline
  const wA = p(t, 1.95, 2.6, OUT), wB = p(t, 2.05, 2.7, OUT), eb = p(t, 2.25, 2.85, OUT);
  // camera: slow push during the hold, then dive into the icon
  const hold = mix(1, 1.14, p(t, 2.1, 3.55, Easing.bezier(0.3, 0, 0.7, 1)));
  const dive = p(t, 3.5, 4.45, Easing.bezier(0.7, 0, 0.35, 1));
  const cam = hold * Math.pow(45, dive);
  const logoFade = 1 - p(t, 3.55, 3.9);
  return (
    <AbsoluteFill style={{ transformOrigin: `${ICON.x}px ${ICON.y}px`, transform: `scale(${cam}) rotate(${mix(0, -1.5, p(t, 2.1, 3.55)) * (1 - dive)}deg)` }}>
      {/* list rows (three copies so the fast scroll is always full) */}
      {[...Array(ROWS.length * 3)].map((_, i) => {
        const idx = i - ROWS.length;
        const name = ROWS[((idx % ROWS.length) + ROWS.length) % ROWS.length];
        const y = scroll + idx * ROW_H;
        if (y < -250 || y > 2150) return null;
        const isGiftReal = idx === GIFT;
        const dir = idx < GIFT ? -1 : 1;
        const away = isGiftReal ? 0 : others;
        return (
          <div key={i} style={{ position: "absolute", left: 120, top: y, height: ROW_H - 34, display: "flex", alignItems: "center", gap: 38, opacity: 1 - away, transform: `translateY(${away * dir * 260}px) scale(${1 - away * 0.1})` }}>
            <div style={{ width: 124, height: 124, borderRadius: 32, overflow: "hidden", background: name === "Gifts" ? `linear-gradient(160deg, ${B.green2}, ${B.green})` : "#fff", boxShadow: "0 8px 22px rgba(0,0,0,.10)", display: "flex", alignItems: "center", justifyContent: "center", visibility: isGiftReal ? "hidden" : "visible" }}>
              {name === "Gifts" ? <Img src={img("br_logo.png")} style={{ width: "72%" }} /> : <Img src={img(ROW_SRC[name])} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 66, letterSpacing: -1.6, color: B.ink, opacity: isGiftReal ? 1 - p(t, 1.3, 1.6) : 1 }}>{name}</div>
          </div>
        );
      })}
      {/* headline around the icon */}
      <div style={{ position: "absolute", left: 0, right: 0, top: ICON.y - 175, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 34, letterSpacing: 9, color: B.gold, opacity: eb, transform: `translateY(${(1 - eb) * 20}px)` }}>THIS WINTER</div>
      <div style={{ position: "absolute", right: ICON.x + 98, top: ICON.y - 70, height: 140, display: "flex", alignItems: "center", fontFamily: INTER, fontWeight: 800, fontSize: 104, letterSpacing: -3.5, color: B.ink, opacity: wA, transform: `translateX(${(1 - wA) * -140}px)`, filter: `blur(${(1 - wA) * 16}px)` }}>Gift</div>
      <div style={{ position: "absolute", left: ICON.x + 98, top: ICON.y - 70, height: 140, display: "flex", alignItems: "center", fontFamily: INTER, fontWeight: 800, fontSize: 104, letterSpacing: -3.5, color: B.ink, opacity: wB, transform: `translateX(${(1 - wB) * 140}px)`, filter: `blur(${(1 - wB) * 16}px)` }}>Smart</div>
      {/* the icon */}
      <div style={{ position: "absolute", left: ix - isz / 2, top: iy - isz / 2, width: isz, height: isz, borderRadius: isz * 0.26, background: `linear-gradient(160deg, ${B.green2}, ${B.green})`, boxShadow: `0 ${16 + lift * 14}px ${36 + lift * 20}px rgba(23,61,46,.30)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Img src={img("br_logo.png")} style={{ width: "72%", opacity: logoFade }} />
        {/* gradient -> flat green so it matches the next scene exactly */}
        <div style={{ position: "absolute", inset: 0, background: B.green, opacity: p(t, 3.6, 4.2) }} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ act 2: green -> pill -> card -> carousel
const CARD = { w: 820, h: 1160 };
const SWAP = [7.35, 8.85, 10.35]; // start of each swap (0.55 s long)
const SW = 0.55;

const CardFace: React.FC<{ c: (typeof CARDS)[number]; reveal: number; imgScale: number }> = ({ c, reveal, imgScale }) => (
  <div style={{ position: "absolute", inset: 0, padding: 40, fontFamily: INTER, opacity: reveal, transform: `translateY(${(1 - reveal) * 30}px)` }}>
    <div style={{ display: "inline-block", padding: "12px 28px", borderRadius: 40, background: "rgba(191,159,98,.16)", color: B.gold, fontWeight: 700, fontSize: 34 }}>{c.tag}</div>
    <div style={{ marginTop: 28, height: 690, borderRadius: 44, overflow: "hidden", background: "#f4f4f4" }}>
      <Img src={img(c.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${imgScale})` }} />
    </div>
    <div style={{ marginTop: 30, fontWeight: 700, fontSize: 52, color: B.ink, letterSpacing: -1.5 }}>{c.name}</div>
    <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontWeight: 800, fontSize: 56, color: B.green, letterSpacing: -1 }}>{c.price}</div>
      <div style={{ padding: "18px 34px", borderRadius: 40, background: B.green, color: B.cream, fontWeight: 700, fontSize: 32 }}>Add to Cart</div>
    </div>
  </div>
);

const Act2: React.FC<{ t: number }> = ({ t }) => {
  if (t < 4.1 || t > 12.6) return null;
  // 1) full green (same color as the dived-into icon) shrinks into a pill
  const pill = p(t, 4.2, 4.95);
  const press = Math.sin(p(t, 5.05, 5.3, Easing.linear) * Math.PI) * 0.06;
  const grow = p(t, 5.35, 6.2);
  const w = mix(mix(2600, 480, pill), CARD.w, grow);
  const h = mix(mix(2600, 132, pill), CARD.h, grow);
  const r = mix(mix(1300, 66, pill), 64, grow);
  const bg = interpolateColors(grow, [0, 0.6], [B.green, B.white]);
  const label = p(t, 4.65, 5.0) * (1 - p(t, 5.35, 5.55));
  const breathe = 1 + Math.sin(t * 5) * 0.03 * (1 - grow) * p(t, 4.6, 4.9);
  // 2) carousel: card i is "on stage" between swaps; swaps overlap in/out
  const stageOf = (i: number) => {
    const inStart = i === 0 ? 4.1 : SWAP[i - 1];
    const outStart = i < SWAP.length ? SWAP[i] : 99;
    const inn = i === 0 ? 1 : p(t, inStart, inStart + SW);
    const out = i < SWAP.length ? p(t, outStart, outStart + SW) : 0;
    return { inn, out, visible: t >= inStart - 0.01 && t <= outStart + SW + 0.01 };
  };
  // 3) last card: camera pushes into its photo while the map fades up
  const dive = p(t, 11.55, 12.45, IN);
  const drift = Math.sin(t * 1.6) * 16;
  const hover = (t2: number) => 1 + 0.035 * Math.sin(t2 * 1.1);
  return (
    <AbsoluteFill style={{ perspective: 2200 }}>
      {CARDS.map((c, i) => {
        const st = stageOf(i);
        if (!st.visible) return null;
        const x = (1 - st.inn) * 760 - st.out * 760;
        const ry = (1 - st.inn) * 42 - st.out * 42;
        const sc = (1 - 0.12 * (1 - st.inn)) * (1 - 0.12 * st.out);
        const op = Math.min(1, st.inn * 1.6) * (1 - st.out * 0.9);
        const isFirst = i === 0;
        const reveal = isFirst ? p(t, 5.75, 6.35, OUT) : 1;
        const imgScale = 1.12 - 0.12 * (isFirst ? reveal : st.inn) + 0.04 * p(t, 6, 12, Easing.linear);
        const lastDive = i === CARDS.length - 1 ? dive : 0;
        if (isFirst && grow < 1) {
          // morphing pill/card shape (first card grows out of the pill)
          return (
            <div key={i} style={{ position: "absolute", left: 540 - w / 2, top: 960 - h / 2, width: w, height: h, borderRadius: r, background: bg, transform: `scale(${(1 - press) * breathe})`, boxShadow: grow > 0.3 ? "0 40px 90px rgba(0,0,0,.12)" : "0 20px 40px rgba(23,61,46,.25)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: INTER, fontWeight: 700, fontSize: 48, color: B.cream, opacity: label }}>Shop Gifts&nbsp;&nbsp;→</span>
              {grow > 0.4 ? <CardFace c={c} reveal={reveal} imgScale={imgScale} /> : null}
            </div>
          );
        }
        return (
          <div key={i} style={{ position: "absolute", left: 540 - CARD.w / 2, top: 960 - CARD.h / 2 + drift * (isFirst ? p(t, 6.2, 6.9) : 1), width: CARD.w, height: CARD.h, opacity: op * (1 - lastDive * 0.0), transformOrigin: "50% 42%", transform: `translateX(${x}px) rotateY(${ry + Math.sin(t * 1.2 + i) * 3}deg) rotateZ(${Math.sin(t * 0.9 + i) * 1.2}deg) scale(${sc * hover(t + i) * (1 + lastDive * 6)})` }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 64, background: B.white, boxShadow: "0 40px 90px rgba(0,0,0,.12)", overflow: "hidden" }}>
              <CardFace c={c} reveal={reveal} imgScale={imgScale} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// gold route drawing continuously behind the carousel
const Route: React.FC<{ t: number }> = ({ t }) => {
  if (t < 6.3 || t > 12.2) return null;
  const k = p(t, 6.4, 11.6, Easing.linear);
  const fade = 1 - p(t, 11.5, 12.0);
  const d = "M 40 1760 C 320 1560, 100 1280, 400 1170 S 1040 920, 830 610 S 280 300, 1040 120";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fade }}>
      <path d={d} fill="none" stroke={B.gold} strokeWidth={14} strokeLinecap="round" strokeDasharray={3300} strokeDashoffset={3300 * (1 - k)} />
    </svg>
  );
};

// ------------------------------------------------------------------ act 3: map + pin + chips
const City: React.FC<{ x: number; y: number; n: string; big?: boolean }> = ({ x, y, n, big }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, fontFamily: INTER, fontWeight: 600, fontSize: big ? 34 : 27, color: "#4c5a52" }}>
    <span style={{ width: big ? 18 : 12, height: big ? 18 : 12, borderRadius: 9, background: "#7d8f84" }} />{n}
  </div>
);
const Act3: React.FC<{ t: number }> = ({ t }) => {
  if (t < 11.9 || t > 14.9) return null;
  const inn = p(t, 11.95, 12.55);
  const push = mix(1.25, 0.98, p(t, 11.95, 14.35, Easing.linear));
  const away = p(t, 13.75, 14.35);
  const pin = interpolate(t, [12.65, 13.0], [0, 1], { ...CL, easing: Easing.bezier(0.34, 1.45, 0.64, 1) });
  const label = p(t, 12.95, 13.35, OUT);
  const PX = 650, PY = 720;
  return (
    <AbsoluteFill style={{ opacity: inn * (1 - away), filter: `blur(${away * 14}px)`, transform: `scale(${push * (1 - away * 0.08)})` }}>
      <AbsoluteFill style={{ background: "#EDE7D6" }}>
        <div style={{ position: "absolute", left: -300, top: 1350, width: 1300, height: 900, borderRadius: "50%", background: "#A9CFE0" }} />
        <div style={{ position: "absolute", left: 420, top: 160, width: 700, height: 600, borderRadius: "50%", background: "#D7E3C8", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", left: 60, top: 700, width: 600, height: 500, borderRadius: "50%", background: "#E8DDBF", filter: "blur(40px)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <path d="M 300 1420 C 420 1200, 520 980, 650 720 S 760 420, 720 300" stroke="#fff" strokeWidth={14} fill="none" />
          <path d="M 300 1420 C 420 1200, 520 980, 650 720 S 760 420, 720 300" stroke="#E9C46A" strokeWidth={6} fill="none" strokeDasharray={1500} strokeDashoffset={1500 * (1 - p(t, 12.2, 13.2))} />
          <path d="M 120 900 C 300 860, 480 800, 650 720" stroke="#fff" strokeWidth={8} fill="none" />
        </svg>
        <City x={250} y={1420} n="Karachi" big />
        <City x={700} y={300} n="Islamabad" big />
        <City x={720} y={380} n="Rawalpindi" />
        <City x={420} y={860} n="Multan" />
        <City x={560} y={600} n="Faisalabad" />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: PX - 50, top: PY - 120 - (1 - pin) * 220, width: 100, height: 120, opacity: Math.min(1, pin * 2) }}>
        <svg width={100} height={120} viewBox="0 0 100 120"><path d="M50 116 C 50 116, 8 66, 8 42 A 42 42 0 1 1 92 42 C 92 66, 50 116, 50 116 Z" fill={B.green} /><circle cx="50" cy="42" r="16" fill={B.gold} /></svg>
      </div>
      <div style={{ position: "absolute", left: PX - 60, top: PY - 8, width: 120, height: 28, borderRadius: "50%", background: "rgba(23,61,46,.25)", transform: `scale(${pin})`, filter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: PY + 70, display: "flex", justifyContent: "center", opacity: label, transform: `translateY(${(1 - label) * 30}px) scale(${0.94 + 0.06 * label})` }}>
        <div style={{ padding: "26px 44px", borderRadius: 44, background: "rgba(255,255,255,.94)", boxShadow: "0 24px 60px rgba(0,0,0,.15)", fontFamily: INTER, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 54, color: B.ink, letterSpacing: -1 }}>Lahore</div>
          <div style={{ fontWeight: 600, fontSize: 32, color: B.sub, marginTop: 6 }}>Delivered in 3–7 days</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Chips: React.FC<{ t: number }> = ({ t }) => {
  if (t < 13.8 || t > 15.4) return null;
  const items = [
    { s: "Cash on Delivery", bg: B.green, fg: B.cream, at: 13.85 },
    { s: "7-Day Easy Returns", bg: B.white, fg: B.ink, at: 14.0 },
    { s: "Delivery Across Pakistan", bg: B.gold, fg: B.white, at: 14.15 },
  ];
  const push = mix(1, 1.06, p(t, 13.85, 15.2, Easing.linear));
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      {items.map((c, i) => {
        const k = p(t, c.at, c.at + 0.5, OUT);
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 760 + i * 170, display: "flex", justifyContent: "center", opacity: k, transform: `translateY(${(1 - k) * 120}px) scale(${0.9 + 0.1 * k})`, filter: `blur(${(1 - k) * 10}px)` }}>
            <div style={{ padding: "30px 56px", borderRadius: 60, background: c.bg, color: c.fg, fontFamily: INTER, fontWeight: 700, fontSize: 50, letterSpacing: -1, boxShadow: "0 24px 50px rgba(0,0,0,.12)" }}>{c.s}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ act 4: green bloom -> logo
const End: React.FC<{ t: number }> = ({ t }) => {
  if (t < 14.45) return null;
  const bloom = p(t, 14.45, 15.15);
  const R = mix(0, 1500, bloom);
  const logo = p(t, 14.95, 15.65, OUT);
  const word = p(t, 15.25, 15.85, OUT);
  const url = p(t, 15.5, 16.1, OUT);
  const drift = mix(1, 1.05, p(t, 15, 17, Easing.linear));
  const shine = mix(-300, 900, p(t, 15.6, 16.4, Easing.linear));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - R, top: 1010 - R, width: R * 2, height: R * 2, borderRadius: "50%", background: `radial-gradient(circle, ${B.green2}, ${B.green} 65%)` }} />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        <div style={{ position: "absolute", left: 540 - 280, top: 640, width: 560, overflow: "hidden", opacity: logo, transform: `scale(${0.88 + 0.12 * logo})`, filter: `blur(${(1 - logo) * 18}px)` }}>
          <Img src={img("br_logo.png")} style={{ width: "100%" }} />
          <div style={{ position: "absolute", top: 0, left: shine, width: 120, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent)", transform: "skewX(-20deg)" }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1085, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 60, letterSpacing: 12, color: B.cream, opacity: word, filter: `blur(${(1 - word) * 10}px)` }}>BAZAAR RETAIL</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1185, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 44, color: B.gold, opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>bazaarretail.com</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ sound
const SFX: { at: number; s: string; v: number }[] = [
  { at: 0.0, s: "swish_long", v: 0.35 }, { at: 1.15, s: "click", v: 0.18 }, { at: 1.45, s: "swish_short", v: 0.28 },
  { at: 1.95, s: "swish_short", v: 0.18 }, { at: 2.05, s: "swish_short", v: 0.18 },
  { at: 3.55, s: "swish_long", v: 0.3 }, { at: 4.35, s: "bloom", v: 0.12 }, { at: 5.08, s: "click", v: 0.25 },
  { at: 5.35, s: "swish_short", v: 0.25 }, { at: 7.35, s: "swish_short", v: 0.3 }, { at: 8.85, s: "swish_short", v: 0.3 },
  { at: 10.35, s: "swish_short", v: 0.3 }, { at: 11.55, s: "swish_long", v: 0.3 }, { at: 12.7, s: "sfx_pop", v: 0.2 },
  { at: 13.85, s: "click", v: 0.16 }, { at: 14.0, s: "click", v: 0.16 }, { at: 14.15, s: "click", v: 0.16 },
  { at: 14.4, s: "swish_long", v: 0.3 }, { at: 15.6, s: "sfx_bell", v: 0.14 },
];

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <Route t={t} />
      <Act2 t={t} />
      <Act3 t={t} />
      <Chips t={t} />
      <Act1 t={t} />
      <End t={t} />
    </AbsoluteFill>
  );
};

export const BazaarGifts2: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill>
      <CameraMotionBlur samples={5} shutterAngle={180}>
        <Scene />
      </CameraMotionBlur>
      <Audio src={staticFile("bazaar/music3.wav")} volume={(f) => 0.6 * interpolate(f, [0, 3, durationInFrames - 60, durationInFrames], [0, 1, 1, 0], CL)} />
      {SFX.map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)}><Audio src={staticFile(`bazaar/${c.s}.wav`)} volume={c.v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
