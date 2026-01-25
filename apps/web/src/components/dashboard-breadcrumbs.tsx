"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@turbo/ui/breadcrumb";
import { Button } from "@turbo/ui/button";
import { Icon } from "@turbo/ui/icon";

const ROUTE_NAME_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  "api-keys": "API Keys",
  docs: "Documentation",
  profile: "Profile",
  analytics: "Analytics",
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  // Remove trailing slash and split into segments
  const segments = pathname
    .replace(/\/$/, "")
    .split("/")
    .filter((segment) => segment !== "");

  // If we are at the root or just /dashboard, we might want to show something specific or nothing
  // But usually /dashboard is the root of this layout.

  const getBreadcrumbName = (segment: string) => {
    return (
      ROUTE_NAME_MAP[segment] ??
      segment.charAt(0).toUpperCase() + segment.slice(1)
    );
  };

  const showBackButton = pathname !== "/dashboard";

  return (
    <div className="flex items-center gap-2">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => router.back()}
          title="Go back"
        >
          <Icon icon={ArrowLeft02Icon} className="size-4" />
          <span className="sr-only">Go back</span>
        </Button>
      )}

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const path = `/${segments.slice(0, index + 1).join("/")}`;
            const name = getBreadcrumbName(segment);

            return (
              <div key={path} className="flex items-center">
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={path}>{name}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="mx-2" />}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
