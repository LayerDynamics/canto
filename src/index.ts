import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GetMcpDetailsInput, ListSkillsInput, GetSkillContentInput, SearchSkillsInput } from "./types.js";
import { handleListPlugins } from "./tools/list-plugins.js";
import { handleListMcps } from "./tools/list-mcps.js";
import { handleGetMcpDetails } from "./tools/get-mcp-details.js";
import { handleListSkills } from "./tools/list-skills.js";
import { handleGetSkillContent } from "./tools/get-skill-content.js";
import { handleSearchSkills } from "./tools/search-skills.js";

const server = new McpServer({
  name: "mcp-skills",
  version: "1.0.0",
});

server.tool(
  "list_plugins",
  "List all installed Claude Code plugins with their metadata (name, version, description, keywords, MCP/skill status)",
  {},
  async () => handleListPlugins(),
);

server.tool(
  "list_mcps",
  "List all MCP servers configured by installed plugins (server name, transport type, source plugin)",
  {},
  async () => handleListMcps(),
);

server.tool(
  "get_mcp_details",
  "Get full configuration details for a specific MCP server (command, args, env, url, headers)",
  GetMcpDetailsInput.shape,
  async (params) => handleGetMcpDetails(params),
);

server.tool(
  "list_skills",
  "List all available skills from plugins and user-created skills (name, description, source)",
  ListSkillsInput.shape,
  async (params) => handleListSkills(params),
);

server.tool(
  "get_skill_content",
  "Get the full content of a specific skill by name",
  GetSkillContentInput.shape,
  async (params) => handleGetSkillContent(params),
);

server.tool(
  "search_skills",
  "Search skills by keyword across name, description, and content",
  SearchSkillsInput.shape,
  async (params) => handleSearchSkills(params),
);

const transport = new StdioServerTransport();
await server.connect(transport);
