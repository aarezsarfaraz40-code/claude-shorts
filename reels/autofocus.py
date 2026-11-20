#!/usr/bin/env python3
"""Pick focusX for every clip in a reel spec so the character stays centered
in the full-screen 9:16 crop.

For each clip, samples frames from the trailer, finds the biggest face
(MediaPipe); if there is none, uses OpenCV saliency (the most "eye-catching"
area). Writes focusX (and focusTo when the subject moves) back into the spec.
Clips with "lockFocus": true are left alone.

Also writes a preview sheet (one crop per clip) so a human/Claude can check.

Usage:
    python3 reels/autofocus.py reels/specs/r01.json --assets reels/assets \
        --sheet /tmp/r01_focus.jpg
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts"))
from face_utils import FaceDetector  # noqa: E402


def grab(video, t, top, bottom, tmp):
    p = os.path.join(tmp, f"f_{t:.2f}.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", video,
                    "-frames:v", "1", "-vf", f"crop=iw:{bottom - top}:0:{top}", p],
                   capture_output=True)
    return cv2.imread(p)


def subject_x(img, det, sal):
    h, w = img.shape[:2]
    faces = [f for f in det.detect(img) if f["score"] >= 0.6]
    # tiles for smaller faces
    for x0 in (0, w // 3, 2 * w // 3):
        tile = img[:, x0:x0 + w // 3 + w // 6]
        for f in det.detect(tile):
            if f["score"] >= 0.6:
                faces.append({"x": (x0 + f["x"] * tile.shape[1]) / w, "w": f["w"] * tile.shape[1] / w,
                              "y": f["y"], "h": f["h"], "score": f["score"]})
    if faces:
        f = max(faces, key=lambda f: f["w"] * f["h"])
        return f["x"] + f["w"] / 2, "face"
    ok, m = sal.computeSaliency(img)
    if ok:
        m = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 15)
        col = m.sum(axis=0)
        col = col - col.min()
        if col.sum() > 0:
            # weight towards the center a little (cinematic framing)
            xs = np.arange(w) / w
            col = col * (1.0 - 0.6 * np.abs(xs - 0.5))
            return float((col * xs).sum() / col.sum()), "saliency"
    return 0.5, "center"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--assets", required=True)
    ap.add_argument("--sheet")
    a = ap.parse_args()
    spec = json.load(open(a.spec))
    src = spec.get("source", {"w": 1280, "h": 720, "top": 92, "bottom": 628})
    video = os.path.join(a.assets, spec["trailer"])
    vis = (1080 / 1920) * (src["bottom"] - src["top"]) / src["w"]  # visible width fraction
    lo, hi = vis / 2, 1 - vis / 2
    det = FaceDetector(min_confidence=0.5)
    sal = cv2.saliency.StaticSaliencySpectralResidual_create()
    tmp = tempfile.mkdtemp()
    tiles = []
    for c in spec["clips"]:
        dur = c["to"] - c["from"]
        if c.get("lockFocus"):
            xs = [c.get("focusX", 0.5), c.get("focusTo", c.get("focusX", 0.5))]
            how = "locked"
        else:
            xs, hows = [], []
            for frac in (0.15, 0.85):
                img = grab(video, c["src"] + dur * frac, src["top"], src["bottom"], tmp)
                if img is None:
                    continue
                x, how = subject_x(img, det, sal)
                xs.append(x)
                hows.append(how)
            if not xs:
                continue
            how = "/".join(hows)
            xs = [min(hi, max(lo, x)) for x in xs]
            if abs(xs[0] - xs[1]) < 0.06:
                m = sum(xs) / 2
                xs = [m, m]
            c["focusX"], c["focusTo"] = round(xs[0], 3), round(xs[1], 3)
        print(f"clip {c['from']:5.1f}-{c['to']:5.1f} src {c['src']:6.1f}: focus {xs[0]:.2f}->{xs[1]:.2f} ({how})")
        if a.sheet:
            img = grab(video, c["src"] + dur * 0.5, src["top"], src["bottom"], tmp)
            if img is not None:
                h, w = img.shape[:2]
                cw = int(vis * w)
                fx = (xs[0] + xs[1]) / 2
                x0 = int(min(w - cw, max(0, fx * w - cw / 2)))
                crop = cv2.resize(img[:, x0:x0 + cw], (180, 320))
                cv2.putText(crop, f"{c['from']:.0f}s", (6, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                tiles.append(crop)
    det.close()
    json.dump(spec, open(a.spec, "w"), indent=1, ensure_ascii=False)
    if a.sheet and tiles:
        cv2.imwrite(a.sheet, np.hstack(tiles))


if __name__ == "__main__":
    main()
