from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Category, Product

from .models import Order


class OrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name="Ткани", slug="tkani")
        self.product = Product.objects.create(
            sku="AH-1", name="Шёлк", price=Decimal("1500"), stock=3, category=category
        )
        self.payload = {
            "customer_name": "Анна",
            "customer_email": "anna@example.com",
            "customer_phone": "+7 999 123-45-67",
            "delivery_method": "pickup",
            "items": [{"sku": "AH-1", "quantity": 2}],
        }

    def post(self, **changes):
        return self.client.post("/api/orders/", {**self.payload, **changes}, format="json")

    def test_order_is_created_and_stock_reduced(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["total"], "3000.00")
        self.assertEqual(data["status"], "new")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 1)
        detail = self.client.get(f"/api/orders/{data['public_id']}/")
        self.assertEqual(detail.json()["items"][0]["subtotal"], "3000.00")

    def test_cannot_order_more_than_in_stock(self):
        response = self.post(items=[{"sku": "AH-1", "quantity": 4}])
        self.assertEqual(response.status_code, 400)
        self.assertIn("в наличии только 3", response.json()["detail"])
        self.assertFalse(Order.objects.exists())

    def test_duplicate_lines_are_merged_before_stock_check(self):
        items = [{"sku": "AH-1", "quantity": 2}, {"sku": "AH-1", "quantity": 2}]
        self.assertEqual(self.post(items=items).status_code, 400)

    def test_validation(self):
        self.assertEqual(self.post(items=[]).status_code, 400)
        self.assertEqual(self.post(customer_phone="123").status_code, 400)
        self.assertEqual(self.post(delivery_method="cdek").status_code, 400)  # нет адреса
        self.assertEqual(self.post(items=[{"sku": "NOPE", "quantity": 1}]).status_code, 400)
        self.assertEqual(self.post(delivery_method="cdek", address="Москва").status_code, 201)
