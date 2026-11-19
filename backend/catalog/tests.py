from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, Collection, Product


class CatalogApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        fabrics = Category.objects.create(name="Ткани", slug="tkani")
        silk = Category.objects.create(name="Шёлк", slug="shelk", parent=fabrics)
        cls.silk = Product.objects.create(
            sku="AH-1", name="Шёлк бирюзовый", price=Decimal("4000"), old_price=Decimal("5000"),
            stock=5, category=silk,
        )  # fmt: skip
        Product.objects.create(
            sku="AH-2", name="Вуаль белая", price=Decimal("900"), stock=0, category=fabrics
        )
        Product.objects.create(
            sku="AH-3", name="Скрытый", price=Decimal("1"), category=fabrics, is_hidden=True
        )
        Collection.objects.create(name="Распродажа", slug="sale").products.add(cls.silk)

    def setUp(self):
        self.client = APIClient()

    def skus(self, query: str) -> set[str]:
        response = self.client.get(f"/api/products/{query}")
        self.assertEqual(response.status_code, 200)
        return {item["sku"] for item in response.json()["results"]}

    def test_hidden_products_are_not_listed(self):
        self.assertEqual(self.skus(""), {"AH-1", "AH-2"})
        self.assertEqual(self.client.get("/api/products/AH-3/").status_code, 404)

    def test_category_filter_includes_descendants(self):
        self.assertEqual(self.skus("?category=tkani"), {"AH-1", "AH-2"})
        self.assertEqual(self.skus("?category=shelk"), {"AH-1"})
        self.assertEqual(self.skus("?category=unknown"), set())

    def test_filters(self):
        self.assertEqual(self.skus("?in_stock=true"), {"AH-1"})
        self.assertEqual(self.skus("?sale=true"), {"AH-1"})
        self.assertEqual(self.skus("?max_price=1000"), {"AH-2"})
        self.assertEqual(self.skus("?collection=sale"), {"AH-1"})
        self.assertEqual(self.skus("?skus=AH-2,AH-3"), {"AH-2"})

    def test_search_ignores_case_for_cyrillic(self):
        self.assertEqual(self.skus("?search=шёлк"), {"AH-1"})
        self.assertEqual(self.skus("?search=ВУАЛЬ"), {"AH-2"})

    def test_detail_counts_views_and_reports_discount(self):
        data = self.client.get("/api/products/AH-1/").json()
        self.assertEqual(data["discount_percent"], 20)
        self.assertEqual(data["views_count"], 1)
        self.assertEqual([crumb["slug"] for crumb in data["breadcrumbs"]], ["tkani", "shelk"])

    def test_category_tree_counts_products_of_children(self):
        tree = self.client.get("/api/categories/").json()
        self.assertEqual(len(tree), 1)
        self.assertEqual(tree[0]["product_count"], 2)
        self.assertEqual(tree[0]["children"][0]["product_count"], 1)

    def test_errors_use_detail_format(self):
        response = self.client.get("/api/products/NOPE/")
        self.assertEqual(list(response.json()), ["detail"])


class CatalogManagementTests(TestCase):
    def test_slug_is_generated_from_russian_name(self):
        first = Category.objects.create(name="Шторы тюлевые")
        second = Category.objects.create(name="Шторы тюлевые")
        self.assertEqual(first.slug, "shtory-tyulevye")
        self.assertEqual(second.slug, "shtory-tyulevye-2")
        self.assertEqual(Collection.objects.create(name="Новинки").slug, "novinki")

    def test_old_price_must_exceed_price(self):
        from django.core.exceptions import ValidationError

        category = Category.objects.create(name="Ткани")
        product = Product(
            sku="X-1", name="Ткань", price=Decimal("100"), old_price=Decimal("90"),
            category=category,
        )  # fmt: skip
        with self.assertRaises(ValidationError):
            product.full_clean()

    def test_hidden_collections_are_not_listed(self):
        Collection.objects.create(name="Видимая", slug="shown")
        Collection.objects.create(name="Скрытая", slug="hidden", is_hidden=True)
        Collection.objects.create(name="Не на главной", slug="plain", is_featured=False)
        client = APIClient()
        slugs = {item["slug"] for item in client.get("/api/collections/").json()}
        self.assertEqual(slugs, {"shown", "plain"})
        featured = {item["slug"] for item in client.get("/api/collections/?featured=1").json()}
        self.assertEqual(featured, {"shown"})
        self.assertEqual(client.get("/api/collections/hidden/").status_code, 404)
