# Clippers Creator

Turn long videos into viral shorts. This is **Phase 1** of the build: project scaffold,
landing page, auth (email/password + optional Google), Postgres schema via Prisma, and a
placeholder dashboard. Video processing, AI clip detection, captions, and exports come in
later phases.

## Stack

- Next.js 14 (App Router) + TypeScript — single app, frontend and API routes together
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (credentials + optional Google OAuth)

## Local setup (Termux or any machine)

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev --name init
npm run dev
```

Visit `http://localhost:3000`.

> Note: running Postgres itself inside Termux is finicky. Easiest path: create a free
> Postgres instance on Render (or Neon/Supabase) and point `DATABASE_URL` at that, even
> for local development. You don't need a local database server.

## Deploying to Render

1. Push this repo to GitHub (you're already doing this from Termux).
2. On Render: **New +** → **PostgreSQL** → create a free instance. Copy its **Internal
   Database URL**.
3. On Render: **New +** → **Web Service** → connect your GitHub repo.
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** Node
4. Add environment variables on the Render web service:
   - `DATABASE_URL` → the Postgres Internal Database URL from step 2
   - `NEXTAUTH_SECRET` → generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` → your Render service URL, e.g. `https://clippers-creator.onrender.com`
     (you'll know this after the first deploy; update and redeploy)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` → optional, leave blank to skip Google login
5. Deploy. The build step runs `prisma generate && prisma migrate deploy && next build`
   automatically (see `package.json`), so your database schema stays in sync every deploy.

## Updating from Termux

Since you're editing/adding files from Termux and pushing to GitHub, Render will
auto-redeploy on every push to your connected branch (default: whatever branch you
connected, usually `main`). No extra steps needed beyond `git add`, `git commit`, `git push`.

## Project structure so far

```
app/
  layout.tsx          — root layout, fonts, metadata
  page.tsx            — landing page
  login/page.tsx       — sign in
  signup/page.tsx       — sign up
  dashboard/page.tsx    — placeholder dashboard (protected)
  api/
    auth/[...nextauth]/route.ts  — NextAuth handler
    signup/route.ts               — account creation endpoint
lib/
  auth.ts             — NextAuth config
  prisma.ts           — Prisma client singleton
prisma/
  schema.prisma       — full data model (users, projects, videos, clips, posts)
```

## What's next (roadmap)

- **Phase 2:** Video upload + storage, FFmpeg processing pipeline, project creation flow
- **Phase 3:** Transcription (hosted Whisper API) + heuristic clip-moment detection
- **Phase 4:** Caption rendering, clip export, platform-specific copy generation
- **Phase 5:** Billing (Stripe), usage credits enforcement, team/admin features

Each phase will be handed to you as file updates to drop into this same repo.
# clippe
