"""Crop the icon out of the AI mockup, mask to a clean rounded square,
regenerate every favicon size, and produce a <512 KB Stripe-ready file.
"""
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

SRC = r"C:\Users\3440\Downloads\ChatGPT Image Apr 23, 2026, 12_35_34 PM.png"
ROOT = Path(r"C:\Users\3440\bonoitec-pilot-pro")
PUBLIC = ROOT / "public"

img = Image.open(SRC).convert("RGBA")
arr = np.array(img)
w, h = img.size

# Step 1: detect the icon's NAVY INTERIOR (not the glow halo around it).
# Sampled pixel data:
#   icon interior:  B-R ≈ 88-167  (blue dominant)
#   gray wall:      B-R ≈ -2-0    (neutral)
#   glow halo:      B-R ≈ 13      (slight blue cast)
# Threshold of B-R > 30 catches only true icon pixels.
r = arr[:, :, 0].astype(int)
g = arr[:, :, 1].astype(int)
b = arr[:, :, 2].astype(int)
navy = (b - r) > 30
ys, xs = np.where(navy)
nx_lo, nx_hi = int(xs.min()), int(xs.max())
ny_lo, ny_hi = int(ys.min()), int(ys.max())
print(f"navy interior: x={nx_lo}-{nx_hi}  y={ny_lo}-{ny_hi}")

# The navy region IS the rounded-square interior. Pad outward by ~1.5% to
# include the rim, then square the box.
pad = int(max(nx_hi - nx_lo, ny_hi - ny_lo) * 0.015)
left = max(0, nx_lo - pad)
top = max(0, ny_lo - pad)
right = min(w, nx_hi + pad)
bottom = min(h, ny_hi + pad)
side = min(right - left, bottom - top)
# Recenter and square
cx = (left + right) // 2
cy = (top + bottom) // 2
left = cx - side // 2
top = cy - side // 2
right = left + side
bottom = top + side
print(f"square crop: ({left},{top}) -> ({right},{bottom})  side={side}")

cropped = img.crop((left, top, right, bottom))
print(f"cropped: {cropped.size}")

# Step 2: build a perfect rounded-square alpha mask matching the icon's
# corner radius. iOS app-icon convention: ~22% corner radius. The source
# matches this closely.
def rounded_mask(size, radius_pct=0.22):
    s = size
    radius = int(s * radius_pct)
    mask = Image.new("L", (s * 4, s * 4), 0)  # 4x supersample for smooth edge
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, s * 4, s * 4), radius=radius * 4, fill=255)
    return mask.resize((s, s), Image.LANCZOS)

mask = rounded_mask(cropped.size[0])
ca = np.array(cropped)
ca[:, :, 3] = np.array(mask)
cropped = Image.fromarray(ca, "RGBA")
print(f"masked rounded square applied")

# Step 3: emit every site icon size + a Stripe-optimized version <512 KB.
TARGETS = {
    "favicon.png": 64,
    "favicon-32.png": 32,
    "favicon-64.png": 64,
    "favicon-180.png": 180,
    "favicon-192.png": 192,
    "favicon-512.png": 512,
    "logo-bonoitecpilot.png": 512,
    "email-mark.png": 1024,
    "oauth-logo.png": 1024,
}
for name, size in TARGETS.items():
    out = cropped.resize((size, size), Image.LANCZOS)
    out.save(PUBLIC / name, "PNG", optimize=True)
    sz = os.path.getsize(PUBLIC / name)
    print(f"  -> public/{name}  {size}x{size}  {sz:,} bytes")

# Stripe icon: 512x512 PNG, must be <512KB. Try with progressive
# palette quantization until under the limit.
target_path = ROOT / "stripe-icon-square.png"
out512 = cropped.resize((512, 512), Image.LANCZOS)
# Try lossless first
out512.save(target_path, "PNG", optimize=True)
sz = os.path.getsize(target_path)
if sz > 512 * 1024:
    # Quantize to 256-color palette while preserving alpha
    print(f"  too big ({sz:,}), quantizing palette")
    quant = out512.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    quant.save(target_path, "PNG", optimize=True)
    sz = os.path.getsize(target_path)

print(f"\nstripe-icon-square.png  512x512  {sz:,} bytes  ({'OK' if sz < 512*1024 else 'STILL TOO BIG'})")
