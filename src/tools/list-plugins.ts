import { readInstalledPlugins } from "../readers/plugin-reader.js";

export async function handleListPlugins() {
  const plugins = await readInstalledPlugins();
  const result = plugins.map((p) => ({
    name: p.name,
    version: p.version,
    description: p.description,
    registryKey: p.registryKey,
    scope: p.scope,
    keywords: p.keywords,
    hasMcpConfig: p.hasMcpConfig,
    hasSkills: p.hasSkills,
  }));

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
