# The Written Entity Backend

Local backend for the frontend in `../frontend/the-written-entity.html`.

## Quick Start

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

The API runs at `http://localhost:3001/api`.
The WebSocket runs at `ws://localhost:3001/ws`.

## Required Local Services

PostgreSQL is required before `npx prisma db push` and `npm run dev`.

Default connection:

```bash
postgresql://postgres:password@localhost:5432/written_entity
```

Redis is included in the spec and queue scaffold, but the current direct pipeline trigger does not require it for manual upload testing.

## Supabase Auth + Google OAuth

Google OAuth is handled by Supabase Auth. The frontend calls:

```js
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/meetings.space.readonly',
    ].join(' '),
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

In Google Cloud, the OAuth redirect URI should be the Supabase callback:

```text
https://bcaywanbcavqeegzsglg.supabase.co/auth/v1/callback
```

In Supabase, keep the Google Client ID and Client Secret in **Authentication → Providers → Google**. Do not put the Google client secret in frontend code.

The frontend uses only the Supabase URL and publishable key. After login, it syncs the verified Supabase session to:

```text
POST http://localhost:3001/auth/supabase/session
```

The backend verifies the Supabase access token with Supabase Auth and stores the runtime Google provider token on the matching backend user record for Calendar/Gmail/Drive/Meet integrations.

Required backend env values:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-project.supabase.co/auth/v1/callback
```

For local static testing, serve the frontend from a localhost URL such as:

```bash
cd ../frontend
python -m http.server 5500
```

Then open:

```text
http://localhost:5500/the-written-entity.html
```

For deployment, set:

```bash
FRONTEND_URL=https://your-frontend-domain.com
```

In the frontend, you can override the backend URL before the main script loads:

```html
<script>
window.WRITTEN_ENTITY_CONFIG = {
  backendOrigin: 'https://your-backend-domain.com'
};
</script>
```

The browser app supports Supabase email/password sign-up, email/password login, Google OAuth, and sign-out. Enable Email provider and Google provider in Supabase Auth, then add your deployed frontend URL to Supabase redirect URLs.

## API Keys

You can test the full upload-to-pipeline flow without API keys. The backend will produce local fallback transcripts, analysis, tasks, email drafts, and archive files.

When ready, update `.env`:

```bash
GEMINI_API_KEY=...
NOTION_CLIENT_SECRET=...
NOTION_DATABASE_ID=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Gemini is used for transcription, meeting analysis, action extraction, and email drafting. Gemini keys remain backend-only. Supabase publishable/anon keys are safe for browser use; service-role keys and Google client secrets are not.
