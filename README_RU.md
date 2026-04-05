# Codex Code Starter

Одноагентный мета-фреймворк для структурированной AI-разработки с **Codex**.

> Название репозитория `codex-code-starter` сохранено для долгосрочной совместимости.

[![GitHub](https://img.shields.io/badge/GitHub-codex--code--starter-blue)](https://github.com/Ultraivanov/codex-code-starter)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/Ultraivanov/codex-code-starter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

> **EN version:** [README.md](README.md)

## Что нового в v1.0.0

- Codex-first контракт рабочих файлов состояния.
- Минимальная аддитивная установка без затрагивания бизнес-кода.
- Протоколы start/finish под границы сессий Codex.
- Профилирование проектов: software vs content.

## Для пользователей

### Требования

- Node.js 18+
- Python 3.x

Проверка:

```bash
node --version
python3 --version
```

### Установка в любой host-проект

1. Скопируйте `init-project.sh` в корень host-проекта.
2. Запустите установщик:

```bash
./init-project.sh
```

Установщик запрашивает **профиль проекта**:

- `software` — для проектов разработки ПО (сервис/приложение/исходный код).
- `content` — для контентных проектов (курс/книга/статья/исследование/сценарий).

Для каждого профиля используется отдельная структура memory-файлов и генерации.

3. Запустите Codex в этом проекте.
4. Запуск протокола в чате:

- `start`

5. Завершение протокола в чате:

- `/fi`

## Рабочий цикл

### Start

`start` выполняет cold start:

- роутинг миграции/апгрейда (на первом запуске),
- проверку crash/session,
- загрузку общего контекста,
- проверку версии фреймворка (с автообновлением при необходимости).

Контекстные файлы выбираются по профилю:

- software: `.codex/SNAPSHOT.md`, `.codex/BACKLOG.md`, `.codex/ARCHITECTURE.md`
- content: `.codex/content/SNAPSHOT.md`, `.codex/content/BACKLOG.md`, `.codex/content/ARCHITECTURE.md`

### Finish

`/fi` выполняет completion:

- security/export проверки,
- git status/diff проверки,
- финализацию сессии.

## Структура фреймворка

```text
codex-code-starter/
├── AGENTS.md                     # Точка входа для Codex
├── init-project.sh               # Установщик для host-проектов
├── CHANGELOG.md
├── README.md
├── README_RU.md
├── LICENSE
├── .codex/
│   ├── commands/                 # Исполняемые Codex workflows
│   │   └── quick-update.sh        # Вход обновления для Codex
│   ├── protocols/                # Silent protocol specs
│   ├── templates/                # Шаблоны состояния/конфига
│   └── contracts/
├── security/                     # Security scan/cleanup скрипты
└── migration/                    # Сборка и релизные скрипты
```

## Режимы миграции

Установщик автоматически определяет тип host-проекта:

- `new` — инициализация в новом проекте,
- `legacy` — миграция существующего проекта,
- `upgrade` — апгрейд со старой версии фреймворка.

Во всех режимах установщик также фиксирует профиль проекта (`software` или `content`) в `.codex/.framework-config`.

Во всех режимах бизнес-код host-проекта не должен разрушаться.

## Модель обновления

- В `start` встроена проверка версии.
- Если доступна новая версия и есть апдейтер, обновление применяется автоматически.
- Пакет обновления содержит только Codex-ветку, чтобы сохранить компактность.

## Для разработчиков фреймворка

### Подготовка

```bash
git clone https://github.com/Ultraivanov/codex-code-starter.git
cd codex-code-starter
```

### Сборка дистрибутива

```bash
bash migration/build-distribution.sh
```

Артефакты создаются в `dist-release/`:

- `init-project.sh`
- `framework.tar.gz`
- `framework-commands.tar.gz`

## Версионирование

- Используется Semantic Versioning.
- `1.0.0` — первый стабильный релиз Codex-first контракта.

Подробности см. в [CHANGELOG.md](CHANGELOG.md).

## Contributing

1. Создайте ветку
2. Внесите изменения
3. Прогоните локальные проверки/сборку
4. Откройте PR

---

Цель фреймворка: сделать сессии Codex детерминированными и переносимыми при едином состоянии проекта.
