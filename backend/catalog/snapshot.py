"""Снимок каталога из базы: JSON-фикстура Django и папка с фото.

Товары, рубрики и подборки живут только в базе и редактируются в админке.
Снимок нужен, чтобы перенести их туда, где базы нет: в сборку статичной
витрины на GitHub Pages или на компьютер нового разработчика.
"""

import shutil
from pathlib import Path

from django.conf import settings

from .models import Category, Collection, Product, ProductPhoto

DATA_DIR = settings.BASE_DIR / "data"
FIXTURE = DATA_DIR / "catalog.json"
MEDIA = DATA_DIR / "media"

# Порядок важен для загрузки: сначала то, на что ссылаются.
MODELS = (Category, Product, ProductPhoto, Collection)


def image_fields(obj) -> list:
    return [
        getattr(obj, field.name)
        for field in obj._meta.fields
        if field.get_internal_type() in ("ImageField", "FileField") and getattr(obj, field.name)
    ]


def iter_objects():
    for model in MODELS:
        yield from model.objects.order_by("pk")


def copy_tree_files(names: set[str], source: Path, target: Path) -> int:
    """Копирует файлы по относительным путям; лишние файлы в target удаляет."""
    target.mkdir(parents=True, exist_ok=True)
    copied = 0
    for name in sorted(names):
        src, dst = source / name, target / name
        if not src.exists():
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.exists() or dst.stat().st_size != src.stat().st_size:
            shutil.copyfile(src, dst)
        copied += 1
    for path in sorted(target.rglob("*"), reverse=True):
        relative = path.relative_to(target).as_posix()
        if path.is_file() and relative not in names:
            path.unlink()
        elif path.is_dir() and not any(path.iterdir()):
            path.rmdir()
    return copied
