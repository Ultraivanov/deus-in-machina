import fs from "node:fs";
import path from "node:path";

const templateMap: Record<string, string> = {
  "saas-landing": "saas-landing.json",
  "auth-dashboard": "auth-dashboard.json"
};

export const loadTemplate = (name: string) => {
  const filename = templateMap[name];
  if (!filename) return null;
  const filePath = path.join(process.cwd(), "templates", filename);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
