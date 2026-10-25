# -*- coding: utf-8 -*-
"""Generate PWA PNG icons: green rounded square + white "翠" glyph."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "icons")
os.makedirs(OUT, exist_ok=True)

GREEN = (7, 193, 96)  # #07C160
FONT_CANDIDATES = [
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    raise SystemExit("no CJK font found")


def rounded(size, radius):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=GREEN)
    return img


def draw_glyph(size, radius_ratio):
    img = rounded(size, int(size * radius_ratio))
    d = ImageDraw.Draw(img)
    font = load_font(int(size * 0.58))
    bbox = d.textbbox((0, 0), "翠", font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), "翠",
           font=font, fill=(255, 255, 255, 255))
    return img


draw_glyph(192, 0.22).save(os.path.join(OUT, "pwa-192.png"))
draw_glyph(512, 0.22).save(os.path.join(OUT, "pwa-512.png"))
# maskable：安全区 80%，无圆角全出血
maskable = draw_glyph(512, 0.0)
maskable.save(os.path.join(OUT, "maskable-512.png"))
# apple-touch-icon：iOS 自动加圆角，用正方形无透明
apple = Image.new("RGB", (180, 180), GREEN)
d = ImageDraw.Draw(apple)
font = load_font(int(180 * 0.58))
bbox = d.textbbox((0, 0), "翠", font=font)
w = bbox[2] - bbox[0]
h = bbox[3] - bbox[1]
d.text(((180 - w) / 2 - bbox[0], (180 - h) / 2 - bbox[1]), "翠", font=font, fill=(255, 255, 255))
apple.save(os.path.join(OUT, "apple-touch-icon.png"))
print("icons written to", OUT)
