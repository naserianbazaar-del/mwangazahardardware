import hashlib
import hmac
import urllib.error
import os
import unittest
from io import BytesIO
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/testdb")
os.environ.setdefault("AUTH_TOKEN_SECRET", "test-token-secret-for-unit-tests")

import backend.main as backend


class SubscriptionPaymentTests(unittest.TestCase):
    def setUp(self):
        self.connection = MagicMock()
        self.connection.__enter__.return_value = self.connection
        self.client = TestClient(backend.app)

    @patch.dict(
        os.environ,
        {
            "PAYSTACK_SECRET_KEY": "sk_test_value",
            "PAYSTACK_CUSTOMER_EMAIL": "payments@example.com",
        },
        clear=False,
    )
    @patch("backend.main.get_connection")
    def test_initializes_kes_mobile_money_checkout(
        self, get_connection
    ):
        get_connection.return_value = self.connection
        token = backend.create_subscription_token(
            os.environ.get("ADMIN_USERNAME", "aurapos")
        )

        with patch(
            "backend.main.paystack_request",
            side_effect=lambda path, payload=None: {
                "status": True,
                "data": {
                    "reference": payload["reference"],
                    "status": "pay_offline",
                    "display_text": "Approve the M-Pesa prompt on your phone.",
                },
            },
        ) as initialize:
            response = self.client.post(
                "/subscription/payments/initialize",
                json={"phone": "0712345678"},
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(initialize.call_args.args[0], "/charge")
        self.assertEqual(result["status"], "pending")
        self.assertEqual(
            result["display_text"], "Approve the M-Pesa prompt on your phone."
        )
        payload = initialize.call_args.args[1]
        self.assertEqual(payload["email"], "payments@example.com")
        self.assertEqual(payload["amount"], "300000")
        self.assertEqual(payload["currency"], "KES")
        self.assertEqual(
            payload["mobile_money"],
            {"phone": "+254712345678", "provider": "mpesa"},
        )
        self.assertTrue(result["reference"].startswith("mhw-"))
        self.assertEqual(self.connection.execute.call_count, 2)

    def test_payment_initialization_requires_login(self):
        with patch("backend.main.paystack_request") as paystack_request:
            response = self.client.post(
                "/subscription/payments/initialize",
                json={"phone": "0712345678"},
            )

        self.assertEqual(response.status_code, 401)
        paystack_request.assert_not_called()

    def test_paystack_error_message_is_reported(self):
        provider_error = urllib.error.HTTPError(
            "https://api.paystack.co/charge",
            403,
            "Forbidden",
            {},
            BytesIO(b'{"message":"M-Pesa is not enabled for this account"}'),
        )

        with patch("backend.main.urllib.request.urlopen", side_effect=provider_error):
            with self.assertRaises(backend.HTTPException) as raised:
                backend.paystack_request("/charge", {"amount": "300000"})

        self.assertEqual(raised.exception.status_code, 502)
        self.assertIn("M-Pesa is not enabled", raised.exception.detail)

    def test_paystack_rejected_response_message_is_reported(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = (
            b'{"status":false,"message":"M-Pesa charge is unavailable"}'
        )

        with patch("backend.main.urllib.request.urlopen", return_value=response):
            with self.assertRaises(backend.HTTPException) as raised:
                backend.paystack_request("/charge", {"amount": "300000"})

        self.assertEqual(raised.exception.status_code, 502)
        self.assertIn("M-Pesa charge is unavailable", raised.exception.detail)

    def test_invalid_kenyan_number_is_rejected(self):
        with self.assertRaises(backend.HTTPException) as raised:
            backend.normalize_kenyan_phone("12345")

        self.assertEqual(raised.exception.status_code, 422)

    @patch("backend.main.get_connection")
    def test_verified_exact_amount_activates_subscription_once(self, get_connection):
        get_connection.return_value = self.connection
        expires_at = datetime(2026, 12, 12, tzinfo=timezone.utc)
        pending_payment = MagicMock()
        pending_payment.fetchone.return_value = ("pending",)
        updated_payment = MagicMock()
        updated_payment.fetchone.return_value = ("mhw-0123456789abcdef0123456789abcdef",)
        expiry = MagicMock()
        expiry.fetchone.return_value = (expires_at,)
        self.connection.execute.side_effect = [
            pending_payment,
            updated_payment,
            MagicMock(),
            expiry,
        ]
        reference = "mhw-0123456789abcdef0123456789abcdef"

        result = backend.activate_subscription(
            reference,
            {
                "reference": reference,
                "status": "success",
                "amount": 300000,
                "currency": "KES",
            },
        )

        self.assertEqual(result["status"], "active")
        self.assertEqual(result["expires_at"], expires_at.isoformat())
        self.connection.commit.assert_called_once()
        self.assertIn("GREATEST", self.connection.execute.call_args_list[2].args[0])

    @patch("backend.main.get_connection")
    def test_wrong_payment_amount_does_not_activate_subscription(self, get_connection):
        with self.assertRaises(backend.HTTPException) as raised:
            backend.activate_subscription(
                "mhw-0123456789abcdef0123456789abcdef",
                {
                    "reference": "mhw-0123456789abcdef0123456789abcdef",
                    "status": "success",
                    "amount": 30000,
                    "currency": "KES",
                },
            )

        self.assertEqual(raised.exception.status_code, 400)
        get_connection.assert_not_called()

    def test_pos_api_rejects_missing_or_inactive_session(self):
        missing_token = self.client.get("/api/categories")
        token = backend.create_access_token(
            os.environ.get("ADMIN_USERNAME", "aurapos")
        )
        with patch("backend.main.subscription_is_active", return_value=False):
            inactive = self.client.get(
                "/api/categories",
                headers={"Authorization": f"Bearer {token}"},
            )

        self.assertEqual(missing_token.status_code, 401)
        self.assertEqual(inactive.status_code, 402)

    def test_pos_api_allows_cors_preflight_without_a_session(self):
        for origin in ("http://localhost:3000", "http://127.0.0.1:3000"):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/api/categories",
                    headers={
                        "Origin": origin,
                        "Access-Control-Request-Method": "GET",
                    },
                )

                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    response.headers["access-control-allow-origin"],
                    origin,
                )

    @patch.dict(os.environ, {"PAYSTACK_SECRET_KEY": "sk_test_value"}, clear=False)
    def test_webhook_rejects_invalid_signature(self):
        response = self.client.post(
            "/paystack/webhook",
            content=b'{"event":"charge.success","data":{"reference":"mhw-invalid"}}',
            headers={"x-paystack-signature": "invalid"},
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
