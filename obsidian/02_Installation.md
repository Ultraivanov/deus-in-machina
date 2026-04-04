---
tags: [codex, install]
---

# Установка

## Требования

- Node.js 18+
- Python 3.x

Проверка:

```bash
node --version
python3 --version
```

## Шаги

1. Скопируйте `init-project.sh` в корень host‑проекта.
2. Запустите установщик:

```bash
./init-project.sh
```

3. Выберите профиль:

- `software` — кодовые проекты
- `content` — контентные проекты

## Результат

Создаются файлы состояния в `.codex/` и фиксируется профиль в `.codex/.framework-config`.

Дальше: [[03_Workflow]]
