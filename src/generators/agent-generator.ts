import { z } from "zod";
import { AgentComponentSchema } from "../types.js";
import type { GeneratedFile } from "../types.js";
import { appendYamlField, escapeYamlString } from "../utils/yaml.js";

type AgentInput = z.infer<typeof AgentComponentSchema>;

export function generateAgent(agent: AgentInput): GeneratedFile {
  const frontmatterLines: string[] = ["---"];

  appendYamlField(frontmatterLines, "name", agent.name);
  appendYamlField(frontmatterLines, "description", agent.description);
  appendYamlField(frontmatterLines, "model", agent.model);
  appendYamlField(frontmatterLines, "color", agent.color);

  if (agent.tools && agent.tools.length > 0) {
    const toolsList = agent.tools
      .map((t) => `"${escapeYamlString(t)}"`)
      .join(", ");
    frontmatterLines.push(`tools: [${toolsList}]`);
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
