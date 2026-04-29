import os
import io
import uuid
import json
import faiss
import pdfplumber
import numpy as np

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel(
    "gemini-3-flash-preview",
    generation_config={"response_mime_type": "application/json", "temperature": 0.2}
)

TOP_K = 3
CHUNK_SIZE = 350
CHUNK_OVERLAP = 50
RESUME_DB = {}

print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

# Load jobs.json
print("Loading jobs dataset...")
try:
    with open("jobs.json", "r") as f:
        AVAILABLE_JOBS = json.load(f)
except Exception as e:
    print("Warning: Could not load jobs.json")
    AVAILABLE_JOBS = []

print("Pre-computing job embeddings...")
if AVAILABLE_JOBS:
    job_reqs = [
        f"Skills: {job.get('skills', '')}. Experience: {job.get('experience', '')}. Education: {job.get('education', '')}." 
        for job in AVAILABLE_JOBS
    ]
    job_embeddings = model.encode(job_reqs)
    # 2. Normalize ALL embeddings
    faiss.normalize_L2(job_embeddings)
else:
    job_embeddings = None
print("Job embeddings computed.")

def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

@app.get("/")
def read_root():
    return {"message": "Welcome to the TalentAlign API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return {"error": "Only PDF files allowed"}
    if not file.filename.lower().endswith(".pdf"):
        return {"error": "Invalid file format. Ensure it ends with .pdf"}

    content = await file.read()
    text = ""
    
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        return {"error": f"Failed to process PDF: {str(e)}"}

    text = text.strip()
    print("Resume text length:", len(text))
    
    if not text:
        return {"error": "Could not extract text from PDF or PDF is empty"}

    preview = text[:500] if len(text) >= 500 else text

    # Basic chunking and FAISS indexing
    chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)    
    chunk_embeddings = model.encode(chunks)
    faiss.normalize_L2(chunk_embeddings)
    
    dimension = chunk_embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(chunk_embeddings)
    
    resume_id = str(uuid.uuid4())
    RESUME_DB[resume_id] = {
        "index": index,
        "chunks": chunks
    }
    
    return {
        "resume_id": resume_id,
        "preview": preview
    }

class MatchJobsRequest(BaseModel):
    resume_id: str

@app.post("/match-jobs-rag")
async def match_jobs_rag(req: MatchJobsRequest):
    if req.resume_id not in RESUME_DB:
        return {"error": "Invalid resume_id"}
        
    if not AVAILABLE_JOBS or job_embeddings is None:
        return {"error": "Job database not loaded"}
        
    resume_data = RESUME_DB[req.resume_id]
    index = resume_data["index"]
    chunks = resume_data["chunks"]
    
    # 1. Retrieve the Top K chunks related to skills and experience
    query_text = "Extract skills, technologies, experience, and job-relevant information from this resume"
    query_embedding = model.encode([query_text])
    faiss.normalize_L2(query_embedding)
    distances, indices = index.search(query_embedding, TOP_K)
    
    retrieved_chunks = [chunks[i] for i in indices[0] if i >= 0 and i < len(chunks)]
    if not retrieved_chunks:
        return {"error": "Could not retrieve relevant resume data"}
        
    context_text = "\n---\n".join(retrieved_chunks)
    
    # 2. Score jobs using ONLY the retrieved chunks (highly pure semantic signal)
    context_embedding = model.encode([context_text])
    faiss.normalize_L2(context_embedding)
    
    similarities = cosine_similarity(context_embedding, job_embeddings)[0]
    
    job_scores = []
    for idx, job in enumerate(AVAILABLE_JOBS):
        raw_score = float(similarities[idx])
        
        # Aggressive Fine-Tuning: Dense embeddings rarely exceed 0.85 naturally despite perfect matches.
        # We apply an efficient 1.25x mathematical multiplier to stretch high scores toward 99%.
        adjusted_score = min(raw_score * 1.25, 0.99)
        score_percent = round(adjusted_score * 100, 2)
        
        job_scores.append({
            "job": job,
            "score_percent": score_percent
        })
        
    job_scores.sort(key=lambda x: x["score_percent"], reverse=True)
    top_3_jobs = job_scores[:3]
    
    # 3. Request Gemini Analysis on the mathematically top 3 matches
    prompt = f"""You are an expert Resume Analyzer AI.

Based ONLY on the provided resume context and the pre-computed top matching jobs, generate an analysis for each role.

For each role include:
- company (exactly as provided in Top Matched Jobs)
- title (exactly as provided in Top Matched Jobs)
- numeric_score (copy the exact score_percent provided)
- reason (why this role fits the candidate based on context)
- missing_skills (skills required by the job but not present in the candidate's context)
- interview_topics (key technical topics to prepare for)
- mock_questions (Exactly 3 frequently asked interview questions related to the topics of this job profile, carefully generating a 1-line or 1-word answer for each)

Return STRICT JSON ONLY in this format:
{{
  "roles": [
    {{
      "company": "",
      "title": "",
      "numeric_score": 0.0,
      "reason": "",
      "missing_skills": [],
      "interview_topics": [],
      "mock_questions": [
        {{
          "question": "",
          "answer": ""
        }}
      ]
    }}
  ]
}}

Do not add explanations outside JSON.
Do not hallucinate skills not present in context.

Resume Context:
{context_text}

Top Matched Jobs to Analyze:
{json.dumps(top_3_jobs, indent=2)}
"""

    try:
        response = gemini_model.generate_content(prompt)
        result_content = response.text
        return json.loads(result_content)
    except Exception as e:
        return {"error": f"Gemini API failed: {str(e)}"}
