from django.conf import settings
from django.contrib import admin, messages
from django.db.models import Count, F, Q
from django.utils.html import format_html

from .models import Category, Collection, Product, ProductPhoto


def thumb(image, size: int = 56) -> str:
    if not image:
        return "—"
    return format_html(
        '<img src="{}" alt="" style="width:{}px;height:{}px;object-fit:cover;border-radius:8px">',
        image.url,
        size,
        size,
    )


def storefront_url(path: str) -> str:
    return f"{settings.STOREFRONT_URL.rstrip('/')}{path}"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("cover", "name", "parent", "slug", "sort_order", "products_total")
    list_display_links = ("cover", "name")
    list_editable = ("sort_order",)
    list_filter = (("parent", admin.RelatedOnlyFieldListFilter),)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("parent",)
    fields = ("name", "slug", "parent", "description", "image", "sort_order")

    def get_queryset(self, request):
        return (
            super().get_queryset(request).select_related("parent").annotate(total=Count("products"))
        )

    def view_on_site(self, obj: Category) -> str:
        return storefront_url(f"/catalog/{obj.slug}/")

    @admin.display(description="Обложка")
    def cover(self, obj: Category) -> str:
        return thumb(obj.image, 40)

    @admin.display(description="Товаров", ordering="total")
    def products_total(self, obj: Category) -> int:
        return obj.total


class ProductPhotoInline(admin.TabularInline):
    model = ProductPhoto
    extra = 1
    fields = ("preview", "image", "sort_order", "is_main")
    readonly_fields = ("preview",)

    @admin.display(description="Превью")
    def preview(self, obj: ProductPhoto) -> str:
        return thumb(obj.image, 72)


class ProductCollectionInline(admin.TabularInline):
    """Подборки прямо в карточке товара — не нужно переходить в раздел «Подборки»."""

    model = Collection.products.through
    extra = 0
    autocomplete_fields = ("collection",)
    verbose_name = "Подборка"
    verbose_name_plural = "Входит в подборки"


class StockFilter(admin.SimpleListFilter):
    title = "наличие"
    parameter_name = "stock_state"

    def lookups(self, request, model_admin):
        return (("in", "В наличии"), ("low", "Заканчивается (≤ 5)"), ("out", "Нет в наличии"))

    def queryset(self, request, queryset):
        if self.value() == "in":
            return queryset.filter(stock__gt=0)
        if self.value() == "low":
            return queryset.filter(stock__gt=0, stock__lte=5)
        if self.value() == "out":
            return queryset.filter(stock=0)
        return queryset


class SaleFilter(admin.SimpleListFilter):
    title = "скидка"
    parameter_name = "on_sale"

    def lookups(self, request, model_admin):
        return (("1", "Со скидкой"), ("0", "Без скидки"))

    def queryset(self, request, queryset):
        if self.value() == "1":
            return queryset.filter(old_price__gt=F("price"))
        if self.value() == "0":
            return queryset.exclude(old_price__gt=F("price"))
        return queryset


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
    list_filter = (
        "category",
        "collections",
        StockFilter,
        SaleFilter,
        "is_new",
        "is_hidden",
        "unit",
    )
    search_fields = ("name", "sku", "description")
    readonly_fields = ("views_count", "created_at", "updated_at")
    list_select_related = ("category", "category__parent")
    autocomplete_fields = ("category",)
    inlines = [ProductPhotoInline, ProductCollectionInline]
    list_per_page = 40
    save_on_top = True
    save_as = True
    actions = ("show_products", "hide_products", "mark_new", "unmark_new")
    fieldsets = (
        (None, {"fields": ("name", "sku", "category", "description")}),
        ("Цена и наличие", {"fields": (("price", "old_price"), ("stock", "unit"))}),
        ("Витрина", {"fields": (("is_new", "is_hidden"),)}),
        (
            "Статистика",
            {"fields": (("views_count", "created_at", "updated_at"),), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("photos")

    def view_on_site(self, obj: Product) -> str:
        return storefront_url(f"/product/{obj.sku}/")

    @admin.display(description="Фото")
    def preview(self, obj: Product) -> str:
        photos = list(obj.photos.all())
        return thumb(photos[0].image) if photos else "—"

    @admin.action(description="Показать на витрине")
    def show_products(self, request, queryset):
        updated = queryset.update(is_hidden=False)
        self.message_user(request, f"Показано на витрине: {updated}.", messages.SUCCESS)

    @admin.action(description="Скрыть с витрины")
    def hide_products(self, request, queryset):
        updated = queryset.update(is_hidden=True)
        self.message_user(request, f"Скрыто с витрины: {updated}.", messages.SUCCESS)

    @admin.action(description="Отметить как новинки")
    def mark_new(self, request, queryset):
        queryset.update(is_new=True)

    @admin.action(description="Снять отметку «Новинка»")
    def unmark_new(self, request, queryset):
        queryset.update(is_new=False)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = (
        "cover",
        "name",
        "slug",
        "is_featured",
        "is_hidden",
        "sort_order",
        "products_total",
    )
    list_display_links = ("cover", "name")
    list_editable = ("is_featured", "is_hidden", "sort_order")
    list_filter = ("is_featured", "is_hidden")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("products",)
    fields = (
        "name",
        "slug",
        "description",
        "image",
        ("is_featured", "is_hidden", "sort_order"),
        "products",
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(total=Count("products", filter=Q(products__is_hidden=False)))
        )

    def view_on_site(self, obj: Collection) -> str:
        return storefront_url(f"/collections/{obj.slug}/")

    @admin.display(description="Обложка")
    def cover(self, obj: Collection) -> str:
        return thumb(obj.image, 40)

    @admin.display(description="Товаров на витрине", ordering="total")
    def products_total(self, obj: Collection) -> int:
        return obj.total
