import { defineConfig } from "eslint/config";

import { baseConfig } from "@turbo/eslint-config/base";
import { reactConfig } from "@turbo/eslint-config/react";

export default defineConfig(
  {
    ignores: ["dist/**"],
  },
  baseConfig,
  reactConfig,
);
