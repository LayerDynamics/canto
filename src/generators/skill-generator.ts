import { z } from "zod";
import { SkillComponentSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";
import { appendYamlField } from "../utils/yaml.js";

type SkillInput = z.infer<typeof SkillComponentSchema>;

export function generateSkill(skill: SkillInput): GeneratedFile {
  const frontmatterLines: string[] = ["---"];

  appendYamlField(frontmatterLines, "name", skill.name);
  appendYamlField(frontmatterLines, "description", skill.description);
  appendYamlField(frontmatterLines, "version", skill.version);

  frontmatterLines.push("---");

  const content = `${frontmatterLines.join("\n")}\n\n${skill.content}\n`;

  return {
    relativePath: `skills/${skill.name}/SKILL.md`,
    content,
  };
}

export function generateSkills(skills: SkillInput[]): GeneratedFile[] {
  return skills.map(generateSkill);
}
