

# Styling Best Practices

## Technology Stack

| Platform | Technology |
|----------|------------|
| Web | Tailwind CSS v4 |
| Mobile | Uniwind (Expo) |
| Theme | Shared `tooling/tailwind/theme.css` |

## Unified Theme

The theme is defined once in `tooling/tailwind/theme.css` using:
- `@theme inline` - Maps CSS variables to Tailwind utilities
- `@layer theme` with `@variant light/dark` - Works for both web and mobile

```css
@layer theme {
  :root {
    @variant light { --background: oklch(1 0 0); }
    @variant dark { --background: oklch(0.145 0 0); }
  }
}
```

**Important**: All variables must exist in both light and dark variants!

## Uniwind Best Practices

### withUniwind HOC
Wrap third-party components that don't support `className`:
```tsx
import { withUniwind } from "uniwind";
import { SafeAreaView } from "react-native-safe-area-context";

export const StyledSafeAreaView = withUniwind(SafeAreaView);
```

**Note**: React Native Reanimated components work without wrapping.

### Theme Switching
```tsx
import { Uniwind, useUniwind } from "uniwind";

// Get current theme
const { theme, hasAdaptiveThemes } = useUniwind();

// Set theme programmatically
Uniwind.setTheme("dark");  // "light", "dark", "system"
```

### Monorepo @source Directive
Include shared packages in scanning:
```css
@source "../../packages/ui";
```

### Custom Themes (Beyond Light/Dark)
```css
@layer theme {
  :root {
    @variant ocean {
      --color-background: #0c4a6e;
      --color-primary: #06b6d4;
    }
  }
}
```

### Static Theme Variables
For JS-accessible values not used in classNames:
```css
@theme static {
  --chart-line-width: 2;
  --animation-duration: 300;
}
```

### useCSSVariable Hook
Access CSS variables in JS:
```tsx
import { useCSSVariable } from "uniwind";
const bgColor = useCSSVariable("--background");
```

## pnpm Monorepo Requirements

Add to `pnpm-workspace.yaml`:
```yaml
overrides:
  react: 19.1.2

publicHoistPattern:
  - react
  - react-native
  - react-dom
```

## cn() Utility
Use for conditional class merging:
```tsx
import { cn } from "@/lib/utils";
<View className={cn("bg-card", isActive && "bg-primary")} />
```

