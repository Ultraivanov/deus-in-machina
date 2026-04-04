import path from "node:path";
import { applySchema, openSqlite, SqliteStore } from "./sqlite.js";

export type StorageInitResult = {
  store: SqliteStore;
  dbPath: string;
};

export const initSqliteStore = (dbPath?: string): StorageInitResult => {
  const resolvedPath =
    dbPath ?? process.env.BUILDRAIL_DB_PATH ?? path.join(process.cwd(), ".buildrail", "buildrail.db");
  const db = openSqlite(resolvedPath);
  applySchema(db);
  return { store: new SqliteStore(db), dbPath: resolvedPath };
};
