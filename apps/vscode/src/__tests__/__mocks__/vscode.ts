/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Mock for VS Code API
 *
 * This provides minimal implementations of VS Code APIs used in our extension
 * so we can run unit tests without a real VS Code environment.
 */

// Mock workspace configuration
const mockConfig: Record<string, unknown> = {
  enabled: true,
  apiEndpoint: "https://kodohq.app/api",
  privacyMode: "normal",
  breakReminderMinutes: 90,
  sessionTimeoutMinutes: 30,
  enableTelemetry: false,
};

// Event listener storage
type EventCallback<T = void> = (arg: T) => void;
const eventListeners: Record<string, EventCallback<unknown>[]> = {};

// Mock active text editor
let mockActiveTextEditor: MockTextEditor | undefined;

interface MockTextEditor {
  document: MockTextDocument;
  selection: {
    active: { line: number; character: number };
  };
}

interface MockTextDocument {
  uri: MockUri;
  languageId: string;
  lineCount: number;
  isUntitled: boolean;
  fileName: string;
}

interface MockUri {
  fsPath: string;
  scheme: string;
  path: string;
  toString: () => string;
}

// Helper to create mock events
const createMockEventEmitter = <T>(eventName: string) => {
  return (callback: EventCallback<T>) => {
    eventListeners[eventName] ??= [];
    eventListeners[eventName].push(callback as EventCallback<unknown>);
    return { dispose: () => {} };
  };
};

export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: <T>(key: string, defaultValue: T): T => {
      const value = mockConfig[key];
      return (value !== undefined ? value : defaultValue) as T;
    },
    has: (key: string): boolean => key in mockConfig,
    update: () => Promise.resolve(),
  }),
  getWorkspaceFolder: (uri?: MockUri) => {
    if (!uri) return undefined;
    return {
      uri: { fsPath: "/mock/workspace" },
      name: "mock-workspace",
      index: 0,
    };
  },
  onDidChangeConfiguration: createMockEventEmitter("configChange"),
  onDidChangeTextDocument: createMockEventEmitter("textDocChange"),
  onDidOpenTextDocument: createMockEventEmitter("textDocOpen"),
  onDidSaveTextDocument: createMockEventEmitter("textDocSave"),
  onDidChangeNotebookDocument: createMockEventEmitter("notebookChange"),
  onDidSaveNotebookDocument: createMockEventEmitter("notebookSave"),
};

export const window = {
  get activeTextEditor() {
    return mockActiveTextEditor;
  },
  onDidChangeActiveTextEditor: createMockEventEmitter("activeEditorChange"),
  onDidChangeTextEditorSelection: createMockEventEmitter("selectionChange"),
  onDidChangeTextEditorVisibleRanges: createMockEventEmitter(
    "visibleRangesChange",
  ),
  tabGroups: {
    onDidChangeTabs: createMockEventEmitter("tabChange"),
  },
  showInformationMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showInputBox: async () => undefined,
};

export const debug = {
  onDidStartDebugSession: createMockEventEmitter("debugStart"),
  onDidTerminateDebugSession: createMockEventEmitter("debugEnd"),
  onDidChangeActiveDebugSession: createMockEventEmitter("debugActive"),
  onDidChangeBreakpoints: createMockEventEmitter("breakpointChange"),
};

export const env = {
  appName: "Visual Studio Code",
  language: "en",
};

export const tasks = {
  onDidStartTask: createMockEventEmitter("taskStart"),
  onDidEndTask: createMockEventEmitter("taskEnd"),
};

export const commands = {
  executeCommand: async <T>(
    _command: string,
    ..._args: unknown[]
  ): Promise<T | undefined> => {
    // Default implementation returns undefined
    // Tests should mock this with vi.spyOn
    return undefined as T;
  },
};

// VS Code SymbolKind enum
export const SymbolKind = {
  File: 0,
  Module: 1,
  Namespace: 2,
  Package: 3,
  Class: 4,
  Method: 5,
  Property: 6,
  Field: 7,
  Constructor: 8,
  Enum: 9,
  Interface: 10,
  Function: 11,
  Variable: 12,
  Constant: 13,
  String: 14,
  Number: 15,
  Boolean: 16,
  Array: 17,
  Object: 18,
  Key: 19,
  Null: 20,
  EnumMember: 21,
  Struct: 22,
  Event: 23,
  Operator: 24,
  TypeParameter: 25,
};

export const Uri = {
  file: (path: string): MockUri => ({
    fsPath: path,
    scheme: "file",
    path,
    toString: () => `file://${path}`,
  }),
};

export class Disposable {
  static from(...disposables: { dispose: () => void }[]): Disposable {
    return {
      dispose: () => {
        for (const d of disposables) {
          d.dispose();
        }
      },
    } as Disposable;
  }

  dispose(): void {}
}

// =============================================================================
// Test Helpers
// =============================================================================

/** Update mock config for tests */
export const __setMockConfig = (key: string, value: unknown): void => {
  mockConfig[key] = value;
};

/** Reset mock config to defaults */
export const __resetMockConfig = (): void => {
  mockConfig.enabled = true;
  mockConfig.apiEndpoint = "https://kodohq.app/api";
  mockConfig.privacyMode = "normal";
  mockConfig.breakReminderMinutes = 90;
  mockConfig.sessionTimeoutMinutes = 30;
  mockConfig.enableTelemetry = false;
};

/** Set the mock active text editor */
export const __setActiveTextEditor = (
  editor: MockTextEditor | undefined,
): void => {
  mockActiveTextEditor = editor;
};

/** Trigger an event for testing */
export const __triggerEvent = <T>(eventName: string, arg: T): void => {
  const listeners = eventListeners[eventName] ?? [];
  for (const listener of listeners) {
    listener(arg);
  }
};

/** Clear all event listeners */
export const __clearEventListeners = (): void => {
  for (const key of Object.keys(eventListeners)) {
    delete eventListeners[key];
  }
};

/** Create a mock text document */
export const __createMockDocument = (
  path = "/mock/workspace/test/file.ts",
  options: Partial<MockTextDocument> = {},
): MockTextDocument => ({
  uri: Uri.file(path),
  languageId: "typescript",
  lineCount: 100,
  isUntitled: false,
  fileName: path,
  ...options,
});

/** Create a mock text editor */
export const __createMockEditor = (
  document?: MockTextDocument,
  line = 10,
  character = 5,
): MockTextEditor => ({
  document: document ?? __createMockDocument(),
  selection: {
    active: { line, character },
  },
});

/** Reset all mocks */
export const __resetAllMocks = (): void => {
  __resetMockConfig();
  __clearEventListeners();
  mockActiveTextEditor = undefined;
};
