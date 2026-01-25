import * as vscode from "vscode";

import { ANALYTICS_EVENTS } from "@turbo/analytics/events";

import { trackEvent } from "../telemetry";

const API_KEY_SECRET_KEY = "kodo.apiKey";

/**
 * Auth manager for handling API key storage and retrieval
 * Uses VS Code's SecretStorage for secure credential storage
 */
export class AuthManager {
  constructor(private readonly secretStorage: vscode.SecretStorage) {}

  /**
   * Get the stored API key
   */
  async getApiKey(): Promise<string | undefined> {
    return this.secretStorage.get(API_KEY_SECRET_KEY);
  }

  /**
   * Store the API key securely
   */
  async setApiKey(apiKey: string): Promise<void> {
    await this.secretStorage.store(API_KEY_SECRET_KEY, apiKey);
  }

  /**
   * Clear the stored API key
   */
  async clearApiKey(): Promise<void> {
    await this.secretStorage.delete(API_KEY_SECRET_KEY);
  }

  /**
   * Check if an API key is stored
   */
  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key;
  }
}

/**
 * Create an AuthManager instance
 */
export const createAuthManager = (
  context: vscode.ExtensionContext,
): AuthManager => {
  return new AuthManager(context.secrets);
};

/**
 * Command to prompt user for API key
 */
export const promptForApiKey = async (
  authManager: AuthManager,
): Promise<boolean> => {
  const apiKey = await vscode.window.showInputBox({
    prompt: "Enter your Kodo API key",
    placeHolder: "kodo...",
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => {
      if (!value.startsWith("kodo")) {
        return "API key must start with 'kodo'";
      }
      return null;
    },
  });

  if (apiKey) {
    await authManager.setApiKey(apiKey);
    trackEvent(ANALYTICS_EVENTS.EXTENSION_API_KEY_SET);
    vscode.window.showInformationMessage("Kodo: API key saved successfully!");
    return true;
  }

  return false;
};
