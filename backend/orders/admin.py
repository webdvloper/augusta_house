from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product", "sku", "name", "price", "quantity")
    readonly_fields = ("sku", "name", "price")
    autocomplete_fields = ("product",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "number",
        "created_at",
        "customer_name",
        "customer_phone",
        "delivery_method",
        "total",
        "status",
    )
    list_editable = ("status",)
    list_filter = ("status", "delivery_method", "created_at")
    search_fields = ("customer_name", "customer_email", "customer_phone", "items__sku")
    readonly_fields = ("public_id", "total", "created_at")
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]

    @admin.display(description="Номер", ordering="id")
    def number(self, obj: Order) -> str:
        return obj.number
