import { homedir } from "os";
import { join } from "path";

export const HOME = homedir();
export const CLAUDE_DIR = join(HOME, ".claude");
export const PLUGINS_DIR = join(CLAUDE_DIR, "plugins");
export const PLUGINS_REGISTRY_PATH = join(PLUGINS_DIR, "installed_plugins.json");
export const USER_SKILLS_DIR = join(CLAUDE_DIR, "skills");
