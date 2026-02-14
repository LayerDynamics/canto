import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { USER_SKILLS_DIR } from "../utils/paths.js";
import { parseFrontmatter } from "../utils/frontmatter.js";
import type { ResolvedPlugin, SkillInfo } from "../types.js";

export async function readAllSkills(plugins: ResolvedPlugin[]): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  // Plugin skills
  for (const plugin of plugins) {
    const skillsDir = join(plugin.installPath, "skills");
    if (!existsSync(skillsDir)) continue;
    try {
      const entries = await readdir(skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillPath = join(skillsDir, entry.name, "SKILL.md");
        if (!existsSync(skillPath)) continue;
        const content = await readFile(skillPath, "utf-8");
        const parsed = parseFrontmatter(content, entry.name);
        skills.push({
          name: parsed.name ?? entry.name,
          description: parsed.description ?? "",
          source: "plugin",
          sourcePlugin: plugin.registryKey,
          sourcePluginName: plugin.name,
          filePath: skillPath,
          directoryName: entry.name,
        });
      }
    } catch { /* skip */ }
  }

  // User skills
  if (existsSync(USER_SKILLS_DIR)) {
    try {
      const entries = await readdir(USER_SKILLS_DIR, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillPath = join(USER_SKILLS_DIR, entry.name, "SKILL.md");
        if (!existsSync(skillPath)) continue;
        const content = await readFile(skillPath, "utf-8");
        const parsed = parseFrontmatter(content, entry.name);
        skills.push({
          name: parsed.name ?? entry.name,
          description: parsed.description ?? "",
          source: "user",
          filePath: skillPath,
          directoryName: entry.name,
        });
      }
    } catch { /* skip */ }
  }

  return skills;
}

export async function readSkillContent(filePath: string): Promise<string> {
  return readFile(filePath, "utf-8");
}
