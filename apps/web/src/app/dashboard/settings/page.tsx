"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { useLocalPreferences } from "@/hooks/use-local-preferences";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import {
  ArrowRight01Icon,
  CodeIcon,
  Key01Icon,
  Moon02Icon,
  Notification01Icon,
  Shield01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash.debounce";

import type { UserSettings } from "@turbo/validators";
import { Avatar, AvatarFallback, AvatarImage } from "@turbo/ui/avatar";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@turbo/ui/card";
import { Icon } from "@turbo/ui/icon";
import { Label } from "@turbo/ui/label";
import { ScrollArea } from "@turbo/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turbo/ui/select";
import { Skeleton } from "@turbo/ui/skeleton";
import { Slider } from "@turbo/ui/slider";
import { Switch } from "@turbo/ui/switch";
import { ThemeToggle } from "@turbo/ui/theme";
import { toast } from "@turbo/ui/toast";
import { userSettingsSchema } from "@turbo/validators";

const SETTINGS_QUERY_KEY = ["user-settings"] as const;

const fetchSettings = async (): Promise<UserSettings> => {
  const res = await api.settings.web.$get();
  if (!res.ok) {
    throw new Error("Failed to fetch settings");
  }
  return res.json();
};

const updateSettings = async (
  updates: Partial<UserSettings>,
): Promise<UserSettings> => {
  const res = await api.settings.web.$put({
    json: updates,
  });
  if (!res.ok) {
    throw new Error("Failed to update settings");
  }
  return res.json();
};

/**
 * Settings toggle component with optimistic updates
 */
const SettingToggle = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  </div>
);

