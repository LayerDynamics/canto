# Canto: Missing Generation Functionality Design

## Context

Canto is an MCP server that generates other MCP servers, Claude Code plugins, and skills. The read/query tools exist (list_plugins, list_mcps, list_skills, etc.) but the core generation tools are missing. The user needs a single `scaffold_plugin` tool that accepts requirements and outputs a working, universal plugin structure — with any combination of components (MCP server, skills, commands, agents, hooks).

## Design Decisions

- **Output mode**: Configurable — write to filesystem OR return as JSON response
- **Generator style**: Single all-in-one tool (not individual per-component tools)
- **MCP stack**: TypeScript only (MCP SDK + stdio transport)
- **Conflict resolution**: Fail with error on name collisions — never overwrite
- **Pre-checks**: Always query the installed ecosystem before generating to detect conflicts

---

## Missing Functionality

### 1. New Tool: `scaffold_plugin`

Accept a structured description of what to generate and output a complete, working plugin.

**Input schema**:

```typescript
ScaffoldPluginInput = z.object({
  name: z.string().describe("Plugin name (kebab-case)"),
  description: z.string().describe("What this plugin does"),
  author: z.object({
    name: z.string(),
    email: z.string().optional(),
  }).optional(),
  outputPath: z.string().describe("Where to write the plugin (absolute path)"),
  writeToDisk: z.boolean().default(true).describe("Write files to disk or return as JSON"),

  components: z.object({
    mcp: z.object({
      serverName: z.string().describe("MCP server name"),
      tools: z.array(z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.array(z.object({
          name: z.string(),
          type: z.enum(["string", "number", "boolean", "enum"]),
          description: z.string(),
          required: z.boolean().default(true),
          enumValues: z.array(z.string()).optional(),
          default: z.string().optional(),
        })).optional(),
      })).min(1),
      transport: z.enum(["stdio", "http"]).default("stdio"),
    }).optional().describe("Generate an MCP server"),

    skills: z.array(z.object({
      name: z.string(),
      description: z.string(),
      content: z.string().describe("Skill body content (markdown)"),
    })).optional().describe("Generate skill files"),

    commands: z.array(z.object({
      name: z.string(),
      description: z.string(),
      argumentHint: z.string().optional(),
      allowedTools: z.array(z.string()).optional(),
      body: z.string().describe("Command instructions (markdown)"),
    })).optional().describe("Generate slash commands"),

    agents: z.array(z.object({
      name: z.string(),
      description: z.string(),
      tools: z.array(z.string()).optional(),
      color: z.string().optional(),
      systemPrompt: z.string().describe("Agent system prompt (markdown)"),
    })).optional().describe("Generate agent definitions"),

    hooks: z.object({
      sessionStart: z.array(z.object({
        matcher: z.string(),
        command: z.string(),
        timeout: z.number().default(5),
      })).optional(),
      preToolUse: z.array(z.object({
        matcher: z.string(),
        command: z.string(),
        timeout: z.number().default(5),
      })).optional(),
      postToolUse: z.array(z.object({
        matcher: z.string(),
        command: z.string(),
        timeout: z.number().default(5),
      })).optional(),
    }).optional().describe("Generate lifecycle hooks"),
  }),
});
```

**Generated output structure**:

```text
<outputPath>/<name>/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json                    (if components.mcp)
├── package.json                 (if components.mcp)
├── tsconfig.json                (if components.mcp)
├── src/
│   ├── index.ts                 (if components.mcp)
│   ├── types.ts                 (if components.mcp)
│   └── tools/
│       └── <tool-name>.ts       (if components.mcp, one per tool)
├── skills/
│   └── <skill-name>/
│       └── SKILL.md             (if components.skills)
├── commands/
│   └── <command-name>.md        (if components.commands)
├── agents/
│   └── <agent-name>.md          (if components.agents)
└── hooks/
    ├── hooks.json               (if components.hooks)
    └── <hook-scripts>.sh        (if components.hooks)
```

### 2. New Source Layer: `src/generators/`

Mirrors the `src/readers/` pattern. Each generator produces file content from structured input:

