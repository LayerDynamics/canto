import { z } from "zod";
import { ScaffoldPluginInput } from "../types.js";
import type { GeneratedFile } from "../types.js";

type ScaffoldParams = z.infer<typeof ScaffoldPluginInput>;

export function generatePluginManifest(params: ScaffoldParams): GeneratedFile {
  const manifest: Record<string, unknown> = {
    name: params.name,
    description: params.description,
    version: "1.0.0",
  };

  if (params.author) {
    manifest.author = params.author;
  }

  if (params.components.skills) {
    manifest.skills = "./skills/";
  }

  if (params.components.commands) {
    manifest.commands = "./commands/";
  }

  if (params.components.hooks) {
    manifest.hooks = "./hooks/hooks.json";
  }

  if (params.components.mcp) {
    manifest.mcpServers = "./.mcp.json";
  }

  return {
    relativePath: ".claude-plugin/plugin.json",
    content: JSON.stringify(manifest, null, 2) + "\n",
  };
}
