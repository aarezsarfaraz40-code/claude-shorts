# GTA HIGHEST — Reel Rules (follow for EVERY reel)

Channel: **GTA HIGHEST** (gaming news, GTA 6). Owner is non-technical — talk in
simple Roman Urdu, ask at most ONE simple question at a time.

## Content
- Scripts: `reels/SCRIPTS.md` (10 scripts). Follow each script's beats, hooks,
  graphics and on-screen text. Facts marked ⚠️ must show an on-screen stamp
  ("ESTIMATE", "FAN THEORY", "NOT CONFIRMED").
- Language: **English** voiceover + English on-screen text.
- Length: **~40 seconds** (35-45 s). Voiceover ~95-105 words.
- The voiceover ALWAYS ends with: **"Follow GTA Highest for more updates."**
- Source footage: GTA VI Trailer 2 (`reels/assets/trailer.mp4`), short
  2-4 s shots only. Every shot must show a character/action (check the focus
  sheet; swap shots that show empty rooms, black frames, or the Rockstar logo).

## Voice
- ElevenLabs, voice **"Liam - Viral Short-Form Storyteller"**
  (`VCgLBmBjldJmfphyB8sZ`), model `eleven_v4`, start the prompt with `[excited]`.
- Download → `reels/assets/vo/rNN.wav`, normalize:
  `ffmpeg -i in -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 rNN.wav`.
- Word timings: `scripts/transcribe.py rNN.wav --model small` → captions
  (fix any misheard words; keep timings).

## Video look (template: `remotion/src/reel/GtaReel.tsx`)
- 1080x1920, trailer **fills the whole screen** (cover crop, sides cut —
  option "A"). Run `reels/autofocus.py` so the character stays centered; then
  LOOK at the focus sheet and fix bad shots.
- **All text in Montserrat 900**, revealed **word by word** (hooks, captions,
  end card). Highlight words = black text on a tilted yellow box.
- **Everything inside the safe zone**: x 60–900, y 250–1440 (nothing under
  the platform's buttons/caption area). Template already enforces this —
  don't add custom positions outside it.
- Motion graphics: counters, versus cards, badges, bar charts, timelines,
  polls, stamps, big numbers, flash + zoom-punch cuts. Keep the purple/pink/
  orange Vice City theme.
- Logo: `reels/brand/logo.jpg` (copy to `reels/assets/logo.jpg`), top-left
  corner (inside safe zone) + big on the end card.
- NO tag pill next to the logo (`"tag": ""`).
- End card (last ~5 s): "FOLLOW GTA HIGHEST" + "DAILY GTA 6 NEWS 🔔".

## Audio mix
- Voiceover at -14 LUFS (normalized file, volume 1).
- Background music: GTA San Andreas theme (`reels/assets/music_sa.wav`),
  **cropped to start at the beat**:
  `"music": {"file": "music_sa.wav", "volume": 0.13, "startAt": 6.35}`
  (~14 dB under the voice, fades out at the end). ⚠️ Rockstar-owned song: may get a
  YouTube copyright claim (revenue goes to Rockstar) — owner accepted.
- SFX: always run `python3 reels/sfx_auto.py reels/specs/rNN.json` after the
  overlays are final. It places whoosh (cuts), pop (headlines, poll), riser +
  ticks + ding (counters), impact (badges, VS stamp, big numbers), glitch
  (stamps), ticks (bars/timeline), riser + bell (end card). All SFX are
  peak-normalized and kept **quiet** (volumes 0.06-0.16).

## Render + deliver
```bash
node remotion/render_reel.mjs --spec reels/specs/rNN.json \
    --assets-dir reels/assets --out output/reel_NN_<topic>.mp4
```
Check a frame strip (safe zone box drawn) before sending. Send the finished
MP4 to the owner as a download card. Commit specs/code to the branch.

## SEO pack (for EVERY reel)
Write `reels/seo/rNN.md` (template: `reels/seo/r01.md`) and give it to the
owner with the video:
- YouTube Shorts title (< 70 chars, keyword first, emoji, `#Shorts`) + 2 backup titles
- Description: hook line, 2-3 keyword-rich sentences with facts, question CTA,
  "Follow GTA HIGHEST for daily GTA 6 news", sources, Rockstar footage credit,
  8-10 hashtags (#GTA6 #GTAVI #GTA6News #Shorts first)
- Tags: ~20-25 comma-separated keywords (under 500 characters), always include
  gta 6, gta vi, gta 6 news, grand theft auto 6, rockstar games, gta highest
- Instagram/TikTok caption + hashtags
