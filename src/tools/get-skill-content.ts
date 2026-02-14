import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readAllSkills, readSkillContent } from "../readers/skill-reader.js";
import { z } from "zod";
import { GetSkillContentInput } from "../types.js";

type GetSkillContentParams = z.infer<typeof GetSkillContentInput>;

export async function handleGetSkillContent(params: GetSkillContentParams) {
  const plugins = await readInstalledPlugins();
  const allSkills = await readAllSkills(plugins);

  let matches = allSkills.filter((s) => s.name === params.name || s.directoryName === params.name);
  if (params.source) {
    matches = matches.filter((s) => s.source === params.source);
  }

  if (matches.length === 0) {
    return {
      content: [{ type: "text" as const, text: `Skill "${params.name}" not found. Use list_skills to see available skills.` }],
    };
  }

  const skill = matches[0];
  const content = await readSkillContent(skill.filePath);

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        name: skill.name,
        description: skill.description,
        source: skill.source,
        sourcePluginName: skill.sourcePluginName,
        directoryName: skill.directoryName,
        content,
      }, null, 2),
    }],
  };
}
