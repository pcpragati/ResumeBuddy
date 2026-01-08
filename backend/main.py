from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from docx import Document
from groq import Groq
import os
from dotenv import load_dotenv
import io

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS (for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# -------------------- Resume Text Extraction --------------------

def extract_pdf_text(file_bytes: bytes) -> str:
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(e)}")


def extract_docx_text(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX parsing error: {str(e)}")

# -------------------- AI Prompt Logic --------------------

def build_prompt(resume_text: str, mode: str) -> str:
    if mode == "professional":
        return f"""
You are an expert resume reviewer for undergraduate students.

STRICT RULES:
- Use bullet points only
- No long paragraphs
- Max 1–2 lines per bullet
- Clear, simple language

Return feedback EXACTLY in this format:

ATS_SCORE:
- Score: X/10
- One-line reason

STRENGTHS:
- Point 1
- Point 2
- Point 3

ISSUES:
- Issue 1
- Issue 2
- Issue 3

SUGGESTIONS:
- Suggestion 1
- Suggestion 2
- Suggestion 3
- Suggestion 4

MISSING_KEYWORDS:
- Keyword 1
- Keyword 2
- Keyword 3

Resume Text:
{resume_text}
"""

    # Roast / Fun Mode
    return f"""
You are a Gen-Z resume roaster.

Your personality:
- Funny
- Slightly savage
- Meme-style humor
- But NEVER insulting the person

RULES:
- Use emojis 😂🔥💀
- Short punchy bullets
- Roast the RESUME, not the human
- Be brutally honest but helpful
- No paragraphs

FORMAT EXACTLY LIKE THIS:

ROAST_HIGHLIGHTS:
- Roast line 1 (funny + emoji)
- Roast line 2
- Roast line 3

REAL_ISSUES (No jokes here):
- Issue 1
- Issue 2
- Issue 3

HOW_TO_FIX (Simple, clear):
- Fix 1
- Fix 2
- Fix 3

Examples of tone:
- "MS Word as a skill? Bold choice 💀"
- "This resume has potential but it's hiding like an introvert at a party 😂"
- "Your projects are good, but they're written like a mystery novel"

Resume Text:
{resume_text}
"""

# -------------------- AI Feedback Generator --------------------

def get_ai_feedback(resume_text: str, mode: str) -> str:
    prompt = build_prompt(resume_text, mode)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a concise, student-friendly resume analyzer."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=600,  # prevents essay-style output
            temperature=0.3 if mode == "professional" else 0.85
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")

# -------------------- API Endpoints --------------------

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    mode: str = Form("professional")
):
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX files allowed")

    file_bytes = await file.read()

    if file.filename.endswith(".pdf"):
        resume_text = extract_pdf_text(file_bytes)
    else:
        resume_text = extract_docx_text(file_bytes)

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found. Scanned resumes are not supported."
        )

    feedback = get_ai_feedback(resume_text, mode)

    return {
        "success": True,
        "mode": mode,
        "feedback": feedback,
        "resume_length": len(resume_text),
        "ai_model": "Groq LLaMA 3.3 70B"
    }

@app.get("/")
def root():
    return {
        "message": "ResumeBuddy API running 🚀",
        "status": "healthy",
        "ai": "Groq LLaMA 3.3 70B",
        "endpoints": ["/analyze", "/docs"]
    }

@app.get("/test")
def test():
    key = os.getenv("GROQ_API_KEY")
    return {
        "groq_key_configured": bool(key),
        "key_preview": key[:8] + "..." if key else None
    }
