import { z } from "zod";
import { SkillComponentSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";

type SkillInput = z.infer<typeof SkillComponentSchema>;

export function generateSkill(skill: SkillInput): GeneratedFile {
  const frontmatter = [
    "---",
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    `version: ${skill.version}`,
    "---",
  ].join("\n");

  const content = `${frontmatter}\n\n${skill.content}\n`;

  return {
    relativePath: `skills/${skill.name}/SKILL.md`,
    content,
  };
}

export function generateSkills(skills: SkillInput[]): GeneratedFile[] {
  return skills.map(generateSkill);
}
