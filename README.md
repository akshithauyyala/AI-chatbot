# AI-chatbot
Nexa is a responsive, portfolio-ready AI chat interface built with plain HTML, CSS, and browser JavaScript. It runs as a static site and includes a local demonstration response engine so the complete chat flow works without an account, server, or API key. 
## Features

- Create, switch, search, rename, and delete conversations; clear all saved chats from Settings.
- Persist conversation IDs, titles, messages, and timestamps in browser `localStorage`.
- Send and edit messages, copy messages and code, and regenerate assistant responses.
- Safe basic Markdown rendering for paragraphs, lists, bold text, inline code, and fenced code blocks.
- Responsive mobile navigation drawer, light and dark appearance, keyboard shortcuts, accessible dialogs, and scroll-to-latest control.
- Helpful topic-aware demo responses for coding, career writing, project ideas, planning, and general questions.

## Files

- `index.html` — semantic application structure and dialogs.
- `style.css` — design tokens, components, themes, motion, and responsive rules.
- `script.js` — storage, rendering, demo response provider, and interactions.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static HTTP server. For example, from this directory run `python -m http.server 8000` and visit `http://localhost:8000`.

Conversations are stored only in the current browser profile under `nexa-ai.conversations.v1`. Clearing browser site data removes them. The theme preference is stored separately.

## Connect a real AI backend

The `requestDemoResponse(prompt)` function in `script.js` is the provider boundary. Replace its local response logic with a request to a trusted same-origin endpoint such as `/api/chat`, sending the conversation context and handling non-success responses. A backend should hold provider credentials and enforce appropriate authentication, rate limits, and input validation. **Never put API secrets in frontend JavaScript, HTML, CSS, or a publicly deployed file.** Demo mode is the default and does not make network requests.
