from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField("Название", max_length=120)
    slug = models.SlugField("Слаг", max_length=140, unique=True)
    parent = models.ForeignKey(
        "self",
        verbose_name="Родительская рубрика",
        null=True,
        blank=True,
        related_name="children",
        on_delete=models.CASCADE,
    )
    image = models.ImageField("Обложка", upload_to="categories/", blank=True)
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Рубрика"
        verbose_name_plural = "Рубрики"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return f"{self.parent.name} → {self.name}" if self.parent_id else self.name

    def descendant_ids(self) -> list[int]:
        """Идентификаторы рубрики и всех вложенных рубрик."""
        ids = [self.pk]
        frontier = [self.pk]
        while frontier:
            frontier = list(
                Category.objects.filter(parent_id__in=frontier).values_list("pk", flat=True)
            )
            ids.extend(frontier)
        return ids


class Product(models.Model):
    class Unit(models.TextChoices):
        PIECE = "шт", "штука"
        METER = "м", "метр"
        SET = "компл", "комплект"

    sku = models.CharField("Артикул", max_length=64, unique=True)
    name = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    price = models.DecimalField(
        "Цена, ₽", max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    old_price = models.DecimalField(
        "Старая цена, ₽",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Заполните, чтобы показать скидку на витрине.",
    )
    stock = models.PositiveIntegerField("Остаток", default=0)
    unit = models.CharField("Единица", max_length=8, choices=Unit.choices, default=Unit.PIECE)
    category = models.ForeignKey(
        Category, verbose_name="Рубрика", related_name="products", on_delete=models.PROTECT
    )
    is_hidden = models.BooleanField("Скрыт с витрины", default=False)
    is_new = models.BooleanField("Новинка", default=False)
    views_count = models.PositiveIntegerField("Просмотры", default=0, editable=False)
    created_at = models.DateTimeField("Добавлен", auto_now_add=True)

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return f"{self.name} ({self.sku})"

    @property
    def discount_percent(self) -> int:
        if self.old_price and self.old_price > self.price:
            return round((1 - self.price / self.old_price) * 100)
        return 0


class ProductPhoto(models.Model):
    product = models.ForeignKey(
        Product, verbose_name="Товар", related_name="photos", on_delete=models.CASCADE
    )
    image = models.ImageField("Фото", upload_to="products/")
    sort_order = models.PositiveIntegerField("Порядок", default=0)
    is_main = models.BooleanField("Главное фото", default=False)

    class Meta:
        verbose_name = "Фото товара"
        verbose_name_plural = "Фото товаров"
        ordering = ["-is_main", "sort_order", "id"]

    def __str__(self) -> str:
        return f"Фото {self.product.sku} #{self.sort_order}"


class Collection(models.Model):
    name = models.CharField("Название", max_length=120)
    slug = models.SlugField("Слаг", max_length=140, unique=True)
    description = models.CharField("Описание", max_length=255, blank=True)
    products = models.ManyToManyField(
        Product, verbose_name="Товары", related_name="collections", blank=True
    )
    sort_order = models.PositiveIntegerField("Порядок", default=0)

    class Meta:
        verbose_name = "Подборка"
        verbose_name_plural = "Подборки"
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name
