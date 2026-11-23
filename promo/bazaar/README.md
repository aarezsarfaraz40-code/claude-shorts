# Bazaar Retail — intro reel

- Composition: `remotion/src/promo/BazaarPromo.tsx` (1080x1920, 34 s)
- Render: `node remotion/render_comp.mjs --comp BazaarPromo --out output/bazaar_retail_intro.mp4`
- Assets in `remotion/public/bazaar/` (logo, 5 product photos from bazaarretail.com,
  Urdu voiceover by ElevenLabs "Ahmad", original music from `make_music.py`, SFX)
- Brand: green #173D2E, cream #F5F1E6, gold #BF9F62; fonts Inter + Noto Nastaliq Urdu
- Facts from the website: Cash on Delivery, delivery across Pakistan in 3-7 days,
  easy 7-day returns, 24/7 AI support, order confirmed by call/message.

## Promo 2 — "Gift Smart" (Apple/olafmotion style, no voiceover)
- Composition: `remotion/src/promo/BazaarGifts.tsx` (1080x1920, 17 s, 120 BPM)
- Render: `node remotion/render_comp.mjs --comp BazaarGifts --out output/bazaar_gifts_promo.mp4`
- Uses `@remotion/motion-blur` (CameraMotionBlur, 6 samples), original music `music2.wav`

## Promo 2 v2 — smooth remake (60 fps)
- Composition: `remotion/src/promo/BazaarGifts2.tsx` (1080x1920, 60 fps, 17 s)
- Render: `node remotion/render_comp.mjs --comp BazaarGifts2 --out output/bazaar_gifts_promo_v2.mp4`
- One camera (true zoom-through into the icon), no hard cuts, camera never
  freezes, colors match across handovers. Music: `make_music2.py` (120 BPM,
  pumping, risers + impacts at 4.3 s and 14.6 s). Smoothness checked with a
  frame-difference test (no pops, no freezes > 0.33 s).
