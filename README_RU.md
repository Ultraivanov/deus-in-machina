# Deus In Machina (DIM)

Design System Runtime (DSR) — слой исполнения для дизайн‑систем. Фокус на **нормализации токенов**, **поиске паттернов** и **валидации UI** с циклом исправлений.

## Обзор
- Не генератор дизайна.
- Не дизайн‑инструмент.
- Runtime, который обеспечивает структуру и соблюдение правил.

## Ключевые возможности
- Нормализация токенов: сырые данные Figma → семантические токены.
- Инференс паттернов: обнаружение повторяемых UI‑структур.
- Валидация: линтер UI по правилам.
- Correction loop: генерация исправлений и повторная проверка.

## Pipeline
Figma → Extractor → Normalizer → Pattern Engine → Rules → Validator → Fix Loop

## Design Generation Gateway (provider-agnostic)
- Канонический слой дизайна: `DESIGN.md` в репозитории.
- DSR оркестрирует генерацию, а не делегирует "истину" внешнему инструменту.
- Figma/Stitch/другие платформы работают как подключаемые providers.
- Любой результат провайдера проходит нормализацию и проверку against `DESIGN.md`.

Поток:
Workflow Task → Design Orchestrator → Provider Adapter → Artifacts → Validation Gate → Apply/Review

## MCP Toolchain
- `extract_figma_context`
- `normalize_tokens`
- `build_landing_spec`
- `generate_ui`
- `validate_ui`
- `fix_ui`
- `loop_until_valid`

## Структура репозитория
- `dsr_spec_v3.md` — исходная спецификация
- `.codex/` — состояние проекта и протоколы
- `README.md` — англ. README
- `CHANGELOG.md` — история изменений

## Быстрый старт
1. Прочитайте `dsr_spec_v3.md`.
2. Посмотрите активную фазу в `.codex/PHASES.md`.
3. Следуйте задачам в `.codex/blocks/`.

## CLI (v0)
```bash
npm install
node bin/dsr.js --help
```

Примеры:
```bash
node bin/dsr.js extract --file AbCdEf123 --out context.json
node bin/dsr.js normalize --input context.json --out normalized.json
```

## Статус
Активная разработка. Фаза 4 (Implementation & Pilot) в работе.

## Лицензия
Проприетарная лицензия. Все права защищены. Использование, копирование,
модификация, распространение или создание производных работ допускается только
с предварительного письменного разрешения правообладателя. См. `LICENSE`.
