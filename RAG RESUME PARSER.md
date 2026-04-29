# 📄 Product Requirements Document (RAG-FIRST VERSION )

## Resume Analyzer & Career Intelligence Platform

---

# 1. 🎯 Product Overview

A web-based Resume Analyzer built on a **RAG-first architecture** that uses embeddings and LLMs to:

* Extract information from resumes
* Suggest Top 3 job roles
* Generate match scores (embedding-based)
* Recommend **companies per role based on fit**
* Provide skill gap analysis, interview prep, and learning paths
* Offer a separate deep resume analysis feature

---

# 2. 🧠 Core Architecture (RAG-Centric)

* Embeddings for semantic understanding
* Vector search for retrieval
* LLM for structured generation
* **Embedding-based ranking for companies per role**

---

# 3. 🚀 Features

## 3.1 Job Matching (RAG-Based)

* Upload resume
* Extract and chunk text
* Generate embeddings
* Suggest **Top 3 roles**
* Compute similarity scores
* For each role:

  * Missing skills
  * Interview Q&A
  * Course topics
  * **Top matching companies (ranked)**

## 3.2 Resume Analysis (RAG Only)

* Upload resume
* Generate:

  * Feedback
  * Suggestions
  * Reasoning

---

# 4. 🛠️ Tech Stack

## Backend

* Python 3.11
* FastAPI

## Text Processing

* pdfplumber

## Embeddings

* sentence-transformers

## Vector DB

* FAISS

## LLM

* OpenAI API

## Frontend

* React.js + Tailwind CSS

## Storage

* JSON datasets:

  * job_profiles.json
  * **company_roles.json (NEW)**
  * resume_tips.json

---

# 5. 🏗️ System Flow

## 5.1 Job Matching Flow

Resume → Extraction → Embeddings → Role Generation → Similarity Scoring → **Company Matching** → RAG Insights → UI

## 5.2 Resume Analysis Flow

Resume → Embeddings → RAG → Feedback → UI

---

# 6. 🔁 Detailed Workflow

## 6.1 Job Matching

1. Upload resume
2. Extract text
3. Chunk text
4. Generate embeddings
5. Store in FAISS
6. LLM generates Top 3 roles
7. Normalize roles to predefined set
8. Compute role similarity scores

### 🔹 NEW: Company Recommendation Pipeline

9. Load company_roles.json
10. For selected role:

* Each company has:
  {
  "company": "",
  "role": "",
  "requirements": ["skill1", "skill2"]
  }

11. Convert company requirements → embeddings
12. Compare with resume embedding (cosine similarity)
13. Rank companies
14. Select Top N (e.g., 3–5)

### 🔹 RAG Enhancement

15. For each role:

* Generate missing skills
* Generate interview Q&A
* Generate course topics

16. Return structured output

---

## 6.2 Resume Analysis

1. Upload resume
2. Extract text
3. Embeddings
4. RAG generation
5. Return feedback

---

# 7. 📊 API Design

## POST /match-jobs

Output:
{
"user": {"name": "", "skills": []},
"roles": [
{
"title": "",
"score": 0,
"companies": [
{"name": "", "match_score": 0}
],
"missing_skills": [],
"interview": [{"q": "", "a": ""}],
"courses": []
}
]
}

## POST /analyze-resume

Output:
{
"feedback": [],
"suggestions": [],
"reasoning": []
}

---

# 8. 📂 Project Phases

## Phase 1: Setup

* Backend + Frontend

## Phase 2: Text Processing

* PDF extraction
* Chunking

## Phase 3: Embeddings

* sentence-transformers integration

## Phase 4: Vector DB

* FAISS setup

## Phase 5: Role Generation

* LLM prompts
* Role normalization

## Phase 6: Scoring

* Role similarity scoring

## Phase 7: Company Matching (NEW)

* Build company_roles.json
* Embedding-based ranking

## Phase 8: RAG Insights

* Missing skills, Q&A, courses

## Phase 9: Resume Analysis

* Feedback pipeline

## Phase 10: Frontend

* Cards, rankings, UI display

---

# 9. ⚙️ Implementation Notes

* Enforce strict JSON outputs
* Limit roles to 3
* Use embedding similarity for both roles and companies
* Cache embeddings
* Keep company dataset small initially (10–20 companies)

---

# 10. 🎯 Success Metrics

* Relevant role prediction
* Meaningful company recommendations
* Response time < 5s

---

# 11. ⚖️ Trade-offs

## Advantages

* Personalized company targeting
* More realistic career guidance

## Challenges

* Requires curated company dataset
* Matching accuracy depends on data quality

## Mitigation

* Start with curated static dataset
* Normalize skill names

---

# 12. ✅ Final Outcome

A RAG-first system that not only suggests job roles but also recommends **specific companies aligned with the user's profile**, making it more actionable and career-focused.

---

# 🎤 Positioning

A **RAG-first Career Intelligence Platform** with role + company-level personalization.
