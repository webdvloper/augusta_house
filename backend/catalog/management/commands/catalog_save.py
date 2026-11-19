from django.conf import settings
from django.core import serializers
from django.core.management.base import BaseCommand

from catalog.snapshot import FIXTURE, MEDIA, copy_tree_files, image_fields, iter_objects


class Command(BaseCommand):
    help = (
        "Сохраняет каталог из базы (рубрики, товары, фото, подборки) в backend/data/ — "
        "чтобы закоммитить его и опубликовать витрину на GitHub Pages."
    )

    def handle(self, *args, **options):
        objects = list(iter_objects())
        FIXTURE.parent.mkdir(parents=True, exist_ok=True)
        with FIXTURE.open("w", encoding="utf-8") as stream:
            serializers.serialize("json", objects, stream=stream, indent=1, ensure_ascii=False)
            stream.write("\n")
        files = {image.name for obj in objects for image in image_fields(obj)}
        copied = copy_tree_files(files, settings.MEDIA_ROOT, MEDIA)
        self.stdout.write(
            self.style.SUCCESS(f"Сохранено объектов: {len(objects)}, файлов: {copied} → {FIXTURE}")
        )
