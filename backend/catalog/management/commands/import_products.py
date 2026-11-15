from decimal import Decimal, InvalidOperation

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from openpyxl import Workbook, load_workbook

from catalog.models import Category, Product
from catalog.utils import translit_slug

COLUMNS = ["sku", "name", "description", "price", "old_price", "stock", "unit", "category"]
REQUIRED = {"sku", "name", "price", "category"}


def get_category(path: str) -> Category:
    """Находит или создаёт рубрику по пути вида «Ткани/Портьерные ткани»."""
    parent = None
    for name in [part.strip() for part in path.split("/") if part.strip()]:
        category = Category.objects.filter(name=name, parent=parent).first()
        if category is None:
            slug = base = translit_slug(name) or "rubrika"
            suffix = 2
            while Category.objects.filter(slug=slug).exists():
                slug = f"{base}-{suffix}"
                suffix += 1
            category = Category.objects.create(name=name, slug=slug, parent=parent)
        parent = category
    if parent is None:
        raise ValueError("не указана рубрика")
    return parent


class Command(BaseCommand):
    help = "Импорт товаров из Excel (.xlsx). Товары сопоставляются по артикулу (sku)."

    def add_arguments(self, parser):
        parser.add_argument("path", help="Путь к файлу .xlsx")
        parser.add_argument(
            "--template", action="store_true", help="Создать по этому пути пустой шаблон."
        )

    def handle(self, *args, **options):
        path = options["path"]
        if options["template"]:
            workbook = Workbook()
            sheet = workbook.active
            sheet.append(COLUMNS)
            sheet.append(
                ["AH-5001", "Ткань портьерная SAMPLE", "Описание", 1500, 1900, 25, "м",
                 "Ткани/Портьерные ткани"]
            )  # fmt: skip
            workbook.save(path)
            self.stdout.write(self.style.SUCCESS(f"Шаблон сохранён: {path}"))
            return

        try:
            sheet = load_workbook(path, read_only=True, data_only=True).active
        except (OSError, ValueError) as error:
            raise CommandError(f"Не удалось открыть файл: {error}") from error

        rows = sheet.iter_rows(values_only=True)
        header = [str(cell or "").strip().lower() for cell in next(rows, [])]
        missing = REQUIRED - set(header)
        if missing:
            raise CommandError(f"В файле нет колонок: {', '.join(sorted(missing))}")

        created = updated = 0
        errors: list[str] = []
        with transaction.atomic():
            for number, row in enumerate(rows, start=2):
                data = dict(zip(header, row, strict=False))
                if not any(data.values()):
                    continue
                try:
                    sku = str(data["sku"] or "").strip()
                    if not sku or not data.get("name"):
                        raise ValueError("пустой артикул или название")
                    fields = {
                        "name": str(data["name"]).strip(),
                        "description": str(data.get("description") or ""),
                        "price": Decimal(str(data["price"])),
                        "old_price": Decimal(str(data["old_price"]))
                        if data.get("old_price")
                        else None,
                        "stock": int(data.get("stock") or 0),
                        "unit": str(data.get("unit") or Product.Unit.PIECE).strip(),
                        "category": get_category(str(data["category"] or "")),
                    }
                    _, was_created = Product.objects.update_or_create(sku=sku, defaults=fields)
                    created += was_created
                    updated += not was_created
                except (ValueError, InvalidOperation, TypeError) as error:
                    errors.append(f"строка {number}: {error}")

        for message in errors:
            self.stderr.write(self.style.WARNING(message))
        self.stdout.write(
            self.style.SUCCESS(f"Создано: {created}, обновлено: {updated}, ошибок: {len(errors)}")
        )
