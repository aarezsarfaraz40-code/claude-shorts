/**
 * Bazaar Retail — Apple/Google-style animated intro reel (1080x1920, ~34 s).
 * Urdu voiceover (starts at INTRO s), original music, SFX, no subtitles.
 * Brand: deep green #173D2E, cream #F5F1E6, gold #BF9F62.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const BAZAAR_DURATION = 34;
const INTRO = 3.0; // seconds of music-only intro before the voice starts
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
const v = (s: number) => f(s + INTRO); // voiceover time -> frame

const G = { green: "#173D2E", green2: "#215440", cream: "#F5F1E6", cream2: "#EFEAE0", sand: "#E5DEC3", gold: "#BF9F62", ink: "#0F241B", white: "#FFFFFF" };
const INTER = "'InterV', 'Inter', system-ui, sans-serif";
const URDU = "'Nastaliq', 'Noto Nastaliq Urdu', serif";
const fontCSS = `
@font-face { font-family: 'InterV'; src: url('${staticFile("fonts/Inter-Variable.ttf")}') format('truetype'); font-weight: 100 900; font-display: block; }
@font-face { font-family: 'Nastaliq'; src: url('${staticFile("fonts/NotoNastaliqUrdu.ttf")}') format('truetype'); font-weight: 400 700; font-display: block; }
`;
const img = (n: string) => staticFile(`bazaar/${n}`);

const PRODUCTS = [
  { img: "p11.jpg", name: "Watch Gift Set", price: "Rs. 3,151" },
  { img: "p09.jpg", name: "Matte Lipstick Set", price: "Rs. 2,449" },
  { img: "p00.jpg", name: "Kids Steering Toy", price: "Rs. 1,909" },
  { img: "p20.jpg", name: "Air Mouse Remote", price: "Rs. 1,985" },
  { img: "p04.jpg", name: "Winter Warm Socks", price: "Rs. 1,197" },
  { img: "p09.jpg", name: "Beauty Picks", price: "Rs. 1,261" },
];

// ------------------------------------------------------------ helpers
const useSpring = (start: number, cfg = { damping: 16, stiffness: 120, mass: 0.9 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - start, fps, config: cfg });
};
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = Easing.bezier(0.22, 1, 0.36, 1); // Apple-ish ease-out

const Headline: React.FC<{ text: string; at: number; out: number; y?: number; size?: number; color?: string }> = ({ text, at, out, y = 230, size = 96, color = G.green }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: ease });
  const o = interpolate(frame, [out - 10, out], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 150, right: 150, top: y, textAlign: "center", direction: "rtl", opacity: p * o, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 10}px)` }}>
      <span style={{ fontFamily: URDU, fontSize: size, lineHeight: 1.9, color }}>{text}</span>
    </div>
  );
};

const Sub: React.FC<{ text: string; at: number; out: number; y: number; size?: number; color?: string; weight?: number }> = ({ text, at, out, y, size = 44, color = G.green, weight = 700 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: ease });
  const o = interpolate(frame, [out - 10, out], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 150, right: 150, top: y, textAlign: "center", opacity: p * o, transform: `translateY(${(1 - p) * 30}px)`, fontFamily: INTER, fontWeight: weight, fontSize: size, color, letterSpacing: -0.5 }}>
      {text}
    </div>
  );
};

// ------------------------------------------------------------ background
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% ${40 + Math.sin(t * 0.3) * 5}%, ${G.cream} 0%, ${G.cream2} 55%, ${G.sand} 100%)` }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", left: 190 + Math.sin(t * 0.25 + i * 2) * 300, top: 400 + i * 450 + Math.cos(t * 0.2 + i) * 120, background: i === 1 ? G.gold : G.green, opacity: 0.07, filter: "blur(90px)" }} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ scene 1: logo intro
const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const circle = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease });
  const shrink = interpolate(frame, [f(3.2), f(4.6)], [1, 0], { ...clamp, easing: ease });
  const logo = useSpring(14, { damping: 13, stiffness: 110, mass: 1 });
  const line = interpolate(frame, [28, 52], [0, 1], { ...clamp, easing: ease });
  const words = "BAZAAR RETAIL".split("");
  const tag = interpolate(frame, [60, 78], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [v(1.7), v(2.1)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {/* green disc expanding then receding */}
      <div style={{ position: "absolute", left: 540 - 1300 * circle * (0.25 + 0.75 * shrink), top: 900 - 1300 * circle * (0.25 + 0.75 * shrink), width: 2600 * circle * (0.25 + 0.75 * shrink), height: 2600 * circle * (0.25 + 0.75 * shrink), borderRadius: "50%", background: `radial-gradient(circle, ${G.green2}, ${G.green})` }} />
      <div style={{ position: "absolute", left: 540 - 300, top: 560, width: 600, transform: `scale(${0.6 + 0.4 * logo}) translateY(${(1 - logo) * 60}px)`, opacity: logo, filter: `drop-shadow(0 30px 40px rgba(0,0,0,${0.25 * shrink}))` }}>
        <Img src={img("br_logo.png")} style={{ width: "100%" }} />
      </div>
      <div style={{ position: "absolute", left: 340, top: 1035, width: 400 * line, height: 4, background: G.gold, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1075, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 64, letterSpacing: 14 }}>
        {words.map((c, i) => {
          const p = interpolate(frame, [32 + i * 2, 46 + i * 2], [0, 1], { ...clamp, easing: ease });
          return <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: shrink > 0.5 ? G.cream : G.green }}>{c === " " ? " " : c}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1170, textAlign: "center", fontFamily: INTER, fontWeight: 500, fontSize: 34, letterSpacing: 4, opacity: tag, color: shrink > 0.5 ? G.gold : G.green }}>ONLINE SHOPPING IN PAKISTAN</div>
      {/* welcome line in Urdu while VO greets */}
      <Headline text="خوش آمدید" at={v(0)} out={v(2.0)} y={1260} size={84} color={G.green} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ phone + screens