export default function SettingsPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const queryClient = useQueryClient();
  const { preferences: localPreferences, setPreference: setLocalPreference } =
    useLocalPreferences();

  const {
    data: settings,
    isLoading: isSettingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSettings,
    enabled: !!sessionData?.user,
  });

  // Accumulate pending changes and sync after 2 seconds of inactivity
  const pendingChangesRef = useRef<Partial<UserSettings>>({});

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onError: () => {
      toast.error("Failed to save settings");
    },
    onSuccess: () => {
      toast.success("Settings saved");
      // If there are pending changes that accumulated while mutation was in flight,
      // trigger another sync immediately
      if (Object.keys(pendingChangesRef.current).length > 0) {
        const pending = pendingChangesRef.current;
        pendingChangesRef.current = {};
        updateMutation.mutate(pending);
      }
    },
    // Note: We don't invalidateQueries here because it would overwrite
    // any pending optimistic updates that haven't been synced yet
  });

  // Debounced sync - sends accumulated changes after 2s of inactivity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSync = useCallback(
    debounce(() => {
      if (Object.keys(pendingChangesRef.current).length > 0) {
        updateMutation.mutate(pendingChangesRef.current);
        pendingChangesRef.current = {};
      }
    }, 2000),
    [],
  );

  // Cleanup debounced function on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      debouncedSync.cancel();
    };
  }, [debouncedSync]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => {
    // Only accumulate if the value actually changed from current state
    // This prevents Slider/component initialization from triggering false changes
    const currentSettings =
      queryClient.getQueryData<UserSettings>(SETTINGS_QUERY_KEY);

    if (currentSettings?.[key] === value) {
      // No actual change, skip
      return;
    }

    // Accumulate the change
    pendingChangesRef.current = {
      ...pendingChangesRef.current,
      [key]: value,
    };

    // Optimistically update UI immediately
    if (currentSettings) {
      queryClient.setQueryData<UserSettings>(SETTINGS_QUERY_KEY, {
        ...currentSettings,
        [key]: value,
      });
    }

    // Trigger debounced sync
    debouncedSync();
  };

  if (isSessionPending || isSettingsLoading) {
    return (
      <main className="container flex flex-1 flex-col gap-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>

        {/* Cards grid skeleton */}
        <div className="grid gap-6">
          {/* Profile card */}
          <Skeleton className="h-48 w-full rounded-xl" />
          {/* Editor Settings card */}
          <Skeleton className="h-80 w-full rounded-xl" />
          {/* Privacy & Data card */}
          <Skeleton className="h-40 w-full rounded-xl" />
          {/* API Keys card */}
          <Skeleton className="h-36 w-full rounded-xl" />
          {/* Appearance card */}
          <Skeleton className="h-36 w-full rounded-xl" />
          {/* Notifications card */}
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (!sessionData) {
    return null;
  }

  // Handle settings not loaded yet - use schema defaults as single source of truth
  const currentSettings = settings ?? userSettingsSchema.parse({});

  return (
    <main className="container flex min-h-0 flex-1 flex-col gap-8 overflow-hidden py-8">
      <div className="shrink-0">
        <PageHeader
          title="Settings"
          description="Manage your account settings and preferences. Changes sync automatically with your extensions."
        />
      </div>

      {settingsError && (
        <div className="bg-destructive/10 text-destructive mb-6 shrink-0 rounded-lg border border-red-200 p-4">
          <p className="text-sm">
            Failed to load settings. Some options may not be available.
          </p>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-6 p-0.5 pb-4">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={UserCircleIcon} className="text-primary size-5" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>
                Your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <Avatar className="size-20">
                <AvatarImage src={sessionData.user.image ?? undefined} />
                <AvatarFallback className="text-lg">
                  {sessionData.user.name.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">{sessionData.user.name}</p>
                <p className="text-muted-foreground text-sm">
                  {sessionData.user.email}
                </p>
                <p className="text-muted-foreground text-xs">
                  User ID: {sessionData.user.id}
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" disabled>
                Edit Profile (Coming Soon)
              </Button>
            </CardFooter>
          </Card>

          {/* Editor Settings Section - NEW */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon={CodeIcon} className="text-primary size-5" />
                  <CardTitle>Editor Settings</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Syncs with extensions
                </Badge>
              </div>
              <CardDescription>
                These settings sync automatically with your VS Code extension
                and other connected editors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingToggle
                id="tracking-enabled"
                label="Activity Tracking"
                description="Enable Kodo to track your coding activity and sessions."
                checked={currentSettings.enabled}
                onCheckedChange={(checked) =>
                  handleSettingChange("enabled", checked)
                }
              />

              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Privacy Mode</Label>
                  <p className="text-muted-foreground text-sm">
                    Control what data is collected during tracking.
                  </p>
                </div>
                <Select
                  value={currentSettings.privacyMode}
                  onValueChange={(value: "normal" | "stealth") =>
                    handleSettingChange("privacyMode", value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="stealth">Stealth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Break Reminder
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Remind you to take breaks after continuous coding.
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {currentSettings.breakReminderMinutes === 0
                      ? "Off"
                      : `${currentSettings.breakReminderMinutes} min`}
                  </span>
                </div>
                <Slider
                  value={[currentSettings.breakReminderMinutes]}
                  onValueChange={([value]) =>
                    value !== undefined &&
                    handleSettingChange("breakReminderMinutes", value)
                  }
                  min={0}
                  max={180}
                  step={15}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">
                  Set to 0 to disable reminders
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Session Timeout
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Gaps shorter than this count as coding time. Longer gaps
                      start a new session.
                    </p>
                  </div>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {currentSettings.sessionTimeoutMinutes} min
                  </span>
                </div>
                <Slider
                  value={[currentSettings.sessionTimeoutMinutes]}
                  onValueChange={([value]) =>
                    value !== undefined &&
                    handleSettingChange("sessionTimeoutMinutes", value)
                  }
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <p className="text-muted-foreground text-xs">
                  Default: 15 min (matches wakatime). Lower = stricter tracking,
                  higher = more forgiving.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Shield01Icon} className="text-primary size-5" />
                <CardTitle>Privacy & Data</CardTitle>
              </div>
              <CardDescription>
                Control how your data is collected and used.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SettingToggle
                id="enable-telemetry"
                label="Anonymous Analytics"
                description="Help improve Kodo by sending anonymous usage data."
                checked={currentSettings.enableTelemetry}
                onCheckedChange={(checked) =>
                  handleSettingChange("enableTelemetry", checked)
                }
              />

              <SettingToggle
                id="capture-symbols"
                label="Symbol Capture"
                description="Capture function and class names for richer AI session summaries. This data stays private."
                checked={currentSettings.captureSymbols}
                onCheckedChange={(checked) =>
                  handleSettingChange("captureSymbols", checked)
                }
              />

              <SettingToggle
                id="capture-commits"
                label="Commit Tracking"
                description="Track Git commits for session context and AI summaries. Works for commits from any source."
                checked={currentSettings.captureCommits}
                onCheckedChange={(checked) =>
                  handleSettingChange("captureCommits", checked)
                }
              />
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Key01Icon} className="text-primary size-5" />
                <CardTitle>API Keys</CardTitle>
              </div>
              <CardDescription>
                Manage API keys for accessing the Kodo API and connecting
                editors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Create and manage API keys to authenticate your development
                tools and track your coding metrics.
              </p>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button asChild>
                <Link href="/dashboard/settings/api-keys">
                  Manage API Keys
                  <Icon icon={ArrowRight01Icon} className="ml-2 size-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Appearance Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon icon={Moon02Icon} className="text-primary size-5" />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  This device only
                </Badge>
              </div>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Theme Preference</p>
                  <p className="text-muted-foreground text-sm">
                    Select your preferred interface theme.
                  </p>
                </div>
                <ThemeToggle />
              </div>

              <SettingToggle
                id="redirect-to-dashboard"
                label="Auto-redirect to Dashboard"
                description="When logged in, automatically go to your dashboard instead of the landing page."
                checked={localPreferences.redirectToDashboard}
                onCheckedChange={(checked) =>
                  setLocalPreference("redirectToDashboard", checked)
                }
              />
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon
                  icon={Notification01Icon}
                  className="text-primary size-5"
                />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Manage how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive a weekly summary of your coding activity.
                  </p>
                </div>
                <Switch id="weekly-digest" disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="product-updates">Product Updates</Label>
                  <p className="text-muted-foreground text-sm">
                    Get notified about new features and improvements.
                  </p>
                </div>
                <Switch id="product-updates" defaultChecked disabled />
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </main>
  );
}
