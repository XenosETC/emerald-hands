#!/usr/bin/env python3
"""Safely enlarge used v2 pet cells while preserving animation coordinates."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

CELL_W = 192
CELL_H = 208
USED = (7, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8)


def limit_for_box(box: tuple[int, int, int, int], margin: int) -> float:
    left, top, right, bottom = box
    cx, cy = CELL_W / 2, CELL_H / 2
    limits: list[float] = []
    if left < cx:
        limits.append((cx - margin) / (cx - left))
    if right > cx:
        limits.append((CELL_W - margin - cx) / (right - cx))
    if top < cy:
        limits.append((cy - margin) / (cy - top))
    if bottom > cy:
        limits.append((CELL_H - margin - cy) / (bottom - cy))
    return min(limits) if limits else 1.0


def enlarged_cell(cell: Image.Image, scale: float) -> Image.Image:
    alpha_box = cell.getchannel("A").getbbox()
    canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    if not alpha_box:
        return canvas
    left, top, right, bottom = alpha_box
    crop = cell.crop(alpha_box)
    width = max(1, round((right - left) * scale))
    height = max(1, round((bottom - top) * scale))
    crop = crop.resize((width, height), Image.Resampling.LANCZOS)
    old_cx = (left + right) / 2
    old_cy = (top + bottom) / 2
    new_cx = CELL_W / 2 + (old_cx - CELL_W / 2) * scale
    new_cy = CELL_H / 2 + (old_cy - CELL_H / 2) * scale
    x = round(new_cx - width / 2)
    y = round(new_cy - height / 2)
    canvas.alpha_composite(crop, (x, y))
    pixels = [(0, 0, 0, 0) if a == 0 else (r, g, b, a) for r, g, b, a in canvas.getdata()]
    canvas.putdata(pixels)
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--output", required=True)
    parser.add_argument("--webp-output", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--target-scale", type=float, default=1.08)
    parser.add_argument("--margin", type=int, default=4)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    if source.size != (1536, 2288):
        raise SystemExit(f"expected 1536x2288 v2 atlas, got {source.size}")
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    report_rows = []
    for row, count in enumerate(USED):
        cells = [source.crop((col * CELL_W, row * CELL_H, (col + 1) * CELL_W, (row + 1) * CELL_H)) for col in range(count)]
        limits = [limit_for_box(cell.getchannel("A").getbbox(), args.margin) for cell in cells]
        scale = min(args.target_scale, min(limits))
        for col, cell in enumerate(cells):
            output.alpha_composite(enlarged_cell(cell, scale), (col * CELL_W, row * CELL_H))
        report_rows.append({"row": row, "frames": count, "scale": round(scale, 4), "target": args.target_scale})

    output_path = Path(args.output)
    webp_path = Path(args.webp_output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, "PNG", optimize=True)
    output.save(webp_path, "WEBP", lossless=True, quality=100, method=6, exact=True)
    Path(args.report).write_text(json.dumps({"ok": True, "margin": args.margin, "rows": report_rows}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
