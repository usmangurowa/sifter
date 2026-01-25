"use client";

import type { IconSvgElement } from "@hugeicons/react";
import type * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/auth/client";
import { useSession } from "@/hooks/use-session";
import {
  AiChat02Icon as _AiChat02Icon,
  CheckmarkCircle01Icon as _CheckmarkCircle01Icon,
  CreditCardIcon as _CreditCardIcon,
  Delete02Icon as _Delete02Icon,
  Folder01Icon as _Folder01Icon,
  Layout01Icon as _Layout01Icon,
  Location01Icon as _Location01Icon,
  Menu01Icon as _Menu01Icon,
  Notification01Icon as _Notification01Icon,
  PieChartIcon as _PieChartIcon,
  Settings02Icon as _Settings02Icon,
  Share01Icon as _Share01Icon,
  StarIcon as _StarIcon,
  Archive02Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  HelpCircleIcon,
  Logout01Icon,
  SentIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@turbo/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@turbo/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@turbo/ui/dropdown-menu";
import { Icon } from "@turbo/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@turbo/ui/sidebar";

import { FeedbackDialog } from "./feedback-dialog";

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  const navMain = useMemo(() => {
    const isExactMatch = (url: string) => pathname === url;
    const isActiveRoute = (url: string) =>
      url !== "#" && (pathname === url || pathname.startsWith(url + "/"));

    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: DashboardSquare01Icon,
        isActive: isExactMatch("/dashboard"),
      },
      {
        title: "Sessions",
        url: "/dashboard/session",
        icon: Clock01Icon,
        isActive: isActiveRoute("/dashboard/session"),
      },
      {
        title: "Wrapped",
        url: "/dashboard/wrapped",
        icon: Archive02Icon,
        isActive: false,
        disabled: true,
        comingSoon: true,
        tooltip: "See weekly, monthly, yearly and all time wrapped",
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings02Icon,
        isActive: isActiveRoute("/dashboard/settings"),
        items: [
          {
            title: "API Keys",
            url: "/dashboard/settings/api-keys",
            isActive: isActiveRoute("/dashboard/settings/api-keys"),
          },
        ],
      },
    ];
  }, [pathname]);

  const navSecondaryWithActive = useMemo(() => {
    const isActiveRoute = (url: string) =>
      url !== "#" && (pathname === url || pathname.startsWith(url + "/"));

    return [
      {
        title: "Documentation",
        url: "/docs",
        icon: BookOpen01Icon,
        isActive: isActiveRoute("/docs"),
      },
      { title: "Support", url: "#", icon: HelpCircleIcon, isActive: false },
      { title: "Feedback", url: "#", icon: SentIcon, isActive: false },
    ];
  }, [pathname]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kodo.svg" alt="Kodo" className="size-5" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Kodo HQ</span>
                  <span className="truncate text-xs">Master Your Momentum</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondaryWithActive} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

const NavMain = ({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: IconSvgElement;
    isActive?: boolean;
    disabled?: boolean;
    comingSoon?: boolean;
    tooltip?: string;
    items?: { title: string; url: string; isActive?: boolean }[];
  }[];
}) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={
              Boolean(item.isActive) || (item.items?.length ?? 0) > 0
            }
          >
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild={!item.disabled}
                tooltip={item.tooltip ?? item.title}
                isActive={item.isActive}
                disabled={item.disabled}
                className={item.disabled ? "cursor-not-allowed opacity-60" : ""}
              >
                {item.disabled ? (
                  <div className="flex items-center gap-2">
                    <Icon icon={item.icon} />
                    <span>{item.title}</span>
                    {item.comingSoon && (
                      <span className="bg-muted text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                        Soon
                      </span>
                    )}
                  </div>
                ) : (
                  <Link href={item.url} prefetch>
                    <Icon icon={item.icon} />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <Icon icon={ArrowRight01Icon} />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.isActive}
                          >
                            <Link href={subItem.url} prefetch>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

const NavSecondary = ({
  items,
  ...props
}: {
  items: { title: string; url: string; icon: IconSvgElement }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) => {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.title === "Feedback" || item.title === "Support") {
              return (
                <SidebarMenuItem key={item.title}>
                  <FeedbackDialog
                    defaultType={
                      item.title === "Support" ? "question" : "feedback"
                    }
                  >
                    <SidebarMenuButton size="sm">
                      <Icon icon={item.icon} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </FeedbackDialog>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url}>
                    <Icon icon={item.icon} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const NavUser = () => {
  const { isMobile } = useSidebar();
  const { data: sessionData } = useSession();
  const router = useRouter();

  const user = sessionData?.user;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const avatar = user?.image ?? "";
  const initials = name.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <Icon icon={Archive02Icon} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon icon={StarIcon} />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon icon={CheckmarkCircle01Icon} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon={CreditCardIcon} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon icon={Notification01Icon} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleSignOut}>
              <Icon icon={Logout01Icon} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
