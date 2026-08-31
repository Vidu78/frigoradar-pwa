"""Genera le icone PWA da public/icon-512x512.jpg.

    pip install pillow
    python scripts/convert_icons.py

Prima usava percorsi assoluti Windows dell'autore, quindi girava su una sola
macchina; ora risolve tutto rispetto alla radice del repository.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "icon-512x512.jpg"
SIZES = (512, 192)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Sorgente non trovata: {SOURCE}")

    with Image.open(SOURCE) as img:
        img = img.convert("RGBA")
        for size in SIZES:
            out = PUBLIC / f"pwa-{size}x{size}.png"
            img.resize((size, size), Image.LANCZOS).save(out, "PNG")
            print(f"Creato {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
