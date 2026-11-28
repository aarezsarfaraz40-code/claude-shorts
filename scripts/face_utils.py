#!/usr/bin/env python3
"""Face detection that works across MediaPipe versions.

Newer MediaPipe releases dropped the legacy ``mp.solutions`` API, which the
original scripts relied on. This module tries, in order:

1. ``mp.solutions.face_detection`` (old MediaPipe)
2. ``mp.tasks.vision.FaceDetector`` (new MediaPipe; model downloaded once)
3. OpenCV Haar cascade (always available, bundled with opencv-python)

Usage:
    from face_utils import FaceDetector
    det = FaceDetector()
    faces = det.detect(bgr_image)   # [{"x","y","w","h","score"}] normalized 0-1
    det.close()
"""
import os
import urllib.request

MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_detector/"
    "blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
)
MODEL_DIR = os.path.expanduser(os.environ.get("SHORTS_MODELS", "~/.shorts-skill/models"))


def _model_path():
    path = os.path.join(MODEL_DIR, "blaze_face_short_range.tflite")
    if not os.path.exists(path):
        os.makedirs(MODEL_DIR, exist_ok=True)
        tmp = path + ".part"
        urllib.request.urlretrieve(MODEL_URL, tmp)
        os.replace(tmp, path)
    return path


class FaceDetector:
    def __init__(self, min_confidence=0.5):
        self.backend = None
        self._impl = None
        self.min_confidence = min_confidence
        try:
            import mediapipe as mp
            if hasattr(mp, "solutions"):
                self._impl = mp.solutions.face_detection.FaceDetection(
                    model_selection=1, min_detection_confidence=min_confidence)
                self.backend = "mediapipe-solutions"
            else:
                from mediapipe.tasks.python import BaseOptions
                from mediapipe.tasks.python import vision
                opts = vision.FaceDetectorOptions(
                    base_options=BaseOptions(model_asset_path=_model_path()),
                    min_detection_confidence=min_confidence)
                self._impl = vision.FaceDetector.create_from_options(opts)
                self._mp = mp
                self.backend = "mediapipe-tasks"
        except Exception:
            self._impl = None
        if self._impl is None:
            import cv2
            self._impl = cv2.CascadeClassifier(
                os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
            self.backend = "opencv-haar"

    def detect(self, bgr):
        import cv2
        h, w = bgr.shape[:2]
        faces = []
        if self.backend == "mediapipe-solutions":
            res = self._impl.process(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
            for d in res.detections or []:
                b = d.location_data.relative_bounding_box
                faces.append({"x": b.xmin, "y": b.ymin, "w": b.width, "h": b.height,
                              "score": float(d.score[0]) if d.score else 1.0})
        elif self.backend == "mediapipe-tasks":
            img = self._mp.Image(image_format=self._mp.ImageFormat.SRGB,
                                 data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
            res = self._impl.detect(img)
            for d in res.detections:
                b = d.bounding_box
                faces.append({"x": b.origin_x / w, "y": b.origin_y / h,
                              "w": b.width / w, "h": b.height / h,
                              "score": float(d.categories[0].score) if d.categories else 1.0})
        else:
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            for (x, y, fw, fh) in self._impl.detectMultiScale(gray, 1.1, 6, minSize=(24, 24)):
                faces.append({"x": x / w, "y": y / h, "w": fw / w, "h": fh / h, "score": 1.0})
        # Clamp to frame
        out = []
        for f in faces:
            x0, y0 = max(0.0, f["x"]), max(0.0, f["y"])
            x1, y1 = min(1.0, f["x"] + f["w"]), min(1.0, f["y"] + f["h"])
            if x1 > x0 and y1 > y0:
                out.append({"x": float(x0), "y": float(y0), "w": float(x1 - x0),
                            "h": float(y1 - y0), "score": float(f["score"])})
        return out

    def close(self):
        if hasattr(self._impl, "close"):
            self._impl.close()
