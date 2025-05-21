import os
import shutil
import subprocess
from langchain_community.document_loaders import PyPDFLoader
from tqdm import tqdm

# ── CONFIG ──
SOURCE_DIR = "output/uu"         # Where your 2000+ PDFs are
BROKEN_DIR = "output/broken"     # Will hold image-based PDFs
OCR_DIR    = "output/ocr_fixed"  # OCR-processed output
LANG       = "ind"               # Tesseract language model

# ── STEP 1: Find PDFs with missing text ──
print("🔍 Detecting non-text PDFs…")
os.makedirs(BROKEN_DIR, exist_ok=True)
broken_files = []

for file in tqdm(os.listdir(SOURCE_DIR)):
    if not file.endswith(".pdf"):
        continue
    full_path = os.path.join(SOURCE_DIR, file)
    try:
        loader = PyPDFLoader(full_path)
        docs = loader.load()
        if not any(doc.page_content.strip() for doc in docs):
            broken_files.append(file)
            shutil.move(full_path, os.path.join(BROKEN_DIR, file))
    except Exception as e:
        print(f"⚠️ Error reading {file}: {e}")
        broken_files.append(file)
        shutil.move(full_path, os.path.join(BROKEN_DIR, file))

print(f"✅ Moved {len(broken_files)} broken PDFs to '{BROKEN_DIR}'")

# ── STEP 2: OCR them using OCRmyPDF with Indonesian language ──
print("🧠 Running OCR on broken PDFs…")
os.makedirs(OCR_DIR, exist_ok=True)

for file in tqdm(broken_files):
    input_path = os.path.join(BROKEN_DIR, file)
    output_path = os.path.join(OCR_DIR, file)
    try:
        subprocess.run([
            "ocrmypdf",
            "--force-ocr",
            "--deskew",
            "--rotate-pages",
            "--optimize", "1",
            "-l", LANG,
            input_path,
            output_path
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ OCR failed for {file}: {e}")

print("✅ OCR completed.")

# ── STEP 3: (Optional) Merge fixed PDFs back for embedding ──
print("📦 Merging OCR'd PDFs back into source folder…")
for file in os.listdir(OCR_DIR):
    shutil.move(os.path.join(OCR_DIR, file), os.path.join(SOURCE_DIR, file))

print("✅ All fixed PDFs returned to original folder.")
