import { promises as fs } from "fs";
import path from "path";

const STATE_DIR = ".assistant";

export type PhaseState = {
  activePhase?: {
    phase: string;
    goal: string;
    started: string;
    target: string;
  };
  activeBlock?: {
    id: string;
    title: string;
    status: string;
    file: string;
  };
};

export async function ensureStateDirs(repoRoot: string): Promise<void> {
  const blocksDir = path.join(repoRoot, STATE_DIR, "blocks");
  const protocolsDir = path.join(repoRoot, STATE_DIR, "protocols");
  const commandsDir = path.join(repoRoot, STATE_DIR, "commands");
  await fs.mkdir(blocksDir, { recursive: true });
  await fs.mkdir(protocolsDir, { recursive: true });
  await fs.mkdir(commandsDir, { recursive: true });
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.rename(tmpPath, filePath);
}

export function buildPhasesMarkdown(state: PhaseState): string {
  const phase = state.activePhase ?? {
    phase: "MVP",
    goal: "",
    started: new Date().toISOString().slice(0, 10),
    target: "TBD"
  };
  const block = state.activeBlock ?? {
    id: "",
    title: "",
    status: "pending",
    file: ""
  };

  return `# PHASES — Project Progress State\n\n> Single source of truth for phases and block status.\n> Block details and tasks live in .assistant/blocks/<ID>.md.\n> Updated at block open/close via init-block and done.\n\n---\n\n## Active Phase\n\n| Field      | Value                      |\n|------------|----------------------------|\n| Phase      | ${phase.phase}             |\n| Goal       | ${phase.goal}              |\n| Started    | ${phase.started}           |\n| Target     | ${phase.target}            |\n\n## Active Block\n\n| Field      | Value                      |\n|------------|----------------------------|\n| Block ID   | ${block.id}                |\n| Title      | ${block.title}             |\n| Status     | ${block.status}            |\n| File       | ${block.file}              |\n\n---\n\n_Last updated: ${new Date().toISOString().slice(0, 10)}_\n`;
}

export function buildSnapshotMarkdown(summary: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `# Snapshot\n\nDate: ${date}\n\n## Summary\n\n${summary}\n`;
}

export async function writePhases(repoRoot: string, content: string): Promise<void> {
  await ensureStateDirs(repoRoot);
  const filePath = path.join(repoRoot, STATE_DIR, "PHASES.md");
  await writeAtomic(filePath, content);
}

export async function writeBlock(repoRoot: string, blockId: string, content: string): Promise<void> {
  await ensureStateDirs(repoRoot);
  const filePath = path.join(repoRoot, STATE_DIR, "blocks", `${blockId}.md`);
  await writeAtomic(filePath, content);
}

export async function writeSnapshot(repoRoot: string, content: string): Promise<void> {
  await ensureStateDirs(repoRoot);
  const filePath = path.join(repoRoot, STATE_DIR, "SNAPSHOT.md");
  await writeAtomic(filePath, content);
}
