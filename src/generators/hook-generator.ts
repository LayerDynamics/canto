import { z } from "zod";
import { HooksComponentSchema, HookEntrySchema } from "../types.js";
import type { GeneratedFile } from "../types.js";

type HooksInput = z.infer<typeof HooksComponentSchema>;
type HookEntry = z.infer<typeof HookEntrySchema>;

interface HookJsonInnerEntry {
  type: "command" | "prompt";
  command?: string;
  prompt?: string;
  timeout: number;
  async?: boolean;
}

interface HookJsonEntry {
  matcher?: string;
  hooks: HookJsonInnerEntry[];
}

// Map from camelCase schema keys to PascalCase Claude Code event names
const EVENT_MAP: Record<string, string> = {
  sessionStart: "SessionStart",
  sessionEnd: "SessionEnd",
  preToolUse: "PreToolUse",
  postToolUse: "PostToolUse",
  stop: "Stop",
  subagentStop: "SubagentStop",
  userPromptSubmit: "UserPromptSubmit",
  preCompact: "PreCompact",
  notification: "Notification",
};

function toScriptName(input: string): string {
  if (input.endsWith(".sh") || input.endsWith(".py")) return input;
  return input.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-") + ".sh";
}

function buildHookEntry(entry: HookEntry): HookJsonEntry {
  const inner: HookJsonInnerEntry = {
    type: entry.type,
    timeout: entry.timeout,
  };

  if (entry.type === "command") {
    const scriptName = toScriptName(entry.command ?? "hook");
    inner.command = `\${CLAUDE_PLUGIN_ROOT}/hooks/${scriptName}`;
  } else {
    inner.prompt = entry.prompt ?? "";
  }

  if (entry.async !== undefined) {
    inner.async = entry.async;
  }

  const result: HookJsonEntry = { hooks: [inner] };
  if (entry.matcher) {
    result.matcher = entry.matcher;
  }

  return result;
}

export function generateHooks(hooks: HooksInput): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const hooksJson: Record<string, HookJsonEntry[]> = {};
  const scriptNames = new Set<string>();

  for (const [key, eventName] of Object.entries(EVENT_MAP)) {
    const entries = hooks[key as keyof HooksInput];
    if (!entries || entries.length === 0) continue;

    hooksJson[eventName] = entries.map(buildHookEntry);

    // Collect script names for command-type hooks
    for (const entry of entries) {
      if (entry.type === "command" && entry.command) {
        scriptNames.add(toScriptName(entry.command));
      }
    }
  }

  files.push({
    relativePath: "hooks/hooks.json",
    content: JSON.stringify({ hooks: hooksJson }, null, 2) + "\n",
  });

  // Generate stub shell scripts for command hooks
  for (const scriptName of scriptNames) {
    files.push({
      relativePath: `hooks/${scriptName}`,
      content: [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "",
        "# Hook receives JSON on stdin with session context",
        "# Output JSON to stdout for hook response",
        "# Exit 0 = success, Exit 2 = blocking error",
        "",
        "# TODO: Implement hook logic",
        `echo '{"continue": true}'`,
        "",
      ].join("\n"),
    });
  }

  return files;
}
