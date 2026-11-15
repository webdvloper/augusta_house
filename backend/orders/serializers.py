from django.db import transaction
from rest_framework import serializers

from catalog.models import Product

from .models import Order, OrderItem


class OrderItemInputSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=64)
    quantity = serializers.IntegerField(min_value=1, max_value=9999)


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("sku", "name", "price", "quantity", "subtotal")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    number = serializers.CharField(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    delivery_label = serializers.CharField(source="get_delivery_method_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "public_id",
            "number",
            "status",
            "status_label",
            "customer_name",
            "customer_email",
            "customer_phone",
            "delivery_method",
            "delivery_label",
            "address",
            "comment",
            "total",
            "created_at",
            "items",
        )


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = (
            "customer_name",
            "customer_email",
            "customer_phone",
            "delivery_method",
            "address",
            "comment",
            "items",
        )

    def validate_customer_phone(self, value: str) -> str:
        digits = [char for char in value if char.isdigit()]
        if len(digits) < 10:
            raise serializers.ValidationError("Укажите телефон полностью.")
        return value.strip()

    def validate_items(self, items: list[dict]) -> list[dict]:
        if not items:
            raise serializers.ValidationError("Корзина пуста.")
        merged: dict[str, int] = {}
        for item in items:
            merged[item["sku"]] = merged.get(item["sku"], 0) + item["quantity"]
        return [{"sku": sku, "quantity": quantity} for sku, quantity in merged.items()]

    def validate(self, attrs: dict) -> dict:
        if attrs.get("delivery_method") != Order.Delivery.PICKUP and not attrs.get("address"):
            raise serializers.ValidationError({"address": "Укажите адрес доставки."})
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> Order:
        items = validated_data.pop("items")
        products = {
            product.sku: product
            for product in Product.objects.select_for_update().filter(
                sku__in=[item["sku"] for item in items], is_hidden=False
            )
        }
        for item in items:
            product = products.get(item["sku"])
            if product is None:
                raise serializers.ValidationError(f"Товар {item['sku']} больше не продаётся.")
            if product.stock < item["quantity"]:
                raise serializers.ValidationError(
                    f"«{product.name}»: в наличии только {product.stock} {product.unit}."
                )

        order = Order.objects.create(**validated_data)
        total = 0
        for item in items:
            product = products[item["sku"]]
            OrderItem.objects.create(
                order=order,
                product=product,
                sku=product.sku,
                name=product.name,
                price=product.price,
                quantity=item["quantity"],
            )
            product.stock -= item["quantity"]
            product.save(update_fields=["stock"])
            total += product.price * item["quantity"]
        order.total = total
        order.save(update_fields=["total"])
        return order
