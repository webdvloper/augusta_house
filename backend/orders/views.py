from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Оформление заказа и просмотр по публичному идентификатору.

    Онлайн-оплата в прототипе не подключена: заказ создаётся со статусом «Новый»,
    менеджер подтверждает его в админке.
    """

    queryset = Order.objects.prefetch_related("items")
    lookup_field = "public_id"
    lookup_value_regex = r"[0-9a-f-]{36}"
    throttle_scope = "orders"

    def get_throttles(self):
        return super().get_throttles() if self.action == "create" else []

    def get_serializer_class(self):
        return OrderCreateSerializer if self.action == "create" else OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
