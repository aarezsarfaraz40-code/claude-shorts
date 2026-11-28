/**
 * Bazaar Retail — "Gift Smarter" promo, Apple/olafmotion style (no voiceover).
 * 1080x1920, 17 s, 120 BPM (1 beat = 15 frames). Every scene morphs out of
 * the previous element; real camera motion blur on fast moves.
 */
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";

export const GIFTS_DURATION = 17;
const B = { bg: "#ECECF1", ink: "#111214", sub: "#6B6E76", green: "#173D2E", green2: "#215440", gold: "#BF9F62", cream: "#F5F1E6", white: "#FFFFFF" };
const INTER = "'InterV', 'Inter', system-ui, sans-serif";
const fontCSS = `@font-face { font-family: 'InterV'; src: url('${staticFile("fonts/Inter-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }`;
const img = (n: string) => staticFile(`bazaar/${n}`);
const C = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const smooth = Easing.bezier(0.65, 0, 0.35, 1); // in-out
const out = Easing.bezier(0.16, 1, 0.3, 1); // expo-ish out
const lerp = (fr: number, a: number, b: number, from: number, to: number, e = smooth) => interpolate(fr, [a, b], [from, to], { ...C, easing: e });

const ROWS = [
  { label: "Fashion", src: "p04.jpg" }, { label: "Beauty", src: "p09.jpg" }, { label: "Gadgets", src: "p20.jpg" },
  { label: "Kids", src: "p00.jpg" }, { label: "Watches", src: "p11.jpg" }, { label: "Winter", src: "p04.jpg" },
  { label: "Gifts", src: "" }, { label: "Skincare", src: "p09.jpg" }, { label: "Home & Living", src: "p11.jpg" },
];
const GIFT_ROW = 6;
const CARDS = [
  { tag: "For Her", src: "p09.jpg", name: "Matte Lipstick Set", price: "Rs. 2,449" },
  { tag: "For Him", src: "p20.jpg", name: "Air Mouse Remote", price: "Rs. 1,985" },
  { tag: "For Kids", src: "p00.jpg", name: "Kids Steering Toy", price: "Rs. 1,909" },
  { tag: "For Winter", src: "p04.jpg", name: "Winter Warm Socks", price: "Rs. 1,197" },
];

