# Beli Grocery — Build Brief

App name: **Beli Grocery** (working name).

## What this app is

A grocery memory for someone you shop for from far away. You feed it orders, it learns the pattern, and it hands you the next list.

Core loop: **Log → Learn → Suggest.** Every feature serves this loop. If a feature doesn't, it waits.

**Who it's for:** anyone who regularly orders groceries on behalf of someone else, such as a parent, grandparent, relative or neighbour. Typically they send a list to a local shop over WhatsApp, the shop delivers, and they pay online. **For now it's a personal app for one person (the owner), not a public product.** No accounts or sign-in; all data stays on the device. (Changed 2026-10-05 from the original public, multi-user plan.)

**The app starts fresh.** No seeded data, no demo orders, no pre-filled names. A fresh install opens on the Empty state, and the user logs orders one at a time. The experience of watching the app learn (Learning state → predictions unlocking at 6 orders) is a core part of the product, so never shortcut it with sample data in the real app.

## Design source of truth

Figma file: `https://www.figma.com/design/GU3YYQcFRcSU5KRWmwE0RC`
File key: `GU3YYQcFRcSU5KRWmwE0RC`

Use the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`) to read designs. Match layout, components and tokens closely. Where code and Figma disagree, Figma wins unless it's impractical; flag it if so.

**Copy in Figma is placeholder.** Names like "Aunty Melaka", counts like "26 orders", dates and amounts are illustrative only. In the app, all of these come from the user's own data. Never hard-code them.

**Pages**
- `Foundations`: colour, type, spacing and radius tokens
- `Components`: Button, Toggle, Category Chip, Item Row, Stat Card, Progress Card
- `Wireframes`: all 19 screens, prototype-wired

**Screen node IDs**

| Group | Screen | Node ID |
|---|---|---|
| Setup | Welcome | 4:4 |
| Setup | Who | 4:14 |
| Setup | How often | 4:29 |
| Setup | Past orders | 4:49 |
| Setup | Bulk import | 4:66 |
| Setup | Review import | 4:79 |
| Home | Empty (0 orders) | 5:9 |
| Home | Learning (1–5 orders) | 5:31 |
| Home | Ready (6+ orders) | 5:73 |
| Log | Paste order | 6:44 |
| Log | Reading (parsing) | 6:63 |
| Log | Review order | 6:73 |
| Log | Saved | 6:120 |
| Order day | Draft next order | 6:131 |
| Order day | Copied | 6:170 |
| History | Orders | 7:92 |
| History | Order detail | 7:124 |
| History | Item detail | 7:175 |
| Insights (v2, do not build yet) | Insights | 7:230 |

**Component node IDs:** Button set `2:8`, Toggle set `2:13`, Category Chip set `2:26`, Item Row set `2:38`, Stat Card `2:39`, Progress Card `2:43`.

## Stack (defaults: confirm before scaffolding)

- **Frontend:** Vite + React + TypeScript, Tailwind using CSS variables from the tokens below. Mobile-first (designed at 375 × 812) and installable as a PWA.
- **Hosting:** GitHub → **Cloudflare Pages**. Do not use Netlify, in config, docs or tooling.
- **Data:** local only. Everything lives in the browser's `localStorage` (`src/lib/store/local.ts`); no server database, no auth. Because the device holds the only copy, the app has **Backup and settings** (save a backup file, restore from one, erase everything) and **Delete order**. Installing as a PWA matters: iOS Safari clears data for sites not added to the Home Screen after 7 days unused.
- **Parsing:** the rule-based reader (`src/lib/parse-local.ts`) by default, offline and free.
- **AI parsing (optional, undecided):** a Pages Function (`/functions/api/parse-order`) calling the Claude API, model `claude-haiku-4-5-20251001`. Only used when the build sets `VITE_AI_PARSING=on`. With no sign-in the endpoint is open to anyone, so protect it before setting `ANTHROPIC_API_KEY` in production. Secrets are set with `wrangler pages secret put` and are never in the repo or client bundle.

## Design tokens

Expose these as CSS variables with the same names as the Figma variables (e.g. `--color-bg-brand`).

**Primitives**
- cream: 50 `#FBF7F0`, 100 `#F4EDE1`, 200 `#E8DCC8`
- ink: 300 `#B5AC9E`, 500 `#7A7266`, 700 `#4A453D`, 900 `#22201C`
- pandan: 50 `#EAF3EC`, 100 `#CFE5D4`, 500 `#2F7D4F`, 700 `#1F5A38`
- chili: 50 `#FCEBE7`, 500 `#D9472B`, 700 `#A8321C`
- kunyit: 50 `#FDF4DC`, 500 `#E8A317`, 700 `#8A5E05`
- sky: 50 `#E6F0F8`, 500 `#3E7CB1`, 700 `#285880`
- white `#FFFFFF`

