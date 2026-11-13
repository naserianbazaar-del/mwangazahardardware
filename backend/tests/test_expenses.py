import os
import unittest
from decimal import Decimal
from unittest.mock import MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://localhost:5432/testdb")
os.environ.setdefault("AUTH_TOKEN_SECRET", "test-token-secret-for-unit-tests")

import backend.main as backend


class ExpenseApiTests(unittest.TestCase):
    def setUp(self):
        self.connection = MagicMock()
        self.connection.__enter__.return_value = self.connection

    @patch("backend.main.get_connection")
    def test_create_expense_records_operating_cost(self, get_connection):
        get_connection.return_value = self.connection
        self.connection.execute.return_value.fetchone.return_value = (
            "expense-id",
            "electricity",
            "Kenya Power",
            Decimal("2500.00"),
            "mobile",
            None,
            "meter-1",
            "Monthly bill",
        )

        result = backend.create_expense(
            backend.ExpenseCreate(
                category="electricity",
                payee=" Kenya Power ",
                amount=Decimal("2500"),
                payment_method="mobile",
                reference="meter-1",
                notes="Monthly bill",
            )
        )

        self.assertEqual(result["payee"], "Kenya Power")
        self.assertEqual(result["amount"], 2500.0)
        self.connection.commit.assert_called_once()

    @patch("backend.main.get_connection")
    def test_supplier_purchase_receives_stock_and_records_initial_payment(self, get_connection):
        get_connection.return_value = self.connection
        supplier_lookup = MagicMock()
        supplier_lookup.fetchone.return_value = ("supplier-id",)
        product_lookup = MagicMock()
        product_lookup.fetchone.return_value = ("product-id", 8)
        self.connection.execute.side_effect = [
            supplier_lookup,
            product_lookup,
            MagicMock(),
            MagicMock(),
            MagicMock(),
            MagicMock(),
            MagicMock(),
        ]

        result = backend.create_supplier_purchase(
            backend.SupplierPurchaseCreate(
                supplier_id="supplier-id",
                invoice_number="INV-100",
                items=[
                    backend.SupplierPurchaseItemCreate(
                        product_id="product-id",
                        quantity=2,
                        unit_cost=Decimal("15.25"),
                    )
                ],
                amount_paid=Decimal("10"),
                payment_method="bank",
            )
        )

        self.assertEqual(result["total"], 30.5)
        self.assertEqual(result["balance"], 20.5)
        self.assertEqual(result["status"], "partial")
        update_call = self.connection.execute.call_args_list[4]
        self.assertEqual(update_call.args[1][0], 10)
        self.connection.commit.assert_called_once()

    @patch("backend.main.get_connection")
    def test_supplier_payment_cannot_exceed_outstanding_balance(self, get_connection):
        get_connection.return_value = self.connection
        purchase_lookup = MagicMock()
        purchase_lookup.fetchone.return_value = (Decimal("100"), Decimal("80"))
        self.connection.execute.return_value = purchase_lookup

        with self.assertRaises(backend.HTTPException) as raised:
            backend.create_supplier_payment(
                "purchase-id",
                backend.SupplierPaymentCreate(
                    amount=Decimal("25"),
                    payment_method="cash",
                ),
            )

        self.assertEqual(raised.exception.status_code, 409)
        self.connection.rollback.assert_called_once()
        self.connection.commit.assert_not_called()
        self.connection.execute.assert_called_once()


if __name__ == "__main__":
    unittest.main()
