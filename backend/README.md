# Mwazanga Hardware API

FastAPI backend backed by Neon PostgreSQL.

## Setup

```powershell
python -m pip install -r backend\requirements.txt
python backend\init_db.py
python -m uvicorn backend.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. OpenAPI documentation is at `/docs`.

The app requires an active KSh 3,000 / 30-day subscription. Put backend settings such as `DATABASE_URL`, admin credentials, `AUTH_TOKEN_SECRET`, and Paystack credentials in the ignored `backend\.env` file (see `backend\.env.example`), then run `backend\init_db.py` to add the subscription tables. Customers log in first, provide only an M-Pesa number, receive an STK push, and are signed into the dashboard after Paystack confirms payment. Configure `POST /paystack/webhook` in the Paystack dashboard.

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
