# English Mastery A1–C2

Frontend snapshot synchronized from Hatchable project English Mastery A1–C2, live version v8.

## Netlify settings
- Build command: leave blank
- Publish directory: `.`
- Deploy branch: `main`

## Important architecture note
The live application depends on Hatchable for end-user authentication (`window.hatchable.auth`), five API endpoints, PostgreSQL learner records, and server-side Gemini integration. The backend and database have not been migrated. This repository is prepared for Netlify import and preview; however, the static Netlify origin does not automatically receive Hatchable's injected browser authentication client or session cookies. A fully functional independent Netlify production deployment still requires a compatible cross-domain authentication solution or same-origin proxy. Keep Hatchable as the production app until that is verified.

Never put the Google API key or any other secret in this repository. Secrets remain server-side in Hatchable.
