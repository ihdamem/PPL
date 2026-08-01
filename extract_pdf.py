import fitz
import os
from pathlib import Path

PDF_PATH = "/Users/prima/Downloads/initial-plan.pdf"
OUT_DIR = Path("/Users/prima/bismillah-kuliah/semester3/0pengembangan-perangkat-lunak/PPL")
IMG_DIR = OUT_DIR / "img"
MD_PATH = OUT_DIR / "initial-plan.md"

IMG_DIR.mkdir(parents=True, exist_ok=True)

doc = fitz.open(PDF_PATH)
md_lines = [f"# {Path(PDF_PATH).name}\n", f"\nPages: {len(doc)}\n"]

saved_images = {}  # xref -> filename
image_counter = 0

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    md_lines.append(f"\n## Page {page_num + 1}\n")

    text = page.get_text()
    if text.strip():
        md_lines.append(text)
        md_lines.append("\n")

    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list, start=1):
        xref = img[0]
        if xref in saved_images:
            img_filename = saved_images[xref]
        else:
            image_counter += 1
            base_ext = "png"
            try:
                pix = fitz.Pixmap(doc, xref)
                # CMYK: convert to RGB
                if pix.n > 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                # Determine extension based on colorspace
                ext = "png"
                img_filename = f"image_{image_counter:03d}.{ext}"
                img_path = IMG_DIR / img_filename
                pix.save(img_path)
                pix = None
                saved_images[xref] = img_filename
            except Exception as e:
                md_lines.append(f"\n<!-- Error extracting image {img_index} on page {page_num + 1}: {e} -->\n")
                continue

        md_lines.append(f"\n![Image {image_counter}](img/{img_filename})\n")

MD_PATH.write_text("\n".join(md_lines), encoding="utf-8")

doc.close()
print(f"Wrote markdown: {MD_PATH}")
print(f"Saved {len(saved_images)} image(s) to: {IMG_DIR}")
