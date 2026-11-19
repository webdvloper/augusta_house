from collections import defaultdict

import django_filters
from django.db.models import Count, F, Prefetch, Q
from rest_framework import mixins, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from .models import Category, Collection, Product, ProductPhoto
from .serializers import (
    CategorySerializer,
    CollectionSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


def visible_products():
    return Product.objects.filter(is_hidden=False).select_related("category")


def category_tree_context() -> dict:
    """Собирает дерево рубрик, счётчики товаров и обложки за три запроса."""
    children = defaultdict(list)
    for category in Category.objects.all():
        children[category.parent_id].append(category)
    counts = dict(
        visible_products()
        .values_list("category_id")
        .annotate(total=Count("id"))
        .values_list("category_id", "total")
    )
    covers: dict[int, object] = {}
    photos = ProductPhoto.objects.filter(product__is_hidden=False).select_related("product")
    for photo in photos.order_by("-is_main", "sort_order", "id"):
        covers.setdefault(photo.product.category_id, photo.image)
    return {"children": children, "counts": counts, "covers": covers}


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Рубрики каталога: список — дерево от корня, деталь — по слагу."""

    serializer_class = CategorySerializer
    lookup_field = "slug"
    pagination_class = None
    queryset = Category.objects.all()

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "category_tree": category_tree_context()}

    def list(self, request, *args, **kwargs):
        roots = self.get_queryset().filter(parent__isnull=True)
        return Response(self.get_serializer(roots, many=True).data)


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    collection = django_filters.CharFilter(field_name="collections__slug")
    search = django_filters.CharFilter(method="filter_search")
    skus = django_filters.CharFilter(method="filter_skus")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    sale = django_filters.BooleanFilter(method="filter_sale")
    is_new = django_filters.BooleanFilter()
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    class Meta:
        model = Product
        fields: list[str] = []

    def filter_category(self, queryset, _name, value):
        category = Category.objects.filter(slug=value).first()
        if category is None:
            return queryset.none()
        return queryset.filter(category_id__in=category.descendant_ids())

    def filter_search(self, queryset, _name, value):
        # SQLite не умеет регистронезависимый поиск по кириллице, поэтому
        # перебираем варианты регистра; в PostgreSQL достаточно icontains.
        for word in value.split()[:6]:
            variants = {word, word.lower(), word.capitalize(), word.upper()}
            condition = Q()
            for variant in variants:
                condition |= Q(name__contains=variant) | Q(sku__icontains=variant)
                condition |= Q(description__contains=variant)
            queryset = queryset.filter(condition)
        return queryset

    def filter_skus(self, queryset, _name, value):
        skus = [sku.strip() for sku in value.split(",") if sku.strip()][:100]
        return queryset.filter(sku__in=skus)

    def filter_in_stock(self, queryset, _name, value):
        return queryset.filter(stock__gt=0) if value else queryset

    def filter_sale(self, queryset, _name, value):
        return queryset.filter(old_price__gt=F("price")) if value else queryset


class ProductViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Товары витрины: список с фильтрами и карточка товара по артикулу."""

    lookup_field = "sku"
    lookup_value_regex = r"[^/]+"
    filterset_class = ProductFilter
    filter_backends = [django_filters.rest_framework.DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["price", "created_at", "views_count", "name"]
    ordering = ["-created_at", "-id"]

    def get_queryset(self):
        return visible_products().prefetch_related("photos").distinct()

    def get_serializer_class(self):
        return ProductDetailSerializer if self.action == "retrieve" else ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        product = self.get_object()
        Product.objects.filter(pk=product.pk).update(views_count=F("views_count") + 1)
        product.views_count += 1
        return Response(self.get_serializer(product).data)


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    """Подборки товаров с превью первых позиций."""

    serializer_class = CollectionSerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        products = Product.objects.select_related("category").prefetch_related("photos")
        queryset = (
            Collection.objects.filter(is_hidden=False)
            .annotate(product_count=Count("products", filter=Q(products__is_hidden=False)))
            .prefetch_related(Prefetch("products", queryset=products))
        )
        if self.request.query_params.get("featured") in ("1", "true"):
            queryset = queryset.filter(is_featured=True)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        try:
            limit = int(self.request.query_params.get("preview", 4))
        except ValueError:
            limit = 4
        context["preview_limit"] = max(0, min(limit, 12))
        return context

    def get_object(self):
        return get_object_or_404(self.get_queryset(), slug=self.kwargs["slug"])
