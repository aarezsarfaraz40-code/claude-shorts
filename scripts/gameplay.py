#!/usr/bin/env python3
"""Gameplay helpers: facecam detection/removal, action highlights, safety check.

Subcommands:

  facecam     Find a streamer facecam (a real face that stays in the same spot).
      python3 gameplay.py facecam INPUT --output facecam.json [--box x,y,w,h]

  highlights  Per-second loudness + scene-cut activity, and the best 20-45s windows.
      python3 gameplay.py highlights INPUT --output highlights.json

  extract     Cut clips with frame-accurate re-encode and the facecam blurred out.
      python3 gameplay.py extract INPUT --segments snapped.json \
          --facecam facecam.json --clips-dir DIR

  verify      Check finished shorts for any leftover facecam + make contact sheets.
      python3 gameplay.py verify --dir output/ [--sheets-dir DIR]

All coordinates in facecam.json are normalized (0-1) to the source frame.
"""
import argparse
import glob
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ----------------------------------------------------------------- helpers

def probe(path):
    r = subprocess.run(["ffprobe", "-v", "quiet", "-print_format", "json",
                        "-show_streams", "-show_format", path],
                       capture_output=True, text=True)
    d = json.loads(r.stdout or "{}")
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), None)
    a = next((s for s in d.get("streams", []) if s.get("codec_type") == "audio"), None)
    if not v:
        raise SystemExit(json.dumps({"error": f"No video stream in {path}"}))
    return {"w": int(v["width"]), "h": int(v["height"]),
            "duration": float(d.get("format", {}).get("duration", 0) or 0),
            "has_audio": a is not None}


def sample_frames(path, count, max_width=1920):
    """Extract `count` evenly spaced frames. Returns (list of (t, bgr), tmpdir)."""
    import cv2
    info = probe(path)
    dur = max(info["duration"], 0.1)
    tmp = tempfile.mkdtemp(prefix="gameplay_")
    rate = count / dur
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vf",
                    f"fps={rate:.6f},scale='min({max_width},iw)':-2",
                    "-q:v", "3", os.path.join(tmp, "f_%05d.jpg")],
                   capture_output=True)
    frames = []
    for i, fp in enumerate(sorted(glob.glob(os.path.join(tmp, "f_*.jpg")))):
        img = cv2.imread(fp)
        if img is not None:
            frames.append(((i + 0.5) / rate, img))
    shutil.rmtree(tmp, ignore_errors=True)
    return frames


def iou(a, b):
    x0, y0 = max(a["x"], b["x"]), max(a["y"], b["y"])
    x1 = min(a["x"] + a["w"], b["x"] + b["w"])
    y1 = min(a["y"] + a["h"], b["y"] + b["h"])
    inter = max(0, x1 - x0) * max(0, y1 - y0)
    union = a["w"] * a["h"] + b["w"] * b["h"] - inter
    return inter / union if union > 0 else 0


def detect_faces_tiled(detector, img):
    """Detect faces on the full frame AND on overlapping tiles.

    Facecam faces are small relative to a 1080p frame; the face model
    downsizes its input, so tiles make small faces detectable.
    """
    h, w = img.shape[:2]
    found = list(detector.detect(img))
    tw, th = w // 3, h // 3
    for gy in range(5):
        for gx in range(5):
            x0, y0 = gx * tw // 2, gy * th // 2
            tile = img[y0:y0 + th, x0:x0 + tw]
            if tile.shape[0] < 32 or tile.shape[1] < 32:
                continue
            for f in detector.detect(tile):
                found.append({"x": (x0 + f["x"] * tile.shape[1]) / w,
                              "y": (y0 + f["y"] * tile.shape[0]) / h,
                              "w": f["w"] * tile.shape[1] / w,
                              "h": f["h"] * tile.shape[0] / h,
                              "score": f["score"]})
    # Non-max suppression
    found.sort(key=lambda f: -f["score"])
    keep = []
    for f in found:
        if all(iou(f, k) < 0.3 for k in keep):
            keep.append(f)
    return keep