- **`plugin-generator.ts`** — Generates `.claude-plugin/plugin.json` manifest
- **`mcp-generator.ts`** — Generates full MCP server: `package.json`, `tsconfig.json`, `src/index.ts` (with McpServer setup + tool registrations), `src/types.ts` (Zod schemas from parameter defs), `src/tools/*.ts` (handler stubs), `.mcp.json`
- **`skill-generator.ts`** — Generates `skills/<name>/SKILL.md` with frontmatter + content
- **`command-generator.ts`** — Generates `commands/<name>.md` with YAML frontmatter + body
- **`agent-generator.ts`** — Generates `agents/<name>.md` with YAML frontmatter + system prompt
- **`hook-generator.ts`** — Generates `hooks/hooks.json` + shell script stubs

### 3. New Utility: `src/utils/writer.ts`

Handles the configurable output mode:

- `writeToDisk: true` — creates directories, writes files
- `writeToDisk: false` — returns `{ files: [{ path, content }] }` as JSON

### 4. New Types in `src/types.ts`

- `ScaffoldPluginInput` — Zod schema (above)
- `GeneratedFile` — `{ relativePath: string; content: string }`
- `ScaffoldResult` — `{ pluginPath: string; files: GeneratedFile[] }`
- Per-generator input interfaces

### 5. New Utility: `src/utils/conflict-checker.ts`

Pre-generation conflict detection. Reuses the existing readers internally:

- **Plugin name**: Calls `readInstalledPlugins()` — checks if any `ResolvedPlugin.name` matches
- **MCP server name**: Calls `readMcpServers()` — checks if any `McpServerConfig.serverName` matches
- **Skill name**: Calls `readAllSkills()` — checks if any `SkillInfo.name` matches
- **Output path**: Checks if `<outputPath>/<name>/` already exists on disk

Returns a list of conflicts. If any exist, the tool returns an error response describing each collision (what exists, where it lives) so the LLM can rename or ask the user.

### 6. New Tool Handler: `src/tools/scaffold-plugin.ts`

Orchestrates the generators:

1. Parse input
2. **Run conflict checks** — fail with descriptive error if any collisions found
3. Always generate plugin.json manifest
4. Conditionally call each generator based on which components are present
5. Collect all `GeneratedFile[]`
6. Either write to disk or return as JSON based on `writeToDisk`

---

## Files to Create

| File                                 | Purpose                                                  |
| ------------------------------------ | -------------------------------------------------------- |
| `src/tools/scaffold-plugin.ts`       | Tool handler for scaffold_plugin                         |
| `src/generators/plugin-generator.ts` | Generates plugin.json manifest                           |
| `src/generators/mcp-generator.ts`    | Generates full MCP server scaffold                       |
| `src/generators/skill-generator.ts`  | Generates SKILL.md files                                 |
| `src/generators/command-generator.ts` | Generates command .md files                             |
| `src/generators/agent-generator.ts`  | Generates agent .md files                                |
| `src/generators/hook-generator.ts`   | Generates hooks.json + scripts                           |
| `src/utils/writer.ts`               | Configurable file writer (disk or JSON)                  |
| `src/utils/conflict-checker.ts`     | Pre-generation collision detection using existing readers |

## Files to Modify

| File            | Change                                                           |
| --------------- | ---------------------------------------------------------------- |
| `src/index.ts`  | Register `scaffold_plugin` tool                                  |
| `src/types.ts`  | Add `ScaffoldPluginInput`, `GeneratedFile`, `ScaffoldResult` types |

---

## Verification

1. `npm run build` — compiles without errors
2. Start the server: `npm start`
3. Test with a minimal plugin (just a skill):
   ```json
   { "name": "test-plugin", "description": "Test", "outputPath": "/tmp", "components": { "skills": [{ "name": "my-skill", "description": "A test skill", "content": "# Test\nDo the thing." }] } }
   ```
4. Verify generated files exist at `/tmp/test-plugin/` with correct structure
5. Test with `writeToDisk: false` and verify JSON response contains all files
6. Test full plugin with MCP server + skills + commands — verify generated MCP server compiles with `cd /tmp/test-plugin && npm install && npm run build`
