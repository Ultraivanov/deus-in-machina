---
tags: [codex, workflow, phases]
---

# Phase → Block → Task → Session

## Иерархия

```
Phase
  └── Block        (.codex/PHASES.md)
        └── Task   (.codex/blocks/<ID>.md)
              └── Session
```

## Где что хранится

- Фазы и статусы блоков: `.codex/PHASES.md`
- Детали блока и задачи: `.codex/blocks/<ID>.md`
- Снимок сессии: `.codex/SNAPSHOT.md`

## Команды

- `init-phases` — генерирует черновик фаз
- `init-block <ID>` — открывает блок и создаёт файл блока
- `init-task` — пишет Change Plan и запускает задачу
- `done` — закрывает задачу или блок после проверки Done When
- `pause` — приостанавливает текущую задачу

## Правила

- Одна задача на сессию.
- Change Plan обязателен до кода.
- Done When должен быть проверяемым.
- Рефакторинг — только в специализированных блоках.

## Типовой поток

1. `init-phases` → `approve`
2. `init-block MVP-01` → `approve`
3. `init-task` → `yes`
4. работа над задачей
5. `done` (задача/блок)
6. `/fi`
