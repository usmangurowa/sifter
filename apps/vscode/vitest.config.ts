import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: false,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    alias: {
      vscode: resolve(__dirname, "src/__tests__/__mocks__/vscode.ts"),
    },
  },
  esbuild: {
    // Force esbuild to treat files as TypeScript
    loader: "ts",
  },
});
