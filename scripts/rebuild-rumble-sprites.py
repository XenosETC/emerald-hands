"""Rebuild clean transparent Relic Rumble poses from chroma-key action sheets.

The generated poses can overlap their nominal 3x3 grid cells. This extractor groups
connected artwork by component centroid, preserving the full pose while excluding
pieces that belong to neighboring cells.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


STATES = ("idle", "walk", "jump", "punch", "kick", "block", "hurt", "special", "ko")


def foreground_distance(pixel: tuple[int, int, int], key: tuple[int, int, int]) -> int:
    return max(abs(pixel[channel] - key[channel]) for channel in range(3))


def find_components(image: Image.Image, threshold: int = 26) -> list[tuple[list[int], int, int]]:
    width, height = image.size
    pixels = image.load()
    key = pixels[0, 0][:3]
    foreground = bytearray(width * height)
    for y in range(height):
        for x in range(width):
            if foreground_distance(pixels[x, y][:3], key) > threshold:
                foreground[y * width + x] = 1

    seen = bytearray(width * height)
    components: list[tuple[list[int], int, int]] = []
    for start, active in enumerate(foreground):
        if not active or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        members: list[int] = []
        sum_x = 0
        sum_y = 0
        while queue:
            index = queue.pop()
            y, x = divmod(index, width)
            members.append(index)
            sum_x += x
            sum_y += y
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    next_index = next_y * width + next_x
                    if foreground[next_index] and not seen[next_index]:
                        seen[next_index] = 1
                        queue.append(next_index)
        if len(members) >= 4:
            components.append((members, sum_x // len(members), sum_y // len(members)))
    return components


def spill_channels(key: tuple[int, int, int]) -> list[int]:
    key_max = max(key)
    return [index for index, value in enumerate(key) if value >= key_max - 16 and value >= 128]


def key_dominance(pixel: tuple[int, int, int], key: tuple[int, int, int]) -> float:
    spill = spill_channels(key)
    non_spill = [index for index in range(3) if index not in spill]
    key_strength = min(pixel[index] for index in spill)
    anchor = max((pixel[index] for index in non_spill), default=0)
    return key_strength - anchor


def dominance_alpha(pixel: tuple[int, int, int], key: tuple[int, int, int]) -> int:
    dominance = key_dominance(pixel, key)
    if dominance <= 0:
        return 255
    spill = spill_channels(key)
    non_spill = [index for index in range(3) if index not in spill]
    anchor = max((pixel[index] for index in non_spill), default=0)
    return max(0, min(255, round((1 - min(1, dominance / max(1, max(key) - anchor))) * 255)))


def soft_alpha(distance: int, transparent: float = 12, opaque: float = 220) -> int:
    if distance <= transparent:
        return 0
    if distance >= opaque:
        return 255
    ratio = (distance - transparent) / (opaque - transparent)
    smooth = ratio * ratio * (3 - 2 * ratio)
    return max(0, min(255, round(smooth * 255)))


def cleanup_spill(pixel: tuple[int, int, int], key: tuple[int, int, int], alpha: int) -> tuple[int, int, int]:
    if alpha >= 252:
        return pixel
    spill = spill_channels(key)
    non_spill = [index for index in range(3) if index not in spill]
    channels = list(pixel)
    anchor = max((channels[index] for index in non_spill), default=0)
    for index in spill:
        channels[index] = min(channels[index], max(0, anchor - 1))
    return tuple(channels)


def rebuild_sheet(root: Path, fighter: str) -> None:
    source_path = root / f"{fighter}-action-sheet-source.png"
    source = Image.open(source_path).convert("RGB")
    width, height = source.size
    cell_width = width / 3
    cell_height = height / 3
    key = source.getpixel((0, 0))
    components = find_components(source)

    for state_index, state in enumerate(STATES):
        target_column = state_index % 3
        target_row = state_index // 3
        selected = [
            members
            for members, center_x, center_y in components
            if min(2, int(center_x / cell_width)) == target_column
            and min(2, int(center_y / cell_height)) == target_row
        ]
        if not selected:
            raise RuntimeError(f"No artwork found for {fighter}-{state}")

        hard_mask = Image.new("L", source.size, 0)
        hard_pixels = hard_mask.load()
        min_x, min_y = width, height
        max_x = max_y = 0
        for members in selected:
            for index in members:
                y, x = divmod(index, width)
                hard_pixels[x, y] = 255
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

        padding = 28
        crop_box = (
            max(0, min_x - padding),
            max(0, min_y - padding),
            min(width, max_x + padding + 1),
            min(height, max_y + padding + 1),
        )
        expanded_mask = hard_mask.filter(ImageFilter.MaxFilter(7)).crop(crop_box)
        color_crop = source.crop(crop_box)
        output = Image.new("RGBA", color_crop.size, (0, 0, 0, 0))
        output_pixels = output.load()
        color_pixels = color_crop.load()
        expanded_pixels = expanded_mask.load()

        for y in range(color_crop.height):
            for x in range(color_crop.width):
                if not expanded_pixels[x, y]:
                    continue
                pixel = color_pixels[x, y]
                distance = foreground_distance(pixel, key)
                key_like = distance <= 32 or key_dominance(pixel, key) >= 16
                alpha = min(soft_alpha(distance), dominance_alpha(pixel, key)) if key_like else 255
                if 0 < alpha <= 8:
                    alpha = 0
                if alpha:
                    output_pixels[x, y] = (*cleanup_spill(pixel, key, alpha), alpha)

        destination = root / f"{fighter}-{state}.png"
        output.save(destination, optimize=True)
        print(f"rebuilt {destination.name}: {output.width}x{output.height}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("fighters", nargs="+", help="fighter ids to rebuild")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "assets" / "pepe-relic-rumble",
    )
    args = parser.parse_args()
    for fighter in args.fighters:
        rebuild_sheet(args.root, fighter)


if __name__ == "__main__":
    main()
