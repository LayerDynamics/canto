/**
 * Safe YAML frontmatter serialization helpers.
 *
 * These produce double-quoted scalars for values that contain YAML-significant
 * characters, and block scalars for multi-line values.
 */

const NEEDS_QUOTING = /[:{}\[\],&*?|>!%#@`"'\n\r]/;

export function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Format a scalar value for use in YAML frontmatter.
 * - Multi-line strings use block scalar (`|-`)
 * - Strings containing YAML-significant chars are double-quoted
 * - Simple strings are emitted bare
 */
export function formatYamlValue(value: string): string {
  if (value.includes("\n")) {
    const indented = value
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    return `|-\n${indented}`;
  }

  if (NEEDS_QUOTING.test(value)) {
    return `"${escapeYamlString(value)}"`;
  }

  return value;
}

/**
 * Append a `key: value` line to a frontmatter line array, with safe escaping.
 */
export function appendYamlField(
  lines: string[],
  key: string,
  value: string | undefined | null,
): void {
  if (value == null) return;
  lines.push(`${key}: ${formatYamlValue(value)}`);
}
