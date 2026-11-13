import base64
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/testdb")
os.environ.setdefault("AUTH_TOKEN_SECRET", "test-token-secret-for-unit-tests")

import backend.main as backend


class AuthLoginTests(unittest.TestCase):
    @patch.dict(os.environ, {"ADMIN_USERNAME": "aurapos", "ADMIN_PASSWORD": "aurapos34"}, clear=False)
    def test_login_accepts_real_admin_credentials(self):
        with patch("backend.main.subscription_is_active", return_value=True):
            client = TestClient(backend.app)
            response = client.post(
                "/auth/login",
                json={"username": "aurapos", "password": "aurapos34"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("token", payload)
        self.assertEqual(payload["user"]["username"], "aurapos")

    @patch.dict(os.environ, {"ADMIN_USERNAME": "aurapos", "ADMIN_PASSWORD": "aurapos34"}, clear=False)
    def test_login_rejects_demo_credentials(self):
        client = TestClient(backend.app)
        response = client.post("/auth/login", json={"username": "admin", "password": "invalid-password"})

        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid", response.json()["detail"])

    @patch.dict(os.environ, {"ADMIN_USERNAME": "aurapos", "ADMIN_PASSWORD": "aurapos34"}, clear=False)
    def test_login_requires_an_active_subscription(self):
        with patch("backend.main.subscription_is_active", return_value=False):
            response = TestClient(backend.app).post(
                "/auth/login",
                json={"username": "aurapos", "password": "aurapos34"},
            )

        self.assertEqual(response.status_code, 402)
        self.assertIn("subscription", response.json()["detail"])
        subscription_token = response.json()["subscription_token"]
        self.assertIsNone(backend.get_token_username(subscription_token))
        self.assertEqual(
            backend.get_token_username(
                subscription_token, ("subscription",)
            ),
            "aurapos",
        )

    @patch.dict(os.environ, {"ADMIN_USERNAME": "aurapos", "ADMIN_PASSWORD": "aurapos34"}, clear=False)
    def test_complete_login_exchanges_subscription_token_after_payment(self):
        subscription_token = backend.create_subscription_token("aurapos")
        with patch("backend.main.subscription_is_active", return_value=True):
            response = TestClient(backend.app).post(
                "/auth/complete-login",
                headers={"Authorization": f"Bearer {subscription_token}"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["user"]["username"], "aurapos")
        self.assertEqual(backend.get_token_username(payload["token"]), "aurapos")


class CategoryCreateTests(unittest.TestCase):
    def setUp(self):
        self.connection = MagicMock()
        self.connection.__enter__.return_value = self.connection
        self.subscription_patch = patch(
            "backend.main.subscription_is_active", return_value=True
        )
        self.subscription_patch.start()
        self.addCleanup(self.subscription_patch.stop)
        token = backend.create_access_token(
            os.environ.get("ADMIN_USERNAME", "aurapos")
        )
        self.client = TestClient(
            backend.app, headers={"Authorization": f"Bearer {token}"}
        )

    @patch("backend.main.get_connection")
    def test_create_category_persists_and_returns_category(self, get_connection):
        get_connection.return_value = self.connection
        self.connection.execute.return_value.fetchone.return_value = (
            "category-id",
            "Ceramic Tiles",
            "Wall and floor tiles",
        )

        response = self.client.post(
            "/api/categories",
            json={"name": "  Ceramic Tiles  ", "description": "Wall and floor tiles"},
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.json(),
            {
                "id": "category-id",
                "name": "Ceramic Tiles",
                "description": "Wall and floor tiles",
            },
        )
        self.connection.execute.assert_called_once()
        self.connection.commit.assert_called_once()
        self.assertEqual(self.connection.execute.call_args.args[1][1:], (
            "Ceramic Tiles",
            "Wall and floor tiles",
        ))

    @patch("backend.main.get_connection")
    def test_create_category_reports_duplicate_name(self, get_connection):
        get_connection.return_value = self.connection
        self.connection.execute.side_effect = backend.psycopg.errors.UniqueViolation(
            "duplicate category"
        )

        response = self.client.post("/api/categories", json={"name": "Ceramic Tiles"})

        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json()["detail"], "A category with this name already exists"
        )
        self.connection.rollback.assert_called_once()

    @patch("backend.main.get_connection")
    def test_create_category_rejects_blank_name_without_database_write(self, get_connection):
        response = self.client.post("/api/categories", json={"name": "   "})

        self.assertEqual(response.status_code, 422)
        get_connection.assert_not_called()


class ProductCrudTests(unittest.TestCase):
    def setUp(self):
        self.connection = MagicMock()
        self.connection.__enter__.return_value = self.connection
        self.subscription_patch = patch(
            "backend.main.subscription_is_active", return_value=True
        )
        self.subscription_patch.start()
        self.addCleanup(self.subscription_patch.stop)
        token = backend.create_access_token(
            os.environ.get("ADMIN_USERNAME", "aurapos")
        )
        self.client = TestClient(
            backend.app, headers={"Authorization": f"Bearer {token}"}
        )
        self.product_payload = {
            "name": "Ceramic Tile",
            "sku": "TILE-001",
            "category": "Ceramic Tiles",
            "size": "30x30 cm",
            "brand": "MHW",
            "price": 25.5,
            "quantity": 5,
            "image": "",
            "description": "Floor tile",
            "type": "general",
        }

    @patch("backend.main.get_connection")
    def test_create_product_persists_product_and_returns_it(self, get_connection):
        get_connection.return_value = self.connection
        self.connection.execute.return_value.fetchone.return_value = (
            "product-id", "Ceramic Tile", "TILE-001", "Ceramic Tiles", "30x30 cm",
            "MHW", 25.5, 5, "", "low_stock", "Floor tile", "general",
        )

        response = self.client.post("/api/products", json=self.product_payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["id"], "product-id")
        self.assertEqual(response.json()["status"], "low_stock")
        self.connection.commit.assert_called_once()

    @patch("backend.main.get_connection")
    def test_create_product_saves_uploaded_image_and_serves_it(self, get_connection):
        get_connection.return_value = self.connection
        png = b"\x89PNG\r\n\x1a\nimage-data"
        self.connection.execute.return_value.fetchone.return_value = (
            "product-id", "Ceramic Tile", "TILE-001", "Ceramic Tiles", "30x30 cm",
            "MHW", 25.5, 5, "", "low_stock", "Floor tile", "general",
        )

        with tempfile.TemporaryDirectory() as temporary_directory:
            upload_route = next(
                route.app for route in backend.app.routes if route.path == "/uploads"
            )
            with (
                patch.object(backend, "UPLOAD_DIRECTORY", Path(temporary_directory)),
                patch.object(upload_route, "directory", temporary_directory),
                patch.object(upload_route, "all_directories", [temporary_directory]),
            ):
                response = self.client.post(
                    "/api/products",
                    json={
                        **self.product_payload,
                        "image": f"data:image/png;base64,{base64.b64encode(png).decode()}",
                    },
                )

                self.assertEqual(response.status_code, 201)
                image_url = self.connection.execute.call_args.args[1][8]
                self.assertTrue(image_url.startswith("/uploads/"))
                image_response = self.client.get(image_url)
                self.assertEqual(image_response.status_code, 200)
                self.assertEqual(image_response.content, png)

    @patch("backend.main.get_connection")
    def test_update_product_persists_all_fields(self, get_connection):
        get_connection.return_value = self.connection
        lookup = MagicMock()
        lookup.fetchone.return_value = ("",)
        update = MagicMock()
        update.fetchone.return_value = (
            "product-id", "Ceramic Tile", "TILE-001", "Ceramic Tiles", "30x30 cm",
            "MHW", 25.5, 5, "", "low_stock", "Floor tile", "general",
        )
        self.connection.execute.side_effect = [lookup, update]

        response = self.client.put("/api/products/product-id", json=self.product_payload)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["description"], "Floor tile")
        self.connection.commit.assert_called_once()

    @patch("backend.main.get_connection")
    def test_update_missing_product_returns_not_found(self, get_connection):
        get_connection.return_value = self.connection
        self.connection.execute.return_value.fetchone.return_value = None

        response = self.client.put("/api/products/missing", json=self.product_payload)

        self.assertEqual(response.status_code, 404)
        self.connection.commit.assert_not_called()

    @patch("backend.main.get_connection")
    def test_delete_product_removes_database_record(self, get_connection):
        get_connection.return_value = self.connection
        lookup = MagicMock()
        lookup.fetchone.return_value = ("",)
        deletion = MagicMock()
        self.connection.execute.side_effect = [lookup, deletion]

        response = self.client.delete("/api/products/product-id")

        self.assertEqual(response.status_code, 204)
        self.connection.commit.assert_called_once()

    @patch("backend.main.get_connection")
    def test_delete_product_preserves_products_referenced_by_sales(self, get_connection):
        get_connection.return_value = self.connection
        lookup = MagicMock()
        lookup.fetchone.return_value = ("",)
        self.connection.execute.side_effect = [
            lookup,
            backend.psycopg.errors.ForeignKeyViolation("product is referenced"),
        ]

        response = self.client.delete("/api/products/product-id")

        self.assertEqual(response.status_code, 409)
        self.assertIn("referenced by sales", response.json()["detail"])
        self.connection.rollback.assert_called_once()


if __name__ == "__main__":
    unittest.main()
