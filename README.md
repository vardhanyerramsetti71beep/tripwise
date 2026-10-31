# 🧭 TripWise: Smart Travel Assistant

TripWise builds a **day-by-day travel itinerary that adapts to the traveller**: their interests, budget, group, pace, accessibility needs, and the **weather on each day of the trip**. Every recommendation comes with a plain-language "why", so the decisions are transparent.

## Chosen vertical

**Travel & Tourism.** The persona is a traveller planning a short city or beach trip (1–14 days) who wants a realistic plan without hours of research. They need a plan that fits their budget, suits the people they travel with, and does not send them to an open-air fort in 40°C heat or a hilltop walk in the rain.

## What it does

| Input (user context) | How TripWise uses it |
| --- | --- |
| Destination and dates | Fetches a **live forecast** (Open-Meteo) when the trip starts within 15 days. Otherwise it uses monthly **climate averages**. |
| Interests (art, food, nature…) | Matching attractions score higher. |
| Travel style (budget / moderate / luxury) | Sets daily living costs and penalises activities above that price level. |
| Total budget (optional) | Reports *within / tight / over* and suggests concrete savings. |
| Pace (relaxed / balanced / packed) | Sets the number of time slots and hours of sightseeing per day. |
| Group (solo / couple / family / friends) | Families never get adults-only or unsuitable venues. |
| Step-free only | Excludes every venue that is not wheelchair-friendly. |

Output:

- A day-by-day plan (morning / midday / afternoon / evening) with a weather badge for each day
- Cost estimates: total, per person, per day, and activities per day
- Trip-wide alerts, such as rainy days, heat, the monsoon season and which weather source was used
- A packing list built from the forecast, the planned activities and the group, with a reason for every item
- Local tips for the destination, plus a print-friendly layout

## Approach and decision logic

The engine is deterministic and rule-based. It runs in the browser, so every decision can be explained and tested.

```
form input ─▶ validate ─▶ weather (forecast or climate) ─▶ score attractions per slot ─▶ greedy day planner
                                                                                           │
                                       packing list ◀── budget estimate ◀── itinerary ◀────┘
```

1. **Validation** (`src/engine/validation.js`). All input is checked against allow-lists and numeric ranges, and unknown values are rejected.
2. **Weather** (`src/engine/weather.js`). Each day is classified as `rainy` (≥50% rain chance), `hot` (≥33°C), `cold` (≤8°C) or `pleasant`. If the network fails, the plan falls back to climate data, so the app never breaks.
3. **Scoring** (`src/engine/scoring.js`). Each attraction is scored for a given slot.
   - **Hard constraints** make an attraction ineligible: not step-free when accessibility is required, or not kid-friendly for families.
   - **Soft factors** add or subtract points: interest match (+4), right time of day (+2 / −3), outdoor in the rain or midday heat (−10), indoor on a rainy day (+2), above the budget level (−3 per level), free entry for budget travellers (+1), and the same neighbourhood as the previous stop (+2), which keeps days walkable.
   - Every adjustment records a reason, and those reasons become the "Why" line in the UI.
4. **Planning** (`src/engine/planner.js`). For each day and slot, the planner picks the best unused attraction that fits the remaining hours. If nothing scores at least 0, it offers context-aware free time (for example, a rest break in the heat). Long day trips such as Versailles or Hakone fill the day on their own.
5. **Budget** (`src/engine/budget.js`). Total = daily living cost × travellers × days, plus activity costs × travellers. If over the limit, it suggests switching to a cheaper style or skipping the priciest activity.
6. **Packing** (`src/engine/packing.js`). Rules based on temperature extremes, rain, activity types, group and destination.

## Project structure

```
index.html            UI markup (semantic, accessible form and results region)
styles.css            Responsive styles, light/dark themes, print styles
server.js             Zero-dependency static server with security headers
src/data/             Curated destinations (5 cities, 55 attractions, climate data)
src/engine/           Pure, framework-free decision logic (fully unit tested)
src/ui/app.js         DOM rendering and form handling
tests/                node:test suites (unit and integration)
```

## Running it

Requires **Node.js 18+**. There are no dependencies to install.

```bash
npm start      # http://localhost:8080
npm test       # runs the full test suite
```

## Testing

There are 46 tests across 14 suites, using Node's built-in test runner:

- Validation edge cases: bad enums, ranges, fake dates, injected interests
- Weather classification, forecast parsing, malformed API data, offline fallback, and no API calls beyond the forecast horizon
- Planner behaviour: no repeats, hour and slot limits per pace, indoor picks on rainy days, no outdoor afternoons in heat, accessibility and family constraints across every destination, deterministic output
- Budget maths and status thresholds, including a zero budget
- Packing rules
- Dataset integrity checks
- End-to-end `createPlan` and the HTTP server: security headers, MIME types, path traversal and hidden-file blocking, method restriction

CI runs the suite on every push (`.github/workflows/test.yml`).

## Security

- **No secrets.** Open-Meteo needs no API key.
- **Strict Content-Security-Policy** in both the HTML and the server headers. It allows only same-origin scripts and styles, and network calls only to `api.open-meteo.com`.
- **No `innerHTML`.** All dynamic content is rendered with `textContent` and DOM nodes, which prevents XSS.
- **Validated input.** Everything is checked against allow-lists before reaching the engine.
- **Hardened server.** It serves only an allow-list of public paths, blocks traversal, dotfiles and source files, allows GET/HEAD only, and sends `nosniff`, `Referrer-Policy`, `Permissions-Policy` and `frame-ancestors 'none'`.
- **Defensive API handling.** Forecast data is shape-checked, there is a 5 s timeout, and failures fall back safely.
- **Local-only preferences.** They are stored in `localStorage` on the user's device and never sent anywhere.

## Accessibility

- Semantic landmarks, a skip link, and labelled controls grouped in `fieldset`/`legend`
- Errors linked to each field with `aria-describedby` and `aria-invalid`, and focus moves to the first invalid field
- Results announced through an `aria-live` region, and focus moves to the plan heading when it is ready
- Visible focus rings, touch targets of at least 40px, and contrast-checked light and dark themes
- Respects `prefers-reduced-motion` and `prefers-color-scheme`
- Fully keyboard operable, responsive down to 320px wide, and printable

## Efficiency

- Zero runtime dependencies and no build step. The repo is well under 1 MB.
- A single network request per plan, and only when a forecast exists for the dates
- The planner does at most O(days × slots × attractions) work, which is instant for this dataset

## Assumptions

- Costs are rough **per-person estimates in USD**, so trips can be compared across countries. They **exclude flights**. Daily living cost covers stay, food and local transport.
- The 5 destinations and their attractions (Paris, Tokyo, Jaipur, New York City, Goa) are curated sample data. The engine is data-driven, so adding a city only means adding an entry in `src/data/destinations.js`.
- Opening days and hours, ticket availability and seasonal events (for example, Anjuna market runs only on Wednesdays) are not modelled. Tips mention the important ones.
- "Typical" weather beyond the 15-day forecast window comes from monthly climate averages.
- Children's ticket prices are treated the same as adult prices, to keep estimates conservative.

## License

MIT
