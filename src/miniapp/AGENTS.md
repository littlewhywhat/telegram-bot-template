# Mini App Frontend

## Rules

- Use `@radix-ui/themes` for all UI primitives
- One default export per file for pages and components
- Before adding new logic or components, propose how to decompose into reusable hooks and components following SOLID principles
- Telegram injects `window.Telegram.WebApp.initData` into the Mini App context — a signed query string containing the user's identity, validated server-side
