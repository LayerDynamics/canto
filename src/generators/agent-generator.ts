import { z } from "zod";
import { AgentComponentSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";

type AgentInput = z.infer<typeof AgentComponentSchema>;

export function generateAgent(agent: AgentInput): GeneratedFile {
  const frontmatterLines = [
    "---",
    `name: ${agent.name}`,
    `description: ${agent.description}`,
    `model: ${agent.model}`,
    `color: ${agent.color}`,
  ];

  if (agent.tools && agent.tools.length > 0) {
    frontmatterLines.push(`tools: [${agent.tools.map((t) => `"${t}"`).join(", ")}]`);
  }

  frontmatterLines.push("---");

  const content = `${frontmatterLines.join("\n")}\n\n${agent.systemPrompt}\n`;

  return {
    relativePath: `agents/${agent.name}.md`,
    content,
  };
}

export function generateAgents(agents: AgentInput[]): GeneratedFile[] {
  return agents.map(generateAgent);
}
