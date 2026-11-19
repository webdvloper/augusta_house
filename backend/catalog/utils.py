from django.utils.text import slugify

_TRANSLIT = dict(
    zip(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        [
            "a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p",
            "r", "s", "t", "u", "f", "h", "ts", "ch", "sh", "sch", "", "y", "", "e", "yu", "ya",
        ],
        strict=True,
    )
)  # fmt: skip


def translit_slug(value: str) -> str:
    """Слаг латиницей из русского названия: «Шторы тюлевые» → «shtory-tyulevye»."""
    return slugify("".join(_TRANSLIT.get(char, char) for char in value.lower()))


def unique_slug(model, name: str, pk: int | None = None) -> str:
    """Свободный слаг для модели: «shtory», «shtory-2», «shtory-3»…"""
    base = translit_slug(name)[:120] or "item"
    slug, index = base, 1
    while model.objects.filter(slug=slug).exclude(pk=pk).exists():
        index += 1
        slug = f"{base}-{index}"
    return slug
