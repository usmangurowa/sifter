"use client";

import type { ApiKey } from "@/hooks/use-api-keys";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import Image from "next/image";
import { authClient } from "@/auth/client";
import { GenerateApiKey } from "@/components/api-key";
import { ApiKeysTable } from "@/components/api-keys-table";
import { PageHeader } from "@/components/page-header";
import { API_KEYS_QUERY_KEY, useApiKeys } from "@/hooks/use-api-keys";
import { useSession } from "@/hooks/use-session";
import {
  Delete02Icon,
  Key01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@turbo/ui/alert-dialog";
import { Badge } from "@turbo/ui/badge";
import { Button } from "@turbo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@turbo/ui/dropdown-menu";
import { Icon } from "@turbo/ui/icon";
import { Skeleton } from "@turbo/ui/skeleton";
import { toast } from "@turbo/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbo/ui/tooltip";

/**
 * Mapping of editor identifiers to their icon paths.
 * Only editors with available icons are included.
 */
const EDITOR_ICONS: Record<string, { logo: string; name: string }> = {
  vscode: { logo: "/editors/vscode.svg", name: "VS Code" },
  cursor: { logo: "/editors/cursor.svg", name: "Cursor" },
  antigravity: { logo: "/editors/antigravity.svg", name: "Antigravity" },
  windsurf: { logo: "/editors/windsurf.svg", name: "Windsurf" },
};

const ActionsCell = ({ keyId }: { keyId: string }) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => authClient.apiKey.delete({ keyId }),
    onSuccess: () => {
      toast.success("API key deleted");
      void queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete API key");
    },
  });

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={deleteMutation.isPending}
          >
            <Icon icon={MoreHorizontalIcon} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Icon icon={Delete02Icon} className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Any applications using this API key
            will no longer be able to authenticate.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            loading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const columns: ColumnDef<ApiKey>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="bg-muted rounded-md p-2">
          <Icon icon={Key01Icon} className="text-muted-foreground h-4 w-4" />
        </div>
        <span className="font-medium">
          {row.original.name ?? "Unnamed Key"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "start",
    header: "Key",
    cell: ({ row }) => (
      <code className="text-muted-foreground font-mono text-sm">
        {row.original.start}••••••••
      </code>
    ),
  },
  {
    accessorKey: "connectedEditors",
    header: "Connected Editors",
    cell: ({ row }) => {
      const editors = row.original.connectedEditors;
      if (editors.length === 0) {
        return (
          <span className="text-muted-foreground text-sm">No editors</span>
        );
      }
      return (
        <div className="flex flex-wrap items-center gap-2">
          {editors.map((editor) => {
            const editorInfo = EDITOR_ICONS[editor.toLowerCase()];
            if (editorInfo) {
              return (
                <Tooltip key={editor}>
                  <TooltipTrigger asChild>
                    <div className="bg-muted relative size-8 rounded-md p-1.5 transition-transform hover:scale-105">
                      <Image
                        src={editorInfo.logo}
                        alt={editorInfo.name}
                        fill
                        className="object-contain p-2 aria-[label='Windsurf']:dark:invert"
                        aria-label={editorInfo.name}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{editorInfo.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return (
              <Badge key={editor} variant="secondary">
                {editor}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      if (!createdAt) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      const date = new Date(createdAt);
      return (
        <span className="text-muted-foreground text-sm">
          {date.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    accessorKey: "lastRequest",
    header: "Last Used",
    cell: ({ row }) => {
      const date = row.original.lastRequest
        ? new Date(row.original.lastRequest)
        : null;
      return (
        <span className="text-muted-foreground text-sm">
          {date ? date.toLocaleDateString() : "Never"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell keyId={row.original.id} />,
  },
];

export default function ApiKeysPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();

  const { keys, isLoading, invalidate } = useApiKeys({
    enabled: !!sessionData?.user,
  });

  const handleKeyGenerated = () => {
    invalidate();
  };

  if (isSessionPending) {
    return (
      <main className="container flex flex-1 flex-col gap-8 px-4 py-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </main>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <main className="container flex flex-1 flex-col gap-8 py-8">
      <PageHeader
        title="API Keys"
        description="Manage your API keys for the VS Code extension and other integrations."
      />

      {/* Generate New Key */}
      <section>
        <GenerateApiKey onKeyGenerated={handleKeyGenerated} />
      </section>

      {/* API Keys Table */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Your API Keys</h2>
        <ApiKeysTable columns={columns} data={keys} isLoading={isLoading} />
      </section>
    </main>
  );
}
