# SeaRock CRM — Unified Deployment

Everything runs on **one Vercel project** (frontend + API together).

## Local development (one command)

From project root:

```bash
npm install
npm run dev
```

This starts both backend (`localhost:3001`) and frontend (`localhost:5173`) together.

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel (root directory = project root, not `frontend`)
3. Add **Environment Variables** in Vercel (from `backend/.env`):

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_VERIFY_TOKEN
ADMIN_EMAIL
ADMIN_PASSWORD
JWT_SECRET
```

4. Deploy — no `VITE_API_URL` needed (API runs on same domain at `/api`)

## URLs after deploy

| What | URL |
|------|-----|
| App | `https://your-app.vercel.app` |
| API health | `https://your-app.vercel.app/api/health` |
| Meta webhook | `https://your-app.vercel.app/api/webhook/whatsapp` |

## Login

- Email: `ssearockcrm@gmail.com`
- Password: `admin1234`
