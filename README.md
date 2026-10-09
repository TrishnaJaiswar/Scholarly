# 🧠 NeuroScholar AI

### Agentic Multi-Document Research Intelligence Platform

**NeuroScholar AI** is an AI-powered research platform that helps users explore multiple scientific papers through conversational research, literature review workflows, paper comparison, trend analysis, and academic report generation.

Built with **FastAPI, LangGraph, LangChain, and Hybrid RAG**, the platform combines semantic and keyword retrieval with agentic workflows to support research grounded in uploaded documents.

🌐 **Live Demo:** [Open NeuroScholar AI](https://scholarly.trishnajaiswar35.workers.dev)  
⚙️ **Backend API:** [Render API](https://scholarly-uguj.onrender.com)  
📘 **API Documentation:** [Swagger UI](https://scholarly-uguj.onrender.com/docs)  
💻 **Repository:** [GitHub](https://github.com/TrishnaJaiswar/NeuroScholar-AI)

---

## 🚀 Features

- 💬 **Research Chat** — ask questions about uploaded research papers.
- 📚 **Literature Review** — generate structured research summaries.
- 📄 **Paper Comparison** — compare findings, methodologies, and results.
- 📈 **Trend Analysis** — identify patterns across selected documents.
- 🔍 **Hybrid RAG** — combine FAISS semantic retrieval and BM25 keyword search.
- 🔎 **Multi-Query Retrieval** — expand queries to improve document discovery.
- 📑 **Multi-PDF Support** — upload and query research documents.
- 🤖 **LangGraph Workflows** — orchestrate specialized research tasks.
- 🧾 **Source-Aware Citations** — provide document references and supporting evidence where available.
- 🗂️ **Persistent Research Sessions** — store and retrieve chat history using SQLite.
- 📤 **PDF Report Export** — generate downloadable academic reports.
- 🌐 **Cloud Deployment** — serve the frontend through Cloudflare and the API through Render.

---

## 🏗️ Architecture

```text
                  User / Researcher
                          |
                          v
             Cloudflare-hosted Frontend
              HTML + CSS + JavaScript
                          |
                    HTTPS / REST
                          |
                          v
                Render-hosted FastAPI
                          |
             +------------+------------+
             |            |            |
             v            v            v
         Upload API   Chat API    Session API
             |            |            |
             v            v            v
        PDF Pipeline  LangGraph      SQLite
                          |
                          v
                  Research Workflow
                          |
             +------------+------------+
             |            |            |
             v            v            v
          Planner     Retrieval     Research
                          |
                          v
                  Hybrid Retrieval
                    FAISS + BM25
                          |
                          v
                  Analysis / Citations
                          |
                          v
                    Report Agent
                          |
                          v
                 PDF Report Generator
```

---

## 🤖 Agentic Research Workflow

The application organizes research tasks through a LangGraph workflow and specialized components.

| Component | Responsibility |
|---|---|
| Planner | Determines the research task and workflow |
| Retrieval | Retrieves relevant passages from available documents |
| Research | Develops document-grounded research insights |
| Analysis | Supports comparison and cross-document analysis |
| Citation | Handles source references and supporting evidence |
| Report | Supports structured academic report generation |

The workflow is designed to coordinate multi-step research tasks rather than treating every request as a standalone question-answering interaction.

---

## 🧠 Retrieval-Augmented Generation

The retrieval pipeline is designed to improve the relevance and grounding of generated responses.

### Retrieval components

- **FAISS:** semantic similarity search over document embeddings.
- **BM25:** keyword-based document retrieval.
- **Multi-query retrieval:** expands the original question into alternative search queries.
- **LLM generation:** uses retrieved context to answer research questions.
- **Citation handling:** associates research responses with available document evidence.

Retrieval quality depends on document extraction, indexing, query formulation, and the relevance of the retrieved passages.

---

## 🖥️ Research Workflows

| Workflow | Purpose |
|---|---|
| Research Chat | Ask questions about uploaded papers |
| Literature Review | Create structured literature reviews |
| Paper Comparison | Compare methods, findings, and limitations |
| Trend Analysis | Explore common themes across documents |
| Report Generation | Generate an academic report and export it as PDF |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Python, FastAPI |
| Agent Orchestration | LangGraph |
| LLM / AI Integration | Groq |
| RAG Framework | LangChain |
| Semantic Retrieval | FAISS |
| Keyword Retrieval | BM25 |
| Embeddings | Hugging Face Sentence Transformers |
| Database | SQLite, SQLAlchemy |
| PDF Generation | ReportLab |
| API Communication | REST, JSON, Server-Sent Event-style streaming |
| Frontend Hosting | Cloudflare Workers |
| Backend Hosting | Render |
| Version Control | Git, GitHub |
| Containerization | Docker configuration included in the project |

---

## 📂 Project Structure

```text
NeuroScholar-AI/
│
├── backend/
│   ├── agents/
│   │   ├── planner_agent.py
│   │   ├── retrieval_agent.py
│   │   ├── research_agent.py
│   │   ├── analysis_agent.py
│   │   ├── citation_agent.py
│   │   └── report_agent.py
│   │
│   ├── graph/
│   │   ├── workflow.py
│   │   └── state.py
│   │
│   ├── rag/
│   │   └── Hybrid_pipeline.py
│   │
│   ├── routes/
│   │   ├── upload.py
│   │   └── documents.py
│   │
│   ├── utils/
│   │   └── pdf_generator.py
│   │
│   ├── main.py
│   ├── schemas.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── Dockerfile
│
├── docker-compose.yml
├── pyproject.toml
├── .gitignore
└── README.md
```

*The tree illustrates the current vanilla JavaScript frontend structure. Keep filenames in sync with the actual repository if your folders differ.*

---

## 📡 API Endpoints

The following endpoints are defined in the FastAPI application or registered routers.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/chat` | Submit a research question |
| POST | `/chat/stream` | Receive a streamed chat response |
| POST | `/upload` | Upload a PDF document |
| GET | `/documents` | Retrieve the document list |
| POST | `/sessions` | Save a research session |
| GET | `/sessions` | List saved sessions |
| GET | `/sessions/{session_id}` | Retrieve a saved session |
| PUT | `/sessions/{session_id}` | Update a saved session |
| DELETE | `/sessions/{session_id}` | Delete a saved session |
| POST | `/export` | Generate a PDF research report |

Interactive API documentation is available at [`/docs`](https://scholarly-uguj.onrender.com/docs) when the backend is running.

---

## ⚙️ Local Installation

### Prerequisites

- Python 3.10 or a compatible version supported by the project dependencies
- Git
- A Groq API key
- A modern web browser

### 1. Clone the repository

```bash
git clone https://github.com/TrishnaJaiswar/NeuroScholar-AI.git
cd NeuroScholar-AI
```

### 2. Configure the backend

```bash
cd backend
python -m venv venv
```

Activate the environment on Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key
```

Use the exact environment variable names expected by your application and its configured LLM client. Never commit real credentials to GitHub.

### 3. Start the FastAPI backend

From the `backend/` directory:

```bash
uvicorn main:app --reload
```

The local API will be available at:

- API: `http://127.0.0.1:8000`
- Swagger documentation: `http://127.0.0.1:8000/docs`

### 4. Start the frontend

The current frontend uses plain HTML, CSS, and JavaScript, so a React/Vite build is not required.

From the repository root, serve the frontend using a local static web server. For example, with Python:

```bash
cd frontend
python -m http.server 5500
```

Open `http://localhost:5500` in your browser.

Ensure the backend's CORS configuration permits your local frontend origin. The frontend's `API_BASE_URL` should point to the local API during local development.

---

## 🌐 Deployment

### Frontend — Cloudflare

The frontend is deployed at:

**[https://scholarly.trishnajaiswar35.workers.dev](https://scholarly.trishnajaiswar35.workers.dev)**

The frontend uses the Render API base URL:

```javascript
const API_BASE_URL = "https://scholarly-uguj.onrender.com";
```

### Backend — Render

The FastAPI backend is deployed at:

**[https://scholarly-uguj.onrender.com](https://scholarly-uguj.onrender.com)**

The Render service should use `backend` as its root directory when configured from the repository root, with the appropriate Python or Docker runtime settings.

### CORS configuration

The FastAPI application must allow the deployed frontend origin:

```python
allow_origins=[
    "https://scholarly.trishnajaiswar35.workers.dev",
]
```

Add local development origins if required. Do not use a wildcard origin when relying on credentialed cross-origin requests.

### Production considerations

- Configure API keys through the hosting provider's environment settings.
- Verify that uploaded files and the database use storage appropriate for the hosting environment.
- Check backend logs after each deployment.
- Test document upload, retrieval, chat streaming, sessions, and PDF export on the deployed application.
- Confirm that the API URL and CORS origins match the current deployment.

---

## 🔑 Environment Variables

Create `backend/.env` for local development:

```env
GROQ_API_KEY=your_groq_api_key
```

Configure the same required variables in Render's environment settings for production.

If your application uses additional variables for model configuration, database paths, or storage, document them here using their actual names.

**Security:** Keep `.env` files out of source control. Commit a sanitized `.env.example` instead.

---

## 📸 Screenshots

### Application Interface

![NeuroScholar AI interface](https://github.com/user-attachments/assets/e487100b-7a5f-4350-b4c2-d816881d431c)

![NeuroScholar AI research workspace](https://github.com/user-attachments/assets/4f2b0dcb-dc33-4e6e-bc9c-1b1d36531052)

---

## 🎯 Engineering Highlights

- Designed an agentic research workflow using LangGraph and specialized components.
- Implemented a hybrid retrieval approach combining FAISS semantic search and BM25 keyword search.
- Built FastAPI endpoints for document upload, research chat, streaming responses, session persistence, and PDF export.
- Integrated multi-document research workflows for literature review, comparison, and trend analysis.
- Added persistent research sessions using SQLite and SQLAlchemy.
- Developed a browser-based frontend using HTML, CSS, and JavaScript.
- Deployed the frontend and backend separately using Cloudflare and Render.

---

## 🗺️ Future Improvements

Potential next steps include:

- Automated retrieval and citation evaluation.
- Research quality metrics and regression tests.
- Improved PDF ingestion, chunking, and indexing performance.
- Observability for agent execution and LLM calls.
- Authentication and user-specific document isolation.
- Persistent production-grade storage for uploaded files and research data.
- CI/CD and container-based deployment automation.

---

## 👩‍💻 Author

**Trishna Jaiswar**  
AI Engineer | Agentic AI • RAG • LangGraph • FastAPI

- **GitHub:** [TrishnaJaiswar](https://github.com/TrishnaJaiswar)
- **LinkedIn:** [Trishna Jaiswar](https://linkedin.com/in/trishna-jaiswar-a6a230322)

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
