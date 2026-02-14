import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { PLUGINS_REGISTRY_PATH } from "../utils/paths.js";
import type { InstalledPluginsRegistry, PluginMetadata, ResolvedPlugin } from "../types.js";

export async function readInstalledPlugins(): Promise<ResolvedPlugin[]> {
  if (!existsSync(PLUGINS_REGISTRY_PATH)) return [];

  const raw = JSON.parse(await readFile(PLUGINS_REGISTRY_PATH, "utf-8")) as InstalledPluginsRegistry;
  const plugins: ResolvedPlugin[] = [];

  for (const [registryKey, entries] of Object.entries(raw.plugins)) {
    const entry = entries[0]; // First entry = active version
    if (!entry) continue;

    // Read plugin.json metadata
    const pluginJsonPath = join(entry.installPath, ".claude-plugin", "plugin.json");
    let metadata: PluginMetadata = { name: registryKey.split("@")[0] };
    if (existsSync(pluginJsonPath)) {
      try {
        metadata = JSON.parse(await readFile(pluginJsonPath, "utf-8"));
      } catch { /* use defaults */ }
    }

    // Check for MCP config and skills
    const hasMcpConfig = existsSync(join(entry.installPath, ".mcp.json"));
    let hasSkills = false;
    const skillsDir = join(entry.installPath, "skills");
    if (existsSync(skillsDir)) {
      try {
        const skillEntries = await readdir(skillsDir, { withFileTypes: true });
        hasSkills = skillEntries.some((e) => e.isDirectory());
      } catch { /* no skills */ }
    }

    plugins.push({
      registryKey,
      name: metadata.name ?? registryKey.split("@")[0],
      version: entry.version,
      description: metadata.description ?? "",
      installPath: entry.installPath,
      scope: entry.scope,
      author: metadata.author,
      homepage: metadata.homepage,
      repository: metadata.repository,
      license: metadata.license,
      keywords: metadata.keywords,
      installedAt: entry.installedAt,
      lastUpdated: entry.lastUpdated,
      hasMcpConfig,
      hasSkills,
    });
  }

  return plugins;
}
