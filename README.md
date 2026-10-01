# Akshitha AI

A responsive portfolio chatbot built with HTML, CSS, and vanilla JavaScript. A small Node.js server serves the frontend and proxies chat requests to an OpenAI compatible Chat Completions API. The API key is read only by the server and is never sent to the browser.

## Requirements

- Node.js 18 or newer (uses built-in `fetch`; tested with Node 24)
- An API key for a provider that implements the OpenAI Chat Completions API

## Configure and run

Set these environment variables in the terminal before starting the server:

| Variable | Required | Default / purpose |
| --- | --- | --- |
| `AI_API_KEY` | Yes | Secret key. `OPENAI_API_KEY` is accepted as a fallback. |
| `AI_MODEL` | Yes | Model name supported by your provider. |
| `AI_API_URL` | No | Full chat completions URL; defaults to `https://api.openai.com/v1/chat/completions`. |
| `AI_SYSTEM_PROMPT` | No | Optional system prompt. Keep portfolio details here if you want the assistant to describe them. |
| `PORT` | No | Local server port; defaults to `3000`. |

Example in PowerShell:

```powershell
$env:AI_API_KEY = 'your-secret-key'
$env:AI_MODEL = 'gpt-4o-mini'
node server.js
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000). In production, set the variables in your hosting provider's server environment and run `node server.js`; do not put the secret in frontend files or commit it to source control. Deploy behind HTTPS and a reverse proxy as appropriate.

## Architecture

- `index.html`, `style.css`, and `script.js` form the framework-free browser app.
- `server.js` serves those files, validates requests, and sends conversation history to the configured AI API with the server-side key.
- Conversations live in browser memory only and are cleared with **New chat** or on reload.

The proxy expects the provider's Chat Completions request and response format (`choices[0].message.content`). It enforces request size and timeout limits, and returns readable errors for missing configuration, invalid input, rate limits, and upstream failures.

## Troubleshooting

- **Setup required:** Set `AI_API_KEY` (or `OPENAI_API_KEY`) and `AI_MODEL` in the same terminal/session used to start Node, then restart the server.
- **Invalid key / model:** Confirm the key is valid and the model is enabled for your account. For a compatible provider, set `AI_API_URL` to its full `/chat/completions` URL.
- **Rate limited:** Wait and retry, or check your provider's quota and rate limits.
- **Service unavailable / timeout:** Check network connectivity and provider status; verify your configured API URL.
- **Port already in use:** Set `PORT` to another available port before starting Node.

No conversation or API key is stored in local storage or written to disk by this app.
