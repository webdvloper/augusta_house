import random
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.demo_images import render
from catalog.models import Category, Collection, Product, ProductPhoto
from catalog.utils import translit_slug

COLORS = {
    "золотой": (198, 160, 82),
    "терракотовый": (181, 96, 62),
    "бирюзовый": (28, 124, 132),
    "изумрудный": (38, 104, 78),
    "слоновая кость": (226, 214, 190),
    "бронза": (150, 110, 62),
    "бордо": (116, 34, 46),
    "голубой": (128, 170, 196),
    "оливковый": (122, 126, 66),
    "графит": (72, 78, 84),
    "пудровый": (214, 176, 170),
    "шоколад": (92, 60, 44),
}

# (раздел, рубрика, тип картинки, шаблон названия, модели, цена от, цена до, единица, описание)
RUBRICS = [
    ("Ткани", "Тюль и вуаль", "sheer", "Тюль Микро-Вуаль {model} {color}",
     ["с утяжелителем", "Lumiere", "Aria"], 650, 1900, "м",
     "Лёгкая полупрозрачная вуаль мягко рассеивает свет. Ширина рулона 300 см, "
     "низ обработан утяжелителем."),
    ("Ткани", "Портьерные ткани", "fabric", "Ткань портьерная {model} {color}",
     ["MICHELLE", "VICTORIA", "Soft Line"], 1200, 3600, "м",
     "Плотная портьерная ткань с благородным матовым блеском. Ширина 280 см, "
     "хорошо держит складку и не выгорает."),
    ("Ткани", "Дизайнерский шёлк", "patterned", "Шёлк дизайнерский {model} {color}",
     ["Florence", "Damasco", "Orient"], 3900, 8900, "м",
     "Натуральный шёлк 100% с жаккардовым рисунком для штор, покрывал и декора. "
     "Ширина 140 см."),
    ("Ткани", "Шёлк дюпион", "fabric", "Шёлк дюпион {model} {color}",
     ["Dupion Classic", "Dupion Stripe"], 2800, 5200, "м",
     "Шёлк дюпион 100% с характерной фактурной нитью. Ширина 137 см."),
    ("Шторы", "Шторы тюлевые", "sheer", "Шторы тюлевые {model} {color}",
     ["Brise", "Nuage", "Voile"], 3200, 7800, "компл",
     "Готовый комплект тюлевых штор на шторной ленте: 2 полотна 300 × 270 см."),
    ("Шторы", "Шторы портьерные", "curtain", "Шторы портьерные {model} {color}",
     ["MICHELLE", "VICTORIA", "Palazzo"], 6900, 18400, "компл",
     "Комплект портьер на подкладке: 2 полотна 150 × 270 см, подхваты в комплекте."),
    ("Декор для штор", "Подхваты и кисти", "tassel", "Подхват-кисть {model} {color}",
     ["Royal", "Barocco", "Milano"], 1200, 3900, "шт",
     "Декоративный подхват с кистью ручной работы. Длина шнура 80 см, кисть 28 см."),
    ("Декор для штор", "Декоративные шнуры", "cord", "Шнур декоративный {model} {color}",
     ["витой 8 мм", "витой 12 мм", "с кантом"], 180, 620, "м",
     "Витой декоративный шнур для отделки штор, подушек и мебели."),
    ("Декор для штор", "Декоративная тесьма", "trim", "Тесьма декоративная {model} {color}",
     ["Fleco с бахромой", "Grosellas", "с помпонами"], 420, 980, "м",
     "Отделочная тесьма с бахромой. Ширина 6 см, пришивается по краю портьер."),
    ("Подушки", "Подушки декоративные", "pillow", "Подушка декоративная {model} {color}",
     ["Square", "Classic 45×45", "Boudoir"], 2400, 5600, "шт",
     "Декоративная подушка со съёмным чехлом на молнии, наполнитель — холлофайбер."),
]  # fmt: skip

COLLECTIONS = [
    ("Новинки сезона", "Свежие поступления тканей и декора"),
    ("Распродажа", "Последние метры и комплекты со скидкой"),
    ("Золото и терракота", "Тёплая гамма для гостиной и спальни"),
    ("Бирюза и изумруд", "Фирменные оттенки Augusta House"),
    ("Натуральный шёлк", "Шёлк 100% — метражом и в готовых изделиях"),
]


class Command(BaseCommand):
    help = "Заполняет базу демо-каталогом: рубрики, товары с фото и подборки."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Удалить текущий каталог.")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            Collection.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
        elif Product.objects.exists():
            self.stdout.write("Каталог уже заполнен. Запустите с --flush, чтобы пересоздать.")
            return

        rng = random.Random(2001)
        collections = {
            name: Collection.objects.create(
                name=name, slug=translit_slug(name), description=description, sort_order=index
            )
            for index, (name, description) in enumerate(COLLECTIONS)
        }
        color_names = list(COLORS)
        counter = 0

        for order, (section, rubric, kind, title, models, low, high, unit, text) in enumerate(
            RUBRICS
        ):
            parent, _ = Category.objects.get_or_create(
                slug=translit_slug(section), defaults={"name": section, "sort_order": order}
            )
            category = Category.objects.create(
                name=rubric, slug=translit_slug(rubric), parent=parent, sort_order=order
            )
            for model in models:
                for color_name in rng.sample(color_names, 2):
                    counter += 1
                    price = Decimal(rng.randrange(low, high, 10))
                    on_sale = rng.random() < 0.28
                    product = Product.objects.create(
                        sku=f"AH-{1000 + counter}",
                        name=title.format(model=model, color=color_name),
                        description=f"{text}\n\nЦвет: {color_name}. Состав и уход указаны на "
                        "ярлыке. Оттенок на экране может отличаться от реального.",
                        price=price,
                        old_price=(price * Decimal("1.25")).quantize(Decimal("10"))
                        if on_sale
                        else None,
                        stock=0 if rng.random() < 0.1 else rng.randint(1, 120),
                        unit=unit,
                        category=category,
                        is_new=rng.random() < 0.25,
                        views_count=rng.randint(5, 400),
                    )
                    for index, closeup in enumerate([False, True]):
                        data = render(kind, COLORS[color_name], counter * 10 + index, closeup)
                        photo = ProductPhoto(product=product, sort_order=index, is_main=index == 0)
                        photo.image.save(f"{product.sku}-{index + 1}.jpg", ContentFile(data))

                    if product.is_new:
                        collections["Новинки сезона"].products.add(product)
                    if on_sale:
                        collections["Распродажа"].products.add(product)
                    if color_name in ("золотой", "терракотовый", "бронза"):
                        collections["Золото и терракота"].products.add(product)
                    if color_name in ("бирюзовый", "изумрудный"):
                        collections["Бирюза и изумруд"].products.add(product)
                    if "шёлк" in rubric.lower():
                        collections["Натуральный шёлк"].products.add(product)

        self.stdout.write(self.style.SUCCESS(f"Готово: {counter} товаров, {len(RUBRICS)} рубрик."))
