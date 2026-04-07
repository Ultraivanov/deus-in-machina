---
tags: [codex, overview]
---

# Обзор

`codex-code-starter` — минимальный GitHub‑friendly каркас для повторяемых Codex‑сессий с 4‑уровневой моделью: Phase → Block → Task → Session.

## Зачем

- Единое состояние проекта между сессиями Codex.
- Детерминированные протоколы `start` и `/fi`.
- Одна задача на сессию с явными approval‑гейтами.
- Нулевое влияние на бизнес‑код.

## Ключевые файлы

- `init-project.sh` — установка в host‑проект.
- `AGENTS.md` — точка входа для Codex.
- `.codex/PHASES.md` — фазы и статусы блоков.
- `.codex/blocks/` — файлы блоков и задач.
- `.codex/` — протоколы и команды.

## Дальше

- [[02_Installation]]
- [[03_Workflow]]
- [[09_Phase_Block_Task]]
