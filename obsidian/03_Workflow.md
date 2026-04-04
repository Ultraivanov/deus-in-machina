---
tags: [codex, workflow]
---

# Workflow

## Start

В чате Codex:

- `start`

Запускается cold start:

- проверка миграции/апгрейда,
- загрузка контекста,
- проверка версии фреймворка.

## Finish

В чате Codex:

- `/fi`

Запускается завершение:

- проверки безопасности/экспорта,
- git status/diff контроль,
- финальная фиксация состояния.

## Контекст

- software: `.codex/SNAPSHOT.md`, `.codex/BACKLOG.md`, `.codex/ARCHITECTURE.md`
- content: `.codex/content/SNAPSHOT.md`, `.codex/content/BACKLOG.md`, `.codex/content/ARCHITECTURE.md`

Дальше: [[04_Structure]]
