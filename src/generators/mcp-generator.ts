import { z } from "zod";
import { McpComponentSchema, McpToolSchema, ToolParameterSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";

type McpInput = z.infer<typeof McpComponentSchema>;
type McpTool = z.infer<typeof McpToolSchema>;
type ToolParam = z.infer<typeof ToolParameterSchema>;

function toSnakeCase(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").toLowerCase();
}

function toPascalCase(name: string): string {
  return name.split(/[-_]+/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ─── package.json ───

function generatePackageJson(pluginName: string): GeneratedFile {
  const pkg = {
    name: pluginName,
    version: "1.0.0",
    description: `MCP server for ${pluginName}`,
    type: "module",
    main: "dist/index.js",
    scripts: {
      build: "tsc",
      start: "node dist/index.js",
      dev: "tsc --watch",
    },
    dependencies: {
      "@modelcontextprotocol/sdk": "^1.12.1",
      zod: "^3.24.0",
    },
    devDependencies: {
      "@types/node": "^22.0.0",
      typescript: "^5.7.0",
    },
  };

  return {
    relativePath: "package.json",
    content: JSON.stringify(pkg, null, 2) + "\n",
  };
}

// ─── tsconfig.json ───

function generateTsconfig(): GeneratedFile {
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "Node16",
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      sourceMap: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"],
  };

  return {
    relativePath: "tsconfig.json",
    content: JSON.stringify(config, null, 2) + "\n",
  };
}

// ─── .mcp.json ───

function generateMcpJson(mcp: McpInput): GeneratedFile {
  const config: Record<string, unknown> = {};

  if (mcp.transport === "stdio") {
    config[mcp.serverName] = {
      command: "node",
      args: ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"],
    };
  } else {
    config[mcp.serverName] = {
      type: "http",
      url: "https://localhost:3000/mcp",
    };
  }

  return {
    relativePath: ".mcp.json",
    content: JSON.stringify({ mcpServers: config }, null, 2) + "\n",
  };
}

// ─── Zod type mapping ───

function zodType(param: ToolParam): string {
  switch (param.type) {
    case "string":
      return "z.string()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "enum":
      if (param.enumValues && param.enumValues.length > 0) {
        const values = param.enumValues.map((v) => `"${v}"`).join(", ");
        return `z.enum([${values}])`;
      }
      return "z.string()";
    default:
      return "z.string()";
  }
}

function zodField(param: ToolParam): string {
  let field = zodType(param);

  if (!param.required) {
    field += ".optional()";
  }

  if (param.defaultValue !== undefined) {
    let coerced: unknown = param.defaultValue;
    switch (param.type) {
      case "number":
        coerced = Number(param.defaultValue);
        break;
      case "boolean":
        coerced = param.defaultValue === "true" || param.defaultValue === "1";
        break;
    }
    field += `.default(${JSON.stringify(coerced)})`;
  }

  field += `.describe(${JSON.stringify(param.description)})`;
  return field;
}

// ─── src/types.ts ───

function generateTypesFile(tools: McpTool[]): GeneratedFile {
  const lines: string[] = ['import { z } from "zod";', ""];

  for (const tool of tools) {
    const schemaName = `${toPascalCase(tool.name)}Input`;
    if (!tool.parameters || tool.parameters.length === 0) {
      lines.push(`export const ${schemaName} = z.object({});`);
    } else {
      lines.push(`export const ${schemaName} = z.object({`);
      for (const param of tool.parameters) {
        lines.push(`  ${toCamelCase(param.name)}: ${zodField(param)},`);
      }
      lines.push("});");
    }
    lines.push("");
  }

  return {
    relativePath: "src/types.ts",
    content: lines.join("\n"),
  };
}

// ─── src/tools/<tool-name>.ts ───

function generateToolHandler(tool: McpTool): GeneratedFile {
  const snakeName = toSnakeCase(tool.name);
  const pascalName = toPascalCase(tool.name);
  const schemaName = `${pascalName}Input`;
  const handlerName = `handle${pascalName}`;
  const hasParams = tool.parameters && tool.parameters.length > 0;

  const lines: string[] = [];

  if (hasParams) {
    lines.push(`import { z } from "zod";`);
    lines.push(`import { ${schemaName} } from "../types.js";`);
    lines.push("");
    lines.push(`type ${pascalName}Params = z.infer<typeof ${schemaName}>;`);
    lines.push("");
    lines.push(`export async function ${handlerName}(params: ${pascalName}Params) {`);
  } else {
    lines.push(`export async function ${handlerName}() {`);
  }

  lines.push("  // TODO: Implement tool logic");
  lines.push(`  const result = { status: "ok", tool: "${snakeName}" };`);
  lines.push("");
  lines.push("  return {");
  lines.push('    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],');
  lines.push("  };");
  lines.push("}");
  lines.push("");

  return {
    relativePath: `src/tools/${snakeName}.ts`,
    content: lines.join("\n"),
  };
}

// ─── src/index.ts ───

function generateIndexFile(mcp: McpInput): GeneratedFile {
  const lines: string[] = [
    'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";',
    'import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";',
  ];

  // Import schemas and handlers
  for (const tool of mcp.tools) {
    const pascalName = toPascalCase(tool.name);
    const snakeName = toSnakeCase(tool.name);
    const hasParams = tool.parameters && tool.parameters.length > 0;

    if (hasParams) {
      lines.push(`import { ${pascalName}Input } from "./types.js";`);
    }
    lines.push(`import { handle${pascalName} } from "./tools/${snakeName}.js";`);
  }

  lines.push("");
  lines.push("const server = new McpServer({");
  lines.push(`  name: ${JSON.stringify(mcp.serverName)},`);
  lines.push('  version: "1.0.0",');
  lines.push("});");
  lines.push("");

  // Register tools
  for (const tool of mcp.tools) {
    const snakeName = toSnakeCase(tool.name);
    const pascalName = toPascalCase(tool.name);
    const hasParams = tool.parameters && tool.parameters.length > 0;

    lines.push("server.tool(");
    lines.push(`  ${JSON.stringify(snakeName)},`);
    lines.push(`  ${JSON.stringify(tool.description)},`);

    if (hasParams) {
      lines.push(`  ${pascalName}Input.shape,`);
      lines.push(`  async (params) => handle${pascalName}(params),`);
    } else {
      lines.push("  {},");
      lines.push(`  async () => handle${pascalName}(),`);
    }

    lines.push(");");
    lines.push("");
  }

  lines.push("const transport = new StdioServerTransport();");
  lines.push("await server.connect(transport);");
  lines.push("");

  return {
    relativePath: "src/index.ts",
    content: lines.join("\n"),
  };
}

// ─── Public API ───

export function generateMcpServer(pluginName: string, mcp: McpInput): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  files.push(generatePackageJson(pluginName));
  files.push(generateTsconfig());
  files.push(generateMcpJson(mcp));
  files.push(generateTypesFile(mcp.tools));
  files.push(generateIndexFile(mcp));

  for (const tool of mcp.tools) {
    files.push(generateToolHandler(tool));
  }

  return files;
}
