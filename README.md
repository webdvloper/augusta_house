# Augusta House

Прототип интернет-магазина домашнего текстиля: ткани, шторы, декор для штор и подушки.
Палитра — Natural Elegance (светлая основа, бирюзовый `#035567` для действий, зелёный `#75B02D` для акцентов).

```
frontend/   Next.js 16 (React 19, TypeScript, Tailwind CSS 4)   → http://localhost:3000
backend/    Django 5.2 + Django REST Framework + Django Admin   → http://localhost:8000
            SQLite (прототип) → PostgreSQL (продакшн)
```

## Запуск

Бэкенд (Python 3.12+):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py catalog_load       # каталог из снимка backend/data/ (товары, рубрики, подборки, фото)
python manage.py createsuperuser    # доступ в админку /admin
python manage.py runserver 8000
```

Фронтенд (Node.js 20+):

```bash
cd frontend
npm install
npm run dev                         # или: npm run build && npm start
```

Адрес API задаётся переменной `NEXT_PUBLIC_API_URL` (по умолчанию `http://localhost:8000`, см. `frontend/.env.example`).

## Что умеет витрина

- Главная: карусель акций, плитки рубрик, подборки, популярное, «О нас», частые вопросы, контакты с картой.
- Каталог: дерево рубрик, фильтры (цена, наличие, скидка), сортировка, пагинация, поиск.
- Карточка товара: галерея, цена и скидка, остаток, счётчик просмотров, похожие товары.
- Корзина и избранное хранятся в браузере (localStorage); на телефоне — нижняя панель навигации.
- Оформление заказа без регистрации: бэкенд проверяет остатки, списывает их и создаёт заказ.
- Страница «Доставка, оплата и возврат», заглушка входа в аккаунт.

## Админка и каталог

Товары, рубрики и подборки **не хранятся в коде** — они живут в базе данных и добавляются
через админку `http://localhost:8000/admin`:

- **Рубрики** — дерево: раздел верхнего уровня (например, «Ткани») и вложенные рубрики. Описание и обложка
  необязательны: без обложки берётся фото первого товара. Слаг (адрес) заполняется из названия сам.
- **Товары** — артикул, рубрика, цена и старая цена (для скидки), остаток, единица, фото (несколько,
  одно — главное) и подборки прямо в карточке товара. Цена, остаток, «Новинка» и «Скрыт» правятся
  из списка; есть фильтры по наличию, скидке, рубрике, подборке и массовые действия.
- **Подборки** — набор товаров с описанием и обложкой. Отметка «На главной» выводит подборку в баннер
  и блоки главной страницы, «Скрыта» убирает её с витрины.
- **Заказы** — смена статуса прямо в списке.

Ссылка «Смотреть на сайте» в админке ведёт на витрину по адресу `STOREFRONT_URL` (по умолчанию `http://localhost:3000`).

Импорт товаров из Excel (сопоставление по артикулу, рубрика — путь вида `Ткани/Портьерные ткани`):

```bash
python manage.py import_products catalog.xlsx --template   # создать файл-шаблон
python manage.py import_products catalog.xlsx              # импортировать
```

## REST API

Ответы — JSON, ошибки — `{ "detail": "..." }`. CORS разрешён для `localhost:3000`.

| Метод | Путь | Назначение |
| --- | --- | --- |
| GET | `/api/categories/` | Дерево рубрик со счётчиками товаров |
| GET | `/api/products/` | Товары. Параметры: `category`, `collection`, `search`, `skus`, `in_stock`, `sale`, `is_new`, `min_price`, `max_price`, `ordering`, `page`, `page_size` |
| GET | `/api/products/{sku}/` | Карточка товара (увеличивает счётчик просмотров) |
| GET | `/api/collections/`, `/api/collections/{slug}/` | Подборки |
| POST | `/api/orders/` | Оформить заказ |
| GET | `/api/orders/{public_id}/` | Заказ по публичному идентификатору |

## Публикация на GitHub Pages

GitHub Pages раздаёт только статические файлы и не может запустить Django, поэтому туда
публикуется статичная версия витрины, собранная **из базы данных**:

1. Отредактируйте каталог в админке.
2. Сохраните снимок базы: `python manage.py catalog_save` — он пишет `backend/data/catalog.json`
   (фикстура Django) и фото в `backend/data/media/`.
3. Закоммитьте `backend/data/` и запушьте в `main`.

Workflow `.github/workflows/pages.yml` создаёт чистую базу, загружает в неё снимок (`catalog_load`),
выгружает каталог для витрины (`export_static` → `frontend/src/generated/`, в git не хранится) и
публикует сайт. Фильтры и поиск там работают в браузере, а оформление заказа показывает
подтверждение и ничего не отправляет. Один раз включите **Settings → Pages → Source: GitHub Actions**.

Собрать статичную версию локально:

```bash
cd backend && python manage.py export_static
cd ../frontend && NEXT_PUBLIC_STATIC_DEMO=1 NEXT_PUBLIC_BASE_PATH=/augusta_house npm run build   # → out/
```

## Проверки

```bash
cd backend && ruff check . && ruff format --check . && python manage.py test
cd frontend && npm run lint && npm run format:check && npm run build
```

## Не входит в прототип

Онлайн-оплата и расчёт доставки (заказ подтверждает менеджер), регистрация покупателей, интеграция с 1С, блог.
Перед продакшном задайте `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` и переведите базу на PostgreSQL.
Стартовые фото в каталоге сгенерированы программно — замените их настоящими в админке.
