#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-}"

if [[ -z "$PROFILE" ]]; then
  echo "Select project profile: software or content"
  read -r PROFILE
fi

case "$PROFILE" in
  software|content)
    ;;
  *)
    echo "Invalid profile: $PROFILE"
    echo "Use 'software' or 'content'."
    exit 1
    ;;
esac

mkdir -p .codex/commands .codex/contracts .codex/templates .codex/protocols

if [[ "$PROFILE" == "content" ]]; then
  mkdir -p .codex/content
  touch .codex/content/SNAPSHOT.md .codex/content/BACKLOG.md .codex/content/ARCHITECTURE.md
else
  touch .codex/SNAPSHOT.md .codex/BACKLOG.md .codex/ARCHITECTURE.md
fi

echo "profile=$PROFILE" > .codex/.framework-config

echo "Codex Code Starter initialized with profile: $PROFILE"
