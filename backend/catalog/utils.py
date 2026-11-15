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
