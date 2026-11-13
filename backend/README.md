# Mwazanga Hardware API

FastAPI backend backed by Neon PostgreSQL.

## Setup

```powershell
python -m pip install -r backend\requirements.txt
python backend\init_db.py
python -m uvicorn backend.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. OpenAPI documentation is at `/docs`.

Subscription billing starts on December 1, 2026; the admin can use the POS without paying until then, and checkout is rejected before that date. From December 1, an active KSh 3,000 monthly subscription is required. Periods end on the first of the month in East Africa Time. The backend checks expired subscriptions every minute and sends one renewal M-Pesa prompt per period to the saved number. The customer must approve every prompt; this is not an automatic debit, and access is blocked until renewal is confirmed. Keep the FastAPI service running for scheduled prompts. Set `ADMIN_USERNAME` to the admin login username and `PAYSTACK_CUSTOMER_EMAIL` to the email Paystack should receive for M-Pesa charges. Put these and other backend settings such as `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_TOKEN_SECRET`, and Paystack credentials in the ignored `backend\.env` file (see `backend\.env.example`), then run `backend\init_db.py` to update the subscription tables. Customers log in first, provide only an M-Pesa number, receive an STK push, and are signed into the dashboard after Paystack confirms payment. Configure `POST /paystack/webhook` in the Paystack dashboard.

Backend tests are kept in `backend\tests`. Run them from the repository root with:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend\tests -t .
```

## Endpoints

- `GET /health`
- `POST /auth/login`
- `POST /auth/complete-login`
- `GET /auth/session`
- `POST /subscription/payments/initialize`
- `GET /subscription/status`
- `GET /subscription/payments/verify/{reference}`
- `POST /paystack/webhook`
- `GET /api/categories`
- `GET /api/products`
- `POST /api/products`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/supplier-purchases`
- `POST /api/supplier-purchases`
- `GET /api/supplier-payments`
- `POST /api/supplier-purchases/{purchase_id}/payments`

Operating expenses (rent, electricity, wages, transport, repairs, supplies, or other) are separate from supplier purchases. Receiving a supplier purchase adds the received quantities to inventory; partial supplier payments reduce the invoice balance without changing stock. `backend\init_db.py` applies the idempotent schema, including the expense and supplier ledgers.
