import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

const getScoreTier = (score) => {
  if (score >= 90) return { label: 'Great Match', class: 'badge-great' }
  if (score >= 75) return { label: 'Good Match', class: 'badge-good' }
  if (score >= 60) return { label: 'Decent Match', class: 'badge-decent' }
  return { label: 'Improvement Needed', class: 'badge-poor' }
}

export default function App() {
  // 5 Explicit States: idle | uploading | processing | success | error
  const [appState, setAppState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [results, setResults] = useState(null)
  
  // Temporary storage for retry logic
  const [lastResumeId, setLastResumeId] = useState('')

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      triggerError("Please upload a valid PDF file.")
      return
    }

    setAppState('uploading')
    setErrorMessage('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Step 1: Upload PDF
      const uploadRes = await fetch(`${API_BASE}/upload-resume`, {
        method: 'POST',
        body: formData
      })
      
      const uploadData = await uploadRes.json()
      
      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error || "Failed to upload resume")
      }

      setLastResumeId(uploadData.resume_id)
      
      // Step 2: Trigger RAG
      await triggerRagAnalysis(uploadData.resume_id)
      
    } catch (err) {
      triggerError(err.message)
    }
  }

  const triggerRagAnalysis = async (resumeId) => {
    setAppState('processing')
    try {
      const ragRes = await fetch(`${API_BASE}/match-jobs-rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resume_id: resumeId })
      })

      const ragData = await ragRes.json()

      if (!ragRes.ok || ragData.error) {
        throw new Error(ragData.error || "RAG Analysis failed")
      }

      // JSON Safeguard Check
      if (!ragData.roles || !Array.isArray(ragData.roles)) {
        throw new Error("Invalid response format received from AI.")
      }

      setResults(ragData.roles)
      setAppState('success')

    } catch (err) {
      triggerError(err.message)
    }
  }

  const triggerError = (msg) => {
    setErrorMessage(msg)
    setAppState('error')
  }

  const handleRetry = () => {
    if (lastResumeId) {
      triggerRagAnalysis(lastResumeId)
    } else {
      setAppState('idle')
    }
  }

  const resetFlow = () => {
    setAppState('idle')
    setResults(null)
    setLastResumeId('')
    setErrorMessage('')
  }
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="app-container">
      <div className="legend-container">
        <div className="legend-title">Scoring System</div>
        <div className="legend-item"><div className="legend-color" style={{background: 'var(--tier-great)'}}></div> &gt; 90% (Great Match)</div>
        <div className="legend-item"><div className="legend-color" style={{background: 'var(--tier-good)'}}></div> 75% - 90% (Good Match)</div>
        <div className="legend-item"><div className="legend-color" style={{background: 'var(--tier-decent)'}}></div> 60% - 75% (Decent Match)</div>
        <div className="legend-item"><div className="legend-color" style={{background: 'var(--tier-poor)'}}></div> &lt; 60% (Improvement Needed)</div>
      </div>

      <header>
        <h1>TalentAlign</h1>
        <p>AI-Powered Mathematical Job Matchmaking</p>
      </header>

      {appState === 'idle' && (
        <div className="upload-box">
          <input 
            type="file" 
            className="file-input" 
            accept=".pdf"
            onChange={handleFileUpload}
          />
          <div className="upload-icon">📄</div>
          <h3>Drag & Drop your Resume (.PDF)</h3>
          <p style={{marginTop: '10px', color: 'var(--text-muted)'}}>We will extract your skills and mathematically rank you against open jobs.</p>
        </div>
      )}

      {appState === 'uploading' && (
        <div className="state-container">
          <div className="spinner"></div>
          <h3>Uploading & Extracting...</h3>
          <p>Parsing PDF and generating semantic chunks...</p>
        </div>
      )}

      {appState === 'processing' && (
        <div className="state-container">
          <div className="spinner"></div>
          <h3>Analyzing your resume...</h3>
          <p>Running FAISS Vector Math and Gemini RAG Inference (This may take 5-10s)...</p>
        </div>
      )}

      {appState === 'error' && (
        <div className="state-container">
          <div className="error-box">
            <h3>Something went wrong</h3>
            <p>{errorMessage}</p>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            {lastResumeId && <button className="btn" onClick={handleRetry}>Retry RAG Analysis</button>}
            <button className="btn btn-secondary" onClick={resetFlow}>Upload New Resume</button>
          </div>
        </div>
      )}

      {appState === 'success' && results && (
        <div className="results-container">
          <div className="controls">
            <h2 className="results-header">Top Job Matches</h2>
            <button className="btn btn-secondary" onClick={resetFlow}>Upload New</button>
          </div>
          
          <div className="cards-container">
            {results.map((role, idx) => {
              const tier = getScoreTier(role.numeric_score);
              return (
              <div className="job-card" key={idx}>
                <div className="card-header">
                  <div>
                    <h3 className="job-title">{role.title}</h3>
                    <div className="company-name">{role.company}</div>
                  </div>
                  <div className={`score-badge ${tier.class}`}>{role.numeric_score}% - {tier.label}</div>
                </div>
                
                <p className="reason">{role.reason}</p>
                
                {role.missing_skills?.length > 0 && (
                  <div className="tags-section">
                    <h4>
                      Missing Skills 
                      <button className="btn-small" onClick={() => copyToClipboard(role.missing_skills.join(", "))}>Copy</button>
                    </h4>
                    <div className="tag-list">
                      {role.missing_skills.map((skill, i) => (
                        <span className="tag" key={i}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {role.interview_topics?.length > 0 && (
                  <div className="tags-section">
                    <h4>
                      Interview Prep 
                      <button className="btn-small" onClick={() => copyToClipboard(role.interview_topics.join("\\n"))}>Copy</button>
                    </h4>
                    <ul className="interview-list">
                      {role.interview_topics.map((topic, i) => (
                        <li key={i}>{topic}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {role.mock_questions?.length > 0 && (
                  <div className="tags-section" style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed var(--border)'}}>
                    <h4>Interview FAQs</h4>
                    <ul className="interview-list" style={{marginTop: '10px'}}>
                      {role.mock_questions.map((q, i) => (
                        <li key={i} style={{marginBottom: '12px'}}>
                          <strong style={{color: 'white'}}>Q: {q.question}</strong><br/>
                          <span style={{color: 'var(--accent-cyan)', fontSize: '0.9rem'}}>A: {q.answer}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
