# Project Structure and Responsibilities

## Application flow

```text
Browser
  -> Next.js frontend
  -> FastAPI backend
  -> PostgreSQL
  -> Paystack (server-to-server for M-Pesa charges and verification)
```

The browser handles the user interface. The backend is authoritative for
authentication, subscriptions, business rules, database changes, and payment
confirmation.

## Repository layout

```text
pos/
├── backend/
│   ├── .env                   # Ignored backend secrets and server settings
│   ├── .env.example           # Safe backend environment template
│   ├── tests/                 # Backend unit and API tests
│   ├── main.py                # FastAPI routes, auth, POS API, Paystack flow
│   ├── init_db.py             # Apply the database schema
│   ├── schema.sql             # PostgreSQL tables and migrations
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile
│   └── README.md
├── frontend/
│   ├── app/                   # Next.js routes and page components
│   ├── components/
│   │   ├── layouts/           # Shared page layouts and navigation
│   │   └── ui/                # Reusable UI controls
│   ├── hooks/                 # Reusable React hooks
│   ├── lib/                   # API client and shared frontend helpers
│   ├── store/                 # Client-side Zustand state
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Presentation-only formatting helpers
│   ├── public/                # Static images and browser assets
│   ├── package.json           # Frontend dependencies and scripts
│   └── .env.local             # Public frontend settings only
├── docker-compose.yml         # Local frontend/backend services
├── package.json               # Root convenience scripts
└── *.md                       # Project and developer documentation
```

`frontend/data/` is available for static presentation data. Persisted POS data
must come from the backend, not from frontend constants or browser storage.

## What belongs in the frontend

- Pages, forms, navigation, visual components, and accessibility behavior.
- Client-side input checks for faster feedback; the backend must validate again.
- API requests through `frontend/lib/api.ts`.
- Temporary UI state, such as the cart before checkout.
- Public configuration such as `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`.

Never put database credentials, `PAYSTACK_SECRET_KEY`, `AUTH_TOKEN_SECRET`, or
other private credentials in frontend files or `NEXT_PUBLIC_*` variables.

## What belongs in the backend

- Login verification, signed tokens, authorization, and subscription enforcement.
- POS business rules and trusted validation.
- PostgreSQL queries, schema changes, and persistence.
- Paystack M-Pesa charge initialization, transaction verification, and webhooks.
- Private configuration loaded from the ignored `backend/.env`.

The frontend must not call Paystack directly. The backend keeps the Paystack
secret private and activates subscriptions only after verifying payment.

## Environment files

- `backend/.env`: backend-only values such as `DATABASE_URL`, admin credentials,
  `AUTH_TOKEN_SECRET`, `PAYSTACK_SECRET_KEY`, billing email, and CORS origins.
- `frontend/.env.local`: browser-visible settings only. Next.js exposes
  `NEXT_PUBLIC_*` values to client code, so these must never contain secrets.
- `docker-compose.yml` loads `backend/.env` into the backend service.

Use `frontend/.env.local` as the single source for local frontend settings.

Use `backend/.env.example` as the backend template. Never commit `.env` files.

## Backend test layout

Backend tests live under `backend/tests/` so they stay separate from runtime
code. Run them from the repository root:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend\tests -t .
```

## Future backend growth

`backend/main.py` currently contains the API and core backend behavior in one
module. If it grows substantially, split it into focused packages such as
`backend/app/api/`, `backend/app/services/`, `backend/app/db/`, and
`backend/app/schemas/`. Keep routes thin, put payment and subscription rules in
services, and keep database access behind the backend. This is a future
refactor; the current import path remains `backend.main:app`.
