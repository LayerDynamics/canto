import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import type { McpServerConfig, ResolvedPlugin } from "../types.js";

interface RawMcpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  type?: string;
  url?: string;
  headers?: Record<string, string>;
}

function normalizeMcpJson(raw: unknown): Record<string, RawMcpEntry> {
  const obj = raw as Record<string, unknown>;
  if ("mcpServers" in obj && typeof obj.mcpServers === "object"
      && obj.mcpServers !== null && !Array.isArray(obj.mcpServers)) {
    return obj.mcpServers as Record<string, RawMcpEntry>;
  }
  return obj as Record<string, RawMcpEntry>;
}

export async function readMcpServers(plugins: ResolvedPlugin[]): Promise<McpServerConfig[]> {
  const servers: McpServerConfig[] = [];
  for (const plugin of plugins) {
    const mcpPath = join(plugin.installPath, ".mcp.json");
    if (!existsSync(mcpPath)) continue;
    try {
      const raw = JSON.parse(await readFile(mcpPath, "utf-8"));
      const normalized = normalizeMcpJson(raw);
      for (const [serverName, config] of Object.entries(normalized)) {
        servers.push({
          serverName,
          sourcePlugin: plugin.registryKey,
          sourcePluginName: plugin.name,
          command: config.command,
          args: config.args,
          env: config.env,
          cwd: config.cwd,
          type: config.type,
          url: config.url,
          headers: config.headers,
        });
      }
    } catch { /* skip malformed */ }
  }
  return servers;
}
