# -*- coding: utf-8 -*-
"""Regenerate website/assets/qr.png for the current APK download URL.

Run after changing the download URL in download.html:

    python website/make-qr.py

The URL is read out of download.html so it cannot drift from the page. Error correction is
level H (~30% recoverable) because the centre carries a logo knockout — a lower level makes
the code unscannable once the plate covers it. The script decodes its own output and fails
loudly if the result does not scan back to the same URL.

Needs: pip install qrcode pillow opencv-python
"""
import os
import re
import sys

import cv2
import qrcode
from PIL import Image, ImageDraw
from qrcode.constants import ERROR_CORRECT_H

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
GREEN, IVORY = "#124026", "#FBF9F4"

with open(os.path.join(HERE, "download.html"), encoding="utf-8") as fh:
    urls = re.findall(r'https://[^\s"<]+\.apk', fh.read())
if not urls:
    sys.exit("No .apk URL found in download.html")
if len(set(urls)) != 1:
    sys.exit("download.html holds more than one APK URL: %s" % sorted(set(urls)))
URL = urls[0]


def rounded(size, radius, fill):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius, fill=fill)
    return img


def build_qr(box=12, border=3):
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, box_size=box, border=border)
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color=GREEN, back_color=IVORY).convert("RGBA")

    # Centre knockout at ~22% of the code — comfortably inside what level H can rebuild.
    w, _ = img.size
    plate = int(w * 0.225)
    pad = int(plate * 0.17)
    radius = int(plate * 0.26)

    bg = rounded((plate, plate), radius, IVORY)
    ring = rounded((plate, plate), radius, None)
    ImageDraw.Draw(ring).rounded_rectangle(
        [0, 0, plate - 1, plate - 1], radius, outline=GREEN, width=max(2, plate // 36)
    )

    icon = Image.open(os.path.join(REPO, "assets", "android-icon-foreground.png")).convert("RGBA")
    icon.thumbnail((plate - 2 * pad, plate - 2 * pad), Image.LANCZOS)

    off = (w - plate) // 2
    img.alpha_composite(bg, (off, off))
    img.alpha_composite(ring, (off, off))
    img.alpha_composite(icon, (off + (plate - icon.width) // 2, off + (plate - icon.height) // 2))
    return img.convert("RGB")


out = os.path.join(HERE, "assets", "qr.png")
build_qr().save(out, optimize=True)

decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(out))
if decoded != URL:
    sys.exit("QR does not scan back to the URL (got %r) — assets/qr.png is NOT safe to ship" % decoded)

print("assets/qr.png written and verified")
print("  url  :", URL)
print("  size :", Image.open(out).size, "%d KB" % (os.path.getsize(out) // 1024))
