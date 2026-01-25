import { Tabs } from "expo-router";
import { Icon } from "@/components/ui/icon";
import {
  Home01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useCSSVariable, useUniwind } from "uniwind";

const TabsLayout = () => {
  const { theme } = useUniwind();
  const isDark = theme === "dark";

  const [primary, background] = useCSSVariable([
    "--primary",
    "--background",
  ]) as string[];

  // Colors based on theme
  const colors = {
    primary,
    background,
    text: isDark ? "#ffffff" : "#000000",
    card: isDark ? "#1c1c1c" : "#ffffff",
    border: isDark ? "#2e2e2e" : "#e5e5e5",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Icon icon={Home01Icon} className="size-6" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Icon icon={UserIcon} className="size-6" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Icon icon={Settings01Icon} className="size-6" color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
