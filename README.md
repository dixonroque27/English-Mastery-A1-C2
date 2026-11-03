# English Mastery A1–C2

Live application: https://english-mastery-a1.hatchable.site

A personalized English-learning platform covering CEFR A1, A2, B1, B2, C1 and C2.

## Learning system
- All learners begin at A1. The optional 10-question placement test is informational and never skips levels.
- Every CEFR level has 4 modules and 12 topics.
- Every topic is assessed in grammar, listening, speaking, reading and writing.
- Topic mastery requires at least 8.5/10 in all five skills. Best score per skill is retained.
- Every module ends with a 5-question exam; at least 80% is required.
- Topics, module exams and CEFR levels unlock sequentially. Server endpoints enforce the same rules.

## Architecture
- Static frontend files in the repository root.
- Hatchable server functions in `api/`.
- Shared server-side progression rules in `lib/progression.js`.
- Existing Hatchable PostgreSQL, end-user authentication and AI gateway remain the production backend.
- No API keys or secrets belong in this repository.

## Netlify
The `netlify.toml` forwards all paths to the canonical Hatchable application. This is intentional: a standalone Netlify origin does not receive Hatchable's injected auth client or session cookies. The redirect preserves working authentication, progress, AI evaluation and database behavior rather than serving a broken static copy.

- Build command: leave blank
- Publish directory: `.`
- Branch: `main`

The canonical app is live at the URL above. Deploy backend changes through Hatchable; do not replace its database or auth configuration.
