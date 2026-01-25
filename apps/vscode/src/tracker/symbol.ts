import * as vscode from "vscode";

/**
 * Symbol context at cursor position.
 */
export interface SymbolContext {
  /** Symbol name (e.g., "handleLogin", "AuthService") */
  name: string;
  /** Symbol kind (e.g., "function", "class", "method") */
  kind: string;
}

/**
 * Map VS Code SymbolKind enum to human-readable strings.
 */
const symbolKindToString = (kind: vscode.SymbolKind): string => {
  switch (kind) {
    case vscode.SymbolKind.Function:
      return "function";
    case vscode.SymbolKind.Method:
      return "method";
    case vscode.SymbolKind.Class:
      return "class";
    case vscode.SymbolKind.Interface:
      return "interface";
    case vscode.SymbolKind.Constructor:
      return "constructor";
    case vscode.SymbolKind.Property:
      return "property";
    case vscode.SymbolKind.Variable:
      return "variable";
    case vscode.SymbolKind.Constant:
      return "constant";
    case vscode.SymbolKind.Enum:
      return "enum";
    case vscode.SymbolKind.Module:
      return "module";
    case vscode.SymbolKind.Namespace:
      return "namespace";
    case vscode.SymbolKind.TypeParameter:
      return "type";
    default:
      return "symbol";
  }
};

// Max symbol name length to match schema validation (255 chars)
// Reserve 3 chars for "..." truncation indicator
const MAX_SYMBOL_NAME_LENGTH = 255;

/**
 * Truncate symbol name if it exceeds max length.
 * Uses "..." prefix to indicate ancestor names were truncated.
 */
const truncateSymbolName = (name: string): string => {
  if (name.length <= MAX_SYMBOL_NAME_LENGTH) {
    return name;
  }
  // Truncate from the start (remove ancestor names) to keep the most specific symbol
  // "Namespace.Class.Subclass.Method" -> "...Subclass.Method"
  return "..." + name.slice(-(MAX_SYMBOL_NAME_LENGTH - 3));
};

/**
 * Find the symbol that contains the given position.
 * Recursively searches through children to find the most specific symbol.
 */
const findSymbolAtPosition = (
  symbols: vscode.DocumentSymbol[],
  position: vscode.Position,
  containerName?: string,
): SymbolContext | null => {
  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      // Build the full name including container
      const fullName = containerName
        ? `${containerName}.${symbol.name}`
        : symbol.name;

      // Check if any child symbol contains the position (more specific match)
      if (symbol.children.length > 0) {
        const childMatch = findSymbolAtPosition(
          symbol.children,
          position,
          fullName,
        );
        if (childMatch) {
          return childMatch;
        }
      }

      // This symbol contains the position and has no matching children
      // Truncate if necessary to fit schema validation
      return {
        name: truncateSymbolName(fullName),
        kind: symbolKindToString(symbol.kind),
      };
    }
  }
  return null;
};

/**
 * Get the symbol at the current cursor position.
 *
 * Uses VS Code's DocumentSymbolProvider to get symbols and finds
 * the one containing the cursor. Returns null if no symbol is found
 * or if the operation fails.
 *
 * @example
 * ```ts
 * const symbol = await getSymbolAtCursor(document, position);
 * if (symbol) {
 *   console.log(symbol.name); // "handleLogin"
 *   console.log(symbol.kind); // "function"
 * }
 * ```
 */
export const getSymbolAtCursor = async (
  document: vscode.TextDocument,
  position: vscode.Position,
): Promise<SymbolContext | null> => {
  try {
    // Execute the document symbol provider command
    // Result can be undefined if no symbol provider is available
    const symbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[] | undefined
    >("vscode.executeDocumentSymbolProvider", document.uri);

    if (!symbols || symbols.length === 0) {
      return null;
    }

    // Find the symbol at the cursor position
    return findSymbolAtPosition(symbols, position);
  } catch {
    // Silently fail if symbol provider is not available
    // This is expected for some file types without language support
    return null;
  }
};

/**
 * Check if symbol capture is enabled in settings.
 */
export const isSymbolCaptureEnabled = (): boolean => {
  const config = vscode.workspace.getConfiguration("kodo");
  return config.get<boolean>("captureSymbols", false);
};
