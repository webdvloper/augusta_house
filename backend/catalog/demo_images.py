"""Процедурные «фото» текстиля для демо-каталога (вместо настоящих снимков)."""

import math
import random
from io import BytesIO

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 800
BACKDROP = (244, 242, 236)
RGB = tuple[int, int, int]


def shade(color: RGB, factor: float) -> RGB:
    return tuple(max(0, min(255, round(channel * factor))) for channel in color)


def weave(color: RGB, rng: random.Random, grain: float = 0.1) -> Image.Image:
    """Плоский лоскут с фактурой переплетения."""
    base = Image.new("RGB", (SIZE, SIZE), color)
    noise = Image.effect_noise((SIZE, SIZE), 60).convert("RGB")
    image = Image.blend(base, noise, grain)
    draw = ImageDraw.Draw(image, "RGBA")
    step = rng.choice([3, 4])
    for y in range(0, SIZE, step):
        draw.line([(0, y), (SIZE, y)], fill=(0, 0, 0, 14))
    for x in range(0, SIZE, step):
        draw.line([(x, 0), (x, SIZE)], fill=(255, 255, 255, 10))
    return image


def folds(image: Image.Image, count: float, strength: int = 70, angle: float = 0) -> Image.Image:
    """Накладывает мягкие складки — волны света и тени."""
    strip = Image.new("L", (SIZE * 2, 1))
    strip.putdata(
        [
            round(128 + strength * math.sin(x / (SIZE * 2) * count * 2 * math.pi * 2))
            for x in range(SIZE * 2)
        ]
    )
    light = strip.resize((SIZE * 2, SIZE * 2))
    if angle:
        light = light.rotate(angle, resample=Image.Resampling.BICUBIC)
    light = light.crop((SIZE // 2, SIZE // 2, SIZE // 2 + SIZE, SIZE // 2 + SIZE))
    return ImageChops.overlay(image, light.convert("RGB"))


def ornament(image: Image.Image, color: RGB, rng: random.Random) -> Image.Image:
    """Простой повторяющийся орнамент: ромбы или полосы."""
    draw = ImageDraw.Draw(image, "RGBA")
    tint = (*shade(color, 1.5), 130)
    if rng.random() < 0.5:
        step = rng.choice([100, 133, 160])
        for row, y in enumerate(range(0, SIZE + step, step)):
            for x in range(0, SIZE + step, step):
                cx = x + (step // 2 if row % 2 else 0)
                r = step // 4
                draw.polygon([(cx, y - r), (cx + r, y), (cx, y + r), (cx - r, y)], outline=tint)
                draw.ellipse([cx - 5, y - 5, cx + 5, y + 5], fill=tint)
    else:
        step = rng.choice([40, 64, 80])
        for x in range(0, SIZE, step):
            draw.rectangle([x, 0, x + step // 5, SIZE], fill=tint)
    return image


def vignette(image: Image.Image) -> Image.Image:
    mask = Image.radial_gradient("L").resize((SIZE, SIZE))
    dark = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    return Image.composite(Image.blend(image, dark, 0.22), image, mask)


def with_shadow(shape_mask: Image.Image, content: Image.Image) -> Image.Image:
    """Кладёт вырезанный по маске предмет на светлый фон с тенью."""
    canvas = Image.new("RGB", (SIZE, SIZE), BACKDROP)
    shadow = Image.new("L", (SIZE, SIZE), 0)
    shadow.paste(shape_mask, (14, 22))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    canvas.paste((150, 146, 136), mask=shadow.point(lambda value: value // 2))
    canvas.paste(content, mask=shape_mask)
    return canvas


def fabric(color: RGB, rng: random.Random, patterned: bool = False) -> Image.Image:
    image = weave(color, rng)
    if patterned:
        image = ornament(image, color, rng)
    return vignette(folds(image, rng.uniform(0.6, 1.4), 55, rng.uniform(15, 60)))


def sheer(color: RGB, rng: random.Random) -> Image.Image:
    light = tuple(round(channel * 0.35 + 255 * 0.65) for channel in color)
    return folds(weave(light, rng, 0.04), rng.uniform(3, 5), 45)


def curtain(color: RGB, rng: random.Random) -> Image.Image:
    image = folds(weave(color, rng, 0.06), rng.uniform(3.5, 5.5), 95)
    draw = ImageDraw.Draw(image, "RGBA")
    y = rng.randint(430, 520)
    draw.rounded_rectangle([0, y, SIZE, y + 26], 8, fill=(*shade(color, 0.55), 235))
    draw.line([(0, y + 4), (SIZE, y + 4)], fill=(255, 255, 255, 60), width=2)
    return vignette(image)


def pillow(color: RGB, rng: random.Random) -> Image.Image:
    texture = folds(ornament(weave(color, rng), color, rng), 0.5, 45, 35)
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle([110, 120, 690, 690], 90, fill=255)
    return with_shadow(mask.filter(ImageFilter.GaussianBlur(2)), vignette(texture))


def cord(color: RGB, rng: random.Random) -> Image.Image:
    mask = Image.new("L", (SIZE, SIZE), 0)
    content = Image.new("RGB", (SIZE, SIZE), color)
    mask_draw, draw = ImageDraw.Draw(mask), ImageDraw.Draw(content)
    width = rng.choice([44, 54, 64])
    for offset in range(-100, SIZE + 100, 4):
        x, y = offset, SIZE - offset
        mask_draw.ellipse([x - width // 2, y - width // 2, x + width // 2, y + width // 2], 255)
    for index, offset in enumerate(range(-100, SIZE + 100, width // 2)):
        tone = shade(color, 1.25 if index % 2 else 0.7)
        x, y = offset, SIZE - offset
        draw.line([(x - width, y - width // 3), (x + width, y + width // 3)], tone, width // 4)
    return with_shadow(mask, content.filter(ImageFilter.GaussianBlur(1.2)))


def trim(color: RGB, rng: random.Random) -> Image.Image:
    canvas = Image.new("RGB", (SIZE, SIZE), BACKDROP)
    draw = ImageDraw.Draw(canvas)
    top = 250
    for x in range(20, SIZE - 20, 9):
        length = 250 + rng.randint(-18, 18)
        tone = shade(color, rng.uniform(0.8, 1.2))
        draw.line([(x, top + 40), (x + rng.randint(-5, 5), top + 40 + length)], tone, 5)
        draw.ellipse([x - 7, top + 30 + length, x + 9, top + 50 + length], fill=tone)
    draw.rectangle([0, top, SIZE, top + 56], fill=shade(color, 0.8))
    for x in range(0, SIZE, 28):
        draw.polygon(
            [(x, top + 28), (x + 14, top + 8), (x + 28, top + 28), (x + 14, top + 48)],
            fill=shade(color, 1.3),
        )
    return canvas.filter(ImageFilter.SMOOTH)


def tassel(color: RGB, rng: random.Random) -> Image.Image:
    canvas = Image.new("RGB", (SIZE, SIZE), BACKDROP)
    draw = ImageDraw.Draw(canvas)
    cx = SIZE // 2
    draw.arc([cx - 190, -260, cx + 190, 250], 0, 180, shade(color, 0.75), 16)
    draw.ellipse([cx - 62, 215, cx + 62, 340], fill=shade(color, 1.1))
    draw.rectangle([cx - 70, 330, cx + 70, 372], fill=shade(color, 0.6))
    for x in range(cx - 96, cx + 97, 7):
        tone = shade(color, rng.uniform(0.75, 1.25))
        spread = (x - cx) * 0.45
        draw.line([(x * 0.72 + cx * 0.28, 372), (x + spread, 700 + rng.randint(-14, 14))], tone, 6)
    return canvas.filter(ImageFilter.SMOOTH)


PAINTERS = {
    "fabric": fabric,
    "patterned": lambda color, rng: fabric(color, rng, patterned=True),
    "sheer": sheer,
    "curtain": curtain,
    "pillow": pillow,
    "cord": cord,
    "trim": trim,
    "tassel": tassel,
}


def render(kind: str, color: RGB, seed: int, closeup: bool = False) -> bytes:
    """Возвращает JPEG; closeup — второй кадр, фактура ткани крупным планом."""
    rng = random.Random(seed)
    if closeup:
        image = vignette(folds(weave(color, rng, 0.14), 0.4, 35, 40))
    else:
        image = PAINTERS[kind](color, rng)
    buffer = BytesIO()
    image.save(buffer, "JPEG", quality=84)
    return buffer.getvalue()
