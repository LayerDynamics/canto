import { z } from "zod";

// ─── Installed Plugins Registry ───
export interface InstalledPluginEntry {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

export interface InstalledPluginsRegistry {
  version: number;
  plugins: Record<string, InstalledPluginEntry[]>;
}

// ─── Plugin Metadata (.claude-plugin/plugin.json) ───
export interface PluginAuthor {
  name: string;
  email?: string;
}

export interface PluginMetadata {
  name: string;
  description?: string;
  version?: string;
  author?: PluginAuthor;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
}

// ─── Resolved Plugin (registry + metadata combined) ───
export interface ResolvedPlugin {
  registryKey: string;
  name: string;
  version: string;
  description: string;
  installPath: string;
  scope: string;
  author?: PluginAuthor;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  installedAt: string;
  lastUpdated: string;
  hasMcpConfig: boolean;
  hasSkills: boolean;
}

// ─── MCP Server Config ───
export interface McpServerConfig {
  serverName: string;
  sourcePlugin: string;
  sourcePluginName: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  type?: string;
  url?: string;
  headers?: Record<string, string>;
}

// ─── Skill ───
export interface SkillInfo {
  name: string;
  description: string;
  source: "plugin" | "user";
  sourcePlugin?: string;
  sourcePluginName?: string;
  filePath: string;
  directoryName: string;
}

// ─── Zod Schemas ───
export const GetMcpDetailsInput = z.object({
  serverName: z.string().describe("The name of the MCP server"),
});

export const ListSkillsInput = z.object({
  source: z.enum(["all", "plugin", "user"]).optional().default("all")
    .describe("Filter by source: 'plugin', 'user', or 'all'"),
});

export const GetSkillContentInput = z.object({
  name: z.string().describe("The skill name"),
  source: z.enum(["plugin", "user"]).optional()
    .describe("Disambiguate if same name exists in both sources"),
});

export const SearchSkillsInput = z.object({
  query: z.string().describe("Keyword to search in skill name, description, and content"),
  source: z.enum(["all", "plugin", "user"]).optional().default("all")
    .describe("Filter search to a specific source"),
});
