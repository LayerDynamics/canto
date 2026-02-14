import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readMcpServers } from "../readers/mcp-reader.js";
import { z } from "zod";
import { GetMcpDetailsInput } from "../types.js";

type GetMcpDetailsParams = z.infer<typeof GetMcpDetailsInput>;

export async function handleGetMcpDetails(params: GetMcpDetailsParams) {
  const plugins = await readInstalledPlugins();
  const servers = await readMcpServers(plugins);
  const server = servers.find((s) => s.serverName === params.serverName);

  if (!server) {
    return {
      content: [{ type: "text" as const, text: `MCP server "${params.serverName}" not found. Use list_mcps to see available servers.` }],
    };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(server, null, 2) }],
  };
}