**Semantic (light mode only for v1)**
- bg: canvas = cream/50, surface = white, subtle = cream/100, brand = pandan/500, brand-subtle = pandan/50, accent = chili/500, accent-subtle = chili/50, warning-subtle = kunyit/50, info-subtle = sky/50
- text: primary = ink/900, secondary = ink/500, on-brand = white, brand = pandan/700, accent = chili/700, warning = kunyit/700, info = sky/700
- border: default = cream/200, strong = ink/300, brand = pandan/500
- category: protein = chili/500, produce = pandan/500, dairy = sky/500, pantry = kunyit/500

**Type** (Google Fonts: Fraunces, Plus Jakarta Sans)

| Style | Font | Weight | Size / line height | Tracking |
|---|---|---|---|---|
| Display | Fraunces | 600 | 32 / 38 | -1% |
| Title | Fraunces | 600 | 24 / 30 | -0.5% |
| Heading | Plus Jakarta Sans | 700 | 18 / 24 | 0 |
| Body | Plus Jakarta Sans | 400 | 15 / 22 | 0 |
| Body Strong | Plus Jakarta Sans | 600 | 15 / 22 | 0 |
| Caption | Plus Jakarta Sans | 500 | 13 / 18 | 0 |
| Label | Plus Jakarta Sans | 700 | 12 / 16 | 4%, uppercase |
| Number | Plus Jakarta Sans | 800 | 28 / 32 | -1% |

**Spacing:** xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32, 3xl 48
**Radius:** sm 8, md 12, lg 20, full 999

## Data model

Stored as one JSON document in `localStorage`. The backup file is the same data wrapped as `{ app: "beli-grocery", version: 1, exported_at, data }`.

```
profile         id, shopping_for (text, the name the user gives),
                cadence_days (int, default 14), created_at

items           id, canonical_name, category
                (protein | produce | dairy | pantry), aliases text[],
                created_at

orders          id, order_date (date), total_rm (numeric, nullable),
                raw_text, created_at

order_items     id, order_id, item_id, quantity (numeric),
                unit (text, e.g. "ekor", "kg", "pek", "tin", "tray", "kotak"),
                amount_rm (numeric, nullable; for lines like "Cili padi × RM5"),
                raw_line
```

`items` is the catalogue, starting empty and growing as they log orders. Every order line resolves to an item, which is how "telor" and "telur" or "Milo medium" and "milo" count as the same thing. When the user fixes a match, add that raw text to `aliases`.

## Parsing (rule-based by default; optional Pages Function: `/api/parse-order`)

**Input:** `{ raw_text, catalogue: [{id, canonical_name, aliases, category}] }` (the catalogue is empty for a brand-new user)

**Output (strict JSON, validated with zod):**
```json
{
  "orders": [{
    "order_date": "2026-10-03",
    "total_rm": 186.40,
    "items": [{
      "raw_line": "Ayam × 2ekor",
      "name": "Ayam",
      "quantity": 2,
      "unit": "ekor",
      "amount_rm": null,
      "category": "protein",
      "matched_item_id": "uuid-or-null",
      "confidence": "high | low"
    }]
  }],
  "warnings": ["No total found"]
}
```

Rules:
- The same function handles a single order (main path) and multi-order text (bulk import, later milestone).
- Keep item names exactly as the user writes them, in Malay or English. Do not translate.
- Spacing and symbols vary: "× 2ekor", "x 1", "2 ekor", "x1". Handle them all.
- "Cili padi × RM5" is a money amount, not a quantity: `amount_rm: 5`, `quantity: null`.
- Anything unmatched or ambiguous gets `confidence: "low"` and is surfaced on Review order under "Check these". For a new user, everything is new, so on early orders the main job is asking for the category once per item, after which it's remembered.
- If the date or total is missing from the pasted text, let the user add it on Review order (default the date to today).
- Dates in Malaysian formats ("3 Oct 2026", "3/10/26", "3 Okt"). Timezone `Asia/Kuala_Lumpur`.

