from rest_framework import serializers

from .models import Category, Collection, Product, ProductPhoto


def absolute_url(serializer: serializers.Serializer, image) -> str | None:
    if not image:
        return None
    request = serializer.context.get("request")
    return request.build_absolute_uri(image.url) if request else image.url


class ProductPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPhoto
        fields = ("id", "image", "sort_order", "is_main")


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    image = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "sku",
            "name",
            "price",
            "old_price",
            "discount_percent",
            "stock",
            "unit",
            "in_stock",
            "is_new",
            "category",
            "image",
        )

    def get_image(self, obj: Product) -> str | None:
        photos = list(obj.photos.all())  # prefetch, главное фото идёт первым
        return absolute_url(self, photos[0].image) if photos else None

    def get_in_stock(self, obj: Product) -> bool:
        return obj.stock > 0


class ProductDetailSerializer(ProductListSerializer):
    photos = ProductPhotoSerializer(many=True, read_only=True)
    breadcrumbs = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = (
            *ProductListSerializer.Meta.fields,
            "description",
            "views_count",
            "photos",
            "breadcrumbs",
            "related",
        )

    def get_breadcrumbs(self, obj: Product) -> list[dict]:
        chain = []
        node = obj.category
        while node is not None:
            chain.append({"name": node.name, "slug": node.slug})
            node = node.parent
        return chain[::-1]

    def get_related(self, obj: Product) -> list[dict]:
        related = (
            Product.objects.filter(category=obj.category, is_hidden=False)
            .exclude(pk=obj.pk)
            .select_related("category")
            .prefetch_related("photos")[:4]
        )
        return ProductListSerializer(related, many=True, context=self.context).data


class CategorySerializer(serializers.ModelSerializer):
    """Рубрика с вложенными рубриками, количеством товаров и обложкой."""

    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent", "image", "product_count", "children")

    def _tree(self) -> dict:
        return self.context["category_tree"]

    def _subtree_ids(self, obj: Category) -> list[int]:
        children = self._tree()["children"]
        ids, stack = [], [obj.pk]
        while stack:
            current = stack.pop()
            ids.append(current)
            stack.extend(child.pk for child in children.get(current, []))
        return ids

    def get_children(self, obj: Category) -> list[dict]:
        children = self._tree()["children"].get(obj.pk, [])
        return CategorySerializer(children, many=True, context=self.context).data

    def get_product_count(self, obj: Category) -> int:
        counts = self._tree()["counts"]
        return sum(counts.get(pk, 0) for pk in self._subtree_ids(obj))

    def get_image(self, obj: Category) -> str | None:
        if obj.image:
            return absolute_url(self, obj.image)
        covers = self._tree()["covers"]
        for pk in self._subtree_ids(obj):
            if pk in covers:
                return absolute_url(self, covers[pk])
        return None


class CollectionSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    preview = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ("id", "name", "slug", "description", "product_count", "preview")

    def get_preview(self, obj: Collection) -> list[dict]:
        limit = self.context.get("preview_limit", 4)
        products = [p for p in obj.products.all() if not p.is_hidden][:limit]
        return ProductListSerializer(products, many=True, context=self.context).data
