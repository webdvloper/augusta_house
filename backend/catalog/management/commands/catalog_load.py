from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Category, Collection, Product
from catalog.snapshot import FIXTURE, MEDIA


class Command(BaseCommand):
    help = "Загружает в базу каталог, сохранённый командой catalog_save (backend/data/)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Удалить текущие товары, рубрики и подборки перед загрузкой.",
        )

    def handle(self, *args, **options):
        if not FIXTURE.exists():
            raise CommandError(f"Нет файла {FIXTURE}. Сначала выполните catalog_save.")
        if Product.objects.exists() and not options["replace"]:
            raise CommandError("В базе уже есть товары. Добавьте --replace, чтобы заменить их.")

        with transaction.atomic():
            if options["replace"]:
                Collection.objects.all().delete()
                Product.objects.all().delete()
                Category.objects.all().delete()
            call_command("loaddata", str(FIXTURE), verbosity=0)

        if MEDIA.exists():
            for source in MEDIA.rglob("*"):
                if source.is_file():
                    target = settings.MEDIA_ROOT / source.relative_to(MEDIA)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(source.read_bytes())
        self.stdout.write(
            self.style.SUCCESS(
                f"Загружено: товаров {Product.objects.count()}, рубрик {Category.objects.count()}, "
                f"подборок {Collection.objects.count()}."
            )
        )