const PHONE = { w: 520, h: 1060 };

const AppHeader: React.FC<{ cart: number; cartBump: number }> = ({ cart, cartBump }) => (
  <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 26px 0", fontFamily: INTER }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: G.green, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <Img src={img("br_logo.png")} style={{ width: 40 }} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 22, color: G.green, letterSpacing: 2 }}>BAZAAR RETAIL</div>
    </div>
    <div style={{ position: "relative", width: 52, height: 52, borderRadius: 26, background: G.cream2, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + cartBump * 0.25})` }}>
      <CartIcon size={28} color={G.green} />
      {cart > 0 ? <div style={{ position: "absolute", right: -4, top: -4, width: 26, height: 26, borderRadius: 13, background: G.gold, color: G.white, fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.6 + 0.4 * Math.min(1, cartBump * 2 + 0.5)})` }}>{cart}</div> : null}
    </div>
  </div>
);

const CartIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6.2" />
    <circle cx="10" cy="20" r="1.4" />
    <circle cx="17" cy="20" r="1.4" />
  </svg>
);

const HomeScreen: React.FC<{ scroll: number; tapIndex: number; tapP: number }> = ({ scroll, tapIndex, tapP }) => (
  <div style={{ padding: "0 22px", fontFamily: INTER }}>
    <div style={{ height: 56, borderRadius: 28, background: G.cream2, display: "flex", alignItems: "center", padding: "0 22px", color: "rgba(23,61,46,.5)", fontSize: 20, fontWeight: 500 }}>🔍&nbsp; Search products</div>
    <div style={{ display: "flex", gap: 10, margin: "18px 0" }}>
      {["All", "Fashion", "Beauty", "Gadgets"].map((c, i) => (
        <div key={c} style={{ padding: "10px 18px", borderRadius: 20, background: i === 0 ? G.green : G.cream2, color: i === 0 ? G.cream : G.green, fontWeight: 700, fontSize: 17 }}>{c}</div>
      ))}
    </div>
    <div style={{ transform: `translateY(${-scroll}px)`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {PRODUCTS.map((p, i) => (
        <div key={i} style={{ borderRadius: 22, background: G.white, overflow: "hidden", boxShadow: i === tapIndex ? `0 0 0 ${4 * tapP}px ${G.gold}` : "0 6px 16px rgba(23,61,46,.08)", transform: i === tapIndex ? `scale(${1 - 0.05 * Math.sin(tapP * Math.PI)})` : "none" }}>
          <div style={{ height: 190, background: "#fff" }}><Img src={img(p.img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ padding: "10px 12px 14px" }}>
            <div style={{ fontWeight: 600, fontSize: 16, color: G.green, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
            <div style={{ fontWeight: 800, fontSize: 19, color: G.green, marginTop: 4 }}>{p.price}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DetailScreen: React.FC<{ enter: number; btnPress: number; flyP: number }> = ({ enter, btnPress, flyP }) => {
  const p = PRODUCTS[0];
  return (
    <div style={{ position: "absolute", inset: 0, top: 120, background: G.cream, transform: `translateY(${(1 - enter) * 900}px)`, borderTopLeftRadius: 30, borderTopRightRadius: 30, fontFamily: INTER, padding: 22 }}>
      <div style={{ height: 470, borderRadius: 26, overflow: "hidden", background: "#fff" }}>
        <Img src={img(p.img)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1 - flyP * 0.3 }} />
      </div>
      <div style={{ marginTop: 22, fontWeight: 800, fontSize: 30, color: G.green }}>{p.name}</div>
      <div style={{ marginTop: 6, fontWeight: 500, fontSize: 18, color: "rgba(23,61,46,.65)" }}>Cash on Delivery · Easy 7-Day Returns</div>
      <div style={{ marginTop: 14, fontWeight: 800, fontSize: 36, color: G.gold }}>{p.price}</div>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 60, height: 84, borderRadius: 42, background: G.green, color: G.cream, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontWeight: 800, fontSize: 28, transform: `scale(${1 - 0.06 * btnPress})`, boxShadow: `0 ${14 - 10 * btnPress}px 30px rgba(23,61,46,.35)` }}>
        <CartIcon size={30} color={G.cream} /> Add to Cart
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; typedFrom: number; frame: number }> = ({ label, value, typedFrom, frame }) => {
  const n = Math.max(0, Math.min(value.length, Math.floor((frame - typedFrom) / 0.8)));
  const active = frame >= typedFrom && n < value.length;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(23,61,46,.6)", marginBottom: 6 }}>{label}</div>
      <div style={{ height: 66, borderRadius: 18, background: G.white, border: `2px solid ${active ? G.gold : "rgba(23,61,46,.12)"}`, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 22, fontWeight: 600, color: G.green }}>
        {value.slice(0, n)}{active && Math.floor(frame / 8) % 2 === 0 ? "|" : ""}
      </div>
    </div>
  );
};

const CheckoutScreen: React.FC<{ enter: number; frame: number; t0: number; placeP: number }> = ({ enter, frame, t0, placeP }) => (
  <div style={{ position: "absolute", inset: 0, top: 120, background: G.cream, transform: `translateX(${(1 - enter) * 600}px)`, fontFamily: INTER, padding: 26 }}>
    <div style={{ fontWeight: 800, fontSize: 32, color: G.green, marginBottom: 20 }}>Checkout</div>
    <Field label="Full name" value="Ahmed Raza" typedFrom={t0 + 2} frame={frame} />
    <Field label="Phone" value="0300 1234567" typedFrom={t0 + 11} frame={frame} />
    <Field label="City" value="Lahore" typedFrom={t0 + 21} frame={frame} />
    <Field label="Address" value="House 12, Street 4, DHA" typedFrom={t0 + 27} frame={frame} />
    <div style={{ marginTop: 10, borderRadius: 18, background: "rgba(191,159,98,.15)", padding: "14px 18px", fontSize: 19, fontWeight: 700, color: G.green }}>💵 Payment: Cash on Delivery</div>
    <div style={{ position: "absolute", left: 26, right: 26, bottom: 60, height: 84, borderRadius: 42, background: G.green, color: G.cream, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, transform: `scale(${1 - 0.06 * placeP})` }}>Place Order</div>
  </div>
);

const ConfirmScreen: React.FC<{ enter: number; frame: number; start: number }> = ({ enter, frame, start }) => {
  const draw = interpolate(frame, [start + 6, start + 24], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", inset: 0, background: G.green, opacity: enter, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: INTER }}>
      <svg width={220} height={220} viewBox="0 0 100 100" style={{ transform: `scale(${0.6 + 0.4 * enter})` }}>
        <circle cx="50" cy="50" r="44" fill="none" stroke={G.gold} strokeWidth="6" strokeDasharray={276} strokeDashoffset={276 * (1 - draw)} strokeLinecap="round" />
        <path d="M30 52 L45 66 L71 38" fill="none" stroke={G.cream} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={60} strokeDashoffset={60 * (1 - Math.max(0, draw * 1.6 - 0.6))} />
      </svg>
      <div style={{ marginTop: 30, fontWeight: 800, fontSize: 40, color: G.cream }}>Order Confirmed</div>
      <div style={{ marginTop: 10, fontWeight: 500, fontSize: 22, color: "rgba(245,241,230,.75)" }}>We'll confirm by call or message</div>
    </div>
  );
};

const Finger: React.FC<{ x: number; y: number; press: number; show: number }> = ({ x, y, press, show }) => (
  <div style={{ position: "absolute", left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: 40, background: "rgba(255,255,255,.55)", border: "3px solid rgba(23,61,46,.35)", opacity: show, transform: `scale(${1 - 0.25 * press})`, boxShadow: `0 0 0 ${press * 26}px rgba(191,159,98,${0.35 * (1 - press)})` }} />
);

const PhoneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // timings (frames)
  const T = {
    in: v(1.9), choose: v(5.5), tap1: v(6.9), detail: v(7.2), addTap: v(7.82), fly: v(7.95), bump: v(8.35),
    checkout: v(8.9), place: v(10.55), confirm: v(10.85), out: v(13.9),
  };
  const enter = spring({ frame: frame - T.in, fps, config: { damping: 18, stiffness: 90, mass: 1.1 } });
  const exit = interpolate(frame, [T.out, T.out + 16], [0, 1], { ...clamp, easing: ease });
  const tilt = interpolate(frame, [T.in, T.in + 40], [22, 0], { ...clamp, easing: ease });
  const floatY = Math.sin(frame / 25) * 8;
  const scroll = interpolate(frame, [T.choose, T.tap1 - 4], [0, 120], { ...clamp, easing: ease });
  const tapP = interpolate(frame, [T.tap1, T.tap1 + 8], [0, 1], clamp);
  const detailIn = spring({ frame: frame - T.detail, fps, config: { damping: 17, stiffness: 120 } });
  const addPress = interpolate(frame, [T.addTap, T.addTap + 4, T.addTap + 9], [0, 1, 0], clamp);
  const flyP = interpolate(frame, [T.fly, T.bump], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const bump = interpolate(frame, [T.bump, T.bump + 6, T.bump + 14], [0, 1, 0], clamp);
  const cart = frame >= T.bump ? 1 : 0;
  const checkoutIn = spring({ frame: frame - T.checkout, fps, config: { damping: 18, stiffness: 120 } });
  const placeP = interpolate(frame, [T.place, T.place + 4, T.place + 9], [0, 1, 0], clamp);
  const confirmIn = interpolate(frame, [T.confirm, T.confirm + 10], [0, 1], clamp);

  // finger path (screen coordinates inside the phone)
  let fx = 150, fy = 520, show = 0, press = 0;
  if (frame >= T.tap1 - 14 && frame < T.detail + 4) { fx = 135; fy = 470; show = 1; press = tapP < 1 ? tapP : 0; }
  if (frame >= T.addTap - 14 && frame < T.fly + 6) { fx = 260; fy = 958; show = 1; press = addPress; }
  if (frame >= T.place - 14 && frame < T.confirm + 2) { fx = 260; fy = 958; show = 1; press = placeP; }

  // flying product thumbnail (from detail image to cart icon)
  const flyX = interpolate(flyP, [0, 1], [260, 470]);
  const flyY = interpolate(flyP, [0, 1], [380, 80]) - Math.sin(flyP * Math.PI) * 120;
  const flyS = interpolate(flyP, [0, 1], [1, 0.15]);

  return (
    <AbsoluteFill style={{ perspective: 2200 }}>
      <div
        style={{
          position: "absolute",
          left: 540 - PHONE.w / 2,
          top: 410 + floatY + (1 - enter) * 900 - exit * 80,
          width: PHONE.w,
          height: PHONE.h,
          transform: `rotateX(${tilt}deg) rotateY(${-tilt * 0.6}deg) scale(${1 - exit * 0.35})`,
          opacity: frame < T.in ? 0 : 1 - exit,
          borderRadius: 74,
          background: "#111",
          padding: 14,
          boxShadow: "0 60px 120px rgba(15,36,27,.35), 0 20px 40px rgba(15,36,27,.25), inset 0 0 0 2px #333",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", background: G.cream }}>
          <AppHeader cart={cart} cartBump={bump} />
          <HomeScreen scroll={scroll} tapIndex={0} tapP={tapP} />
          {frame >= T.detail ? <DetailScreen enter={detailIn} btnPress={addPress} flyP={flyP} /> : null}
          {frame >= T.checkout ? <CheckoutScreen enter={checkoutIn} frame={frame} t0={T.checkout} placeP={placeP} /> : null}
          {frame >= T.confirm ? <ConfirmScreen enter={confirmIn} frame={frame} start={T.confirm} /> : null}
          {flyP > 0 && flyP < 1 ? (
            <div style={{ position: "absolute", left: flyX - 120, top: flyY - 120, width: 240, height: 240, borderRadius: 30, overflow: "hidden", transform: `scale(${flyS})`, boxShadow: "0 20px 40px rgba(0,0,0,.25)" }}>
              <Img src={img(PRODUCTS[0].img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : null}
          <Finger x={fx} y={fy} press={press} show={show} />
          {/* dynamic island */}
          <div style={{ position: "absolute", left: PHONE.w / 2 - 14 - 70, top: 14, width: 140, height: 36, borderRadius: 18, background: "#000" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// cities floating around the phone while VO says "Pakistan"
const Cities: React.FC = () => {
  const frame = useCurrentFrame();
  const cities = [
    { n: "Karachi", x: 120, y: 520 }, { n: "Lahore", x: 760, y: 600 }, { n: "Islamabad", x: 90, y: 980 },
    { n: "Rawalpindi", x: 740, y: 1100 }, { n: "Faisalabad", x: 150, y: 1380 },
  ];
  const out = interpolate(frame, [v(5.3), v(5.7)], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {cities.map((c, i) => {
        const s = spring({ frame: frame - v(2.6) - i * 4, fps: FPS, config: { damping: 12, stiffness: 140 } });
        return (
          <div key={c.n} style={{ position: "absolute", left: c.x, top: c.y + Math.sin(frame / 20 + i) * 8, transform: `scale(${s})`, opacity: s, padding: "14px 24px", borderRadius: 30, background: G.white, boxShadow: "0 12px 30px rgba(23,61,46,.15)", fontFamily: INTER, fontWeight: 700, fontSize: 30, color: G.green, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: G.gold }} />{c.n}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// call + message confirmation bubbles
const ConfirmCall: React.FC = () => {
  const frame = useCurrentFrame();
  const a = spring({ frame: frame - v(11.1), fps: FPS, config: { damping: 14, stiffness: 140 } });
  const b = spring({ frame: frame - v(11.66), fps: FPS, config: { damping: 14, stiffness: 140 } });
  const out = interpolate(frame, [v(13.6), v(14.0)], [1, 0], clamp);
  const ring = Math.sin(frame / 2) * 6 * (frame < v(12.4) ? 1 : 0);
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: INTER }}>
      <div style={{ position: "absolute", left: 150, width: 780, top: 290, transform: `translateY(${(1 - a) * -200}px)`, opacity: a, borderRadius: 34, background: "rgba(255,255,255,.92)", boxShadow: "0 20px 50px rgba(15,36,27,.2)", padding: "24px 28px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 76, height: 76, borderRadius: 38, background: "#2FBF71", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, transform: `rotate(${ring}deg)` }}>📞</div>
        <div><div style={{ fontWeight: 800, fontSize: 30, color: G.green }}>Bazaar Retail</div><div style={{ fontWeight: 500, fontSize: 22, color: "rgba(23,61,46,.65)" }}>Order confirmation call…</div></div>
      </div>
      <div style={{ position: "absolute", left: 150, width: 780, top: 450, transform: `translateY(${(1 - b) * -200}px)`, opacity: b, borderRadius: 34, background: "rgba(255,255,255,.92)", boxShadow: "0 20px 50px rgba(15,36,27,.2)", padding: "24px 28px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 76, height: 76, borderRadius: 20, background: G.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💬</div>
        <div><div style={{ fontWeight: 800, fontSize: 30, color: G.green }}>Your order is confirmed ✓✓</div><div style={{ fontWeight: 500, fontSize: 22, color: "rgba(23,61,46,.65)" }}>Delivery in 3–7 days</div></div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ delivery scene
const Van: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
    <rect x="2" y="10" width="60" height="36" rx="6" fill={G.green} />
    <path d="M62 20 h20 l14 14 v12 h-34 z" fill={G.green2} />
    <rect x="68" y="24" width="14" height="10" rx="2" fill={G.cream} />
    <text x="32" y="33" textAnchor="middle" fontFamily="InterV" fontWeight="800" fontSize="11" fill={G.gold}>BR</text>
    <circle cx="20" cy="48" r="8" fill="#222" /><circle cx="20" cy="48" r="3" fill="#ccc" />
    <circle cx="78" cy="48" r="8" fill="#222" /><circle cx="78" cy="48" r="3" fill="#ccc" />
  </svg>
);

const Delivery: React.FC = () => {
  const frame = useCurrentFrame();
  const start = v(14.05), end = v(18.2);
  const inn = interpolate(frame, [start, start + 14], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [end - 10, end], [1, 0], clamp);
  const p = interpolate(frame, [start + 10, v(17.5)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  // route path points (quadratic curve)
  const P0 = { x: 200, y: 1250 }, P1 = { x: 540, y: 700 }, P2 = { x: 880, y: 1250 };
  const at = (t: number) => ({ x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x, y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y });
  const van = at(p);
  const days = interpolate(frame, [v(15.0), v(15.6)], [0, 1], { ...clamp, easing: ease });
  const door = interpolate(frame, [v(17.5), v(17.9)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: inn * out }}>
      <Headline text="پورے پاکستان میں ڈیلیوری" at={start} out={end} y={250} size={80} />
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`} fill="none" stroke="rgba(23,61,46,.18)" strokeWidth="14" strokeLinecap="round" />
        <path d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`} fill="none" stroke={G.gold} strokeWidth="14" strokeLinecap="round" strokeDasharray="1400" strokeDashoffset={1400 * (1 - p)} />
      </svg>
      {/* warehouse */}
      <div style={{ position: "absolute", left: P0.x - 80, top: P0.y - 40, width: 160, textAlign: "center", fontFamily: INTER }}>
        <div style={{ fontSize: 130 }}>🏬</div>
        <div style={{ fontWeight: 700, fontSize: 26, color: G.green }}>Bazaar Retail</div>
      </div>
      {/* home */}
      <div style={{ position: "absolute", left: P2.x - 80, top: P2.y - 40, width: 160, textAlign: "center", fontFamily: INTER, transform: `scale(${1 + door * 0.15})` }}>
        <div style={{ fontSize: 130 }}>🏡</div>
        <div style={{ fontWeight: 700, fontSize: 26, color: G.green }}>Your door</div>
      </div>
      <div style={{ position: "absolute", left: van.x - 140, top: van.y - 170, transform: `translateY(${Math.sin(frame / 3) * 3}px)` }}><Van size={280} /></div>
      {/* 3-7 days */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, textAlign: "center", opacity: days, transform: `scale(${0.8 + 0.2 * days})` }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 18, background: G.green, padding: "18px 48px", borderRadius: 40 }}>
          <span style={{ fontFamily: INTER, fontWeight: 900, fontSize: 96, color: G.gold, letterSpacing: -2 }}>3–7</span>
          <span style={{ fontFamily: URDU, fontSize: 64, color: G.cream }}>دن</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ COD scene
const Cod: React.FC = () => {
  const frame = useCurrentFrame();
  const start = v(18.2), end = v(22.05);
  const inn = interpolate(frame, [start, start + 12], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [end - 10, end], [1, 0], clamp);
  const box = spring({ frame: frame - start, fps: FPS, config: { damping: 12, stiffness: 110 } });
  const lid = interpolate(frame, [v(18.6), v(19.1)], [0, 1], { ...clamp, easing: ease });
  const check = spring({ frame: frame - v(19.16), fps: FPS, config: { damping: 10, stiffness: 200 } });
  const cash = spring({ frame: frame - v(20.0), fps: FPS, config: { damping: 11, stiffness: 150 } });
  const badge = spring({ frame: frame - v(20.6), fps: FPS, config: { damping: 11, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ opacity: inn * out }}>
      {/* parcel box */}
      <div style={{ position: "absolute", left: 540 - 200, top: 640 + (1 - box) * -600, width: 400, height: 320, perspective: 900 }}>
        <div style={{ position: "absolute", inset: 0, top: 60, background: "#C9A26B", borderRadius: 18, boxShadow: "0 40px 60px rgba(15,36,27,.25)" }}>
          <div style={{ position: "absolute", left: 180, top: 0, width: 40, height: "100%", background: "#B08852" }} />
          <div style={{ position: "absolute", left: 30, bottom: 26, padding: "6px 14px", background: G.cream, borderRadius: 8, fontFamily: INTER, fontWeight: 800, fontSize: 22, color: G.green }}>BAZAAR RETAIL</div>
        </div>
        <div style={{ position: "absolute", left: -10, right: -10, top: 30, height: 60, background: "#D8B27B", borderRadius: 14, transformOrigin: "50% 100%", transform: `rotateX(${-lid * 110}deg)`, boxShadow: "0 6px 12px rgba(0,0,0,.15)" }} />
        {/* inspect check */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 120, height: 120, borderRadius: 60, background: "#2FBF71", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, fontWeight: 900, fontFamily: INTER, transform: `scale(${check})`, boxShadow: "0 12px 30px rgba(47,191,113,.45)" }}>✓</div>
      </div>
      <Headline text="پہلے چیک کریں، پھر کیش دیں" at={v(18.3)} out={end} y={300} size={70} />
      {/* cash notes */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 540 - 170 + i * 30, top: 1080 + i * 14 + (1 - cash) * 300, width: 340, height: 160, borderRadius: 16, background: "linear-gradient(135deg, #2E8B57, #1F6B42)", border: "4px solid #A7D7B5", transform: `rotate(${-8 + i * 8}deg)`, opacity: cash, boxShadow: "0 16px 30px rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 900, fontSize: 48, color: "#E7F5EC" }}>Rs</div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center", transform: `scale(${badge})`, opacity: badge }}>
        <div style={{ display: "inline-block", background: G.green, color: G.cream, padding: "22px 46px", borderRadius: 40, fontFamily: INTER, fontWeight: 900, fontSize: 52, letterSpacing: 1, boxShadow: "0 20px 40px rgba(23,61,46,.35)" }}>CASH ON DELIVERY</div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ features scene
const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const start = v(22.0), end = v(25.85);
  const out = interpolate(frame, [end - 10, end], [1, 0], clamp);
  const cards = [
    { icon: "↩️", en: "Easy 7-Day Returns", ur: "سات دن میں آسان واپسی", at: v(22.1) },
    { icon: "💬", en: "24/7 Support", ur: "چوبیس گھنٹے سپورٹ", at: v(24.38) },
  ];
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {cards.map((c, i) => {
        const s = spring({ frame: frame - c.at, fps: FPS, config: { damping: 15, stiffness: 120 } });
        return (
          <div key={i} style={{ position: "absolute", left: 150, width: 780, top: 560 + i * 420, transform: `translateY(${(1 - s) * 160}px) rotateX(${(1 - s) * 30}deg)`, opacity: s, borderRadius: 44, background: G.white, boxShadow: "0 30px 70px rgba(15,36,27,.15)", padding: "44px 40px", display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ width: 130, height: 130, borderRadius: 34, background: G.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, flexShrink: 0 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: URDU, fontSize: 52, color: G.green, direction: "rtl", lineHeight: 1.9 }}>{c.ur}</div>
              <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 30, color: G.gold }}>{c.en}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ outro
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const start = v(25.8);
  const bg = interpolate(frame, [start, start + 16], [0, 1], { ...clamp, easing: ease });
  const logo = spring({ frame: frame - start - 4, fps: FPS, config: { damping: 13, stiffness: 110 } });
  const url = "bazaarretail.com";
  const typed = Math.max(0, Math.min(url.length, Math.floor((frame - start - 14) / 1.4)));
  const btn = spring({ frame: frame - v(27.46), fps: FPS, config: { damping: 10, stiffness: 160 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  const shine = interpolate(frame, [start + 20, start + 44], [-300, 1200], clamp);
  return (
    <AbsoluteFill style={{ opacity: bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${G.green2}, ${G.green} 70%)` }} />
      <div style={{ position: "absolute", left: 540 - 280, top: 520, width: 560, transform: `scale(${0.7 + 0.3 * logo})`, opacity: logo, overflow: "hidden" }}>
        <Img src={img("br_logo.png")} style={{ width: "100%" }} />
        <div style={{ position: "absolute", top: 0, left: shine, width: 120, height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)", transform: "skewX(-20deg)" }} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 58, letterSpacing: 10, color: G.cream, opacity: logo }}>BAZAAR RETAIL</div>
      <div style={{ position: "absolute", left: 150, right: 150, top: 1060, textAlign: "center" }}>
        <span style={{ display: "inline-block", padding: "16px 34px", borderRadius: 34, background: "rgba(245,241,230,.12)", border: `2px solid ${G.gold}`, fontFamily: INTER, fontWeight: 700, fontSize: 42, color: G.gold }}>
          🌐 {url.slice(0, typed)}{typed < url.length && Math.floor(frame / 8) % 2 === 0 ? "|" : ""}
        </span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, textAlign: "center", transform: `scale(${btn * pulse})`, opacity: btn }}>
        <span style={{ display: "inline-block", padding: "10px 60px 22px", borderRadius: 50, background: G.gold, fontFamily: URDU, fontSize: 64, color: G.green, boxShadow: "0 20px 40px rgba(0,0,0,.3)" }}>آج ہی آرڈر کریں</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1390, textAlign: "center", fontFamily: INTER, fontWeight: 600, fontSize: 28, color: "rgba(245,241,230,.75)", opacity: btn }}>Cash on Delivery · Delivery Across Pakistan</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ audio cues
const SFX: { at: number; s: string; vol: number }[] = [
  { at: 0.05, s: "riser", vol: 0.12 },
  { at: 0.75, s: "impact", vol: 0.16 },
  { at: 1.5, s: "ding", vol: 0.12 },
  { at: INTRO + 1.9, s: "whoosh", vol: 0.12 },
  ...[0, 1, 2, 3, 4].map((i) => ({ at: INTRO + 2.6 + i * 0.13, s: "pop", vol: 0.08 })),
  { at: INTRO + 6.9, s: "tick", vol: 0.12 },
  { at: INTRO + 7.2, s: "whoosh", vol: 0.1 },
  { at: INTRO + 7.82, s: "tick", vol: 0.14 },
  { at: INTRO + 8.35, s: "pop", vol: 0.16 },
  { at: INTRO + 8.9, s: "whoosh", vol: 0.1 },
  { at: INTRO + 10.55, s: "tick", vol: 0.14 },
  { at: INTRO + 10.9, s: "ding", vol: 0.16 },
  { at: INTRO + 11.1, s: "pop", vol: 0.14 },
  { at: INTRO + 11.66, s: "pop", vol: 0.14 },
  { at: INTRO + 14.05, s: "whoosh", vol: 0.12 },
  { at: INTRO + 15.0, s: "pop", vol: 0.14 },
  { at: INTRO + 17.5, s: "bell", vol: 0.14 },
  { at: INTRO + 18.2, s: "impact", vol: 0.12 },
  { at: INTRO + 19.16, s: "ding", vol: 0.14 },
  { at: INTRO + 20.6, s: "pop", vol: 0.16 },
  { at: INTRO + 22.1, s: "whoosh", vol: 0.1 },
  { at: INTRO + 24.38, s: "whoosh", vol: 0.1 },
  { at: INTRO + 25.3, s: "riser", vol: 0.1 },
  { at: INTRO + 25.85, s: "impact", vol: 0.14 },
  { at: INTRO + 27.46, s: "bell", vol: 0.14 },
];

export const BazaarPromo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: G.cream }}>
      <style dangerouslySetInnerHTML={{ __html: fontCSS }} />
      <Backdrop />
      <Sequence durationInFrames={v(2.2)}><LogoIntro /></Sequence>
      <Sequence from={v(1.6)} durationInFrames={v(15) - v(1.6)}><Headline text="پورے پاکستان میں آن لائن شاپنگ" at={v(1.9) - v(1.6)} out={v(5.4) - v(1.6)} y={200} size={58} /></Sequence>
      <Sequence from={v(1.6)} durationInFrames={v(15) - v(1.6)}><Headline text="بس چنیں اور ایڈ ٹو کارٹ" at={v(5.5) - v(1.6)} out={v(8.8) - v(1.6)} y={200} size={64} /></Sequence>
      <Sequence from={v(1.6)} durationInFrames={v(15) - v(1.6)}><Headline text="کال یا میسج پر کنفرمیشن" at={v(10.7) - v(1.6)} out={v(14.0) - v(1.6)} y={1500} size={64} /></Sequence>
      <Sequence from={0} durationInFrames={v(15)}><Cities /></Sequence>
      <Sequence from={0} durationInFrames={v(15)}><PhoneScene /></Sequence>
      <Sequence from={0} durationInFrames={v(14.1)}><ConfirmCall /></Sequence>
      <Sequence from={0} durationInFrames={v(18.3)}><Delivery /></Sequence>
      <Sequence from={0} durationInFrames={v(22.1)}><Cod /></Sequence>
      <Sequence from={0} durationInFrames={v(26)}><Features /></Sequence>
      <Sequence from={0}><Outro /></Sequence>
      <Sequence from={f(INTRO)}><Audio src={staticFile("bazaar/vo.wav")} /></Sequence>
      <Audio
        src={staticFile("bazaar/music.wav")}
        volume={(fr) => {
          const voice = fr > f(INTRO) && fr < v(28.9) ? 0.16 : 0.42; // duck under the voice
          return voice * interpolate(fr, [0, 6, durationInFrames - 40, durationInFrames], [0, 1, 1, 0], clamp);
        }}
      />
      {SFX.map((c, i) => (
        <Sequence key={i} from={f(c.at)}><Audio src={staticFile(`bazaar/sfx_${c.s}.wav`)} volume={c.vol} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
