---
trigger: always_on
---

# Code Style Guidelines

## TypeScript/JavaScript

### Functions
- **Always use arrow functions** for all function declarations:
  ```typescript
  // ✅ Correct
  export const myFunction = (param: string) => {
    return param.toUpperCase();
  };

  // ❌ Incorrect
  export function myFunction(param: string) {
    return param.toUpperCase();
  }
  ```

### React Components
- Use arrow function components with explicit return for simple components:
  ```tsx
  export const Button = ({ children }: ButtonProps) => (
    <button>{children}</button>
  );
  ```
- Use arrow function with block body for complex logic:
  ```tsx
  export const Form = ({ onSubmit }: FormProps) => {
    const handleSubmit = () => { /* ... */ };
    return <form onSubmit={handleSubmit}>...</form>;
  };
  ```

### Types
- Prefer `interface` for object shapes that might be extended
- Prefer `type` for unions, intersections, and utility types
- Use `T[]` instead of `Array<T>`:
  ```typescript
  // ✅ Correct
  tags: { name: string; value: string }[]
  
  // ❌ Incorrect
  tags: Array<{ name: string; value: string }>
  ```

### Imports
- Use absolute imports with `@/` alias when available
- Group imports: external → internal packages → relative
- Use `type` imports for type-only imports:
  ```typescript
  import type { ReactNode } from "react";
  ```

## Styling

### Tailwind CSS
- Use Tailwind v4 with the shared theme from `@turbo/tailwind-config`
- Import theme in CSS: `@import "@turbo/tailwind-config/theme";`
- Use the `cn()` utility from `@turbo/ui` for conditional classes

### CSS Variables
- Design tokens are defined in `tooling/tailwind/theme.css`
- Uses OKLCH color space for colors
- Reference via Tailwind: `bg-primary`, `text-muted-foreground`, etc.

## Naming Conventions
- **Files**: kebab-case (`email-button.tsx`)
- **Components**: PascalCase (`EmailButton`)
- **Functions/Variables**: camelCase (`sendEmail`)
- **Constants**: SCREAMING_SNAKE_CASE (`DEFAULT_FROM`)
- **Types/Interfaces**: PascalCase (`SendEmailOptions`)

## Documentation
- Use JSDoc comments for exported functions:
  ```typescript
  /**
   * Brief description of what this does.
   * @example
   * \`\`\`ts
   * await sendEmail({ to: "user@example.com" });
   * \`\`\`
   */
  export const sendEmail = async (options: SendEmailOptions) => { ... };
  ```

### Nullish Coalescing
- **Prefer `??` over `||`** for default values when dealing with null/undefined:
  ```typescript
  // ✅ Correct - only fallback on null/undefined
  const name = user.name ?? "Anonymous";
  const email = options?.email ?? undefined;

  // ❌ Incorrect - also fallback on "", 0, false
  const name = user.name || "Anonymous";


## CLI Preference
- When installing packages or performing actions easily done through CLI, use CLI commands
- Example: `pnpm add package-name` instead of manually editing package.json
## Data Fetching & Mutations

### TanStack Query
- **Always use TanStack Query** for data fetching and mutations in React components:
  ```typescript
  // ✅ Correct - Use useQuery for fetching
  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: fetchApiKeys,
  });

  // ✅ Correct - Use useMutation for mutations
  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(id),
    onSuccess: () => {
      toast.success("Deleted");
      void queryClient.invalidateQueries({ queryKey: ["items"] });
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  // ❌ Incorrect - Manual state management
  const [isLoading, setIsLoading] = useState(false);
  const handleDelete = async () => {
    setIsLoading(true);
    try { await deleteItem(id); } finally { setIsLoading(false); }
  };
  ```

- Use `isPending` from mutation for loading states, not manual `useState`
- Use `void` before `invalidateQueries` to satisfy floating promise lint rules
- Define query keys as constants when reused across components