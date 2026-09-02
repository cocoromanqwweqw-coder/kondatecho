#!/usr/bin/env python3
"""Regenerate PNG home-screen icons from public/pwa-icon.svg."""

import base64
import io
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public"
SVG = ROOT / "pwa-icon.svg"


def main() -> None:
    svg = SVG.read_text()
    match = re.search(r'href="data:image/png;base64,([^"]+)"', svg)
    if not match:
        raise SystemExit(f"embedded png not found in {SVG}")

    bowl = Image.open(io.BytesIO(base64.b64decode(match.group(1)))).convert("RGBA")
    img = Image.new("RGB", (512, 512), "#ffffff")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([26, 26, 486, 486], radius=90, outline="#000000", width=10)

    bowl_resized = bowl.resize((384, 384), Image.Resampling.LANCZOS)
    img.paste(bowl_resized, (64, 64), bowl_resized)

    img.save(ROOT / "pwa-icon-512.png", optimize=True)
    img.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "pwa-icon-192.png", optimize=True)
    img.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / "apple-touch-icon.png", optimize=True)
    print("wrote pwa-icon-512.png, pwa-icon-192.png, apple-touch-icon.png")


if __name__ == "__main__":
    main()
