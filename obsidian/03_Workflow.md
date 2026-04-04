---
tags: [codex, workflow]
---

# Workflow

## Start

В чате Codex:

- `start`

Запускается cold start:

- проверка миграции/апгрейда,
- загрузка контекста из файлов,
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

## Команды уровня Phase/Block/Task

- `init-phases` — черновик `PHASES.md` из текущего контекста
- `init-block <ID>` — создать файл блока в `.codex/blocks/`
- `init-task` — Change Plan для следующей задачи
- `done` — закрыть задачу/блок после проверки Done When
- `pause` — поставить задачу на паузу

Подробнее: [[09_Phase_Block_Task]]

Дальше: [[04_Structure]]
