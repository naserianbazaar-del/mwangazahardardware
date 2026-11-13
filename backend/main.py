import base64
import binascii
import hashlib
import hmac
import json
import logging
import os
import re
import urllib.error
import urllib.request
from contextlib import asynccontextmanager
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote
from uuid import uuid4

import psycopg
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv(Path(__file__).with_name(".env"))
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required")
AUTH_TOKEN_SECRET = os.environ.get("AUTH_TOKEN_SECRET")
if not AUTH_TOKEN_SECRET:
    raise RuntimeError("AUTH_TOKEN_SECRET is required")

SCHEMA_PATH = Path(__file__).with_name("schema.sql")
UPLOAD_DIRECTORY = Path(__file__).with_name("uploads")
MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
SUBSCRIPTION_ID = "admin"
SUBSCRIPTION_PRICE_KES = 3_000
SUBSCRIPTION_AMOUNT_SUBUNITS = SUBSCRIPTION_PRICE_KES * 100
ACCESS_TOKEN_LIFETIME = timedelta(hours=24)
SUBSCRIPTION_TOKEN_LIFETIME = timedelta(minutes=15)
logger = logging.getLogger(__name__)


def get_connection() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL)


def row_to_dict(row: tuple[Any, ...], columns: list[str]) -> dict[str, Any]:
    result = dict(zip(columns, row))
    for key, value in result.items():
        if isinstance(value, Decimal):
            result[key] = float(value)
    return result


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    sku: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    size: str = Field(min_length=1, max_length=100)
    brand: str = "Mwazanga Hardware"
    price: float = Field(ge=0)
    quantity: int = Field(default=0, ge=0)
    image: str = Field(default="", max_length=7_000_000)
    description: str | None = None
    type: str = "general"


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str
    address: str | None = None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class SubscriptionPaymentRequest(BaseModel):
    phone: str = Field(min_length=9, max_length=20)


class UserResponse(BaseModel):
    id: str
    username: str
    role: str = "admin"


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)
    discount: float = Field(default=0, ge=0)
    payment_method: Literal["cash", "card", "mobile"]
    notes: str | None = None


class ExpenseCreate(BaseModel):
    category: Literal[
        "rent", "electricity", "wages", "transport", "repairs", "supplies", "other"
    ]
    payee: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_method: Literal["cash", "card", "mobile", "bank"]
    expense_date: datetime | None = None
    reference: str | None = Field(default=None, max_length=200)
    notes: str | None = None


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(default="", max_length=50)
    email: str = Field(default="", max_length=254)
    address: str = Field(default="", max_length=500)


class SupplierPurchaseItemCreate(BaseModel):
    product_id: str = Field(min_length=1)
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class SupplierPurchaseCreate(BaseModel):
    supplier_id: str = Field(min_length=1)
    invoice_number: str = Field(default="", max_length=200)
    items: list[SupplierPurchaseItemCreate] = Field(min_length=1)
    amount_paid: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    payment_method: Literal["cash", "card", "mobile", "bank"] = "cash"
    purchase_date: datetime | None = None
    notes: str | None = None


class SupplierPaymentCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_method: Literal["cash", "card", "mobile", "bank"]
    payment_date: datetime | None = None
    reference: str | None = Field(default=None, max_length=200)
    notes: str | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="Mwazanga Hardware POS API", version="1.0.0", lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIRECTORY, check_dir=False), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,"
            "http://localhost:3001,http://localhost:3002",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _token_secret() -> bytes:
    return AUTH_TOKEN_SECRET.encode("utf-8")


def _create_token(username: str, purpose: str, lifetime: timedelta) -> str:
    payload = json.dumps(
        {
            "sub": username,
            "purpose": purpose,
            "exp": int((datetime.now(timezone.utc) + lifetime).timestamp()),
        },
        separators=(",", ":"),
    ).encode("utf-8")
    encoded_payload = base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")
    signature = hmac.new(
        _token_secret(), encoded_payload.encode("ascii"), hashlib.sha256
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).rstrip(b"=").decode("ascii")
    return f"{encoded_payload}.{encoded_signature}"


def create_access_token(username: str) -> str:
    return _create_token(username, "access", ACCESS_TOKEN_LIFETIME)


def create_subscription_token(username: str) -> str:
    return _create_token(username, "subscription", SUBSCRIPTION_TOKEN_LIFETIME)


