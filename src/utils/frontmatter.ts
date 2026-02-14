export interface ParsedSkillMd {
  name: string | null;
  description: string | null;
  body: string;
}

export function parseFrontmatter(content: string, directoryName: string): ParsedSkillMd {
  const trimmed = content.trimStart();

  // Check for YAML frontmatter delimiters
  if (trimmed.startsWith("---")) {
    const endIndex = trimmed.indexOf("---", 3);
    if (endIndex !== -1) {
      const frontmatter = trimmed.slice(3, endIndex).trim();
      const body = trimmed.slice(endIndex + 3).trim();

      let name: string | null = null;
      let description: string | null = null;

      for (const line of frontmatter.split("\n")) {
        const nameMatch = line.match(/^name:\s*(.+)/);
        if (nameMatch) name = nameMatch[1].trim().replace(/^["']|["']$/g, "");

        const descMatch = line.match(/^description:\s*(.+)/);
        if (descMatch) description = descMatch[1].trim().replace(/^["']|["']$/g, "");
      }

      return { name: name ?? directoryName, description, body };
    }
  }

  // No frontmatter - derive from content
  const lines = content.split("\n").filter((l) => l.trim());
  let description: string | null = null;

  for (const line of lines) {
    const heading = line.match(/^#+\s+(.+)/);
    if (heading) {
      description = heading[1].trim();
      break;
    }
    if (line.trim() && !line.startsWith("#")) {
      description = line.trim();
      break;
    }
  }

  return { name: directoryName, description, body: content };
}