def cluster_static_faces(per_frame, n_frames, min_freq=0.2, max_spread=0.04, min_score=0.75):
    """Group detections that stay in the same place across frames."""
    clusters = []
    for fi, faces in enumerate(per_frame):
        for f in faces:
            cx, cy = f["x"] + f["w"] / 2, f["y"] + f["h"] / 2
            best = None
            for c in clusters:
                if math.hypot(cx - c["cx"], cy - c["cy"]) < max(0.06, c["fw"]):
                    best = c
                    break
            if best is None:
                best = {"cx": cx, "cy": cy, "fw": f["w"], "items": []}
                clusters.append(best)
            best["items"].append((fi, f))
            n = len(best["items"])
            best["cx"] += (cx - best["cx"]) / n
            best["cy"] += (cy - best["cy"]) / n
            best["fw"] += (f["w"] - best["fw"]) / n
    result = []
    for c in clusters:
        frames_hit = len({fi for fi, _ in c["items"]})
        freq = frames_hit / max(n_frames, 1)
        xs = [f["x"] + f["w"] / 2 for _, f in c["items"]]
        ys = [f["y"] + f["h"] / 2 for _, f in c["items"]]
        spread = max(_std(xs), _std(ys))
        score = sum(f["score"] for _, f in c["items"]) / len(c["items"])
        result.append({"freq": round(freq, 3), "spread": round(spread, 4),
                       "mean_score": round(score, 3),
                       "face": _union([f for _, f in c["items"]]),
                       "static": freq >= min_freq and spread <= max_spread
                                 and score >= min_score})
    return result


def _std(v):
    if len(v) < 2:
        return 0.0
    m = sum(v) / len(v)
    return math.sqrt(sum((x - m) ** 2 for x in v) / len(v))


def _union(faces):
    # Robust union: use 10th/90th percentiles to ignore outliers
    def pct(vals, p):
        vals = sorted(vals)
        return vals[min(len(vals) - 1, max(0, int(round(p * (len(vals) - 1)))))]
    x0 = pct([f["x"] for f in faces], 0.1)
    y0 = pct([f["y"] for f in faces], 0.1)
    x1 = pct([f["x"] + f["w"] for f in faces], 0.9)
    y1 = pct([f["y"] + f["h"] for f in faces], 0.9)
    return {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}


def facecam_box_from_face(face, aspect):
    """Grow a face box into an estimate of the whole facecam window.

    `aspect` = frame width / frame height, so boxes stay sensible on
    non-16:9 sources. Boxes within 10% of a frame edge are snapped to it,
    since facecams almost always sit against an edge or corner.
    """
    cx, cy = face["x"] + face["w"] / 2, face["y"] + face["h"] / 2
    bw = face["w"] * 3.2
    bh = face["h"] * 2.8
    bw = max(bw, bh / aspect * 1.0)
    x0, y0 = cx - bw / 2, cy - bh * 0.45
    x1, y1 = x0 + bw, y0 + bh
    snap = 0.10
    if x0 < snap:
        x0 = 0.0
    if y0 < snap:
        y0 = 0.0
    if 1 - x1 < snap:
        x1 = 1.0
    if 1 - y1 < snap:
        y1 = 1.0
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(1, x1), min(1, y1)
    return {"x": round(x0, 4), "y": round(y0, 4),
            "w": round(x1 - x0, 4), "h": round(y1 - y0, 4)}


def center_crop_norm(w, h):
    cw = min(1.0, (h * 9 / 16) / w)
    return {"x": (1 - cw) / 2, "y": 0.0, "w": cw, "h": 1.0}


# ----------------------------------------------------------------- facecam

def cmd_facecam(args):
    from face_utils import FaceDetector
    info = probe(args.input)
    out = {"source_resolution": f"{info['w']}x{info['h']}", "boxes": [],
           "method": "manual" if args.box else "auto"}

    if args.box:
        for spec in args.box:
            x, y, w, h = [float(v) for v in spec.split(",")]
            out["boxes"].append({"x": x, "y": y, "w": w, "h": h, "source": "manual"})
    else:
        frames = sample_frames(args.input, args.frames)
        det = FaceDetector(min_confidence=args.min_confidence)
        per_frame = [detect_faces_tiled(det, img) for _, img in frames]
        out["detector"] = det.backend
        det.close()
        clusters = cluster_static_faces(per_frame, len(frames), min_freq=args.min_freq,
                                        min_score=args.min_score)
        out["frames_sampled"] = len(frames)
        out["face_clusters"] = clusters
        aspect = info["w"] / info["h"]
        for c in clusters:
            if c["static"]:
                box = facecam_box_from_face(c["face"], aspect)
                box.update({"source": "auto", "freq": c["freq"]})
                out["boxes"].append(box)

    crop = center_crop_norm(info["w"], info["h"])
    for b in out["boxes"]:
        b["overlaps_center_crop"] = iou(b, crop) > 0 or (
            b["x"] < crop["x"] + crop["w"] and b["x"] + b["w"] > crop["x"])
    out["facecam_found"] = bool(out["boxes"])

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(out, f, indent=2)
    summary = {k: v for k, v in out.items() if k != "face_clusters"}
    print(json.dumps(summary, indent=2))


# ----------------------------------------------------------------- highlights