def get_token_username(
    token: str | None, allowed_purposes: tuple[str, ...] = ("access",)
) -> str | None:
    if not token:
        return None
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(
            _token_secret(), encoded_payload.encode("ascii"), hashlib.sha256
        ).digest()
        provided_signature = base64.urlsafe_b64decode(
            encoded_signature + "=" * (-len(encoded_signature) % 4)
        )
        if not hmac.compare_digest(expected_signature, provided_signature):
            return None
        payload = base64.urlsafe_b64decode(
            encoded_payload + "=" * (-len(encoded_payload) % 4)
        )
        claims = json.loads(payload)
        if (
            not isinstance(claims, dict)
            or claims.get("purpose") not in allowed_purposes
            or claims.get("sub") != os.environ.get("ADMIN_USERNAME", "aurapos")
            or int(claims.get("exp", 0))
            <= int(datetime.now(timezone.utc).timestamp())
        ):
            return None
        return claims["sub"]
    except (
        ValueError,
        TypeError,
        KeyError,
        binascii.Error,
        UnicodeDecodeError,
        json.JSONDecodeError,
    ):
        return None


def get_bearer_token(request: Request) -> str | None:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    return token.strip() if scheme.lower() == "bearer" and token.strip() else None


def get_payment_username(request: Request) -> str | None:
    return get_token_username(
        get_bearer_token(request), ("access", "subscription")
    )


def get_subscription_expiry() -> datetime | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT expires_at FROM subscriptions WHERE id = %s",
            (SUBSCRIPTION_ID,),
        ).fetchone()
    return row[0] if row else None


def subscription_is_active() -> bool:
    expiry = get_subscription_expiry()
    if expiry is None:
        return False
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry > datetime.now(timezone.utc)


def normalize_kenyan_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("0"):
        digits = f"254{digits[1:]}"
    if not re.fullmatch(r"254[17]\d{8}", digits):
        raise HTTPException(
            status_code=422,
            detail="Enter a valid Kenyan mobile number, such as 0712345678",
        )
    return f"+{digits}"


