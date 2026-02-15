import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import type { GeneratedFile } from "../types.js";

export async function writeFilesToDisk(basePath: string, files: GeneratedFile[]): Promise<void> {
  for (const file of files) {
    const fullPath = join(basePath, file.relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, "utf-8");
  }
}
