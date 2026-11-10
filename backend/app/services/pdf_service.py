import os
import uuid
import re
import unicodedata
import logging
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from app.core.config import settings

logger = logging.getLogger(__name__)

def sanitize_ascii(text: str) -> str:
    """Normalize and clean non-latin unicode characters to avoid core font errors."""
    if not text:
        return ""
    # Replace common unicode punctuation with ASCII equivalents
    replacements = {
        "—": "-",
        "–": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "…": "...",
        "•": "*",
        "lambda": "lambda",
        "delta": "delta",
        "hbar": "h_bar"
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    # Decompose any remaining unicode accents and encode to ascii/latin1
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    return normalized

class HandwrittenPDF(FPDF):
    def __init__(
        self,
        paper_style: str = "ruled",
        bg_color: str = "ivory",
        line_spacing_mult: float = 1.5,
        margin: int = 20,
        *args, **kwargs
    ):
        super().__init__(*args, **kwargs)
        self.paper_style = paper_style
        self.bg_color_name = bg_color
        self.line_spacing_mult = line_spacing_mult
        self.custom_margin = margin
        self.set_margins(margin, margin, margin)
        self.set_auto_page_break(auto=True, margin=margin)

    def header(self):
        bg_rgb_map = {
            "ivory": (253, 251, 247),
            "white": (255, 255, 255),
            "parchment": (246, 241, 230),
            "yellow_legal": (254, 252, 215)
        }
        r, g, b = bg_rgb_map.get(self.bg_color_name, (253, 251, 247))
        self.set_fill_color(r, g, b)
        self.rect(0, 0, 210, 297, "F")  # A4 size

        # Paper textures
        if self.paper_style == "ruled":
            self.set_draw_color(220, 226, 240)
            self.set_line_width(0.2)
            y = 25
            while y < 285:
                self.line(self.custom_margin - 5, y, 210 - self.custom_margin + 5, y)
                y += 8 * self.line_spacing_mult

            # Margin line
            self.set_draw_color(240, 180, 180)
            self.set_line_width(0.4)
            self.line(self.custom_margin - 3, 10, self.custom_margin - 3, 287)

        elif self.paper_style == "grid":
            self.set_draw_color(230, 235, 245)
            self.set_line_width(0.15)
            for x in range(10, 200, 6):
                self.line(x, 10, x, 287)
            for y in range(10, 287, 6):
                self.line(10, y, 200, y)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(160, 160, 160)
        footer_text = f"Voxora Handwritten Study Notes - Page {self.page_no()}"
        self.cell(0, 10, footer_text, align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)


class PDFService:
    @staticmethod
    def hex_to_rgb(hex_str: str) -> tuple:
        hex_str = hex_str.lstrip("#")
        if len(hex_str) == 3:
            hex_str = "".join([c*2 for c in hex_str])
        if len(hex_str) != 6:
            return (26, 54, 93)
        return (int(hex_str[0:2], 16), int(hex_str[2:4], 16), int(hex_str[4:6], 16))

    @staticmethod
    def generate_handwritten_pdf(
        content: str,
        title: str = "Lecture Notes",
        font_style: str = "Caveat",
        font_size: int = 14,
        ink_color: str = "#1A365D",
        paper_style: str = "ruled",
        line_spacing: float = 1.5,
        margin: int = 20,
        page_background: str = "ivory"
    ) -> str:
        output_filename = f"handwritten_{uuid.uuid4().hex[:12]}.pdf"
        output_path = os.path.join(settings.GENERATED_DIR, output_filename)

        pdf = HandwrittenPDF(
            paper_style=paper_style,
            bg_color=page_background,
            line_spacing_mult=line_spacing,
            margin=margin
        )
        pdf.add_page()

        r, g, b = PDFService.hex_to_rgb(ink_color)
        pdf.set_text_color(r, g, b)

        base_font = "Helvetica"
        line_h = (font_size * 0.45) * line_spacing
        printable_width = 210 - (margin * 2)

        # Title
        safe_title = sanitize_ascii(title[:80])
        pdf.set_font(base_font, "B", font_size + 6)
        pdf.cell(printable_width, 12, safe_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="L")
        pdf.ln(4)

        lines = content.split("\n")
        pdf.set_font(base_font, "", font_size)

        for line in lines:
            line_clean = sanitize_ascii(line.strip())
            if not line_clean:
                pdf.ln(line_h * 0.6)
                continue

            if line_clean.startswith("# "):
                pdf.set_font(base_font, "B", font_size + 4)
                pdf.ln(line_h * 0.4)
                pdf.multi_cell(printable_width, line_h * 1.2, line_clean.lstrip("# ").strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font(base_font, "", font_size)
            elif line_clean.startswith("## "):
                pdf.set_font(base_font, "B", font_size + 2)
                pdf.ln(line_h * 0.3)
                pdf.multi_cell(printable_width, line_h * 1.1, line_clean.lstrip("# ").strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font(base_font, "", font_size)
            elif line_clean.startswith("### "):
                pdf.set_font(base_font, "B", font_size)
                pdf.multi_cell(printable_width, line_h, line_clean.lstrip("# ").strip(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_font(base_font, "", font_size)
            elif line_clean.startswith(("- ", "* ")):
                bullet_text = line_clean[2:].strip()
                pdf.multi_cell(printable_width, line_h, f"   ~  {bullet_text}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            else:
                pdf.multi_cell(printable_width, line_h, line_clean, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.output(output_path)
        logger.info(f"Generated handwritten PDF at {output_path}")
        return output_filename

pdf_service = PDFService()