## Predictions (plain code, NOT AI)

Predictions are deterministic and explainable. Every suggestion shows its reason.

- **Threshold:** predictions unlock at **6 orders**. Below that, Home shows the Learning state ("{n} of 6 orders logged" with matching filled segments).
- **Per item:** interval = median number of orders between appearances. "Every order" = 1, "every 4 weeks" = 2 at a 2-week cadence.
- **Due** when orders since last appearance ≥ interval.
- **Suggested quantity** = most common past quantity and unit.
- **Next order date** = last order date + `cadence_days` (later: the median real gap).
- **Reason strings** match the designs: "every order", "every 4 weeks · due now", "every 8 weeks · in 4 weeks".
- Draft screen sections: "Due this round" (toggled on) and "Not due" (toggled off).

Put this in `src/lib/predict.ts` with unit tests (Vitest).

## Copy for WhatsApp

Format the draft as plain text, one item per line:

```
Ayam × 2 ekor
Telor × 1 tray
Milo × 1
```

Copy it to the clipboard, then show the Copied sheet. "Log it now" opens Review order pre-filled with the draft and today's date, with the total left empty.

## Test fixtures only (never seeded into the app)

Use this as a parser fixture and as the base for generated prediction fixtures (e.g. 8 synthetic fortnightly orders built from it):

```
3 Oct 2026 · RM 186.40
Ayam × 2 ekor
Fish (any type) × 1 kg
Daging × 1 kg
Tempura × 1 pek
Hotdog × 2 pek
Fresh milk × 1 kotak
Susu pekat F&N × 2 tin
Telor × 1 tray
Sardin Cap Ayam × 2 tin
Gardenia × 1 pek
Biskut lemak × 1 pek
milo x 1
Asam jawa × 1 pek
Sos tiram × 1 pek
Cili padi × RM5
Margarine Planta x 1 pek
```

## Copy and placeholders

- The person's name is always user data, e.g. "Shopping for {name}". Input placeholder: "e.g. Mum, Atuk, Uncle Ravi".
- Empty-state copy refers to "{name}'s pattern", or "their pattern" if no name is set.
- Counts, dates, totals and item names in the UI always come from data. No hard-coded examples.
- Setup's "Got past orders?" step defaults to **Start fresh**. Import past orders is an option, not the recommended path.

## Milestones (build in order, one at a time; stop for review after each)

1. **Scaffold and tokens:** Vite, Tailwind and tokens; the six components built to match Figma; a `/dev/components` page showing them; deploys to Cloudflare Pages.
2. **Data and Setup:** local storage (originally Supabase; replaced 2026-10-05), and the Setup flow (Welcome → Who → How often → Past orders, defaulting to Start fresh).
3. **Log an order:** Paste → Reading → Review → Saved, with the rule-based reader (AI optional).
4. **Home and History:** the three Home states (Empty, Learning, Ready), Order history, Order detail, Item detail.
5. **Predictions and Order day:** `predict.ts` with tests, Draft next order, Copy for WhatsApp, the log-it-now loop.
6. **Ship v1:** production Cloudflare Pages deploy, custom domain, PWA manifest and icon (needed so data isn't cleared on iPhone).
7. **Bulk import (post-v1):** Bulk import → Review import, for loading order history.

**Out of scope for v1:** Insights screen, bulk import, dark mode, accounts or sync across devices, multiple people, price tracking per item, notifications.

## Conventions

- Currency: `RM 186.40` (space after RM, two decimals; whole numbers allowed in stat cards, e.g. `RM 372`).
- Dates: `3 Oct 2026` in lists, `Sat, 17 Oct` for the next order.
- UI copy in English; item names in whatever the user typed.
- Accessibility: tap targets ≥ 44px, visible focus states, WCAG AA contrast on all text.
- Never put the Claude API key in client code.
- Keep components small and typed. No component library: build from the Figma components.

## Open decisions (ask when relevant)

- Categories: four for now (Protein, Produce, Dairy, Pantry). Telor is under Dairy and Milo under Pantry. Possible fifth group: Drinks or Frozen.
- AI parsing: keep it (and add endpoint protection) or stay rule-based only.
- Domain for Beli Grocery (possibly under Kasah Kod).