def per_second_loudness(path, duration):
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-vn", "-af",
         "aresample=8000,asetnsamples=n=8000,astats=metadata=1:reset=1,"
         "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
         "-f", "null", "-"], capture_output=True, text=True)
    vals = []
    for line in r.stdout.splitlines():
        if "RMS_level=" in line:
            v = line.split("=", 1)[1].strip()
            try:
                x = float(v)
            except ValueError:
                x = -90.0
            vals.append(max(-90.0, x if math.isfinite(x) else -90.0))
    n = int(math.ceil(duration))
    vals = (vals + [-90.0] * n)[:n]
    return vals


def per_second_scene_cuts(path, duration, threshold=0.3):
    r = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-an", "-vf",
         f"fps=6,scale=320:-2,select='gt(scene,{threshold})',showinfo",
         "-f", "null", "-"], capture_output=True, text=True)
    n = int(math.ceil(duration))
    cuts = [0] * max(n, 1)
    for line in r.stderr.splitlines():
        if "pts_time:" in line:
            try:
                t = float(line.split("pts_time:")[1].split()[0])
                cuts[min(int(t), len(cuts) - 1)] += 1
            except (ValueError, IndexError):
                pass
    return cuts


def cmd_highlights(args):
    info = probe(args.input)
    dur = info["duration"]
    loud = per_second_loudness(args.input, dur) if info["has_audio"] else [-90.0] * int(math.ceil(dur))
    cuts = per_second_scene_cuts(args.input, dur)
    n = min(len(loud), len(cuts))
    loud, cuts = loud[:n], cuts[:n]

    # Normalize loudness to 0-1 using the video's own range
    lo = sorted(loud)[int(0.05 * (n - 1))] if n else -90
    hi = sorted(loud)[int(0.98 * (n - 1))] if n else 0
    span = max(hi - lo, 1e-6)
    lnorm = [min(1, max(0, (v - lo) / span)) for v in loud]
    cmax = max(max(cuts) if cuts else 1, 1)
    cnorm = [min(1, c / cmax) for c in cuts]
    activity = [0.65 * a + 0.35 * b for a, b in zip(lnorm, cnorm)]

    # Sliding windows: score = mean activity + bonus for a strong peak
    windows = []
    for length in range(args.min_dur, args.max_dur + 1, 5):
        for s in range(0, max(1, n - length + 1), 2):
            seg = activity[s:s + length]
            if not seg:
                continue
            mean = sum(seg) / len(seg)
            peak = max(seg)
            early = max(seg[:5]) if seg else 0  # strong opening = better hook
            score = 100 * (0.55 * mean + 0.25 * peak + 0.20 * early)
            windows.append({"start": s, "end": s + length, "action_score": round(score, 1),
                            "peak_at": s + seg.index(peak)})
    windows.sort(key=lambda w: -w["action_score"])
    picked = []
    for w in windows:
        if all(w["end"] <= p["start"] or w["start"] >= p["end"] for p in picked):
            picked.append(w)
        if len(picked) >= args.top:
            break
    picked.sort(key=lambda w: w["start"])

    out = {"duration": round(dur, 2), "seconds": n,
           "loudness_db": [round(v, 1) for v in loud],
           "scene_cuts": cuts,
           "activity": [round(v, 3) for v in activity],
           "top_windows": picked}
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(out, f)
    print(json.dumps({"action": "highlights", "duration": out["duration"],
                      "top_windows": picked}, indent=2))


# ----------------------------------------------------------------- extract

