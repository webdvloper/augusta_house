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
python manage.py seed_demo          # демо-каталог: 58 товаров с картинками, рубрики, подборки
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

## Админка

`http://localhost:8000/admin` — товары с фото, рубрики, подборки и заказы (смена статуса прямо в списке).
Цена, остаток, «Новинка» и «Скрыт с витрины» редактируются из списка товаров.

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

## Демо на GitHub Pages

GitHub Pages раздаёт только статические файлы, поэтому там публикуется демо-версия витрины без бэкенда:
каталог берётся из снимка (`frontend/src/lib/demo-catalog.json` + фото в `frontend/public/demo/`),
фильтры и поиск работают в браузере, а оформление заказа показывает демо-подтверждение и ничего не отправляет.
Админки в демо нет.

Публикация — workflow `.github/workflows/pages.yml`: запускается при пуше в `main` или вручную.
Один раз включите в репозитории **Settings → Pages → Source: GitHub Actions**.

Собрать демо локально:

```bash
cd backend && python manage.py export_static        # снимок каталога и фото
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
Фотографии в демо-каталоге сгенерированы программно — замените их настоящими в админке.
