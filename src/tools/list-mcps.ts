import { readInstalledPlugins } from "../readers/plugin-reader.js";
import { readMcpServers } from "../readers/mcp-reader.js";

export async function handleListMcps() {
  const plugins = await readInstalledPlugins();
  const servers = await readMcpServers(plugins);
  const result = servers.map((s) => ({
    serverName: s.serverName,
    sourcePluginName: s.sourcePluginName,
    transport: s.command ? "stdio" : "http",
    command: s.command,
    url: s.url,
  }));

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}
