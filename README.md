# TalentAlign 🎯

**AI-Powered Mathematical Job Matchmaking**

TalentAlign is a cutting-edge, "Double-RAG" powered AI application designed to fundamentally restructure how resumes are matched against complex job requirements. By ditching outdated keyword-matching algorithms and utilizing 384-dimensional dense semantic vectors, TalentAlign mathematically bridges the gap between what a candidate has built and what an employer actually needs.

---

## 🛑 The Problem
Traditional Applicant Tracking Systems (ATS) and hiring filters are fundamentally noisy and broken. They rely on literal keyword scraping, meaning highly qualified candidates are frequently rejected simply because they described a complex architecture instead of writing a specific buzzword. Furthermore, recruiters waste hours manually cross-referencing education, experience, and tech stacks simply to disqualify a resume. 

## 💡 Our Approach
TalentAlign moves hiring into deep semantic space. Instead of searching for keywords, we use **Sentence Transformers** to convert entire paragraphs of candidate experience into geometric vectors. We mathematically compute the distance between the candidate's history and a company's strict requirements (including their specific Education and Years of Experience demands) using **FAISS (Facebook AI Similarity Search)**. 

Once the absolute best mathematical fits are located, the data is pushed to a large language model (Google Gemini) to logically justify the match, identify skill gaps, and instantly generate an interview preparation plan.

---

## ⚙️ How It Works (The Double-RAG Engineering Flow)

1. **Pre-flight Job Indexing:** When the FastAPI server boots up, it reads a highly detailed JSON database of open jobs (`jobs.json`). It combines the strict `Skills`, `Experience`, and `Education` demands of every job into dense strings and pre-computes their mathematical embeddings.
2. **User Uploads Resume:** A user drags and drops a PDF into the glowing React UI. The backend catches the file and uses `pdfplumber` to extract all native organic text.
3. **Vector Database Generation:** The resume is aggressively sliced into sliding 350-character chunks and projected into an ephemeral FAISS Vector Database uniquely mapped to a UUID constraint.
4. **Semantic Extraction:** We blindly query the FAISS database to extract *only* the core "skills and experience" components of the candidate's life, stripping away formatting noise and irrelevant hobbies.
5. **Phase 1: Pure Mathematical Matchmaking:** The system runs a rigorous `cosine_similarity` matrix comparing the isolated resume chunks against the 26 pre-computed company jobs. The backend applies an aggressive `1.25x` geometric multiplier to map complex NLP distance scores cleanly onto a human-readable 0-100% scale.
6. **Phase 2: Generative JSON Rigging:** The Top 3 mathematically ranked jobs, along with the candidate's raw data chunks, are piped into Google Gemini. The model is forced under strict instruction to output a complex `application/json` payload detailing exactly *why* they fit, exactly what they are *missing*, and specific *mock interview questions*.
7. **Frontend Render:** The React application intercepts the JSON and elegantly renders it into a 5-tier colored visual layout, complete with copying tools and interactive logic. 

---

## ✨ Features

- **Double-RAG Pipeline:** Utilizes both FAISS Semantic Search and Gemini Generative AI to ensure zero hallucinations and mathematically pure matchmaking.
- **Dynamic 4-Tier UI Scaling:** A visually striking, glassmorphic UI that actively sorts and color-codes results in real-time (`Great Match` | `Good Match` | `Decent Match` | `Improvement Needed`).
- **Edge-Case Discrimination:** Built to natively handle identical titles (e.g., separating an AWS Data Scientist from an R-based Causal Inference Data Scientist) based purely on requirement vectors.
- **Actionable AI Feedback:** Instantly generates tailored "Missing Skills" lists to optimize candidate study sessions.
- **Custom Interview FAQs:** Generates 3 hyper-specific Mock Interview questions + answers based exactly on the cross-section of the opening's tech stack and the candidate's weaknesses.

---

## 🛠️ Tech Stack

### Frontend UI
- **Framework:** React (Bootstrapped incredibly fast via Vite)
- **Styling:** Custom Vanilla CSS (Dark mode, neon glassmorphism gradients, CSS Grid layouts)
- **State Management:** Native React Hooks handling 5 distinct asynchronous upload/LLM stages seamlessly.

### Backend API
- **Framework:** FastAPI (Python, Uvicorn)
- **Document Parsing:** `pdfplumber`
- **Vector Math:** `numpy`, `scikit-learn` (`cosine_similarity`)
- **Semantic Mapping / RAG Engine:** `sentence-transformers` (`all-MiniLM-L6-v2`) inside a Facebook `FAISS` indexing engine.
- **Generative AI:** Google Gemini SDK (`gemini-3-flash-preview` strictly locked to `application/json` output).

---

## 🚀 Getting Started

### 1. Start the Backend
Navigate to the root directory and ensure your `.env` contains your `GEMINI_API_KEY`.
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### 2. Start the Frontend
Open a secondary terminal and boot up the UI.
```bash
cd frontend
npm install
npm run dev
```

Hold `CTRL` and click the `localhost:5173` link printed in your terminal to boot up the **TalentAlign** dashboard!
