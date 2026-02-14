import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readAllSkills, readSkillContent } from "../readers/skill-reader.js";
import { z } from "zod";
import { SearchSkillsInput } from "../types.js";

type SearchSkillsParams = z.infer<typeof SearchSkillsInput>;

export async function handleSearchSkills(params: SearchSkillsParams) {
  const plugins = await readInstalledPlugins();
  const allSkills = await readAllSkills(plugins);

  const filtered = params.source === "all"
    ? allSkills
    : allSkills.filter((s) => s.source === params.source);

  const query = params.query.toLowerCase();
  const results: Array<{
    name: string;
    description: string;
    source: string;
    sourcePluginName?: string;
    directoryName: string;
    matchedIn: string[];
  }> = [];

  for (const skill of filtered) {
    const matchedIn: string[] = [];

    if (skill.name.toLowerCase().includes(query)) matchedIn.push("name");
    if (skill.description.toLowerCase().includes(query)) matchedIn.push("description");

    // Check content
    try {
      const content = await readSkillContent(skill.filePath);
      if (content.toLowerCase().includes(query)) matchedIn.push("content");
    } catch { /* skip unreadable */ }

    if (matchedIn.length > 0) {
      results.push({
        name: skill.name,
        description: skill.description,
        source: skill.source,
        sourcePluginName: skill.sourcePluginName,
        directoryName: skill.directoryName,
        matchedIn,
      });
    }
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
  };
}
