"""Общие настройки REST API: пагинация и единый формат ошибок { detail: string }."""

from rest_framework.pagination import PageNumberPagination
from rest_framework.views import exception_handler as drf_exception_handler


class DefaultPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 60


FIELD_LABELS = {
    "customer_name": "Имя",
    "customer_email": "E-mail",
    "customer_phone": "Телефон",
    "delivery_method": "Доставка",
    "address": "Адрес",
    "comment": "Комментарий",
    "items": "Корзина",
    "quantity": "Количество",
    "sku": "Артикул",
}


def _flatten(data, prefix: str = "") -> list[str]:
    """Сворачивает вложенные ошибки валидации DRF в список строк."""
    if isinstance(data, dict):
        messages: list[str] = []
        for key, value in data.items():
            if key in ("detail", "non_field_errors"):
                label = ""
            else:
                label = f"{prefix}{FIELD_LABELS.get(key, key)}: "
            messages.extend(f"{label}{msg}" for msg in _flatten(value))
        return messages
    if isinstance(data, list | tuple):
        messages = []
        for item in data:
            messages.extend(_flatten(item, prefix))
        return messages
    return [str(data)]


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        response.data = {"detail": " ".join(_flatten(response.data)) or "Ошибка запроса."}
    return response
