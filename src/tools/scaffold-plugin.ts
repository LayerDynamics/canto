import { z } from "zod";
import { join } from "path";
import { ScaffoldPluginInput } from "../types.js";
import type { GeneratedFile } from "../types.js";
import { checkConflicts } from "../utils/conflict-checker.js";
import { writeFilesToDisk } from "../utils/writer.js";
import { generatePluginManifest } from "../generators/plugin-generator.js";
import { generateMcpServer } from "../generators/mcp-generator.js";
import { generateSkills } from "../generators/skill-generator.js";
import { generateCommands } from "../generators/command-generator.js";
import { generateAgents } from "../generators/agent-generator.js";
import { generateHooks } from "../generators/hook-generator.js";

type ScaffoldParams = z.infer<typeof ScaffoldPluginInput>;

export async function handleScaffoldPlugin(params: ScaffoldParams) {
  // 1. Run conflict checks
  const conflicts = await checkConflicts(params);
  if (conflicts.length > 0) {
    const details = conflicts.map((c) => `- [${c.type}] ${c.detail}`).join("\n");
    return {
      content: [{
        type: "text" as const,
        text: `Cannot scaffold plugin "${params.name}" due to conflicts:\n${details}\n\nRename the conflicting components or remove existing ones first.`,
      }],
      isError: true,
    };
  }

  // 2. Collect all generated files
  const files: GeneratedFile[] = [];

  // Always generate plugin manifest
  files.push(generatePluginManifest(params));

  // Conditionally generate components
  if (params.components.mcp) {
    files.push(...generateMcpServer(params.name, params.components.mcp));
  }

  if (params.components.skills && params.components.skills.length > 0) {
    files.push(...generateSkills(params.components.skills));
  }

  if (params.components.commands && params.components.commands.length > 0) {
    files.push(...generateCommands(params.components.commands));
  }

  if (params.components.agents && params.components.agents.length > 0) {
    files.push(...generateAgents(params.components.agents));
  }

  if (params.components.hooks) {
    files.push(...generateHooks(params.components.hooks));
  }

  // 3. Write or return
  const pluginPath = join(params.outputPath, params.name);

  if (params.writeToDisk) {
    await writeFilesToDisk(pluginPath, files);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          status: "created",
          pluginPath,
          fileCount: files.length,
          files: files.map((f) => f.relativePath),
          components: {
            manifest: true,
            mcp: !!params.components.mcp,
            skills: params.components.skills?.length ?? 0,
            commands: params.components.commands?.length ?? 0,
            agents: params.components.agents?.length ?? 0,
            hooks: !!params.components.hooks,
          },
          nextSteps: params.components.mcp
            ? [`cd ${pluginPath}`, "npm install", "npm run build"]
            : [],
        }, null, 2),
      }],
    };
  }

  // Return as JSON without writing
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        status: "generated",
        pluginPath,
        files: files.map((f) => ({
          relativePath: f.relativePath,
          content: f.content,
        })),
      }, null, 2),
    }],
  };
}
