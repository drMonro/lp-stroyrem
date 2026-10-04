# Обработчик формы для Yandex Cloud Functions и Postbox

Функция проверяет hCaptcha и отправляет заявку на email через Yandex Cloud Postbox.

## Настройка

1. В Postbox создайте и подтвердите адрес отправителя.
2. Создайте сервисный аккаунт в том же каталоге, назначьте ему роль `postbox.sender` и создайте API-ключ с областью действия `yc.postbox.send`.
3. Создайте функцию в Yandex Cloud с runtime Node.js 22, точкой входа `index.handler` и публичным доступом.
4. Загрузите содержимое этой папки в редактор функции. Yandex Cloud установит зависимость из `package.json` при создании версии.
5. Добавьте переменные окружения:
   - `ALLOWED_ORIGIN` — origin сайта без завершающего `/`, например `https://user.github.io`;
   - `HCAPTCHA_SECRET` — секрет hCaptcha;
   - `POSTBOX_API_KEY_ID` — идентификатор API-ключа Postbox;
   - `POSTBOX_API_KEY_SECRET` — секретная часть API-ключа;
   - `FROM_EMAIL` — подтверждённый в Postbox адрес отправителя;
   - `TO_EMAIL` — адрес, на который должны приходить заявки.
6. В корневой `.env` для сборки сайта добавьте публичные значения:
   - `FORM_ENDPOINT=https://functions.yandexcloud.net/<function-id>`;
   - `HCAPTCHA_SITEKEY=<site-key>`.

Секреты функции нельзя добавлять в `.env` сайта или GitHub Actions build artifact.
