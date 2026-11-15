from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Collection, Product, ProductPhoto


def thumb(image, size: int = 56) -> str:
    if not image:
        return "—"
    return format_html(
        '<img src="{}" style="width:{}px;height:{}px;object-fit:cover;border-radius:6px">',
        image.url,
        size,
        size,
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "slug", "sort_order", "products_total")
    list_editable = ("sort_order",)
    list_filter = ("parent",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Товаров")
    def products_total(self, obj: Category) -> int:
        return obj.products.count()


class ProductPhotoInline(admin.TabularInline):
    model = ProductPhoto
    extra = 1
    fields = ("preview", "image", "sort_order", "is_main")
    readonly_fields = ("preview",)

    @admin.display(description="Превью")
    def preview(self, obj: ProductPhoto) -> str:
        return thumb(obj.image, 72)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "preview",
        "name",
        "sku",
        "category",
        "price",
        "old_price",
        "stock",
        "is_new",
        "is_hidden",
        "views_count",
    )
    list_display_links = ("preview", "name")
    list_editable = ("price", "old_price", "stock", "is_new", "is_hidden")
    list_filter = ("category", "is_hidden", "is_new", "collections")
    search_fields = ("name", "sku", "description")
    readonly_fields = ("views_count", "created_at")
    list_select_related = ("category",)
    inlines = [ProductPhotoInline]
    list_per_page = 40
    actions = ("hide_products", "show_products")

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("photos")

    @admin.display(description="Фото")
    def preview(self, obj: Product) -> str:
        photos = list(obj.photos.all())
        return thumb(photos[0].image) if photos else "—"

    @admin.action(description="Скрыть с витрины")
    def hide_products(self, request, queryset):
        queryset.update(is_hidden=True)

    @admin.action(description="Показать на витрине")
    def show_products(self, request, queryset):
        queryset.update(is_hidden=False)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "products_total")
    list_editable = ("sort_order",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("products",)

    @admin.display(description="Товаров")
    def products_total(self, obj: Collection) -> int:
        return obj.products.count()
