import json
import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from catalog.models import Category, Collection, Product

FRONTEND = settings.BASE_DIR.parent / "frontend"


class Command(BaseCommand):
    help = "Выгружает каталог в JSON и копирует фото — для статичной демо-версии витрины."

    def add_arguments(self, parser):
        parser.add_argument("--json", default=str(FRONTEND / "src/lib/demo-catalog.json"))
        parser.add_argument("--media", default=str(FRONTEND / "public/demo/media"))

    def handle(self, *args, **options):
        media = Path(options["media"])
        shutil.rmtree(media, ignore_errors=True)
        media.mkdir(parents=True)

        def copy(image, name: str) -> str:
            """Копирует файл под стабильным именем и возвращает путь от корня сайта."""
            target = f"{name}{Path(image.name).suffix.lower()}"
            shutil.copyfile(image.path, media / target)
            return f"/demo/media/{target}"

        categories = {category.pk: category for category in Category.objects.all()}

        def trail(category: Category) -> list[Category]:
            chain = [category]
            while chain[-1].parent_id:
                chain.append(categories[chain[-1].parent_id])
            return chain[::-1]

        products = []
        covers: dict[int, str] = {}
        queryset = Product.objects.filter(is_hidden=False).prefetch_related("photos", "collections")
        for order, product in enumerate(queryset.order_by("-created_at", "-id")):
            photos = [
                {
                    "id": photo.pk,
                    "image": copy(photo.image, f"{product.sku}-{index + 1}"),
                    "sort_order": photo.sort_order,
                    "is_main": photo.is_main,
                }
                for index, photo in enumerate(product.photos.all())
            ]
            path = trail(categories[product.category_id])
            if photos:
                for node in path:
                    covers.setdefault(node.pk, photos[0]["image"])
            products.append(
                {
                    "id": product.pk,
                    "sku": product.sku,
                    "name": product.name,
                    "description": product.description,
                    "price": str(product.price),
                    "old_price": str(product.old_price) if product.old_price else None,
                    "discount_percent": product.discount_percent,
                    "stock": product.stock,
                    "unit": product.unit,
                    "in_stock": product.stock > 0,
                    "is_new": product.is_new,
                    "views_count": product.views_count,
                    "category": {"id": path[-1].pk, "name": path[-1].name, "slug": path[-1].slug},
                    "image": photos[0]["image"] if photos else None,
                    "photos": photos,
                    "breadcrumbs": [{"name": node.name, "slug": node.slug} for node in path],
                    "collections": [collection.slug for collection in product.collections.all()],
                    "newest_rank": order,
                }
            )

        def tree(parent_id: int | None) -> list[dict]:
            nodes = []
            for category in categories.values():
                if category.parent_id != parent_id:
                    continue
                count = sum(
                    1
                    for product in products
                    if any(crumb["slug"] == category.slug for crumb in product["breadcrumbs"])
                )
                nodes.append(
                    {
                        "id": category.pk,
                        "name": category.name,
                        "slug": category.slug,
                        "parent": category.parent_id,
                        "image": copy(category.image, f"category-{category.slug}")
                        if category.image
                        else covers.get(category.pk),
                        "product_count": count,
                        "children": tree(category.pk),
                    }
                )
            return nodes

        snapshot = {
            "categories": tree(None),
            "products": products,
            "collections": [
                {
                    "id": collection.pk,
                    "name": collection.name,
                    "slug": collection.slug,
                    "description": collection.description,
                }
                for collection in Collection.objects.all()
            ],
        }
        target = Path(options["json"])
        target.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + "\n", "utf-8")
        self.stdout.write(self.style.SUCCESS(f"Выгружено товаров: {len(products)} → {target}"))
