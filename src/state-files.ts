import fs from "fs";
import { promises as fsPromises } from "fs";
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
  await fsPromises.mkdir(blocksDir, { recursive: true });
  await fsPromises.mkdir(protocolsDir, { recursive: true });
  await fsPromises.mkdir(commandsDir, { recursive: true });
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fsPromises.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fsPromises.writeFile(tmpPath, content, "utf8");
  await fsPromises.rename(tmpPath, filePath);
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

type ActiveBlockInfo = {
  id: string;
  title: string;
  status: string;
  file: string;
};

type ActiveTaskInfo = {
  id: string;
  title: string;
  status: string;
  doneWhen: string;
};

type BlockTask = {
  id: string;
  title: string;
  status: string;
  doneWhen: string;
};

function readFileIfExists(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function sectionLines(md: string, heading: string): string[] {
  const lines = md.split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) return [];
  const end = lines.findIndex((line, idx) => idx > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? lines.length : end);
}

function parseKeyValueTable(lines: string[]): Record<string, string> {
  const rows = lines.filter((line) => line.trim().startsWith("|"));
  if (rows.length < 3) return {};
  const dataRows = rows.slice(2);
  const map: Record<string, string> = {};
  for (const row of dataRows) {
    const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 2) {
      map[cols[0]] = cols[1];
    }
  }
  return map;
}

function parseTasksTable(lines: string[]): BlockTask[] {
  const rows = lines.filter((line) => line.trim().startsWith("|"));
  if (rows.length < 3) return [];
  const dataRows = rows.slice(2);
  const tasks: BlockTask[] = [];
  for (const row of dataRows) {
    const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cols.length >= 4) {
      tasks.push({
        id: cols[0],
        title: cols[1],
        status: cols[2],
        doneWhen: cols[3]
      });
    }
  }
  return tasks;
}

export function resolveBlockFilePath(repoRoot: string, filePath: string, blockId?: string): string {
  if (filePath) {
    if (path.isAbsolute(filePath)) return filePath;
    return path.join(repoRoot, filePath);
  }
  if (blockId) {
    return path.join(repoRoot, STATE_DIR, "blocks", `${blockId}.md`);
  }
  return path.join(repoRoot, STATE_DIR, "blocks", "UNKNOWN.md");
}

export function readActiveBlock(repoRoot: string): ActiveBlockInfo | null {
  const phasesPath = path.join(repoRoot, STATE_DIR, "PHASES.md");
  const md = readFileIfExists(phasesPath);
  if (!md) return null;
  const lines = sectionLines(md, "## Active Block");
  const map = parseKeyValueTable(lines);
  if (!map["Block ID"]) return null;
  return {
    id: map["Block ID"] ?? "",
    title: map["Title"] ?? "",
    status: map["Status"] ?? "",
    file: map["File"] ?? ""
  };
}

export function readActiveTaskFromBlock(repoRoot: string, blockFilePath: string): ActiveTaskInfo | null {
  const md = readFileIfExists(blockFilePath);
  if (!md) return null;
  const lines = sectionLines(md, "## Active Task");
  const map = parseKeyValueTable(lines);
  if (!map["Task ID"]) return null;
  return {
    id: map["Task ID"] ?? "",
    title: map["Title"] ?? "",
    status: map["Status"] ?? "",
    doneWhen: map["Done When"] ?? ""
  };
}

export function readBlockTasksFromFile(repoRoot: string, blockFilePath: string): BlockTask[] {
  const md = readFileIfExists(blockFilePath);
  if (!md) return [];
  const lines = sectionLines(md, "## Tasks");
  return parseTasksTable(lines);
}
