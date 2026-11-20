#!/usr/bin/env bash
# Setup dependencies for claude-shorts
# Usage: bash setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== claude-shorts dependency setup ==="
echo ""

# --- Python Virtual Environment ---

# Check if shared venv exists (from claude-video)
VENV=""
if [ -d "$HOME/.video-skill" ]; then
    VENV="$HOME/.video-skill"
    echo "[Python] Found shared venv at ~/.video-skill"

    # Check if faster-whisper is already installed
    if "$VENV/bin/python3" -c "import faster_whisper" 2>/dev/null; then
        echo "[Python] faster-whisper already installed — skipping Python setup"
    else
        echo "[Python] Installing faster-whisper into shared venv..."
        "$VENV/bin/pip" install --quiet faster-whisper
    fi

    # Check mediapipe
    if ! "$VENV/bin/python3" -c "import mediapipe" 2>/dev/null; then
        echo "[Python] Installing mediapipe..."
        "$VENV/bin/pip" install --quiet mediapipe
    fi

    # Check opencv
    if ! "$VENV/bin/python3" -c "import cv2" 2>/dev/null; then
        echo "[Python] Installing opencv-python..."
        "$VENV/bin/pip" install --quiet opencv-python
    fi

    # PyAV 17+ breaks faster-whisper's audio decoding
    "$VENV/bin/pip" install --quiet "av>=14,<17"
else
    VENV="$HOME/.shorts-skill"
    if [ -d "$VENV" ]; then
        echo "[Python] Found venv at ~/.shorts-skill"
    else
        echo "[Python] Creating venv at ~/.shorts-skill..."
        python3 -m venv "$VENV"
    fi

    echo "[Python] Installing dependencies..."
    "$VENV/bin/pip" install --quiet --upgrade pip

    # PyTorch is optional: faster-whisper runs on CTranslate2 and does not need it.
    # Only install it when an NVIDIA GPU is present (used for CUDA detection).
    if command -v nvidia-smi &>/dev/null; then
        echo "[Python] NVIDIA GPU detected — installing PyTorch with CUDA (optional)..."
        "$VENV/bin/pip" install --quiet torch torchvision torchaudio \
            --index-url https://download.pytorch.org/whl/cu128 \
            || echo "[Python] WARNING: PyTorch install failed — continuing (not required)"
    else
        echo "[Python] No NVIDIA GPU — skipping PyTorch (not required, CPU mode)"
    fi

    echo "[Python] Installing faster-whisper, mediapipe, numpy, opencv..."
    "$VENV/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"
fi

echo "[Python] Venv ready: $VENV"
echo ""

# --- Node.js / Remotion ---

echo "[Node] Setting up Remotion project..."

if [ ! -f "$SCRIPT_DIR/remotion/package.json" ]; then
    echo "[Node] ERROR: remotion/package.json not found"
    echo "       Run this script from the claude-shorts project root"
    exit 1
fi

cd "$SCRIPT_DIR/remotion"

if [ -d "node_modules" ]; then
    echo "[Node] node_modules exists — running npm install to check for updates..."
else
    echo "[Node] Installing Remotion dependencies..."
fi

npm install --silent 2>&1 | tail -1 || npm install

echo "[Node] Remotion ready"
echo ""

# --- System Dependencies ---

MISSING=()

if ! command -v ffmpeg &>/dev/null; then
    MISSING+=("ffmpeg")
fi

if ! command -v jq &>/dev/null; then
    MISSING+=("jq")
fi

# MediaPipe (new versions) needs EGL/GLES libraries even on CPU
if ! ldconfig -p 2>/dev/null | grep -q "libEGL.so.1"; then
    MISSING+=("libegl1" "libgles2")
fi

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "[System] Missing packages: ${MISSING[*]}"
    echo "[System] Install with: sudo apt install ${MISSING[*]}"
else
    echo "[System] All system dependencies present (ffmpeg, jq)"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "Python venv: $VENV"
echo "Remotion:    $SCRIPT_DIR/remotion/"
echo ""
echo "To use: invoke /shorts in Claude Code"
