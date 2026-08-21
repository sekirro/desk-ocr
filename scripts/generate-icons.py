from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 1024


def rounded_gradient() -> Image.Image:
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    pixels = image.load()
    for y in range(SIZE):
        ratio = y / (SIZE - 1)
        start = (10, 22, 42)
        end = (15, 50, 68)
        color = tuple(round(start[index] * (1 - ratio) + end[index] * ratio) for index in range(3))
        for x in range(SIZE):
            pixels[x, y] = (*color, 255)

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((24, 24, 1000, 1000), radius=220, fill=255)
    image.putalpha(mask)
    return image


def draw_icon() -> Image.Image:
    image = rounded_gradient()
    draw = ImageDraw.Draw(image)
    white = (245, 249, 255, 255)
    cyan = (45, 212, 191, 255)

    bracket_width = 54
    bracket_length = 180
    left, top, right, bottom = 190, 190, 834, 834

    for points in [
        [(left + bracket_length, top), (left, top), (left, top + bracket_length)],
        [(right - bracket_length, top), (right, top), (right, top + bracket_length)],
        [(left, bottom - bracket_length), (left, bottom), (left + bracket_length, bottom)],
        [(right - bracket_length, bottom), (right, bottom), (right, bottom - bracket_length)],
    ]:
        draw.line(points, fill=cyan, width=bracket_width, joint="curve")

    line_left = 300
    for y, line_right in [(390, 710), (512, 760), (634, 660)]:
        draw.rounded_rectangle(
            (line_left, y - 27, line_right, y + 27),
            radius=27,
            fill=white,
        )

    return image


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    output = project_root / "build"
    output.mkdir(parents=True, exist_ok=True)
    image = draw_icon()
    image.save(output / "icon.png", optimize=True)
    image.save(
        output / "icon.ico",
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


if __name__ == "__main__":
    main()
