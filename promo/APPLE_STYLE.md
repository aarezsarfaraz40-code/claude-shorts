# "Apple-style" motion graphics — what the owner means (apply to future promos)

Feedback on Bazaar Retail v1: fun and correct, but NOT Apple style. Missing:

- **Giant kinetic typography**: one or two huge words fill the screen, tight
  tracking, heavy weight, revealed with masks/slides, cut on the music beat.
- **Calm, premium motion**: smooth ease-in-out (no bouncy springs, no
  wobble), slow push-ins, parallax layers, depth of field / blur focus pulls.
- **Hero product shots**: product isolated on a clean black or white stage,
  slow 3D rotation, soft studio light, reflections, glowing gradient behind.
- **Mask & light transitions**: text revealed through masks, light sweeps,
  gradient glows, glassmorphism cards — no emojis, no cartoon icons.
- **Extreme close-ups** of UI details (a button, a price, a checkmark) instead
  of the whole phone all the time; camera "flies" into the screen.
- **Minimal palette**: mostly black/white + one brand accent; lots of empty space.
- **Rhythm**: every cut/reveal lands on a beat; music drives the edit.
- Ask the owner for a reference video before starting the next promo.

## Reference received: `promo/reference/where_are_we_going.mp4` (olafmotion style, 11 s)
Breakdown (THIS is the target look):
1. Light grey background (~#ECECF1), SF-Pro-like clean type, very few words.
2. **Match-cut morphs** — every scene grows out of the previous element:
   iOS app list scrolls (motion-blurred) → "Maps" picked → its icon lands
   **inline inside the headline** ("Let's Plan Your [icon] Adventure") →
   camera **zooms into the icon** → it becomes a blue circle → shrinks into a
   "Directions" pill button → the pill **expands into a card**.
3. **Strong motion blur** on every fast move (whip pans, card swaps).
4. Cards swap with slight 3D tilt while a **blue route line draws itself**.
5. Last card **zooms into a map**, pin + place label; quick logo end on black.
6. Fast, beat-driven, ~11-20 s; soft shadows, rounded iOS cards, no emojis.

Implementation notes (Remotion): install `@remotion/motion-blur` (same
version as remotion) for CameraMotionBlur/Trail; build morphs by animating
one element's size/radius/position/color across scenes instead of cutting.

## Smoothness checklist (learned from "Gift Smart" v1 → v2)
- Render at **60 fps**.
- Never hard-switch scenes: hand over only when both frames look identical
  (same color/shape/position). Start the next layer BEFORE the old one unmounts.
- Camera never freezes: during holds keep a slow push (≈+10-15%), drift,
  slight rotation/hover.
- In-out easing for moves; zoom-throughs ease out at the end so the last
  sliver of background doesn't vanish in one frame.
- Run the frame-difference test (no single-frame jump > ~35, no still run
  > 0.33 s) before sending.
