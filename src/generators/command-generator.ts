import { z } from "zod";
import { CommandComponentSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";

type CommandInput = z.infer<typeof CommandComponentSchema>;

export function generateCommand(command: CommandInput): GeneratedFile {
  const frontmatterLines = [
    "---",
    `description: ${command.description}`,
  ];

  if (command.argumentHint) {
    frontmatterLines.push(`argument-hint: ${command.argumentHint}`);
  }

  if (command.allowedTools && command.allowedTools.length > 0) {
    frontmatterLines.push(`allowed-tools: [${command.allowedTools.join(", ")}]`);
  }

  if (command.model) {
    frontmatterLines.push(`model: ${command.model}`);
  }

  if (command.disableModelInvocation) {
    frontmatterLines.push(`disable-model-invocation: true`);
  }

  frontmatterLines.push("---");

  const content = `${frontmatterLines.join("\n")}\n\n${command.body}\n`;

  return {
    relativePath: `commands/${command.name}.md`,
    content,
  };
}

export function generateCommands(commands: CommandInput[]): GeneratedFile[] {
  return commands.map(generateCommand);
}
