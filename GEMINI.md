# Project Rules for JAVAMIFI Compass (GEMINI.md)

Follow docs/DESIGN.md exactly.

## HARD RULES
- **No Arbitrary Literals:** Never use hex colors, px/rem literals or arbitrary Tailwind values (`[...]`) in components. Use design tokens only. If a token is missing, stop and ask.
- **Forbidden Patterns:** Drop shadows on cards (`shadow-*`), backdrop-blur (`backdrop-blur-*`), gradients, emoji as icons, purple/neon accents, stock-photo placeholders, lorem ipsum.
- **Strict Color Semantics:** Product-line colors (WiFi orange `#F27B2A`, eSIM blue `#4C97FF`, SIM pink `#E96BB0`) are reserved exclusively for connectivity products. Never use them for food, dining, or halal status.
- **Accessibility & Touch Targets:** Minimum interactive touch target is 48px × 48px. Minimum body text is 14px (`body-sm`), minimum label is 12px (`label-sm`).
- **Tabular Numerics:** Force tabular figures (`tnum` / `font-feature-settings: "tnum" 1`) on all numbers, currencies, dates, and metric values.
- **Internationalization (i18n):** All user-visible strings must come from i18n keys (EN + ID). No hard-coded copy or hard-coded money.
- **AI Text Safety:** Render AI/scraped text as plain text only. Never use `dangerouslySetInnerHTML` or markdown rendering for untrusted evidence.
- **Deterministic Calculation:** Never compute currency conversion, halal tier status, or price sanity in UI code. The UI only displays deterministic fields provided by the API.

## WORKFLOW
1. State the plan, files to touch (max 6), and anything ambiguous.
2. Make the smallest change. Do not edit files outside the declared list.
3. Run typecheck, lint, and tests; paste the output in the response.
4. Never edit existing tests. Add new ones to verify new behaviors.
