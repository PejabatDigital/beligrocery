# Beli Grocery

A grocery memory for someone you shop for from far away. **Log → Learn → Suggest.**
See [CLAUDE.md](CLAUDE.md) for the product brief. Design reference screenshots from Figma are in [`design/`](design).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no Supabase settings, the app runs in **local mode** (development only):
sign-in is skipped, data is kept in this browser's localStorage, and pasted lists are read by the
rule-based parser instead of Claude. Clear site data to start over as a new user.

`/dev/components` shows every component and design token.

## Connect Supabase and Claude

1. **Supabase project** (free tier is fine)
   - SQL editor → run [`supabase/migrations/20261003000000_init.sql`](supabase/migrations/20261003000000_init.sql)
     (tables, row-level security, the `save_order` function).
   - Authentication → Providers → Email: enabled (magic link).
   - Authentication → URL configuration: Site URL `http://localhost:5173`, and add it to Redirect URLs.
2. **Client settings**: copy `.env.example` to `.env.local` and fill in the project URL and anon key.
3. **Function secrets**: copy `.dev.vars.example` to `.dev.vars` and fill in `ANTHROPIC_API_KEY`,
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
4. Run both the app and the Pages Function:

   ```bash
   npm run dev:all
   ```

   Vite (5173) proxies `/api/*` to wrangler (8788). If the function is unreachable, the app falls back
   to the rule-based parser and says so on Review order.

Never put the Anthropic key or the Supabase service key in client code or `.env.local`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run dev:api` | Pages Functions under wrangler on port 8788 |
| `npm run dev:all` | Both together |
| `npm test` | Vitest: predictions, parser, formatting |
| `npm run build` | Type-check and build to `dist/` |
| `npm run pages:deploy` | Build and deploy to Cloudflare Pages (milestone 6) |

## Where things live

| Path | |
|---|---|
| `src/lib/predict.ts` | Deterministic predictions (intervals, due items, reasons). Tested in `predict.test.ts`. |
| `src/lib/parse-local.ts` | Rule-based list reader: "We spotted" preview, local mode and fallback. |
| `src/lib/parse-schema.ts` | Zod contract for `/api/parse-order`, shared by client and function. |
| `src/lib/store/` | Data layer: Supabase, plus the dev-only local store. |
| `functions/api/parse-order.ts` | Pages Function: auth, 30 reads/hour per user, Claude Haiku 4.5 with structured outputs. |
| `src/components/` | The six Figma components plus layout pieces. |
| `src/pages/` | Screens, grouped as in Figma: setup, home, log, orderday, history. |
