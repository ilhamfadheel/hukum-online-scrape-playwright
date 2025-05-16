import os
import torch
from tqdm import tqdm
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# ── CONFIG ──
PDF_DIR       = "output/uu"                  # your folder of PDFs
INDEX_DIR     = "faiss_index"           # where to save
EMBED_MODEL   = "intfloat/multilingual-e5-base"
CHUNK_SIZE    = 512
CHUNK_OVERLAP = 50
DEVICE        = "cuda" if torch.cuda.is_available() else "cpu"

print(f"🚀 Using device: {DEVICE}")

# ── 1) Load & minimally clean PDFs ──
def join_broken_lines(text: str) -> str:
    import re
    lines, out, buf = text.splitlines(), [], ""
    for ln in lines:
        ln = ln.strip()
        if not ln:
            if buf:
                out.append(buf); buf = ""
            continue
        # join if previous line not punctuated and this starts lowercase
        if buf and not re.search(r"[\.!?:;]$", buf) and ln[0].islower():
            buf += " " + ln
        else:
            if buf: out.append(buf)
            buf = ln
    if buf: out.append(buf)
    return "\n".join(out)

all_docs = []
print("🔍 Loading and cleaning PDFs…")
for path in tqdm(os.listdir(PDF_DIR), desc="Reading PDFs"):
    if not path.lower().endswith(".pdf"): continue
    full = os.path.join(PDF_DIR, path)
    pages = PyPDFLoader(full).load()  # list of Document(page_content, metadata)
    for i, doc in enumerate(pages, start=1):
        clean = join_broken_lines(doc.page_content)
        # overwrite page_content, keep original metadata plus page #
        doc.page_content = clean
        doc.metadata["page"] = i
        all_docs.append(doc)

# ── 2) Chunk with metadata ──
print("✂️ Splitting into chunks…")
splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    length_function=len
)
chunks = splitter.split_documents(all_docs)

# ── 3) Embed & index via LangChain’s FAISS.from_documents ──
print("🧠 Loading embedding model…")
embedder = HuggingFaceEmbeddings(
    model_name=EMBED_MODEL,
    model_kwargs={"device": DEVICE}
)

print("🔢 Building FAISS index (this will embed internally)…")
db = FAISS.from_documents(
    documents=chunks,
    embedding=embedder
)

# ── 4) Save the index ──
os.makedirs(INDEX_DIR, exist_ok=True)
db.save_local(INDEX_DIR)
print(f"✅ FAISS index saved to '{INDEX_DIR}/'")
