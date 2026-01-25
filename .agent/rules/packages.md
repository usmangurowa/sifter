---
trigger: always_on
---

# Package Conventions

## Package Structure
Every package in `packages/` follows this structure:
```
packages/<name>/
├── src/
│   ├── index.ts          # Main entry point, exports public API
│   ├── components/       # React components (if applicable)
│   └── ...
├── package.json
├── tsconfig.json
└── eslint.config.ts
```

## package.json Template
```json
{
  "name": "@turbo/<name>",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./src/index.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "clean": "git clean -xdf .cache .turbo dist node_modules",
    "dev": "tsc --watch",
    "format": "prettier --check . --ignore-path ../../.gitignore",
    "lint": "eslint",
    "typecheck": "tsc --noEmit --emitDeclarationOnly false"
  },
  "devDependencies": {
    "@turbo/eslint-config": "workspace:*",
    "@turbo/prettier-config": "workspace:*",
    "@turbo/tsconfig": "workspace:*",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "typescript": "catalog:"
  },
  "prettier": "@turbo/prettier-config"
}
```

## Dependency Rules
- **Internal packages**: Use `workspace:*`
- **Shared versions**: Use `catalog:` (from pnpm-workspace.yaml)
- **React ecosystem**: Use `catalog:react19`
- **Exact versions**: Use `-E` flag when installing

## tsconfig.json Template
```json
{
  "extends": "@turbo/tsconfig/compiled-package.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## eslint.config.ts Template
```typescript
import { defineConfig } from "eslint/config";
import { baseConfig } from "@turbo/eslint-config/base";

export default defineConfig(
  { ignores: ["dist/**"] },
  baseConfig,
);
```

## Creating New Packages
When creating a new package:
1. Create folder in `packages/<name>/`
2. Add package.json following template above
3. Add tsconfig.json extending `@turbo/tsconfig/compiled-package.json`
4. Add eslint.config.ts extending `@turbo/eslint-config/base`
5. Run `pnpm install` from root
6. Add package to consuming apps/packages
