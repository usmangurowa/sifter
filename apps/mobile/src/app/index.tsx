import { View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { StyledSafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";

const App = () => {
  return (
    <StyledSafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        {/* Heading */}
        <Text className="text-foreground text-4xl font-extrabold tracking-tight">
          🚀 Welcome
        </Text>
        <Text className="text-foreground font-jakarta-extrabold text-4xl tracking-tight">
          🚀 Welcome
        </Text>

        {/* Subheading */}
        <Text className="text-muted-foreground text-center text-xl leading-relaxed">
          Build beautiful apps with{" "}
          <Text className="text-primary font-semibold">
            Expo (Router) + Uniwind 🔥
          </Text>
        </Text>

        {/* Card Example */}
        <View className="bg-card mt-4 w-full rounded-lg p-4">
          <Text className="text-card-foreground font-medium">Card Example</Text>
          <Text className="text-muted-foreground mt-2 text-sm">
            Using monorepo theme with bg-card and text-card-foreground
          </Text>
        </View>

        {/* Color Buttons */}
        <View className="mt-4 flex-row gap-2">
          <View className="bg-primary rounded-lg px-4 py-2">
            <Text className="text-primary-foreground">Primary</Text>
          </View>
          <View className="bg-secondary rounded-lg px-4 py-2">
            <Text className="text-secondary-foreground">Secondary</Text>
          </View>
          <View className="bg-destructive rounded-lg px-4 py-2">
            <Text className="text-white">Destructive</Text>
          </View>
        </View>
        <Link href="/login" asChild>
          <Button className="w-full">
            <Text>Login</Text>
          </Button>
        </Link>

        {/* Theme Switcher */}
        <ThemeSwitcher />

        <StatusBar style="auto" />
      </View>
    </StyledSafeAreaView>
  );
};

export default App;
