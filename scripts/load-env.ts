import fs from "node:fs";
import path from "node:path";

type EnvMap = Record<string, string>;

function parseEnvFile(contents: string): EnvMap {
  const env: EnvMap = {};
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !(key in env)) {
      env[key] = value;
    }
  }

  return env;
}

export function loadEnvFiles(
  baseDir = process.cwd(),
  files = [".env.local", ".env"],
) {
  for (const file of files) {
    const filePath = path.join(baseDir, file);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const parsed = parseEnvFile(fs.readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
