/**
 * Symbol Module Tests
 *
 * Tests for symbol detection logic including:
 * - getSymbolAtCursor function
 * - isSymbolCaptureEnabled configuration
 * - Symbol name truncation for deeply nested symbols
 * - Edge cases (no symbols, unsupported files, nested symbols)
 */

import type * as vscode from "vscode";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSymbolAtCursor, isSymbolCaptureEnabled } from "../tracker/symbol";
import { __resetAllMocks, __setMockConfig } from "./__mocks__/vscode";

// Mock vscode module
vi.mock("vscode", () => import("./__mocks__/vscode"));

// =============================================================================
// Mock Helpers
// =============================================================================

// VS Code SymbolKind enum values
const SymbolKind = {
  Function: 11,
  Method: 5,
  Class: 4,
  Interface: 10,
  Constructor: 8,
  Property: 6,
  Variable: 12,
  Constant: 13,
  Enum: 9,
  Module: 1,
  Namespace: 2,
  TypeParameter: 25,
  Unknown: 99,
};

interface MockRange {
  contains: (position: MockPosition) => boolean;
}

interface MockPosition {
  line: number;
  character: number;
}

interface MockDocumentSymbol {
  name: string;
  kind: number;
  range: MockRange;
  children: MockDocumentSymbol[];
}

interface MockDocument {
  uri: { fsPath: string; scheme: string };
}

const createMockRange = (startLine: number, endLine: number): MockRange => ({
  contains: (pos: MockPosition) => pos.line >= startLine && pos.line <= endLine,
});

const createMockSymbol = (
  name: string,
  kind: number,
  startLine: number,
  endLine: number,
  children: MockDocumentSymbol[] = [],
): MockDocumentSymbol => ({
  name,
  kind,
  range: createMockRange(startLine, endLine),
  children,
});

const createMockDocument = (): MockDocument => ({
  uri: { fsPath: "/test/file.ts", scheme: "file" },
});

const createMockPosition = (line: number, character = 0): MockPosition => ({
  line,
  character,
});

// Type cast helpers to satisfy the function signatures
const asDocument = (doc: MockDocument): vscode.TextDocument =>
  doc as unknown as vscode.TextDocument;

const asPosition = (pos: MockPosition): vscode.Position =>
  pos as unknown as vscode.Position;

// =============================================================================
// Tests
// =============================================================================