// ------------------------------------------------------------- 1. app list
const ROW_H = 170;
const List: React.FC<{ fr: number }> = ({ fr }) => {
  // fast scroll that decelerates onto the "Gifts" row (centered at y=960)
  const target = 960 - (GIFT_ROW * ROW_H + ROW_H / 2);
  const y0 = target + 2600;
  const y = lerp(fr, 0, 42, y0, target, out);
  const settle = lerp(fr, 40, 54, 0, 1);
  const leave = lerp(fr, 48, 70, 0, 1);
  return (
    <AbsoluteFill>
      {[...ROWS, ...ROWS, ...ROWS].map((r, i) => {
        const idx = i - ROWS.length; // the middle copy is the "real" list
        const top = y + idx * ROW_H - ROWS.length * 0; // repeated copies above/below
        const isGift = idx === GIFT_ROW;
        const yy = y + (i - ROWS.length) * ROW_H + ROWS.length * 0;
        if (yy < -200 || yy > 2100) return null;
        const dim = isGift ? 1 : 1 - settle * 0.75;
        const away = isGift ? 0 : leave;
        return (
          <div key={i} style={{ position: "absolute", left: 120, right: 120, top: yy, height: ROW_H - 30, display: "flex", alignItems: "center", gap: 36, opacity: dim * (1 - away), transform: `translateX(${away * (i % 2 ? 300 : -300)}px)`, filter: `blur(${away * 12}px)` }}>
            {isGift ? <div style={{ width: 120, height: 120 }} /> : !r.src ? (
              <div style={{ width: 120, height: 120, borderRadius: 30, background: `linear-gradient(160deg, ${B.green2}, ${B.green})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Img src={img("br_logo.png")} style={{ width: "74%" }} />
              </div>
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: 30, overflow: "hidden", boxShadow: "0 8px 20px rgba(0,0,0,.12)", background: "#fff" }}>
                <Img src={img(r.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 64, color: B.ink, letterSpacing: -1.5, opacity: isGift ? 1 - lerp(fr, 50, 60, 0, 1) : 1 }}>{r.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// the BR icon: lives in the list, flies into the headline, then the camera zooms into it
const BrIcon: React.FC<{ fr: number }> = ({ fr }) => {
  const listY = 960 - 60;
  const fly = lerp(fr, 50, 74, 0, 1, out);
  const x = interpolate(fly, [0, 1], [120, 540 - 70]);
  const y = interpolate(fly, [0, 1], [listY, 860]);
  let size = interpolate(fly, [0, 1], [120, 140]);
  const zoom = lerp(fr, 104, 124, 0, 1, Easing.bezier(0.7, 0, 0.84, 0));
  size = size * (1 + zoom * 28);
  const radius = interpolate(fly, [0, 1], [30, 36]) * (1 + zoom * 28);
  const cx = x + 70, cy = y + 70;
  const visible = fr < 126;
  if (!visible) return null;
  // during the list scroll the icon scrolls with the list
  const target = 960 - (GIFT_ROW * ROW_H + ROW_H / 2);
  const scrollY = lerp(fr, 0, 42, target + 2600, target, out) + GIFT_ROW * ROW_H + (ROW_H - 30) / 2 - 60;
  const yy = fr < 50 ? scrollY : cy - size / 2;
  const xx = fr < 50 ? 120 : cx - size / 2;
  return (
    <div style={{ position: "absolute", left: xx, top: yy, width: size, height: size, borderRadius: radius, background: `linear-gradient(160deg, ${B.green2}, ${B.green})`, boxShadow: `0 ${18 * (1 - zoom)}px 40px rgba(23,61,46,${0.35 * (1 - zoom)})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Img src={img("br_logo.png")} style={{ width: "74%", opacity: 1 - zoom * 3 }} />
    </div>
  );
};

// ------------------------------------------------------------- 2. headline
const Headline: React.FC<{ fr: number }> = ({ fr }) => {
  const a = lerp(fr, 56, 74, 0, 1, out);
  const b = lerp(fr, 60, 78, 0, 1, out);
  const eyebrow = lerp(fr, 66, 80, 0, 1, out);
  const gone = lerp(fr, 100, 112, 0, 1);
  const word = (t: string, p: number, dir: number): React.ReactNode => (
    <span style={{ display: "inline-block", opacity: p * (1 - gone), transform: `translateX(${(1 - p) * 160 * dir}px)`, filter: `blur(${(1 - p) * 18 + gone * 20}px)` }}>{t}</span>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", fontFamily: INTER, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: B.gold, opacity: eyebrow * (1 - gone) }}>THIS WINTER</div>
      <div style={{ position: "absolute", right: 540 + 96, top: 862, fontFamily: INTER, fontWeight: 800, fontSize: 100, letterSpacing: -3, color: B.ink, lineHeight: "140px" }}>{word("Gift", a, -1)}</div>
      <div style={{ position: "absolute", left: 540 + 96, top: 862, fontFamily: INTER, fontWeight: 800, fontSize: 100, letterSpacing: -3, color: B.ink, lineHeight: "140px" }}>{word("Smart", b, 1)}</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- 3. green fill -> pill -> card
const Morph: React.FC<{ fr: number }> = ({ fr }) => {
  if (fr < 122 || fr > 172) return null;
  // green full screen shrinks into a pill, the pill grows into the first card
  const toPill = lerp(fr, 122, 140, 0, 1, out);
  const toCard = lerp(fr, 146, 166, 0, 1, out);
  let w = interpolate(toPill, [0, 1], [2600, 470]);
  let h = interpolate(toPill, [0, 1], [2600, 130]);
  let r = interpolate(toPill, [0, 1], [1300, 65]);
  w = interpolate(toCard, [0, 1], [w, 820]);
  h = interpolate(toCard, [0, 1], [h, 1160]);
  r = interpolate(toCard, [0, 1], [r, 64]);
  const bg = toCard > 0.35 ? B.white : B.green;
  const label = lerp(fr, 132, 140, 0, 1) * (1 - lerp(fr, 146, 150, 0, 1));
  const press = interpolate(fr, [141, 144, 147], [1, 0.94, 1], C);
  return (
    <div style={{ position: "absolute", left: 540 - w / 2, top: 960 - h / 2, width: w, height: h, borderRadius: r, background: bg, transform: `scale(${press})`, boxShadow: toCard > 0.35 ? "0 40px 90px rgba(0,0,0,.12)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 700, fontSize: 48, color: B.cream, overflow: "hidden" }}>
      <span style={{ opacity: label }}>Shop Gifts&nbsp;&nbsp;→</span>
    </div>
  );
};

// ------------------------------------------------------------- 4. product cards
const CARD_T = [160, 195, 240, 285]; // frames when each card is fully in
const Card: React.FC<{ c: (typeof CARDS)[number]; fr: number; i: number }> = ({ c, fr, i }) => {
  const start = CARD_T[i];
  const end = i < CARDS.length - 1 ? CARD_T[i + 1] : 999;
  const inP = i === 0 ? lerp(fr, 158, 170, 0, 1, out) : lerp(fr, start - 12, start + 6, 0, 1, out);
  const outP = i < CARDS.length - 1 ? lerp(fr, end - 12, end + 2, 0, 1, Easing.bezier(0.7, 0, 0.84, 0)) : 0;
  if (fr < start - 14 || (i < CARDS.length - 1 && fr > end + 4)) return null;
  const content = i === 0 ? lerp(fr, 160, 172, 0, 1, out) : 1;
  const zoomMap = i === CARDS.length - 1 ? lerp(fr, 315, 335, 0, 1, Easing.bezier(0.7, 0, 0.84, 0)) : 0;
  if (zoomMap >= 1) return null;
  const x = (1 - inP) * (i === 0 ? 0 : 900) - outP * 1100;
  const y = (1 - inP) * (i === 0 ? 0 : 500) - outP * 300;
  const rot = (1 - inP) * (i === 0 ? 0 : 18) - outP * 14;
  const float = Math.sin(fr / 14 + i) * 6;
  return (
    <div style={{ position: "absolute", left: 540 - 410, top: 960 - 580 + float, width: 820, height: 1160, perspective: 1800, transform: `translate(${x}px, ${y}px) scale(${1 + zoomMap * 5})`, opacity: 1 - zoomMap * 0.8 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 64, background: B.white, boxShadow: "0 40px 90px rgba(0,0,0,.12)", transform: `rotateY(${rot}deg) rotateZ(${rot * 0.25}deg)`, padding: 40, boxSizing: "border-box", fontFamily: INTER }}>
        <div style={{ opacity: content, transform: `translateY(${(1 - content) * 40}px)` }}>
          <div style={{ display: "inline-block", padding: "12px 28px", borderRadius: 40, background: "rgba(191,159,98,.16)", color: B.gold, fontWeight: 700, fontSize: 34, letterSpacing: 1 }}>{c.tag}</div>
          <div style={{ marginTop: 28, height: 690, borderRadius: 44, overflow: "hidden", background: "#f4f4f4" }}>
            <Img src={img(c.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.08 - 0.08 * inP})` }} />
          </div>
          <div style={{ marginTop: 30, fontWeight: 700, fontSize: 52, color: B.ink, letterSpacing: -1.5 }}>{c.name}</div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 56, color: B.green, letterSpacing: -1 }}>{c.price}</div>
            <div style={{ padding: "18px 34px", borderRadius: 40, background: B.green, color: B.cream, fontWeight: 700, fontSize: 32 }}>Add to Cart</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// gold route line drawing behind the cards
const Route: React.FC<{ fr: number }> = ({ fr }) => {
  const p = lerp(fr, 165, 312, 0, 1, Easing.linear);
  const fade = 1 - lerp(fr, 312, 326, 0, 1);
  if (fr < 160) return null;
  const d = "M 60 1700 C 300 1500, 120 1250, 400 1150 S 1000 900, 820 600 S 300 300, 1020 140";
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: fade }}>
      <path d={d} fill="none" stroke={B.gold} strokeWidth={14} strokeLinecap="round" strokeDasharray={3200} strokeDashoffset={3200 * (1 - p)} />
    </svg>
  );
};

// ------------------------------------------------------------- 5. map + pin
const City: React.FC<{ x: number; y: number; name: string; big?: boolean }> = ({ x, y, name, big }) => (
  <div style={{ position: "absolute", left: x, top: y, display: "flex", alignItems: "center", gap: 10, fontFamily: INTER, fontWeight: 600, fontSize: big ? 34 : 26, color: "#4c5a52" }}>
    <span style={{ width: big ? 18 : 12, height: big ? 18 : 12, borderRadius: 9, background: "#7d8f84" }} />{name}
  </div>
);
const MapScene: React.FC<{ fr: number }> = ({ fr }) => {
  if (fr < 318 || fr > 400) return null;
  const inP = lerp(fr, 318, 336, 0, 1, out);
  const push = lerp(fr, 330, 395, 1.15, 1.0, Easing.linear);
  const leave = lerp(fr, 384, 398, 0, 1);
  const pin = lerp(fr, 342, 354, 0, 1, Easing.bezier(0.34, 1.56, 0.64, 1));
  const label = lerp(fr, 352, 364, 0, 1, out);
  const pinX = 650, pinY = 720;
  return (
    <AbsoluteFill style={{ opacity: inP * (1 - leave), filter: `blur(${(1 - inP) * 20 + leave * 20}px)` }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, background: "#EDE7D6" }}>
        {/* water */}
        <div style={{ position: "absolute", left: -300, top: 1350, width: 1300, height: 900, borderRadius: "50%", background: "#A9CFE0" }} />
        {/* soft terrain blobs */}
        <div style={{ position: "absolute", left: 420, top: 160, width: 700, height: 600, borderRadius: "50%", background: "#D7E3C8", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", left: 60, top: 700, width: 600, height: 500, borderRadius: "50%", background: "#E8DDBF", filter: "blur(40px)" }} />
        {/* roads */}
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d="M 300 1420 C 420 1200, 520 980, 650 720 S 760 420, 720 300" stroke="#fff" strokeWidth={14} fill="none" />
          <path d="M 300 1420 C 420 1200, 520 980, 650 720 S 760 420, 720 300" stroke="#E9C46A" strokeWidth={6} fill="none" />
          <path d="M 120 900 C 300 860, 480 800, 650 720" stroke="#fff" strokeWidth={8} fill="none" />
        </svg>
        <City x={250} y={1420} name="Karachi" big />
        <City x={700} y={300} name="Islamabad" big />
        <City x={720} y={380} name="Rawalpindi" />
        <City x={420} y={860} name="Multan" />
        <City x={560} y={600} name="Faisalabad" />
      </AbsoluteFill>
      {/* pin */}
      <div style={{ position: "absolute", left: pinX - 50, top: pinY - 120 - (1 - pin) * 200, width: 100, height: 120, opacity: Math.min(1, pin * 2) }}>
        <svg width={100} height={120} viewBox="0 0 100 120"><path d="M50 116 C 50 116, 8 66, 8 42 A 42 42 0 1 1 92 42 C 92 66, 50 116, 50 116 Z" fill={B.green} /><circle cx="50" cy="42" r="16" fill={B.gold} /></svg>
      </div>
      <div style={{ position: "absolute", left: pinX - 60, top: pinY + 30, width: 120, height: 30, borderRadius: "50%", background: "rgba(23,61,46,.25)", transform: `scale(${pin})`, filter: "blur(6px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: pinY + 90, display: "flex", justifyContent: "center", opacity: label, transform: `translateY(${(1 - label) * 30}px)` }}>
        <div style={{ padding: "26px 40px", borderRadius: 40, background: "rgba(255,255,255,.92)", boxShadow: "0 24px 60px rgba(0,0,0,.15)", fontFamily: INTER, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 52, color: B.ink, letterSpacing: -1 }}>Lahore</div>
          <div style={{ fontWeight: 600, fontSize: 32, color: B.sub, marginTop: 6 }}>Delivered in 3–7 days</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- 6. promise chips
const Chips: React.FC<{ fr: number }> = ({ fr }) => {
  if (fr < 390 || fr > 440) return null;
  const items = [
    { t: "Cash on Delivery", bg: B.green, fg: B.cream, at: 392 },
    { t: "7-Day Easy Returns", bg: B.white, fg: B.ink, at: 404 },
    { t: "Delivery Across Pakistan", bg: B.gold, fg: B.white, at: 416 },
  ];
  const leave = lerp(fr, 428, 440, 0, 1, Easing.bezier(0.7, 0, 0.84, 0));
  return (
    <AbsoluteFill>
      {items.map((c, i) => {
        const p = lerp(fr, c.at, c.at + 12, 0, 1, out);
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 740 + i * 170, display: "flex", justifyContent: "center", opacity: p * (1 - leave), transform: `translateX(${(1 - p) * (i % 2 ? 500 : -500) + leave * (i % 2 ? -900 : 900)}px)` }}>
            <div style={{ padding: "30px 56px", borderRadius: 60, background: c.bg, color: c.fg, fontFamily: INTER, fontWeight: 700, fontSize: 52, letterSpacing: -1, boxShadow: "0 24px 50px rgba(0,0,0,.12)" }}>{c.t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- 7. end card
const End: React.FC<{ fr: number }> = ({ fr }) => {
  if (fr < 434) return null;
  const wipe = lerp(fr, 434, 450, 0, 1, out);
  const logo = lerp(fr, 444, 462, 0, 1, out);
  const url = lerp(fr, 458, 472, 0, 1, out);
  const shine = lerp(fr, 462, 490, -300, 900, Easing.linear);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - 1500 * wipe, top: 960 - 1500 * wipe, width: 3000 * wipe, height: 3000 * wipe, borderRadius: "50%", background: `radial-gradient(circle, ${B.green2}, ${B.green} 60%)` }} />
      <div style={{ position: "absolute", left: 540 - 280, top: 640, width: 560, overflow: "hidden", opacity: logo, transform: `scale(${0.85 + 0.15 * logo})`, filter: `blur(${(1 - logo) * 16}px)` }}>
        <Img src={img("br_logo.png")} style={{ width: "100%" }} />
        <div style={{ position: "absolute", top: 0, left: shine, width: 120, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent)", transform: "skewX(-20deg)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1080, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 60, letterSpacing: 12, color: B.cream, opacity: logo }}>BAZAAR RETAIL</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 44, color: B.gold, opacity: url, transform: `translateY(${(1 - url) * 24}px)` }}>bazaarretail.com</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------- composition
const SFX = [
  { at: 0, s: "whoosh", v: 0.22 }, { at: 48, s: "whoosh", v: 0.16 }, { at: 58, s: "pop", v: 0.12 },
  { at: 102, s: "riser", v: 0.14 }, { at: 124, s: "impact", v: 0.16 }, { at: 142, s: "tick", v: 0.2 },
  { at: 150, s: "whoosh", v: 0.14 }, { at: 183, s: "whoosh", v: 0.16 }, { at: 228, s: "whoosh", v: 0.16 },
  { at: 273, s: "whoosh", v: 0.16 }, { at: 312, s: "riser", v: 0.12 }, { at: 330, s: "whoosh", v: 0.16 },
  { at: 350, s: "pop", v: 0.18 }, { at: 392, s: "pop", v: 0.14 }, { at: 404, s: "pop", v: 0.14 },
  { at: 416, s: "pop", v: 0.14 }, { at: 434, s: "whoosh", v: 0.18 }, { at: 446, s: "impact", v: 0.16 }, { at: 462, s: "bell", v: 0.14 },
];

const Scene: React.FC = () => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: B.bg }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      {fr < 80 ? <List fr={fr} /> : null}
      {fr < 115 ? <Headline fr={fr} /> : null}
      <BrIcon fr={fr} />
      <Route fr={fr} />
      <Morph fr={fr} />
      {CARDS.map((c, i) => <Card key={i} c={c} fr={fr} i={i} />)}
      <MapScene fr={fr} />
      <Chips fr={fr} />
      <End fr={fr} />
    </AbsoluteFill>
  );
};

export const BazaarGifts: React.FC = () => (
  <AbsoluteFill>
    <CameraMotionBlur samples={6} shutterAngle={200}>
      <Scene />
    </CameraMotionBlur>
    <Audio src={staticFile("bazaar/music2.wav")} volume={(f) => 0.55 * interpolate(f, [0, 4, 480, 510], [0, 1, 1, 0], C)} />
    {SFX.map((c, i) => (
      <Sequence key={i} from={c.at}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.v} /></Sequence>
    ))}
  </AbsoluteFill>
);
