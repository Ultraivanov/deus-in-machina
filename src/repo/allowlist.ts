import path from "node:path";

export type AllowlistInput = {
  repoIndex: string[] | null;
  taskTitle: string;
  technicalGoal?: string;
};

const toLower = (value: string) => value.toLowerCase();

const containsAny = (haystack: string, needles: string[]) =>
  needles.some((needle) => haystack.includes(needle));

const keywordGroups: Array<{ keywords: string[]; patterns: string[] }> = [
  {
    keywords: ["landing", "hero", "page", "screen", "ui", "view"],
    patterns: ["page", "screen", "view", "landing", "hero"]
  },
  {
    keywords: ["component", "widget", "section", "card"],
    patterns: ["component", "components", "ui", "section", "card"]
  },
  {
    keywords: ["api", "endpoint", "route", "server"],
    patterns: ["api", "route", "server"]
  },
  {
    keywords: ["config", "settings", "env"],
    patterns: ["config", "settings", "env"]
  },
  {
    keywords: ["readme", "docs", "documentation"],
    patterns: ["readme", "docs", "documentation"]
  }
];

const scorePath = (relativePath: string, patterns: string[]) => {
  const lowered = toLower(relativePath);
  let score = 0;
  patterns.forEach((pattern) => {
    if (lowered.includes(pattern)) score += 1;
  });
  return score;
};

const filterByExtension = (paths: string[], allowedExtensions: string[]) =>
  paths.filter((p) => allowedExtensions.includes(path.extname(p)));

export const inferAllowedFiles = (input: AllowlistInput): string[] => {
  if (!input.repoIndex || input.repoIndex.length === 0) return [];
  const taskText = toLower([input.taskTitle, input.technicalGoal ?? ""].join(" "));

  const matchedGroups = keywordGroups.filter((group) => containsAny(taskText, group.keywords));
  const patterns = matchedGroups.flatMap((group) => group.patterns);

  const candidates = patterns.length
    ? input.repoIndex.filter((entry) => scorePath(entry, patterns) > 0)
    : input.repoIndex;

  const filtered = filterByExtension(candidates, [".ts", ".tsx", ".js", ".jsx", ".md"]);

  const unique = Array.from(new Set(filtered));
  return unique.slice(0, 20);
};