describe("Symbol Module", () => {
  beforeEach(() => {
    __resetAllMocks();
    vi.clearAllMocks();
  });

  // ===========================================================================
  // isSymbolCaptureEnabled
  // ===========================================================================

  describe("isSymbolCaptureEnabled", () => {
    it("should return false by default", () => {
      __setMockConfig("captureSymbols", false);
      expect(isSymbolCaptureEnabled()).toBe(false);
    });

    it("should return true when enabled in settings", () => {
      __setMockConfig("captureSymbols", true);
      expect(isSymbolCaptureEnabled()).toBe(true);
    });
  });

  // ===========================================================================
  // getSymbolAtCursor
  // ===========================================================================

  describe("getSymbolAtCursor", () => {
    it("should return null when no symbols found", async () => {
      // Mock executeCommand to return empty array
      const vscode = await import("./__mocks__/vscode");
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue([]);

      const doc = createMockDocument();
      const pos = createMockPosition(5);

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toBeNull();
    });

    it("should return null when symbol provider returns null", async () => {
      const vscode = await import("./__mocks__/vscode");
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(null);

      const doc = createMockDocument();
      const pos = createMockPosition(5);

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toBeNull();
    });

    it("should return null when symbol provider throws", async () => {
      const vscode = await import("./__mocks__/vscode");
      vi.spyOn(vscode.commands, "executeCommand").mockRejectedValue(
        new Error("No symbol provider"),
      );

      const doc = createMockDocument();
      const pos = createMockPosition(5);

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toBeNull();
    });

    it("should find a simple function symbol", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("handleLogin", SymbolKind.Function, 10, 20),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(15); // Inside the function

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toEqual({
        name: "handleLogin",
        kind: "function",
      });
    });

    it("should find a method inside a class", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("AuthService", SymbolKind.Class, 1, 50, [
          createMockSymbol("validate", SymbolKind.Method, 10, 20),
          createMockSymbol("logout", SymbolKind.Method, 25, 35),
        ]),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(15); // Inside validate method

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toEqual({
        name: "AuthService.validate",
        kind: "method",
      });
    });

    it("should find deeply nested symbols", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("Namespace", SymbolKind.Namespace, 1, 100, [
          createMockSymbol("Module", SymbolKind.Module, 5, 90, [
            createMockSymbol("Class", SymbolKind.Class, 10, 80, [
              createMockSymbol("method", SymbolKind.Method, 20, 40),
            ]),
          ]),
        ]),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(30); // Inside the method

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toEqual({
        name: "Namespace.Module.Class.method",
        kind: "method",
      });
    });

    it("should return parent symbol when cursor is outside child ranges", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("AuthService", SymbolKind.Class, 1, 50, [
          createMockSymbol("validate", SymbolKind.Method, 10, 20),
        ]),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(25); // Inside class but outside method

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toEqual({
        name: "AuthService",
        kind: "class",
      });
    });

    it("should return null when cursor is outside all symbols", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("handleLogin", SymbolKind.Function, 10, 20),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(5); // Before the function

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toBeNull();
    });

    it("should map all symbol kinds correctly", async () => {
      const vscode = await import("./__mocks__/vscode");
      const testCases = [
        { kind: SymbolKind.Function, expected: "function" },
        { kind: SymbolKind.Method, expected: "method" },
        { kind: SymbolKind.Class, expected: "class" },
        { kind: SymbolKind.Interface, expected: "interface" },
        { kind: SymbolKind.Constructor, expected: "constructor" },
        { kind: SymbolKind.Property, expected: "property" },
        { kind: SymbolKind.Variable, expected: "variable" },
        { kind: SymbolKind.Constant, expected: "constant" },
        { kind: SymbolKind.Enum, expected: "enum" },
        { kind: SymbolKind.Module, expected: "module" },
        { kind: SymbolKind.Namespace, expected: "namespace" },
        { kind: SymbolKind.TypeParameter, expected: "type" },
        { kind: SymbolKind.Unknown, expected: "symbol" },
      ];

      for (const { kind, expected } of testCases) {
        const mockSymbols = [createMockSymbol("test", kind, 1, 10)];
        vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
          mockSymbols,
        );

        const doc = createMockDocument();
        const pos = createMockPosition(5);

        const result = await getSymbolAtCursor(
          asDocument(doc),
          asPosition(pos),
        );
        expect(result?.kind).toBe(expected);
      }
    });

    it("should truncate deeply nested symbol names exceeding 255 chars", async () => {
      const vscode = await import("./__mocks__/vscode");
      // Create a very long nested symbol name
      const longName = "A".repeat(100);
      const mockSymbols = [
        createMockSymbol(longName, SymbolKind.Namespace, 1, 100, [
          createMockSymbol(longName, SymbolKind.Module, 5, 90, [
            createMockSymbol(longName, SymbolKind.Class, 10, 80, [
              createMockSymbol("method", SymbolKind.Method, 20, 40),
            ]),
          ]),
        ]),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(30);

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));

      // Full name would be "AAA...AAA.AAA...AAA.AAA...AAA.method" (309 chars)
      // Should be truncated to 255 chars with "..." prefix
      expect(result).not.toBeNull();
      if (result) {
        expect(result.name.length).toBeLessThanOrEqual(255);
        expect(result.name.startsWith("...")).toBe(true);
        expect(result.name.endsWith(".method")).toBe(true);
      }
    });

    it("should not truncate symbol names under 255 chars", async () => {
      const vscode = await import("./__mocks__/vscode");
      const mockSymbols = [
        createMockSymbol("MyClass", SymbolKind.Class, 1, 50, [
          createMockSymbol("myMethod", SymbolKind.Method, 10, 20),
        ]),
      ];
      vi.spyOn(vscode.commands, "executeCommand").mockResolvedValue(
        mockSymbols,
      );

      const doc = createMockDocument();
      const pos = createMockPosition(15);

      const result = await getSymbolAtCursor(asDocument(doc), asPosition(pos));
      expect(result).toEqual({
        name: "MyClass.myMethod",
        kind: "method",
      });
      if (result) {
        expect(result.name.startsWith("...")).toBe(false);
      }
    });
  });
});
