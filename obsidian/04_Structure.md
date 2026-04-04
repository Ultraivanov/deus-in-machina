---
tags: [codex, structure]
---

# Структура

```text
codex-code-starter/
├── AGENTS.md
├── init-project.sh
├── CHANGELOG.md
├── README.md
├── README_RU.md
├── LICENSE
├── .codex/
│   ├── PHASES.md
│   ├── blocks/
│   │   └── BLOCK-TEMPLATE.md
│   ├── commands/
│   │   ├── init-phases.md
│   │   ├── init-block.md
│   │   └── init-task.md
│   ├── protocols/
│   │   ├── phase-workflow.md
│   │   ├── init-phases-protocol.md
│   │   ├── init-block-protocol.md
│   │   └── init-task-protocol.md
│   ├── templates/
│   └── contracts/
├── security/
└── migration/
```

## Примечания

- `AGENTS.md` — входная точка.
- `.codex/PHASES.md` — список фаз и статусы блоков.
- `.codex/blocks/` — задачи и Change Plans.
- `security/` и `migration/` — вспомогательные процессы.

Дальше: [[05_Migration_Update]]
