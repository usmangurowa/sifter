import * as vscode from "vscode";

/**
 * Heartbeat represents a single coding activity event
 */
export interface Heartbeat {
  /** Timestamp of the activity */
  timestamp: Date;
  /** File path (null in stealth/privacy mode) */
  file: string | null;
  /** Project name extracted from git or folder */
  project: string;
  /** Programming language ID */
  language: string;
  /** Git branch name (if available) */
  branch: string | null;
  /** Editor identifier (e.g., "vscode", "cursor", "antigravity") */
  editor: string;
  /** Operating system */
  os: "macos" | "windows" | "linux";
  /** Whether this was a write event (typing) vs read (viewing) */
  isWrite: boolean;
  /** Symbol name at cursor (opt-in, e.g., "handleLogin") */
  symbolName?: string;
  /** Symbol kind (e.g., "function", "class", "method") */
  symbolKind?: string;
}

/**
 * Heartbeat ready to be sent to the API
 */
export interface HeartbeatPayload {
  heartbeats: (Omit<Heartbeat, "timestamp"> & { timestamp: string })[];
}

/**
 * Get the current operating system type
 */
export const getOS = (): Heartbeat["os"] => {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    default:
      return "linux";
  }
};

/**
 * Get the editor name (VS Code, Cursor, Antigravity, etc.)
 */
export const getEditorName = (): string => {
  const appName = vscode.env.appName.toLowerCase();

  // Detect known VS Code forks
  if (appName.includes("cursor")) {
    return "cursor";
  }
  if (appName.includes("antigravity")) {
    return "antigravity";
  }
  if (appName.includes("windsurf")) {
    return "windsurf";
  }
  if (appName.includes("vscodium")) {
    return "vscodium";
  }
  if (appName.includes("code - insiders")) {
    return "vscode-insiders";
  }
  if (appName.includes("visual studio code") || appName.includes("code")) {
    return "vscode";
  }

  // Fallback to the raw app name (normalized)
  return appName.replace(/\s+/g, "-").toLowerCase();
};
