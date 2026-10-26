# JavaMifi Compass — Voice & Copywriting Guide

Tagline: **"Plan your connection before you pack."**  
Campaign Hashtag: **#AntiSusahSinyal**

---

## 1. Brand Personality & Tone

JavaMifi Compass communicates as an **experienced, reliable travel connectivity companion**.

| Trait | How We Sound | What We Avoid |
|---|---|---|
| **Helpful & Reassuring** | "Stay connected seamlessly in Tokyo and on the bullet train." | Overly technical telecom jargon (bands, MHz, IMSI). |
| **Objective & Transparent** | "Pocket WiFi is cheaper for groups of 3+; solo travelers save with an eSIM." | Pushing expensive plans when a cheaper option is better. |
| **Action-Oriented & Clear** | "Scan your QR code in cellular settings upon landing." | Vague steps like "activate your device when ready." |
| **Bilingual Consistency** | Natural Indonesian (*Bahasa Indonesia yang lugas dan ramah*) and idiomatic English. | Direct robotic machine translations. |

---

## 2. Copywriting Enforcement Rules

1. **Zero User-Facing Text in Code:** All interface strings belong exclusively to message catalogs (`apps/web/messages/id.json` and `apps/web/messages/en.json`).
2. **Dynamic Editorial Content in CMS:** Travel guides, destination tips, FAQs, and marketing banners are managed in the CMS database, never hardcoded in component JSX or services.
3. **Lint Enforcement:** The custom ESLint rule `custom-i18n/no-hardcoded-strings` flags literal strings in components to keep code clean and internationalization-ready.
4. **Stable API Error Codes:** The NestJS API returns error codes (e.g. `INVALID_PROMO_CODE`, `ORDER_EXPIRED`); frontends map these codes to localized user-friendly messages.
