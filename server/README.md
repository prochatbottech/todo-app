# Бэкенд (PHP + MySQL)

Раскладка повторяет структуру на хостинге Timeweb: каталог `server/todo/` соответствует
домашнему каталогу сайта `~/todo/`, а `server/todo/public_html/` — web-корню.

```
server/todo/
├── config.example.php      → ~/todo/config.php        (создать из шаблона, заполнить креды)
├── db.php                  → ~/todo/db.php            (PDO-подключение)
└── public_html/
    ├── .htaccess           → ~/todo/public_html/.htaccess
    ├── setup.php           → ~/todo/public_html/setup.php  (запустить 1 раз, затем удалить)
    └── api/index.php       → ~/todo/public_html/api/index.php
```

## Установка

1. Создайте MySQL-базу и пользователя (напр. `cw242295_todo`).
2. Скопируйте `config.example.php` → `config.php`, укажите хост/имя/логин/пароль.
   `config.php` лежит вне web-корня и в git не попадает.
3. Загрузите файлы по схеме выше.
4. Откройте `https://<домен>/setup.php` — создастся таблица `lists` (с записью «Входящие»)
   и `todos`. После успешного выполнения **удалите** `setup.php`.

## Требования

- PHP 8.0+ с расширением `pdo_mysql`.
- MySQL 5.7+ или MariaDB 10.2+ (используется тип `JSON` для тегов).
- Apache с `mod_rewrite` (для роутинга `/api` и https-редиректа).
