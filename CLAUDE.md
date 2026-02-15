# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Canto

Canto is an MCP server that is also an MCP generator. A user tells the LLM what they need — a custom plugin, MCP server, skill, or any combination. The LLM queries Canto with those requirements in the format the server accepts. Canto scaffolds the files and premakes the structure so it works universally. The LLM then makes further queries to refine and tailor the output based on the user's specific request, and outputs the finished skill, MCP, or plugin to the desired location.

Generated MCPs will always need to be configured for the specific task, but the scaffolded structure is complete and functional.

The current codebase implements the **read/query side**: tools to inspect the user's installed plugin ecosystem so Canto understands existing conventions and structures. **The generation/scaffold tools are not yet implemented** — that is the core remaining work.

## Build & Run

```bash
npm run build        # tsc → dist/
npm run dev          # tsc --watch
npm start            # node dist/index.js (stdio transport)
```

No test framework or linter is configured.

## Architecture

MCP server using `@modelcontextprotocol/sdk` over stdio transport. Entry point: `src/index.ts`.

### Current tools (read/query)

| Tool              | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `list_plugins`    | List installed plugins with metadata                     |
| `list_mcps`       | List MCP servers from installed plugins                  |
| `get_mcp_details` | Full config for a specific MCP server                    |
| `list_skills`     | List skills from plugins and user-created                |
| `get_skill_content` | Full content of a skill by name                        |
| `search_skills`   | Keyword search across skill names, descriptions, content |

### Needed tools (generate/scaffold)

Tools that accept requirements and output working plugin/MCP/skill structures to the filesystem. MCPs will always need user configuration for their specific task but should be structurally complete.

### Source layout

```text
src/
├── index.ts              # Server setup, tool registration
├── types.ts              # All interfaces + Zod input schemas
├── readers/              # Filesystem data access
│   ├── plugin-reader.ts  # Reads ~/.claude/plugins/installed_plugins.json + plugin.json
│   ├── mcp-reader.ts     # Reads .mcp.json from plugin install paths
│   └── skill-reader.ts   # Reads skills/*/SKILL.md from plugins and ~/.claude/skills/
├── tools/                # Tool handlers (one per file)
│   ├── list-plugins.ts
│   ├── list-mcps.ts
│   ├── get-mcp-details.ts
│   ├── list-skills.ts
│   ├── get-skill-content.ts
│   └── search-skills.ts
└── utils/
    ├── paths.ts          # Canonical paths (~/.claude, ~/.claude/plugins, ~/.claude/skills)
    └── frontmatter.ts    # YAML frontmatter parser for SKILL.md files
```

### Data flow

Every read tool: **handler → `readInstalledPlugins()` → reader(s) → filter/format → JSON response**. No caching; filesystem read fresh each call.

### Key filesystem paths

- `~/.claude/plugins/installed_plugins.json` — plugin registry
- `<plugin-install-path>/.claude-plugin/plugin.json` — plugin metadata
- `<plugin-install-path>/.mcp.json` — plugin's MCP server configs
- `<plugin-install-path>/skills/*/SKILL.md` — plugin skills
- `~/.claude/skills/*/SKILL.md` — user-created skills

## Conventions

- ESM-only (`"type": "module"`). All local imports use `.js` extensions.
- TypeScript strict mode, target ES2022, Node16 module resolution.
- Tool handlers are pure async functions, one per file in `src/tools/`.
- Zod schemas for tool inputs live in `src/types.ts`; `.shape` passed to `server.tool()`.
- Raw interfaces for internal data structures; Zod only at the tool boundary.
