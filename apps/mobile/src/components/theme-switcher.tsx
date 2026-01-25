import { Pressable, Text, View } from "react-native";
import { Uniwind, useUniwind } from "uniwind";

const themes = [
  { name: "light", label: "Light", icon: "☀️" },
  { name: "dark", label: "Dark", icon: "🌙" },
  { name: "system", label: "System", icon: "⚙️" },
] as const;

/**
 * Theme switcher component with light/dark/system options.
 * Uses Uniwind's setTheme and useUniwind hook for theme management.
 */
export const ThemeSwitcher = () => {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const activeTheme = hasAdaptiveThemes ? "system" : theme;

  return (
    <View className="gap-4 p-4">
      <Text className="text-muted-foreground text-sm">
        Current: {activeTheme}
      </Text>

      <View className="flex-row gap-2">
        {themes.map((t) => (
          <Pressable
            key={t.name}
            onPress={() => Uniwind.setTheme(t.name)}
            className={`items-center rounded-lg px-4 py-3 ${
              activeTheme === t.name ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text className="mb-1 text-2xl">{t.icon}</Text>
            <Text
              className={`text-xs ${
                activeTheme === t.name
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