def paystack_request(path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    secret_key = os.environ.get("PAYSTACK_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=503, detail="Paystack payments are not configured"
        )
    request = urllib.request.Request(
        f"https://api.paystack.co{path}",
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        headers={
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            # Paystack's Cloudflare layer rejects the default Python-urllib
            # user agent with HTTP 403 (error 1010).
            "User-Agent": "mwangazahardware-backend/1.0",
        },
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read())
    except urllib.error.HTTPError as error:
        raw_body = error.read()
        try:
            error_payload = json.loads(raw_body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            error_payload = {}
        provider_message = (
            error_payload.get("message")
            if isinstance(error_payload, dict)
            and isinstance(error_payload.get("message"), str)
            else ""
        )
        provider_message = provider_message.strip()[:300]
        if provider_message:
            logger.error(
                "Paystack returned HTTP %s: %s", error.code, provider_message
            )
        else:
            logger.error(
                "Paystack returned HTTP %s: %s",
                error.code,
                raw_body[:200].decode("utf-8", "replace").strip(),
            )
        detail = "The payment provider rejected the request"
        if provider_message:
            detail = f"Paystack rejected the request: {provider_message}"
        raise HTTPException(
            status_code=502, detail=detail
        ) from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        logger.error("Paystack request failed", exc_info=True)
        raise HTTPException(
            status_code=502, detail="Unable to contact the payment provider"
        ) from error
    if not isinstance(result, dict) or result.get("status") is not True:
        provider_message = (
            result.get("message")
            if isinstance(result, dict) and isinstance(result.get("message"), str)
            else ""
        )
        provider_message = provider_message.strip()[:300]
        if provider_message:
            logger.error("Paystack rejected the request: %s", provider_message)
            detail = f"Paystack rejected the request: {provider_message}"
        else:
            detail = "The payment provider rejected the request"
        raise HTTPException(
            status_code=502, detail=detail
        )
    return result


def get_paystack_billing_email() -> str:
    email = (
        os.environ.get("PAYSTACK_CUSTOMER_EMAIL")
        or os.environ.get("NEXT_PUBLIC_BUSINESS_EMAIL")
        or ""
    ).strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(
            status_code=503,
            detail="Configure a billing email for the Paystack account",
        )
    return email


def activate_subscription(reference: str, transaction: dict[str, Any]) -> dict[str, Any]:
    if (
        transaction.get("reference") != reference
        or transaction.get("status") != "success"
        or transaction.get("amount") != SUBSCRIPTION_AMOUNT_SUBUNITS
        or transaction.get("currency") != "KES"
    ):
        raise HTTPException(
            status_code=400,
            detail="Payment is not successful or does not match the subscription amount",
        )

    with get_connection() as connection:
        payment = connection.execute(
            "SELECT status FROM subscription_payments WHERE reference = %s FOR UPDATE",
            (reference,),
        ).fetchone()
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment reference not found")
        if payment[0] == "success":
            expiry_row = connection.execute(
                "SELECT expires_at FROM subscriptions WHERE id = %s",
                (SUBSCRIPTION_ID,),
            ).fetchone()
            return {
                "status": "active",
                "expires_at": expiry_row[0].isoformat() if expiry_row else None,
            }

        updated_payment = connection.execute(
            """
            UPDATE subscription_payments
            SET status = 'success', paid_at = NOW()
            WHERE reference = %s AND status = 'pending'
            RETURNING reference
            """,
            (reference,),
        ).fetchone()
        if updated_payment is None:
            raise HTTPException(status_code=409, detail="Payment is no longer pending")

        connection.execute(
            """
            INSERT INTO subscriptions (id, email, phone, expires_at, updated_at)
            SELECT %s, payment.email, payment.phone,
                   NOW() + INTERVAL '30 days', NOW()
            FROM subscription_payments AS payment
            WHERE payment.reference = %s
            ON CONFLICT (id) DO UPDATE
            SET email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                expires_at = GREATEST(subscriptions.expires_at, NOW())
                    + INTERVAL '30 days',
                updated_at = NOW()
            """,
            (SUBSCRIPTION_ID, reference),
        )
        expiry_row = connection.execute(
            "SELECT expires_at FROM subscriptions WHERE id = %s",
            (SUBSCRIPTION_ID,),
        ).fetchone()
        connection.commit()
    return {"status": "active", "expires_at": expiry_row[0].isoformat()}


@app.middleware("http")
async def require_active_subscription(request: Request, call_next: Any):
    if request.method == "OPTIONS":
        return await call_next(request)
    if request.url.path.startswith("/api/"):
        username = get_token_username(get_bearer_token(request))
        if username is None:
            return JSONResponse(
                status_code=401, content={"detail": "Authentication required"}
            )
        if not subscription_is_active():
            return JSONResponse(
                status_code=402,
                content={"detail": "An active subscription is required"},
            )
    return await call_next(request)


def save_product_image(image: str) -> tuple[str, Path | None]:
    if not image.startswith("data:"):
        return image, None

    try:
        header, encoded = image.split(",", 1)
        mime_type = header.removeprefix("data:").removesuffix(";base64")
        image_bytes = base64.b64decode(encoded, validate=True)
    except (ValueError, binascii.Error) as error:
        raise HTTPException(status_code=400, detail="Invalid product image") from error

    signatures = {
        "image/jpeg": (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        "image/png": (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        "image/webp": (
            ".webp",
            lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP",
        ),
        "image/gif": (
            ".gif",
            lambda data: data.startswith((b"GIF87a", b"GIF89a")),
        ),
    }
    signature = signatures.get(mime_type)
    if not signature or not signature[1](image_bytes):
        raise HTTPException(
            status_code=400,
            detail="Product images must be valid JPEG, PNG, WebP, or GIF files",
        )
    if len(image_bytes) > MAX_PRODUCT_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Product images must be 5 MB or smaller")

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    image_path = UPLOAD_DIRECTORY / f"{uuid4()}{signature[0]}"
    image_path.write_bytes(image_bytes)
    return f"/uploads/{image_path.name}", image_path


def remove_product_image(image: str) -> None:
    filename = Path(image).name
    if image.startswith("/uploads/") and filename == image.removeprefix("/uploads/"):
        image_path = UPLOAD_DIRECTORY / filename
        try:
            image_path.unlink(missing_ok=True)
        except OSError:
            logger.warning("Unable to remove unused product image %s", image_path, exc_info=True)


@app.get("/health")
def health() -> dict[str, str]:
    with get_connection() as connection:
        connection.execute("SELECT 1")
    return {"status": "ok", "database": "connected"}


@app.post("/auth/login", response_model=None)
def login(credentials: LoginRequest) -> dict[str, Any] | JSONResponse:
    username = credentials.username.strip()
    password = credentials.password
    expected_username = os.environ.get("ADMIN_USERNAME", "aurapos")
    expected_password = os.environ.get("ADMIN_PASSWORD", "aurapos34")

    if username != expected_username or password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not subscription_is_active():
        return JSONResponse(
            status_code=402,
            content={
                "detail": "Complete the KSh 3,000 monthly subscription to continue",
                "subscription_token": create_subscription_token(username),
            },
        )

    token = create_access_token(username)
    return {
        "token": token,
        "user": UserResponse(id="admin", username=username, role="admin").model_dump(),
    }


@app.get("/auth/session")
def auth_session(request: Request) -> dict[str, Any]:
    username = get_token_username(get_bearer_token(request))
    if username is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    expiry = get_subscription_expiry()
    if expiry is None:
        raise HTTPException(
            status_code=402, detail="An active subscription is required"
        )
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=402, detail="An active subscription is required"
        )
    return {
        "user": UserResponse(id="admin", username=username, role="admin").model_dump(),
        "subscription_expires_at": expiry.isoformat(),
    }


@app.post("/auth/complete-login")
def complete_login(request: Request) -> dict[str, Any]:
    username = get_token_username(
        get_bearer_token(request), ("access", "subscription")
    )
    if username is None:
        raise HTTPException(status_code=401, detail="A valid login is required")
    if not subscription_is_active():
        raise HTTPException(
            status_code=402, detail="An active subscription is required"
        )
    return {
        "token": create_access_token(username),
        "user": UserResponse(id="admin", username=username, role="admin").model_dump(),
    }


@app.post("/subscription/payments/initialize")
def initialize_subscription_payment(
    request: Request,
    payment_request: SubscriptionPaymentRequest,
) -> dict[str, Any]:
    if get_payment_username(request) is None:
        raise HTTPException(status_code=401, detail="Login before starting payment")
    email = get_paystack_billing_email()
    phone = normalize_kenyan_phone(payment_request.phone)
    reference = f"mhw-{uuid4().hex}"
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO subscription_payments
              (reference, email, phone, amount, status)
            VALUES (%s, %s, %s, %s, 'pending')
            """,
            (reference, email, phone, SUBSCRIPTION_AMOUNT_SUBUNITS),
        )
        connection.commit()

    try:
        provider_response = paystack_request(
            "/charge",
            {
                "email": email,
                "amount": str(SUBSCRIPTION_AMOUNT_SUBUNITS),
                "currency": "KES",
                "mobile_money": {"phone": phone, "provider": "mpesa"},
                "reference": reference,
                "metadata": {
                    "subscription": "mwazanga-monthly",
                    "phone": phone,
                },
            },
        )
        provider_data = provider_response.get("data", {})
        provider_status = provider_data.get("status")
        if provider_data.get("reference") != reference or provider_status not in {
            "pay_offline",
            "pending",
            "ongoing",
            "success",
            "failed",
        }:
            raise HTTPException(
                status_code=502, detail="Invalid charge response from payment provider"
            )
    except HTTPException:
        with get_connection() as connection:
            connection.execute(
                """
                UPDATE subscription_payments SET status = 'failed'
                WHERE reference = %s AND status = 'pending'
                """,
                (reference,),
            )
            connection.commit()
        raise

    with get_connection() as connection:
        connection.execute(
            """
            UPDATE subscription_payments
            SET display_text = %s,
                status = CASE WHEN %s = 'failed' THEN 'failed' ELSE status END
            WHERE reference = %s
            """,
            (
                provider_data.get("display_text"),
                provider_status,
                reference,
            ),
        )
        connection.commit()
    if provider_status == "success":
        verified_transaction = paystack_request(
            f"/transaction/verify/{quote(reference, safe='')}"
        ).get("data", {})
        if verified_transaction.get("status") == "success":
            activated = activate_subscription(reference, verified_transaction)
            return {
                "reference": reference,
                "status": "active",
                "display_text": "Payment confirmed.",
                "expires_at": activated.get("expires_at"),
            }
    return {
        "reference": reference,
        "status": "failed" if provider_status == "failed" else "pending",
        "display_text": provider_data.get(
            "display_text",
            "Check your phone and approve the M-Pesa payment prompt.",
        ),
    }


@app.get("/subscription/payments/verify/{reference}")
def verify_subscription_payment(reference: str) -> dict[str, Any]:
    if not re.fullmatch(r"mhw-[a-f0-9]{32}", reference):
        raise HTTPException(status_code=404, detail="Payment reference not found")
    with get_connection() as connection:
        payment = connection.execute(
            "SELECT status FROM subscription_payments WHERE reference = %s",
            (reference,),
        ).fetchone()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment reference not found")
    if payment[0] == "success":
        expiry = get_subscription_expiry()
        return {
            "status": "active",
            "expires_at": expiry.isoformat() if expiry else None,
        }
    if payment[0] == "failed":
        return {"status": "failed"}

    transaction = paystack_request(
        f"/transaction/verify/{quote(reference, safe='')}"
    ).get("data", {})
    if transaction.get("status") in {"failed", "abandoned"}:
        with get_connection() as connection:
            connection.execute(
                """
                UPDATE subscription_payments SET status = 'failed'
                WHERE reference = %s AND status = 'pending'
                """,
                (reference,),
            )
            connection.commit()
        return {"status": "failed"}
    if transaction.get("status") != "success":
        return {"status": "pending"}
    return activate_subscription(reference, transaction)


@app.post("/paystack/webhook")
async def paystack_webhook(request: Request) -> dict[str, str]:
    secret_key = os.environ.get("PAYSTACK_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=503, detail="Paystack payments are not configured"
        )
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    expected_signature = hmac.new(
        secret_key.encode("utf-8"), body, hashlib.sha512
    ).hexdigest()
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        event = json.loads(body)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from error
    if event.get("event") != "charge.success":
        return {"status": "ignored"}
    reference = event.get("data", {}).get("reference")
    if not isinstance(reference, str) or not re.fullmatch(
        r"mhw-[a-f0-9]{32}", reference
    ):
        raise HTTPException(status_code=400, detail="Invalid payment reference")
    verified = paystack_request(
        f"/transaction/verify/{quote(reference, safe='')}"
    ).get("data", {})
    if verified.get("status") != "success":
        return {"status": "pending"}
    activate_subscription(reference, verified)
    return {"status": "processed"}


@app.get("/api/categories")
def list_categories() -> list[dict[str, Any]]:
    columns = ["id", "name", "description"]
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, name, description FROM categories ORDER BY name"
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/categories", status_code=201)
def create_category(category: CategoryCreate) -> dict[str, Any]:
    name = category.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Category name is required")

    columns = ["id", "name", "description"]
    with get_connection() as connection:
        try:
            row = connection.execute(
                """
                INSERT INTO categories (id, name, description)
                VALUES (%s, %s, %s)
                RETURNING id, name, description
                """,
                (str(uuid4()), name, category.description or None),
            ).fetchone()
            connection.commit()
        except psycopg.errors.UniqueViolation as error:
            connection.rollback()
            raise HTTPException(
                status_code=409, detail="A category with this name already exists"
            ) from error
    return row_to_dict(row, columns)


@app.get("/api/products")
def list_products(
    category: str | None = None,
    search: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    if not 1 <= limit <= 500:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 500")
    columns = [
        "id", "name", "sku", "category", "size", "brand", "price",
        "quantity", "image", "status", "description", "type",
    ]
    query = """
        SELECT id, name, sku, category, size, brand, price, quantity,
               image, status, description, type
        FROM products
                WHERE (%s::text IS NULL OR category = %s::text)
                    AND (%s::text IS NULL OR name ILIKE %s::text OR sku ILIKE %s::text)
        ORDER BY name
                LIMIT %s::int
    """
    search_pattern = f"%{search}%" if search else None
    with get_connection() as connection:
        rows = connection.execute(
            query, (category, category, search, search_pattern, search_pattern, limit)
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/products", status_code=201)
def create_product(product: ProductCreate) -> dict[str, Any]:
    product_id = str(uuid4())
    saved_image: Path | None = None
    status = (
        "out_of_stock"
        if product.quantity == 0
        else "low_stock"
        if product.quantity <= 20
        else "in_stock"
    )
    columns = [
        "id", "name", "sku", "category", "size", "brand", "price",
        "quantity", "image", "status", "description", "type",
    ]
    with get_connection() as connection:
        try:
            image_url, saved_image = save_product_image(product.image)
            row = connection.execute(
                """
                INSERT INTO products
                  (id, name, sku, category, size, brand, price, quantity,
                   image, status, description, type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name, sku, category, size, brand, price, quantity,
                          image, status, description, type
                """,
                (
                    product_id, product.name, product.sku, product.category,
                    product.size, product.brand, product.price, product.quantity,
                    image_url, status, product.description, product.type,
                ),
            ).fetchone()
            connection.commit()
        except psycopg.errors.UniqueViolation as error:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail="SKU already exists") from error
        except psycopg.errors.ForeignKeyViolation as error:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="Category does not exist") from error
        except Exception:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise
    return row_to_dict(row, columns)


@app.put("/api/products/{product_id}")
def update_product(product_id: str, product: ProductCreate) -> dict[str, Any]:
    image_url = product.image
    saved_image: Path | None = None
    previous_image = ""
    status = (
        "out_of_stock"
        if product.quantity == 0
        else "low_stock"
        if product.quantity <= 20
        else "in_stock"
    )
    columns = [
        "id", "name", "sku", "category", "size", "brand", "price",
        "quantity", "image", "status", "description", "type",
    ]
    with get_connection() as connection:
        try:
            current_product = connection.execute(
                "SELECT image FROM products WHERE id = %s FOR UPDATE", (product_id,)
            ).fetchone()
            if current_product is None:
                raise HTTPException(status_code=404, detail="Product not found")
            previous_image = current_product[0]
            image_url, saved_image = save_product_image(product.image)
            row = connection.execute(
                """
                UPDATE products
                SET name = %s, sku = %s, category = %s, size = %s, brand = %s,
                    price = %s, quantity = %s, image = %s, status = %s,
                    description = %s, type = %s, updated_at = NOW()
                WHERE id = %s
                RETURNING id, name, sku, category, size, brand, price, quantity,
                          image, status, description, type
                """,
                (
                    product.name.strip(),
                    product.sku.strip(),
                    product.category.strip(),
                    product.size.strip(),
                    product.brand.strip(),
                    product.price,
                    product.quantity,
                    image_url,
                    status,
                    product.description,
                    product.type,
                    product_id,
                ),
            ).fetchone()
            connection.commit()
        except psycopg.errors.UniqueViolation as error:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise HTTPException(status_code=409, detail="SKU already exists") from error
        except psycopg.errors.ForeignKeyViolation as error:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail="Category does not exist") from error
        except Exception:
            connection.rollback()
            if saved_image:
                saved_image.unlink(missing_ok=True)
            raise
    if previous_image != image_url:
        remove_product_image(previous_image)
    return row_to_dict(row, columns)


@app.delete("/api/products/{product_id}", status_code=204)
def delete_product(product_id: str) -> None:
    with get_connection() as connection:
        try:
            row = connection.execute(
                "SELECT image FROM products WHERE id = %s FOR UPDATE", (product_id,)
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Product not found")
            result = connection.execute(
                "DELETE FROM products WHERE id = %s", (product_id,)
            )
            connection.commit()
        except psycopg.errors.ForeignKeyViolation as error:
            connection.rollback()
            raise HTTPException(
                status_code=409,
                detail="This product is referenced by sales or inventory records and cannot be deleted",
            ) from error
    remove_product_image(row[0])


@app.get("/api/customers")
def list_customers() -> list[dict[str, Any]]:
    columns = [
        "id", "name", "email", "phone", "address", "loyalty_points",
        "total_purchases", "last_purchase", "created_at",
    ]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, name, email, phone, address, loyalty_points,
                   total_purchases, last_purchase, created_at
            FROM customers ORDER BY name
            """
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/customers", status_code=201)
def create_customer(customer: CustomerCreate) -> dict[str, Any]:
    customer_id = str(uuid4())
    columns = ["id", "name", "email", "phone", "address"]
    with get_connection() as connection:
        try:
            row = connection.execute(
                """
                INSERT INTO customers (id, name, email, phone, address)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, name, email, phone, address
                """,
                (customer_id, customer.name, customer.email, customer.phone, customer.address),
            ).fetchone()
            connection.commit()
        except psycopg.errors.UniqueViolation as error:
            connection.rollback()
            raise HTTPException(status_code=409, detail="Email already exists") from error
    return row_to_dict(row, columns)


@app.post("/api/orders", status_code=201)
def create_order(order: OrderCreate) -> dict[str, Any]:
    order_id = str(uuid4())
    order_number = f"ORD-{order_id[:8].upper()}"
    with get_connection() as connection:
        try:
            product_rows = {}
            for item in order.items:
                row = connection.execute(
                    "SELECT id, price, quantity FROM products WHERE id = %s FOR UPDATE",
                    (item.product_id,),
                ).fetchone()
                if row is None:
                    raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
                if row[2] < item.quantity:
                    raise HTTPException(status_code=409, detail=f"Insufficient stock for {item.product_id}")
                product_rows[item.product_id] = row

            subtotal = sum(
                product_rows[item.product_id][1] * item.quantity for item in order.items
            )
            total = max(Decimal("0"), subtotal - Decimal(str(order.discount)))
            connection.execute(
                """
                INSERT INTO orders
                  (id, order_number, customer_id, subtotal, discount, total,
                   payment_method, status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'completed', %s)
                """,
                (
                    order_id, order_number, order.customer_id, subtotal,
                    order.discount, total, order.payment_method, order.notes,
                ),
            )
            for item in order.items:
                price = product_rows[item.product_id][1]
                connection.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (%s, %s, %s, %s)",
                    (order_id, item.product_id, item.quantity, price),
                )
                new_quantity = product_rows[item.product_id][2] - item.quantity
                status = "out_of_stock" if new_quantity == 0 else "low_stock" if new_quantity < 20 else "in_stock"
                connection.execute(
                    "UPDATE products SET quantity = %s, status = %s, updated_at = NOW() WHERE id = %s",
                    (new_quantity, status, item.product_id),
                )
                connection.execute(
                    "INSERT INTO inventory_movements (id, product_id, type, quantity, reason) VALUES (%s, %s, 'out', %s, %s)",
                    (str(uuid4()), item.product_id, item.quantity, f"Sale {order_number}"),
                )
            connection.commit()
        except HTTPException:
            connection.rollback()
            raise
        except Exception:
            connection.rollback()
            raise
    return {
        "id": order_id,
        "order_number": order_number,
        "subtotal": float(subtotal),
        "discount": float(order.discount),
        "total": float(total),
        "payment_method": order.payment_method,
        "status": "completed",
    }


@app.get("/api/orders")
def list_orders(limit: int = 100) -> list[dict[str, Any]]:
    if not 1 <= limit <= 500:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 500")
    columns = [
        "id", "order_number", "customer_id", "subtotal", "discount", "total",
        "payment_method", "status", "notes", "created_at",
    ]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, order_number, customer_id, subtotal, discount, total,
                   payment_method, status, notes, created_at
            FROM orders ORDER BY created_at DESC LIMIT %s
            """, (limit,)
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.get("/api/expenses")
def list_expenses(limit: int = 500) -> list[dict[str, Any]]:
    if not 1 <= limit <= 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
    columns = [
        "id", "category", "payee", "amount", "payment_method", "expense_date",
        "reference", "notes",
    ]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, category, payee, amount, payment_method, expense_date,
                   reference, notes
            FROM expenses ORDER BY expense_date DESC LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/expenses", status_code=201)
def create_expense(expense: ExpenseCreate) -> dict[str, Any]:
    payee = expense.payee.strip()
    if not payee:
        raise HTTPException(status_code=422, detail="Payee is required")
    expense_id = str(uuid4())
    columns = [
        "id", "category", "payee", "amount", "payment_method", "expense_date",
        "reference", "notes",
    ]
    with get_connection() as connection:
        row = connection.execute(
            """
            INSERT INTO expenses
              (id, category, payee, amount, payment_method, expense_date, reference, notes)
            VALUES (%s, %s, %s, %s, %s, COALESCE(%s, NOW()), %s, %s)
            RETURNING id, category, payee, amount, payment_method, expense_date,
                      reference, notes
            """,
            (
                expense_id, expense.category, payee, expense.amount,
                expense.payment_method, expense.expense_date, expense.reference, expense.notes,
            ),
        ).fetchone()
        connection.commit()
    return row_to_dict(row, columns)


@app.get("/api/suppliers")
def list_suppliers() -> list[dict[str, Any]]:
    columns = ["id", "name", "phone", "email", "address", "created_at"]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, name, phone, email, address, created_at
            FROM suppliers ORDER BY name
            """
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/suppliers", status_code=201)
def create_supplier(supplier: SupplierCreate) -> dict[str, Any]:
    name = supplier.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Supplier name is required")
    columns = ["id", "name", "phone", "email", "address", "created_at"]
    with get_connection() as connection:
        row = connection.execute(
            """
            INSERT INTO suppliers (id, name, phone, email, address)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, phone, email, address, created_at
            """,
            (
                str(uuid4()), name, supplier.phone.strip(),
                supplier.email.strip(), supplier.address.strip(),
            ),
        ).fetchone()
        connection.commit()
    return row_to_dict(row, columns)


@app.get("/api/supplier-purchases")
def list_supplier_purchases(limit: int = 500) -> list[dict[str, Any]]:
    if not 1 <= limit <= 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
    columns = [
        "id", "supplier_id", "supplier_name", "invoice_number", "total",
        "amount_paid", "balance", "status", "purchase_date", "notes",
    ]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT p.id, p.supplier_id, s.name, p.invoice_number, p.total,
                   p.amount_paid, p.total - p.amount_paid,
                   CASE
                     WHEN p.amount_paid = 0 THEN 'unpaid'
                     WHEN p.amount_paid < p.total THEN 'partial'
                     ELSE 'paid'
                   END,
                   p.purchase_date, p.notes
            FROM supplier_purchases p
            JOIN suppliers s ON s.id = p.supplier_id
            ORDER BY p.purchase_date DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/supplier-purchases", status_code=201)
def create_supplier_purchase(purchase: SupplierPurchaseCreate) -> dict[str, Any]:
    product_ids = [item.product_id for item in purchase.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(
            status_code=422,
            detail="Each product can appear only once per supplier purchase",
        )

    purchase_total = sum(
        (item.unit_cost * item.quantity for item in purchase.items),
        Decimal("0"),
    )
    if purchase_total <= 0:
        raise HTTPException(status_code=422, detail="Purchase total must be greater than zero")
    if purchase.amount_paid > purchase_total:
        raise HTTPException(
            status_code=422,
            detail="Amount paid cannot exceed the supplier purchase total",
        )

    purchase_id = str(uuid4())
    purchase_number = purchase.invoice_number.strip()
    with get_connection() as connection:
        try:
            supplier_row = connection.execute(
                "SELECT id FROM suppliers WHERE id = %s FOR KEY SHARE",
                (purchase.supplier_id,),
            ).fetchone()
            if supplier_row is None:
                raise HTTPException(status_code=404, detail="Supplier not found")

            product_rows: dict[str, tuple[Any, ...]] = {}
            for item in purchase.items:
                row = connection.execute(
                    "SELECT id, quantity FROM products WHERE id = %s FOR UPDATE",
                    (item.product_id,),
                ).fetchone()
                if row is None:
                    raise HTTPException(
                        status_code=404, detail=f"Product {item.product_id} not found"
                    )
                product_rows[item.product_id] = row

            connection.execute(
                """
                INSERT INTO supplier_purchases
                  (id, supplier_id, invoice_number, total, amount_paid, purchase_date, notes)
                VALUES (%s, %s, %s, %s, %s, COALESCE(%s, NOW()), %s)
                """,
                (
                    purchase_id, purchase.supplier_id, purchase_number,
                    purchase_total, purchase.amount_paid, purchase.purchase_date, purchase.notes,
                ),
            )
            for item in purchase.items:
                connection.execute(
                    """
                    INSERT INTO supplier_purchase_items
                      (purchase_id, product_id, quantity, unit_cost)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (purchase_id, item.product_id, item.quantity, item.unit_cost),
                )
                new_quantity = product_rows[item.product_id][1] + item.quantity
                status = (
                    "out_of_stock" if new_quantity == 0
                    else "low_stock" if new_quantity <= 20
                    else "in_stock"
                )
                connection.execute(
                    """
                    UPDATE products
                    SET quantity = %s, status = %s, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (new_quantity, status, item.product_id),
                )
                connection.execute(
                    """
                    INSERT INTO inventory_movements
                      (id, product_id, type, quantity, reason)
                    VALUES (%s, %s, 'in', %s, %s)
                    """,
                    (
                        str(uuid4()), item.product_id, item.quantity,
                        f"Supplier purchase {purchase_number or purchase_id}",
                    ),
                )

            if purchase.amount_paid > 0:
                connection.execute(
                    """
                    INSERT INTO supplier_payments
                      (id, purchase_id, amount, payment_method, reference, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        str(uuid4()), purchase_id, purchase.amount_paid,
                        purchase.payment_method, purchase_number or None, purchase.notes,
                    ),
                )
            connection.commit()
        except HTTPException:
            connection.rollback()
            raise
        except Exception:
            connection.rollback()
            raise

    return {
        "id": purchase_id,
        "supplier_id": purchase.supplier_id,
        "invoice_number": purchase_number,
        "total": float(purchase_total),
        "amount_paid": float(purchase.amount_paid),
        "balance": float(purchase_total - purchase.amount_paid),
        "status": (
            "unpaid" if purchase.amount_paid == 0
            else "partial" if purchase.amount_paid < purchase_total
            else "paid"
        ),
    }


@app.get("/api/supplier-payments")
def list_supplier_payments(limit: int = 500) -> list[dict[str, Any]]:
    if not 1 <= limit <= 1000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
    columns = [
        "id", "purchase_id", "supplier_name", "invoice_number", "amount",
        "payment_method", "payment_date", "reference", "notes",
    ]
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT payment.id, payment.purchase_id, supplier.name,
                   purchase.invoice_number, payment.amount, payment.payment_method,
                   payment.payment_date, payment.reference, payment.notes
            FROM supplier_payments payment
            JOIN supplier_purchases purchase ON purchase.id = payment.purchase_id
            JOIN suppliers supplier ON supplier.id = purchase.supplier_id
            ORDER BY payment.payment_date DESC
            LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [row_to_dict(row, columns) for row in rows]


@app.post("/api/supplier-purchases/{purchase_id}/payments", status_code=201)
def create_supplier_payment(
    purchase_id: str, payment: SupplierPaymentCreate
) -> dict[str, Any]:
    payment_id = str(uuid4())
    with get_connection() as connection:
        try:
            purchase = connection.execute(
                """
                SELECT total, amount_paid FROM supplier_purchases
                WHERE id = %s FOR UPDATE
                """,
                (purchase_id,),
            ).fetchone()
            if purchase is None:
                raise HTTPException(status_code=404, detail="Supplier purchase not found")

            balance = purchase[0] - purchase[1]
            if payment.amount > balance:
                raise HTTPException(
                    status_code=409,
                    detail=f"Payment exceeds the outstanding balance of {balance}",
                )

            row = connection.execute(
                """
                INSERT INTO supplier_payments
                  (id, purchase_id, amount, payment_method, payment_date, reference, notes)
                VALUES (%s, %s, %s, %s, COALESCE(%s, NOW()), %s, %s)
                RETURNING id, purchase_id, amount, payment_method, payment_date, reference, notes
                """,
                (
                    payment_id, purchase_id, payment.amount, payment.payment_method,
                    payment.payment_date, payment.reference, payment.notes,
                ),
            ).fetchone()
            connection.execute(
                "UPDATE supplier_purchases SET amount_paid = amount_paid + %s WHERE id = %s",
                (payment.amount, purchase_id),
            )
            connection.commit()
        except HTTPException:
            connection.rollback()
            raise
        except Exception:
            connection.rollback()
            raise
    columns = [
        "id", "purchase_id", "amount", "payment_method", "payment_date",
        "reference", "notes",
    ]
    return row_to_dict(row, columns)
