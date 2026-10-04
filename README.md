# СтройРемонт24 — лендинг

Статический лендинг магазина строительных материалов «СтройРемонт24». Сайт собирается в HTML, CSS и JavaScript, публикуется на GitHub Pages, а заявки из формы обрабатывает отдельная функция в Yandex Cloud.

## Как это устроено

```text
Исходники в src/
        │
        ├── Rsbuild + Nunjucks + PostCSS
        ▼
  статическая папка build/
        │
        ▼
   GitHub Pages
        │
        └── форма → hCaptcha → Yandex Cloud Function → Yandex Postbox → email
```

GitHub Pages отвечает только за отдачу сайта. Никаких PHP-процессов и секретов в браузере нет: проверка капчи и отправка писем происходят в облачной функции.

## Стек

### Сайт

- [Rsbuild](https://rsbuild.rs/) — сборка на базе Rspack;
- [Nunjucks](https://mozilla.github.io/nunjucks/) — HTML-шаблоны и переиспользуемые части страниц;
- PostCSS, `postcss-preset-env`, БЭМ и `.pcss`-исходники — стили;
- Vanilla JavaScript — клиентская логика;
- Swiper, Choices.js, IMask и Mmenu-light — интерактивные элементы;
- Sharp и SVGO — подготовка адаптивных изображений и SVG-спрайта;
- ESLint и Stylelint — проверка кода.

### Заявки и защита от ботов

- [hCaptcha](https://www.hcaptcha.com/) — проверка пользователя перед отправкой;
- Yandex Cloud Functions, Node.js 22 — HTTP-обработчик формы;
- Nodemailer и Yandex Cloud Postbox — отправка писем;
- GitHub Actions — сборка и публикация на GitHub Pages.

## Быстрый старт

Требуется Node.js 22 и npm.

```bash
npm ci
npm run dev
```

Разработка доступна по адресу `http://192.168.0.2:3001`.

Полезные команды:

```bash
npm run build          # production-сборка в build/
npm run lint           # ESLint и Stylelint
npm run clean          # очистка build/
npm run mock-data      # обновление локальных данных каталога
npm run build:analyze  # сборка с Rsdoctor
```

## Переменные окружения

Скопируйте [`.env.example`](.env.example) в `.env` и замените значения-заглушки. Корневой `.env` не попадает в Git и не публикуется. Для сборки сайта нужны только публичные значения:

```dotenv
FORM_ENDPOINT=https://functions.yandexcloud.net/<function-id>
HCAPTCHA_SITEKEY=<public-hcaptcha-sitekey>
SITE_URL=https://drmonro.github.io/lp-stroyrem
CATALOG_YML_URL=<catalog-feed-url>
```

В GitHub Actions эти значения добавляются в **Settings → Secrets and variables → Actions**. `HCAPTCHA_SITEKEY` и URL функции допустимо показывать в браузере — это публичные адреса, а не доступы к сервисам.

Секреты хранятся только в настройках Yandex Cloud Function:

- `HCAPTCHA_SECRET`;
- `POSTBOX_API_KEY_ID`;
- `POSTBOX_API_KEY_SECRET`;
- `FROM_EMAIL`;
- `TO_EMAIL`;
- `ALLOWED_ORIGIN` — например, `https://drmonro.github.io`.

Никогда не добавляйте эти значения в `.env`, HTML, JavaScript, GitHub Actions artifact или README.

## Публикация

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) запускается при пуше в `master` и вручную из вкладки **Actions**. Он:

1. устанавливает зависимости через `npm ci`;
2. создаёт временный `.env` из GitHub Secrets;
3. собирает сайт;
4. передаёт `build/` в GitHub Pages.

Для первого запуска в репозитории нужно выбрать **Settings → Pages → Build and deployment → GitHub Actions**. Адрес проекта по умолчанию: `https://drmonro.github.io/lp-stroyrem/`.

Сайт также готов к размещению в подкаталоге GitHub Pages: пути к статике относительные, поэтому CSS, JavaScript, изображения и manifest не зависят от корня домена.

## Облачная функция

Исходники функции находятся в [`functions/form-handler/`](functions/form-handler/). Это отдельный небольшой Node.js-проект, поэтому в нём есть собственный `package.json`: Yandex Cloud при обновлении функции устанавливает только `nodemailer`, а не все инструменты сборки лендинга.

Инструкции по обновлению и перечень переменных находятся в [`functions/form-handler/README.md`](functions/form-handler/README.md). Содержимое этой папки не входит в GitHub Pages artifact.

Перед тестом формы проверьте:

- функция публична;
- `ALLOWED_ORIGIN` совпадает с origin сайта без пути;
- в hCaptcha разрешён `drmonro.github.io` или подключённый пользовательский домен;
- адрес отправителя подтверждён в Postbox.

## Структура

```text
src/
├── templates/       Nunjucks: страницы, layout и partials
├── css/             PostCSS-стили по блокам
├── js/              браузерная логика и утилиты
├── data/            шаблоны и mock-данные каталога
└── media/           изображения и SVG

scripts/site-build.mjs     рендеринг шаблонов, изображения, SVG, sitemap и копирование статики
functions/form-handler/    Yandex Cloud Function для формы
.github/workflows/         GitHub Actions / GitHub Pages
```

Редактируйте файлы в `src/`; `build/` — результат сборки и игнорируется Git.

## Короткая история проекта

Проект не всегда был статическим и облачным. По Git-истории видно несколько важных переходов:

- сначала сборка работала на Gulp, а форма отправлялась PHP-обработчиком;
- позже проект получил Nunjucks-partials, секции каталога, доставки, команды и контактов, а данные каталога стали загружаться и преобразовываться отдельно;
- Gulp был обновлён до версии 5, после чего сборочный конвейер перенесли на Rsbuild (коммит `c2d32d6`);
- Sass и часть старых ассетов были удалены в пользу актуальных PostCSS-блоков;
- магазин `stroyrem24.ru`, контакты и аналитика были встроены в лендинг;
- PHP-зависимости и серверный деплой заменены на GitHub Pages, Yandex Cloud Function, hCaptcha и Postbox (коммит `c05ae77`).

Так лендинг сохранил простоту статического сайта, но получил рабочую форму без собственного сервера.
