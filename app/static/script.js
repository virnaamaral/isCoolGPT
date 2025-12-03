const form = document.getElementById("ask-form");
const questionInput = document.getElementById("question");
const messagesEl = document.getElementById("messages");
const statusEl = document.getElementById("status");
const sendButton = document.getElementById("send-button");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(rawText) {
  // 1) Escapa HTML pra evitar XSS
  let text = escapeHtml(rawText);

  // 2) Quebra em linhas pra processar listas e títulos
  const lines = text.split(/\r?\n/);
  const out = [];
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h4>${trimmed.slice(4)}</h4>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3>${trimmed.slice(3)}</h3>`);
    } else if (trimmed.startsWith("# ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h2>${trimmed.slice(2)}</h2>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${trimmed.slice(2)}</li>`);
    } else if (trimmed === "") {
      // linha vazia = quebra de parágrafo
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push("<br>");
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(trimmed);
    }
  }

  if (inList) {
    out.push("</ul>");
  }

  text = out.join("\n");

  // 3) Negrito e itálico
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return text;
}

let typingElement = null;

function scrollToBottom() {
  // Espera o layout atualizar antes de tentar scrollar
  window.requestAnimationFrame(() => {
    const last = messagesEl.lastElementChild;
    if (last) {
      last.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  });
}

// cria a mensagem de "digitando..."
function showTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant typing";

  const header = document.createElement("div");
  header.className = "message-header";
  header.textContent = "isCoolGPT";

  const body = document.createElement("div");
  body.className = "message-body";

  const dots = document.createElement("div");
  dots.className = "typing-dots";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    dots.appendChild(dot);
  }

  body.appendChild(dots);
  wrapper.appendChild(header);
  wrapper.appendChild(body);

  messagesEl.appendChild(wrapper);
  scrollToBottom();

  return wrapper;
}

function removeTypingIndicator() {
  if (typingElement && typingElement.parentNode) {
    typingElement.parentNode.removeChild(typingElement);
  }
  typingElement = null;
}

// Adiciona uma mensagem na tela
function addMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const header = document.createElement("div");
  header.className = "message-header";
  header.textContent = role === "user" ? "Você" : "isCoolGPT";

  const body = document.createElement("div");
  body.className = "message-body";

  if (role === "assistant") {
    body.innerHTML = renderMarkdown(text);
  } else {
    body.textContent = text;
  }

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

async function handleSubmit(event) {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  // mensagem do usuário
  addMessage("user", question);
  questionInput.value = "";
  questionInput.focus();

  // status + bolha de digitando
  statusEl.textContent = "Pensando...";
  sendButton.disabled = true;
  typingElement = showTypingIndicator();

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // TROCAR "question" aqui se o campo do backend tiver outro nome
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Erro na API (${response.status}): ${text || response.statusText}`
      );
    }

    const data = await response.json();

    // remove "digitando..." antes de mostrar a resposta
    removeTypingIndicator();

    const answer =
      data.answer ??
      data.response ??
      data.message ??
      JSON.stringify(data, null, 2);

    addMessage("assistant", answer);
  } catch (err) {
    console.error(err);
    removeTypingIndicator();
    addMessage(
      "assistant",
      "Ops, deu erro ao falar com o backend. Confere se a API está rodando e tenta de novo."
    );
  } finally {
    statusEl.textContent = "";
    sendButton.disabled = false;
  }
}

// Enviar no submit do form
form.addEventListener("submit", handleSubmit);

// Enviar com Enter, quebrar linha com Shift+Enter
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();        // impede quebra de linha no textarea
    form.requestSubmit();          // dispara o submit do formulário
  }
});

