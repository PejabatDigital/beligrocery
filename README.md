# Beli Grocery

A grocery memory for someone you shop for from far away. **Log → Learn → Suggest.**
See [CLAUDE.md](CLAUDE.md) for the product brief. Design reference screenshots from Figma are in [`design/`](design).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

There are no accounts and no server database. Everything is saved in this browser's localStorage,
so data on your laptop and data on your phone are separate. Pasted lists are read by the rule-based
reader. Clear site data, or use **History → Backup and settings → Erase everything**, to start over.

`/dev/components` shows every component and design token.

## Keeping your data safe

The device holds the only copy. **History → Backup and settings → Save a backup** writes a JSON file
(on a phone, the share sheet lets you send it to Files, Drive or WhatsApp). **Restore from a backup**
is on the same screen and on Welcome, for moving to a new phone.

On iPhone, add the site to the Home Screen: Safari clears data for sites that aren't installed after
7 days without a visit.

## Optional: read lists with Claude

Off by default. To try it locally:

1. Copy `.env.example` to `.env.local` and set `VITE_AI_PARSING=on`.
2. Copy `.dev.vars.example` to `.dev.vars` and set `ANTHROPIC_API_KEY`.
3. Run `npm run dev:all`. Vite (5173) proxies `/api/*` to wrangler (8788). If the function is
   unreachable, the app falls back to the rule-based reader and says so on Review order.

There's no sign-in, so a deployed `/api/parse-order` is open to anyone who finds it. Protect it before
setting the key in production. Never put the Anthropic key in client code or `.env.local`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run dev:api` | Pages Functions under wrangler on port 8788 |
| `npm run dev:all` | Both together (only needed for AI reading) |
| `npm test` | Vitest: predictions, parser, formatting |
| `npm run build` | Type-check and build to `dist/` |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages (milestone 6) |

## Where things live

| Path | |
|---|---|
| `src/lib/predict.ts` | Deterministic predictions (intervals, due items, reasons). Tested in `predict.test.ts`. |
| `src/lib/parse-local.ts` | Rule-based list reader: the default, the "We spotted" preview, and the AI fallback. |
| `src/lib/parse-schema.ts` | Zod contract for `/api/parse-order`, shared by client and function. |
| `src/lib/store/` | Data layer: localStorage, backup and restore. Tested in `local.test.ts`. |
| `functions/api/parse-order.ts` | Optional Pages Function: Claude Haiku 4.5 with structured outputs. |
| `src/components/` | The six Figma components plus layout pieces. |
| `src/pages/` | Screens, grouped as in Figma: setup, home, log, orderday, history. |
