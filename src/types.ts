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
  url?: string;
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

// ─── Generated File ───
export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export interface ScaffoldResult {
  pluginPath: string;
  files: GeneratedFile[];
}

// ─── Conflict ───
export interface ConflictEntry {
  type: "plugin" | "mcp-server" | "skill" | "output-path";
  name: string;
  detail: string;
}

// ─── Scaffold Plugin Input ───
const BaseToolParameterSchema = z.object({
  name: z.string().describe("Parameter name"),
  description: z.string().describe("What this parameter does"),
  required: z.boolean().default(true).describe("Whether this parameter is required"),
});

const StringToolParameterSchema = BaseToolParameterSchema.extend({
  type: z.literal("string").describe("Parameter type"),
  defaultValue: z.string().optional().describe("Default value"),
});

const NumberToolParameterSchema = BaseToolParameterSchema.extend({
  type: z.literal("number").describe("Parameter type"),
  defaultValue: z.number().optional().describe("Default value"),
});

const BooleanToolParameterSchema = BaseToolParameterSchema.extend({
  type: z.literal("boolean").describe("Parameter type"),
  defaultValue: z.boolean().optional().describe("Default value"),
});

const EnumToolParameterSchema = BaseToolParameterSchema.extend({
  type: z.literal("enum").describe("Parameter type"),
  enumValues: z.array(z.string()).describe("Allowed values if type is enum"),
  defaultValue: z.string().optional().describe("Default value (must be one of enumValues)"),
});

const ToolParameterSchema = z.discriminatedUnion("type", [
  StringToolParameterSchema,
  NumberToolParameterSchema,
  BooleanToolParameterSchema,
  EnumToolParameterSchema,
]);

const McpToolSchema = z.object({
  name: z.string().describe("Tool name (snake_case)"),
  description: z.string().describe("What the tool does"),
  parameters: z.array(ToolParameterSchema).optional().describe("Tool input parameters"),
});

const McpComponentSchema = z.object({
  serverName: z.string().describe("MCP server name"),
  tools: z.array(McpToolSchema).min(1).describe("Tools the MCP server exposes"),
  transport: z.enum(["stdio", "http"]).default("stdio").describe("Transport type"),
});

const SkillComponentSchema = z.object({
  name: z.string().describe("Skill name (kebab-case)"),
  description: z.string().describe("When/why to use this skill — should start with 'This skill should be used when...'"),
  version: z.string().default("0.1.0").describe("Semantic version (MAJOR.MINOR.PATCH)"),
  content: z.string().describe("Skill body content (markdown)"),
});

const CommandComponentSchema = z.object({
  name: z.string().describe("Command name (kebab-case)"),
  description: z.string().describe("What the command does — shown in /help"),
  argumentHint: z.string().optional().describe("Expected arguments hint e.g. '<pr-number>'"),
  allowedTools: z.array(z.string()).optional().describe("Tools the command can use e.g. ['Read', 'Grep', 'Bash']"),
  model: z.enum(["sonnet", "opus", "haiku"]).optional().describe("Model override"),
  disableModelInvocation: z.boolean().optional().describe("If true, command is template only — no LLM invocation"),
  body: z.string().describe("Command instructions FOR Claude (markdown) — not messages to user"),
});

const AgentComponentSchema = z.object({
  name: z.string().describe("Agent name (kebab-case, 3-50 chars, alphanumeric start/end)"),
  description: z.string().describe("When to invoke — must include 'Use this agent when...' and <example> blocks"),
  model: z.enum(["inherit", "sonnet", "opus", "haiku"]).default("inherit").describe("Model to use"),
  color: z.enum(["blue", "cyan", "green", "yellow", "magenta", "red"]).default("blue").describe("UI color"),
  tools: z.array(z.string()).optional().describe("Available tools — omit for full access"),
  systemPrompt: z.string().describe("Agent system prompt (markdown) — write in second person: 'You are...'"),
});

const HookEntrySchema = z.object({
  matcher: z.string().optional().describe("Regex or pipe-separated tool names — omit to match all"),
  type: z.enum(["command", "prompt"]).default("command").describe("Hook type: command (shell script) or prompt (LLM evaluation)"),
  command: z.string().optional().describe("Shell command to run (for type: command)"),
  prompt: z.string().optional().describe("LLM evaluation prompt (for type: prompt)"),
  timeout: z.number().default(60).describe("Timeout in seconds"),
  async: z.boolean().optional().describe("Run hook asynchronously"),
});

const HooksComponentSchema = z.object({
  sessionStart: z.array(HookEntrySchema).optional(),
  sessionEnd: z.array(HookEntrySchema).optional(),
  preToolUse: z.array(HookEntrySchema).optional(),
  postToolUse: z.array(HookEntrySchema).optional(),
  stop: z.array(HookEntrySchema).optional(),
  subagentStop: z.array(HookEntrySchema).optional(),
  userPromptSubmit: z.array(HookEntrySchema).optional(),
  preCompact: z.array(HookEntrySchema).optional(),
  notification: z.array(HookEntrySchema).optional(),
});

const ComponentsSchema = z.object({
  mcp: McpComponentSchema.optional().describe("Generate an MCP server"),
  skills: z.array(SkillComponentSchema).optional().describe("Generate skill files"),
  commands: z.array(CommandComponentSchema).optional().describe("Generate slash commands"),
  agents: z.array(AgentComponentSchema).optional().describe("Generate agent definitions"),
  hooks: HooksComponentSchema.optional().describe("Generate lifecycle hooks"),
});

export const ScaffoldPluginInput = z.object({
  name: z.string().describe("Plugin name (kebab-case)"),
  description: z.string().describe("What this plugin does"),
  author: z.object({
    name: z.string(),
    email: z.string().optional(),
    url: z.string().optional(),
  }).optional().describe("Plugin author"),
  outputPath: z.string().describe("Where to write the plugin (absolute path)"),
  writeToDisk: z.boolean().default(true).describe("Write files to disk (true) or return as JSON (false)"),
  components: ComponentsSchema,
});

// Re-export sub-schemas for generators
export {
  McpComponentSchema,
  McpToolSchema,
  ToolParameterSchema,
  SkillComponentSchema,
  CommandComponentSchema,
  AgentComponentSchema,
  HooksComponentSchema,
  HookEntrySchema,
  ComponentsSchema,
};