def mask_filter(boxes, w, h):
    """FFmpeg filtergraph that heavily pixelates + blurs every facecam box."""
    if not boxes:
        return None
    parts = []
    last = "0:v"
    for i, b in enumerate(boxes):
        x = int(b["x"] * w) // 2 * 2
        y = int(b["y"] * h) // 2 * 2
        bw = max(16, int(math.ceil(b["w"] * w / 2)) * 2)
        bh = max(16, int(math.ceil(b["h"] * h / 2)) * 2)
        bw, bh = min(bw, w - x), min(bh, h - y)
        cols = max(2, bw // 120)
        sigma = max(10, min(bw, bh) // 6)
        parts.append(f"[{last}]split[b{i}][t{i}]")
        parts.append(f"[t{i}]crop={bw}:{bh}:{x}:{y},scale={cols}:-2:flags=area,"
                     f"scale={bw}:{bh}:flags=neighbor,gblur=sigma={sigma},"
                     f"eq=brightness=-0.15[m{i}]")
        nxt = f"v{i}"
        parts.append(f"[b{i}][m{i}]overlay={x}:{y}[{nxt}]")
        last = nxt
    return ";".join(parts), f"[{last}]"


def cmd_extract(args):
    info = probe(args.input)
    with open(args.segments) as f:
        segs = json.load(f)["segments"]
    boxes = []
    if args.facecam and os.path.exists(args.facecam):
        with open(args.facecam) as f:
            boxes = json.load(f).get("boxes", [])
    os.makedirs(args.clips_dir, exist_ok=True)
    mf = mask_filter(boxes, info["w"], info["h"])
    results = []
    for i, seg in enumerate(segs):
        sid = seg.get("id", i + 1)
        out = os.path.join(args.clips_dir, f"clip_{int(sid):02d}.mp4")
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{seg['start']:.3f}",
               "-to", f"{seg['end']:.3f}", "-i", args.input]
        if mf:
            graph, label = mf
            cmd += ["-filter_complex", graph, "-map", label, "-map", "0:a?"]
        cmd += ["-c:v", "libx264", "-preset", args.preset, "-crf", "16",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                "-movflags", "+faststart", out]
        r = subprocess.run(cmd, capture_output=True, text=True)
        ok = r.returncode == 0 and os.path.exists(out)
        results.append({"clip": os.path.basename(out), "ok": ok,
                        "start": seg["start"], "end": seg["end"],
                        "facecam_masked": bool(mf),
                        **({} if ok else {"error": r.stderr[-400:]})})
    print(json.dumps({"action": "extract", "facecam_boxes": len(boxes),
                      "clips": results}, indent=2))
    if not all(r["ok"] for r in results):
        sys.exit(1)


# ----------------------------------------------------------------- verify

def cmd_verify(args):
    from face_utils import FaceDetector
    files = sorted(glob.glob(os.path.join(args.dir, "*.mp4")))
    if not files:
        raise SystemExit(json.dumps({"error": f"No mp4 files in {args.dir}"}))
    sheets = args.sheets_dir or os.path.join(args.dir, "_checks")
    os.makedirs(sheets, exist_ok=True)
    det = FaceDetector(min_confidence=args.min_confidence)
    report = []
    for fp in files:
        info = probe(fp)
        n = max(6, int(info["duration"]))
        frames = sample_frames(fp, n, max_width=1080)
        per_frame = [detect_faces_tiled(det, img) for _, img in frames]
        clusters = cluster_static_faces(per_frame, len(frames), min_freq=0.3,
                                        min_score=0.7)
        static = [c for c in clusters if c["static"]]
        sheet = os.path.join(sheets, os.path.splitext(os.path.basename(fp))[0] + "_sheet.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fp, "-vf",
                        f"fps=8/{max(info['duration'], 1):.3f},scale=270:-2,tile=8x1",
                        "-frames:v", "1", sheet], capture_output=True)
        report.append({"file": os.path.basename(fp),
                       "resolution": f"{info['w']}x{info['h']}",
                       "duration": round(info["duration"], 1),
                       "frames_checked": len(frames),
                       "frames_with_any_face": sum(1 for p in per_frame if p),
                       "static_face_regions": static,
                       "facecam_suspected": bool(static),
                       "contact_sheet": sheet})
    det.close()
    passed = not any(r["facecam_suspected"] for r in report)
    print(json.dumps({"action": "verify", "pass": passed, "files": report}, indent=2))
    if not passed:
        sys.exit(2)


# ----------------------------------------------------------------- main

def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("facecam")
    a.add_argument("input")
    a.add_argument("--output", required=True)
    a.add_argument("--frames", type=int, default=48)
    a.add_argument("--min-freq", type=float, default=0.2,
                   help="Fraction of sampled frames a face must appear in, same spot")
    a.add_argument("--min-confidence", type=float, default=0.5)
    a.add_argument("--min-score", type=float, default=0.75,
                   help="Average detector confidence a facecam face must reach")
    a.add_argument("--box", action="append",
                   help="Manual facecam box x,y,w,h (normalized 0-1). Repeatable.")

    a = sub.add_parser("highlights")
    a.add_argument("input")
    a.add_argument("--output", required=True)
    a.add_argument("--min-dur", type=int, default=20)
    a.add_argument("--max-dur", type=int, default=45)
    a.add_argument("--top", type=int, default=12)

    a = sub.add_parser("extract")
    a.add_argument("input")
    a.add_argument("--segments", required=True)
    a.add_argument("--facecam")
    a.add_argument("--clips-dir", required=True)
    a.add_argument("--preset", default="veryfast")

    a = sub.add_parser("verify")
    a.add_argument("--dir", required=True)
    a.add_argument("--sheets-dir")
    a.add_argument("--min-confidence", type=float, default=0.6)

    args = p.parse_args()
    {"facecam": cmd_facecam, "highlights": cmd_highlights,
     "extract": cmd_extract, "verify": cmd_verify}[args.cmd](args)


if __name__ == "__main__":
    main()
