import uuid

from django.db import models

from catalog.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новый"
        CONFIRMED = "confirmed", "Подтверждён"
        SHIPPED = "shipped", "Отправлен"
        DONE = "done", "Завершён"
        CANCELLED = "cancelled", "Отменён"

    class Delivery(models.TextChoices):
        PICKUP = "pickup", "Самовывоз (Химки)"
        COURIER = "courier", "Курьер по Москве и области"
        POST = "post", "Почта России"
        CDEK = "cdek", "СДЭК"

    # Публичный идентификатор: по нему покупатель открывает страницу заказа.
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField("Статус", max_length=16, choices=Status.choices, default=Status.NEW)
    customer_name = models.CharField("Имя", max_length=120)
    customer_email = models.EmailField("E-mail")
    customer_phone = models.CharField("Телефон", max_length=32)
    delivery_method = models.CharField(
        "Доставка", max_length=16, choices=Delivery.choices, default=Delivery.PICKUP
    )
    address = models.CharField("Адрес", max_length=255, blank=True)
    comment = models.TextField("Комментарий", blank=True)
    total = models.DecimalField("Сумма, ₽", max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        verbose_name = "Заказ"
        verbose_name_plural = "Заказы"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Заказ №{self.number}"

    @property
    def number(self) -> str:
        return f"AH-{self.pk:06d}" if self.pk else "AH-новый"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        Product, verbose_name="Товар", null=True, on_delete=models.SET_NULL, related_name="+"
    )
    # Название, артикул и цена фиксируются на момент оформления.
    sku = models.CharField("Артикул", max_length=64)
    name = models.CharField("Название", max_length=255)
    price = models.DecimalField("Цена, ₽", max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField("Количество")

    class Meta:
        verbose_name = "Позиция заказа"
        verbose_name_plural = "Позиции заказа"

    def __str__(self) -> str:
        return f"{self.name} × {self.quantity}"

    @property
    def subtotal(self):
        return self.price * self.quantity
