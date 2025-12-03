const form = document.getElementById("ask-form");
const questionInput = document.getElementById("question");
const messagesEl = document.getElementById("messages");
const statusEl = document.getElementById("status");
const sendButton = document.getElementById("send-button");

// Adiciona uma mensagem na tela
function addMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const header = document.createElement("div");
  header.className = "message-header";
  header.textContent = role === "user" ? "Você" : "isCoolGPT";

  const body = document.createElement("div");
  body.className = "message-body";
  body.textContent = text;

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function handleSubmit(event) {
  event.preventDefault();

  const question = questionInput.value.trim();
  if (!question) return;

  // mostra mensagem do usuário
  addMessage("user", question);
  questionInput.value = "";
  questionInput.focus();

  // mostra status de carregando
  statusEl.textContent = "Pensando com ajuda da gemma3:1b...";
  sendButton.disabled = true;

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 🔴 Se no backend o campo não for "question",
      // TROQUE aqui (ex: { prompt: question })
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Erro na API (${response.status}): ${text || response.statusText}`
      );
    }

    const data = await response.json();

    // 🔴 Se no backend a resposta vier em outra chave,
    // troque "answer" pelo nome certo.
    const answer =
      data.answer ??
      data.response ??
      data.message ??
      JSON.stringify(data, null, 2);

    addMessage("assistant", answer);
  } catch (err) {
    console.error(err);
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

