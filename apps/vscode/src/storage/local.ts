import type * as vscode from "vscode";

/**
 * Local storage wrapper using VS Code's globalState
 * Persists data across VS Code sessions
 */
export class LocalStorage {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Get a value from storage
   */
  get<T>(key: string, defaultValue: T): T {
    return this.context.globalState.get<T>(key, defaultValue);
  }

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    await this.context.globalState.update(key, undefined);
  }

  /**
   * Get all keys in storage
   */
  keys(): readonly string[] {
    return this.context.globalState.keys();
  }
}

/**
 * Create a LocalStorage instance
 */
export const createLocalStorage = (
  context: vscode.ExtensionContext,
): LocalStorage => {
  return new LocalStorage(context);
};
