import * as vscode from "vscode";

/**
 * Kodo extension configuration settings
 */
export interface KodoConfig {
  /** Enable or disable Kodo tracking */
  enabled: boolean;
  /** API endpoint URL */
  apiEndpoint: string;
  /** Privacy mode: "normal" (full data) or "stealth" (no filenames) */
  privacyMode: "normal" | "stealth";
  /** Break reminder interval in minutes (0 to disable) */
  breakReminderMinutes: number;
  /** Session timeout in minutes (controls session boundaries AND coding time calculation) */
  sessionTimeoutMinutes: number;
  /** Enable anonymous usage analytics */
  enableTelemetry: boolean;
  /** Capture function/class names for AI summaries */
  captureSymbols: boolean;
  /** Track Git commits for session context */
  captureCommits: boolean;
}

const CONFIG_SECTION = "kodo";
const DEFAULT_API_ENDPOINT = "https://kodohq.app/api";

/**
 * Get the current Kodo configuration
 */
export const getConfig = (): KodoConfig => {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);

  return {
    enabled: config.get<boolean>("enabled", true),
    apiEndpoint: DEFAULT_API_ENDPOINT, // Hardcoded - not user-configurable
    privacyMode: config.get<"normal" | "stealth">("privacyMode", "normal"),
    breakReminderMinutes: config.get<number>("breakReminderMinutes", 90),
    sessionTimeoutMinutes: config.get<number>("sessionTimeoutMinutes", 15),
    enableTelemetry: config.get<boolean>("enableTelemetry", false),
    captureSymbols: config.get<boolean>("captureSymbols", false),
    captureCommits: config.get<boolean>("captureCommits", true),
  };
};

/**
 * Listen for configuration changes
 */
export const onConfigChange = (
  callback: (config: KodoConfig) => void,
): vscode.Disposable => {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(CONFIG_SECTION)) {
      callback(getConfig());
    }
  });
};

/**
 * Check if privacy mode is enabled (stealth mode)
 */
export const isPrivacyModeEnabled = (): boolean => {
  return getConfig().privacyMode === "stealth";
};

/**
 * Check if tracking is enabled
 */
export const isTrackingEnabled = (): boolean => {
  return getConfig().enabled;
};
