import fs from "node:fs";
import path from "node:path";

export type RepoIndexOptions = {
  root: string;
  exclude?: string[];
};

const defaultExcludes = new Set([
  ".git",
  "node_modules",
  "dist",
  ".buildrail",
  ".assistant"
]);

export const buildRepoIndex = (options: RepoIndexOptions): string[] => {
  const root = options.root;
  const excludes = new Set([...(options.exclude ?? []), ...defaultExcludes]);
  const results: string[] = [];

  const walk = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (excludes.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(root, fullPath);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        results.push(relPath);
      }
    }
  };

  walk(root);
  return results.sort();
};
