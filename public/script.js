const icon = document.getElementById("chatbot-icon");
const container = document.getElementById("chatbot-container");
const closeBtn = document.getElementById("close-btn");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");
const sendBtn = document.getElementById("send-btn");
const messagesEl = document.getElementById("chatbot-messages");
const typing = document.getElementById("typing-indicator");

const conversation = [];

icon.addEventListener("click", () => {
  container.classList.remove("hidden");
  input.focus();
});

closeBtn.addEventListener("click", () => {
  container.classList.add("hidden");
});

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatInline(text) {
  return text
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

function renderMarkdown(text) {
  const codeBlocks = [];
 const safeText = escapeHTML(
  String(text ?? "")
    .replace(/\\([*_`#~|])/g, "$1")
    .replace(/\\+/g, "\\")
);
  // Preserve fenced code blocks before formatting other Markdown.
  let content = safeText.replace(
    /```([^\n]*)\n?([\s\S]*?)```/g,
    (_, language, code) => {
      const index = codeBlocks.length;
      const languageClass = language.trim()
        ? ` class="language-${language.trim().replace(/[^a-zA-Z0-9_-]/g, "")}"`
        : "";

      codeBlocks.push(
        `<pre><code${languageClass}>${code}</code></pre>`
      );

      return `\u0000CODE${index}\u0000`;
    }
  );

  content = content.replace(
    /^### (.+)$/gm,
    "<h3>$1</h3>"
  );

  content = content.replace(
    /^## (.+)$/gm,
    "<h2>$1</h2>"
  );

  content = content.replace(
    /^# (.+)$/gm,
    "<h1>$1</h1>"
  );

  content = content.replace(
    /^\s*[-*] (.+)$/gm,
    "<li>$1</li>"
  );

  content = content.replace(
    /^\s*\d+[.)] (.+)$/gm,
    "<li>$1</li>"
  );

  content = content.replace(
    /(<li>.*<\/li>\n?)+/g,
    (list) => `<ul>${list.replace(/\n/g, "")}</ul>`
  );

  content = content
    .split(/\n{2,}/)
    .map((part) => {
      part = part.trim();

      if (
        !part ||
        /^<(h[1-3]|ul|pre)\b/.test(part) ||
        /^\u0000CODE\d+\u0000$/.test(part)
      ) {
        return part;
      }

      return `<p>${formatInline(part.replace(/\n/g, "<br>"))}</p>`;
    })
    .join("");

  content = content.replace(
    /\u0000CODE(\d+)\u0000/g,
    (_, index) => codeBlocks[Number(index)] || ""
  );

  return content;
}

function addMessage(text, role) {
  const wrapper = document.createElement("div");

  wrapper.className =
    `message ${role === "user" ? "user-message" : "assistant-message"}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  if (role === "assistant") {
    bubble.innerHTML = renderMarkdown(text);
  } else {
    bubble.textContent = text;
  }

  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function loading(value) {
  typing.classList.toggle("hidden", !value);
  sendBtn.disabled = value;
  input.disabled = value;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();

  if (!text || sendBtn.disabled) {
    return;
  }

  addMessage(text, "user");

  conversation.push({
    role: "user",
    content: text
  });

  input.value = "";
  loading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: conversation
      })
    });

    const data = await response.json();

    if (!response.ok) {
  if (response.status === 503) {
    throw new Error(
      "The AI service is temporarily busy. Please try again in a few moments."
    );
  }

  throw new Error(
    typeof data.error === "string"
      ? data.error
      : data.error?.message || "Something went wrong. Please try again."
  );
}
    addMessage(data.reply, "assistant");

    conversation.push({
      role: "assistant",
      content: data.reply
    });
  } catch (error) {
    addMessage(`Error: ${error.message}`, "assistant");
  } finally {
    loading(false);
    input.focus();
  }
});