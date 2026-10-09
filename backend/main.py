
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
import json

from schemas import (
    ChatRequest,
    ChatResponse,
    SessionCreate,
)

from graph.workflow import graph
from utils.pdf_generator import create_pdf

from routes.upload import router as upload_router
from routes.documents import router as documents_router

from database import Base, engine, SessionLocal
from models import ChatSession


# ==========================================================
# FastAPI
# ==========================================================

app = FastAPI(
    title="NeuroScholar AI",
    version="1.0.0",
)

Base.metadata.create_all(bind=engine)


# ==========================================================
# Routers
# ==========================================================

app.include_router(upload_router)
app.include_router(documents_router)


# ==========================================================
# CORS
# ==========================================================



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "https://scholarly.trishnajaiswar35.workers.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ==========================================================
# Health
# ==========================================================

@app.get("/")
def root():
    return {"message": "NeuroScholar AI Backend Running"}


# ==========================================================
# Normal Chat
# ==========================================================

@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):

    result = graph.invoke({
        "question": req.question,
        "forced_task": req.task,
        "selected_documents": req.documents,
    })

    citations = []

    if result.get("citation"):
        citations = [
            {
                "source": c.source,
                "page": c.page,
                "quote": c.quote,
            }
            for c in result["citation"].citations
        ]

    return ChatResponse(
        answer=result["answer"],
        task=result["planner"].task,
        citations=citations,
    )


# ==========================================================
# Streaming Chat
# ==========================================================

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):

    inputs = {
        "question": req.question,
        "forced_task": req.task,
        "selected_documents": req.documents,
    }

    async def event_generator():

        streamed_text = ""
        final_answer = None

        try:
            async for event in graph.astream_events(
                inputs,
                version="v2",
            ):

                event_type = event.get("event")

                if event_type == "on_chat_model_stream":

                    chunk = event.get("data", {}).get("chunk")

                    if chunk is None:
                        continue

                    content = getattr(chunk, "content", "")

                    if isinstance(content, str):

                        if content:
                            streamed_text += content

                            yield (
                                "data: "
                                + json.dumps({
                                    "type": "token",
                                    "content": content,
                                })
                                + "\n\n"
                            )

                    elif isinstance(content, list):

                        for item in content:

                            text = ""

                            if isinstance(item, str):
                                text = item
                            elif isinstance(item, dict):
                                text = item.get("text", "")

                            if text:
                                streamed_text += text

                                yield (
                                    "data: "
                                    + json.dumps({
                                        "type": "token",
                                        "content": text,
                                    })
                                    + "\n\n"
                                )

                elif event_type == "on_chain_end":

                    output = event.get("data", {}).get("output")

                    if isinstance(output, dict):
                        answer = output.get("answer")

                        if answer:
                            final_answer = answer

            if final_answer and not streamed_text:

                yield (
                    "data: "
                    + json.dumps({
                        "type": "final",
                        "content": str(final_answer),
                    })
                    + "\n\n"
                )

            yield (
                "data: "
                + json.dumps({"type": "done"})
                + "\n\n"
            )

        except Exception as e:

            print("\n========== STREAM ERROR ==========")
            print(repr(e))
            print("=================================\n")

            yield (
                "data: "
                + json.dumps({
                    "type": "error",
                    "message": str(e),
                })
                + "\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ==========================================================
# Export PDF
# ==========================================================

@app.post("/export")
def export_report(req: ChatRequest):

    result = graph.invoke({
        "question": req.question,
        "forced_task": "report_generation",
        "selected_documents": req.documents,
    })

    report = result.get("report")

    if not report:
        return Response(
            content=b"Report generation failed.",
            status_code=500,
            media_type="text/plain",
        )

    pdf_bytes = create_pdf(report)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                'attachment; filename="NeuroScholar_Report.pdf"'
        },
    )


# ==========================================================
# Chat Session Persistence
# ==========================================================

@app.post("/sessions")
def save_session(req: SessionCreate):

    db = SessionLocal()

    try:
        session = ChatSession(
            title=req.title,
            task=req.task,
            messages=json.dumps(req.messages),
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return {"id": session.id}

    finally:
        db.close()


@app.get("/sessions")
def get_sessions():

    db = SessionLocal()

    try:
        sessions = db.query(ChatSession).all()

        return [
            {
                "id": s.id,
                "title": s.title,
                "task": s.task,
            }
            for s in sessions
        ]

    finally:
        db.close()


@app.get("/sessions/{session_id}")
def load_session(session_id: int):

    db = SessionLocal()

    try:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .first()
        )

        if not session:
            return {"error": "Session not found"}

        return {
            "id": session.id,
            "title": session.title,
            "task": session.task,
            "messages": json.loads(session.messages),
        }

    finally:
        db.close()


@app.put("/sessions/{session_id}")
def update_session(session_id: int, req: SessionCreate):

    db = SessionLocal()

    try:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .first()
        )

        if not session:
            return {"error": "Session not found"}

        session.title = req.title
        session.task = req.task
        session.messages = json.dumps(req.messages)

        db.commit()

        return {"message": "Session updated"}

    finally:
        db.close()


@app.delete("/sessions/{session_id}")
def delete_session(session_id: int):

    db = SessionLocal()

    try:
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .first()
        )

        if session:
            db.delete(session)
            db.commit()

        return {"message": "Session deleted"}

    finally:
        db.close()