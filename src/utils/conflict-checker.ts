import { existsSync } from "fs";
import { join } from "path";
import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readMcpServers } from "../readers/mcp-reader.js";
import { readAllSkills } from "../readers/skill-reader.js";
import type { ConflictEntry } from "../types.js";
import { z } from "zod";
import { ScaffoldPluginInput } from "../types.js";

type ScaffoldParams = z.infer<typeof ScaffoldPluginInput>;

export async function checkConflicts(params: ScaffoldParams): Promise<ConflictEntry[]> {
  const conflicts: ConflictEntry[] = [];
  const plugins = await readInstalledPlugins();

  // Check plugin name
  const existingPlugin = plugins.find((p) => p.name === params.name);
  if (existingPlugin) {
    conflicts.push({
      type: "plugin",
      name: params.name,
      detail: `Plugin "${params.name}" already installed at ${existingPlugin.installPath}`,
    });
  }

  // Check MCP server name
  if (params.components.mcp) {
    const servers = await readMcpServers(plugins);
    const existingServer = servers.find((s) => s.serverName === params.components.mcp!.serverName);
    if (existingServer) {
      conflicts.push({
        type: "mcp-server",
        name: params.components.mcp.serverName,
        detail: `MCP server "${params.components.mcp.serverName}" already exists in plugin "${existingServer.sourcePluginName}"`,
      });
    }
  }

  // Check skill names
  if (params.components.skills && params.components.skills.length > 0) {
    const allSkills = await readAllSkills(plugins);
    for (const skill of params.components.skills) {
      const existingSkill = allSkills.find((s) => s.name === skill.name);
      if (existingSkill) {
        const source = existingSkill.source === "plugin"
          ? `plugin "${existingSkill.sourcePluginName}"`
          : "user skills";
        conflicts.push({
          type: "skill",
          name: skill.name,
          detail: `Skill "${skill.name}" already exists in ${source} at ${existingSkill.filePath}`,
        });
      }
    }
  }

  // Check output path
  const outputDir = join(params.outputPath, params.name);
  if (existsSync(outputDir)) {
    conflicts.push({
      type: "output-path",
      name: outputDir,
      detail: `Output directory "${outputDir}" already exists`,
    });
  }

  return conflicts;
}
