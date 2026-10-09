const API_BASE_URL = "https://scholarly-uguj.onrender.com";

const fileInput = document.getElementById("pdf-file");
const uploadButton = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");
const documentList = document.getElementById("document-list");
const chatForm = document.getElementById("chat-form");
const questionInput = document.getElementById("question-input");
const chatMessages = document.getElementById("chat-messages");
const taskSelect = document.getElementById("task-select");
const sendButton = document.getElementById("send-btn");
const connectionStatus = document.getElementById("connection-status");

let documents = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function addMessage(text, role = "assistant") {
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${role}`;

  const title = role === "user" ? "You" : "NeuroScholar AI";

  bubble.innerHTML = `<strong>${title}</strong><p>${escapeHtml(text)}</p>`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return bubble.querySelector("p");
}


function backendUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`;
}


function showUploadStatus(type, filename, detail = "") {
  const icons = {
    success: "✓",
    error: "!",
    loading: "↻"
  };

  const titles = {
    success: "Upload successful",
    error: "Upload failed",
    loading: "Uploading PDF..."
  };

  uploadStatus.className = `message upload-result ${type}`;

  uploadStatus.replaceChildren();

  const icon = document.createElement("span");
  icon.className = "upload-result-icon";
  icon.textContent = icons[type];

  const content = document.createElement("span");
  content.className = "upload-result-content";

  const title = document.createElement("strong");
  title.textContent = titles[type];

  const fileName = document.createElement("span");
  fileName.className = "upload-filename";
  fileName.textContent = filename;

  content.append(title, fileName);

  if (detail) {
    const message = document.createElement("span");
    message.className = "upload-error-detail";
    message.textContent = detail;
    content.appendChild(message);
  }

  uploadStatus.append(icon, content);
}

async function checkBackend() {
  try {
    const response = await fetch(backendUrl("/"));

    if (!response.ok) {
      throw new Error("Backend not responding");
    }

    connectionStatus.textContent = "Backend connected";
    connectionStatus.className = "status online";
  } catch (error) {
    connectionStatus.textContent = "Backend unavailable";
    connectionStatus.className = "status offline";
  }
}

async function loadDocuments() {
  documentList.textContent = "Loading documents...";

  try {
    const response = await fetch(backendUrl("/documents"));

    if (!response.ok) {
      throw new Error("Could not load documents");
    }

    const data = await response.json();

    documents = Array.isArray(data)
      ? data
      : (data.documents || data.files || []);

    renderDocuments();
  } catch (error) {
    documentList.textContent =
      "Could not load documents. Check your backend and CORS settings.";
  }
}

function renderDocuments() {
  documentList.replaceChildren();

  if (!documents.length) {
    documentList.textContent = "No PDFs uploaded yet.";
    return;
  }

  documents.forEach((item) => {
    const name = typeof item === "string"
      ? item
      : (item.filename || item.name || "");

    if (!name) return;

    const label = document.createElement("label");
    label.className = "document-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = name;
    checkbox.checked = true;

    const text = document.createElement("span");
    text.textContent = `📄 ${name}`;

    label.append(checkbox, text);
    documentList.appendChild(label);
  });
}

// PDF upload with filename-specific success/error feedback
uploadButton.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    uploadStatus.className = "message upload-result error";
    uploadStatus.textContent = "Please select a PDF first.";
    return;
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showUploadStatus("error", file.name, "Only PDF files are supported.");
    return;
  }

  uploadButton.disabled = true;
  uploadButton.textContent = "Uploading...";

  showUploadStatus("loading", file.name);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(backendUrl("/upload"), {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "The server rejected the upload.");
    }

    showUploadStatus(
      "success",
      data.filename || file.name,
      "Your PDF was saved by the backend."
    );

    fileInput.value = "";

    // Refresh the list after a successful upload.
    await loadDocuments();
  } catch (error) {
    showUploadStatus(
      "error",
      file.name,
      error.message || "Please check your backend connection."
    );
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = "Upload PDF";
  }
});

document.getElementById("refresh-docs")
  .addEventListener("click", loadDocuments);

// Feature cards select a research task.
document.querySelectorAll("[data-task]").forEach((button) => {
  button.addEventListener("click", () => {
    taskSelect.value = button.dataset.task;

    document.getElementById("dashboard").scrollIntoView({
      behavior: "smooth"
    });

    questionInput.focus();
  });
});

// Stream AI responses from FastAPI.
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (!question) return;

  const selectedDocuments = Array.from(
    document.querySelectorAll(
      "#document-list input[type='checkbox']:checked"
    )
  ).map((checkbox) => checkbox.value);

  addMessage(question, "user");

  questionInput.value = "";
  sendButton.disabled = true;
  sendButton.textContent = "Thinking...";

  const answerElement = addMessage("Generating your answer...");

  try {
    const response = await fetch(backendUrl("/chat/stream"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        task: taskSelect.value,
        documents: selectedDocuments
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(errorBody || `Request failed (${response.status})`);
    }

    if (!response.body) {
      throw new Error("Streaming is not supported by this response.");
    }

    answerElement.textContent = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let receivedAnswer = false;

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const eventText of events) {
        const dataLine = eventText
          .split("\n")
          .find((line) => line.startsWith("data:"));

        if (!dataLine) continue;

        let payload;

        try {
          payload = JSON.parse(dataLine.slice(5).trim());
        } catch {
          continue;
        }

        if (payload.type === "token" && payload.content) {
          answerElement.textContent += payload.content;
          receivedAnswer = true;
        } else if (payload.type === "final") {
          const finalAnswer = payload.answer || payload.content;

          if (finalAnswer) {
            answerElement.textContent = finalAnswer;
            receivedAnswer = true;
          }
        } else if (payload.type === "error") {
          throw new Error(
            payload.message || "The backend reported an error."
          );
        }
      }
    }

    // Process a final event if the stream ends without a trailing separator.
    if (buffer.trim()) {
      const dataLine = buffer
        .split("\n")
        .find((line) => line.startsWith("data:"));

      if (dataLine) {
        try {
          const payload = JSON.parse(dataLine.slice(5).trim());

          if (payload.type === "token" && payload.content) {
            answerElement.textContent += payload.content;
            receivedAnswer = true;
          } else if (payload.type === "final") {
            const finalAnswer = payload.answer || payload.content;

            if (finalAnswer) {
              answerElement.textContent = finalAnswer;
              receivedAnswer = true;
            }
          } else if (payload.type === "error") {
            throw new Error(payload.message || "Streaming failed.");
          }
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
        }
      }
    }

    if (!receivedAnswer) {
      answerElement.textContent =
        "No answer was received. Check the backend logs and API key.";
    }
  } catch (error) {
    answerElement.textContent = `Error: ${error.message}`;
  } finally {
    sendButton.disabled = false;
    sendButton.textContent = "Send ↑";
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

checkBackend();
loadDocuments();
