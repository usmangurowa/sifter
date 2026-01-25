import { DashboardBreadcrumbs } from "@/components/dashboard-breadcrumbs";
import { AppSidebar } from "@/components/dashboard-sidebar";

import { Separator } from "@turbo/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@turbo/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <AppSidebar />
      <SidebarInset className="flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-content mr-2" />
            <DashboardBreadcrumbs />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
