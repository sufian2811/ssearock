# Real Estate CRM with WhatsApp Integration

A Customer Relationship Management system for real estate agencies in Pakistan. Manage property leads and communicate with clients via WhatsApp using the **Meta WhatsApp Cloud API**.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React + Vite + Tailwind CSS         |
| Backend  | Node.js + Express                   |
| Database | Supabase (PostgreSQL)               |
| Messaging| Meta WhatsApp Cloud API             |

## Features

- **Lead Management** — Add, edit, filter leads by status and location
- **Excel Import** — Bulk upload leads from Excel
- **WhatsApp Messaging** — Send messages to individual leads or bulk via templates
- **Conversation Threads** — Full message history per lead (incoming/outgoing)
- **24-Hour Window Logic** — Free-form replies within 24h of client message; templates required outside
- **Chat Dashboard** — Real-time conversation list with chat interface
- **Message Templates** — Create and manage starter templates (must match Meta-approved templates)

## Project Structure

```
watsapp/
├── backend/          # Node.js Express API + Meta WhatsApp webhooks
├── frontend/         # React dashboard and chat UI
├── supabase/         # Database migrations
└── README.md
```

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Supabase](https://supabase.com/) account
- [Meta Business Account](https://business.facebook.com/) with WhatsApp Cloud API enabled

### 1. Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your **Project URL** and **Service Role Key** from Settings → API

### 2. Meta WhatsApp Cloud API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app → Add **WhatsApp** product
3. In **WhatsApp → API Setup**, note:
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Temporary access token** (create a permanent System User token for production)
4. Create a **Verify Token** (any random string you choose)
5. Set webhook URL (after deploying backend or using ngrok):
   ```
   https://your-domain.com/api/webhook/whatsapp
   ```
   Subscribe to: `messages`
6. Create and **approve message templates** in [Meta Business Manager](https://business.facebook.com/) → WhatsApp Manager → Message Templates
7. Template names in CRM must **exactly match** approved Meta template names

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in Supabase + Meta WhatsApp credentials
npm run dev
```

Backend runs at `http://localhost:3001`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

WHATSAPP_ACCESS_TOKEN=your-permanent-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_API_VERSION=v21.0

FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

## Local Webhook Testing

```bash
ngrok http 3001
```

Use the ngrok URL in Meta Developer Console:
```
https://xxxx.ngrok.io/api/webhook/whatsapp
```

## API Endpoints

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/leads`                      | List leads (with filters)|
| POST   | `/api/leads`                      | Create lead              |
| POST   | `/api/leads/upload`               | Import leads from Excel  |
| GET    | `/api/messages/conversations`     | List conversations       |
| POST   | `/api/messages/send`              | Send WhatsApp message    |
| POST   | `/api/messages/send-bulk`         | Bulk send via template   |
| GET    | `/api/messages/templates`         | List templates           |
| POST   | `/api/messages/templates`         | Create template          |
| GET    | `/api/webhook/whatsapp`           | Meta webhook verification|
| POST   | `/api/webhook/whatsapp`           | Meta incoming messages   |

## WhatsApp Messaging Rules

- **24-hour window**: When a client sends a message, you have 24 hours to reply with free-form text
- **Template messages**: Required to initiate conversations or message after the 24-hour window
- **Templates must be pre-approved** in Meta Business Manager before use

## License

MIT
