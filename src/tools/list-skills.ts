import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readAllSkills } from "../readers/skill-reader.js";
import { z } from "zod";
import { ListSkillsInput } from "../types.js";

type ListSkillsParams = z.infer<typeof ListSkillsInput>;

export async function handleListSkills(params: ListSkillsParams) {
  const plugins = await readInstalledPlugins();
  const allSkills = await readAllSkills(plugins);

  const filtered = params.source === "all"
    ? allSkills
    : allSkills.filter((s) => s.source === params.source);

  const result = filtered.map((s) => ({
    name: s.name,
    description: s.description,
    source: s.source,
    sourcePluginName: s.sourcePluginName,
    directoryName: s.directoryName,
  }));

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
