import type { OpenVSXExtension } from "@cortex/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckIcon, CircleAlertIcon, PluginIcon } from "~/lib/icons";
import {
  openVSXDetailsQueryOptions,
  openVSXInstallMutationOptions,
  openVSXInstalledQueryOptions,
  openVSXSearchQueryOptions,
  openVSXUninstallMutationOptions,
} from "~/lib/openvsxReactQuery";
import { cn } from "~/lib/utils";
import { Skeleton } from "./ui/skeleton";

function ExtensionIcon({ extension }: { extension: OpenVSXExtension }) {
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-border/60 bg-background">
      {extension.files.icon ? (
        <img src={extension.files.icon} alt="" className="size-7 object-contain" loading="lazy" />
      ) : (
        <PluginIcon className="size-5 text-muted-foreground" />
      )}
    </span>
  );
}

function ExtensionCard({
  extension,
  selected,
  onSelect,
}: {
  extension: OpenVSXExtension;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        selected
          ? "border-foreground/30 bg-muted/60"
          : "border-border/60 bg-background/40 hover:bg-muted/40",
      )}
      onClick={onSelect}
    >
      <ExtensionIcon extension={extension} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span className="truncate">{extension.displayName ?? extension.name}</span>
          {extension.verified ? <CheckIcon className="size-3.5 shrink-0 text-emerald-500" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {extension.namespace}.{extension.name}
        </span>
        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
          {extension.description ?? "No description provided."}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">v{extension.version}</span>
    </button>
  );
}

function ExtensionDetails({
  extension,
  installed,
  busy,
  onInstall,
  onUninstall,
}: {
  extension: OpenVSXExtension;
  installed: boolean;
  busy: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}) {
  return (
    <aside className="rounded-xl border border-border/60 bg-background/70 p-4 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-start gap-3">
        <ExtensionIcon extension={extension} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {extension.displayName ?? extension.name}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {extension.namespace}.{extension.name}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {extension.description ?? "No description provided."}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Version</dt>
          <dd className="mt-0.5 font-medium">{extension.version}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Downloads</dt>
          <dd className="mt-0.5 font-medium">
            {extension.downloadCount === undefined ? "—" : extension.downloadCount.toLocaleString()}
          </dd>
        </div>
      </dl>
      {extension.categories && extension.categories.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {extension.categories.slice(0, 5).map((category) => (
            <span
              key={category}
              className="rounded-full border border-border/60 px-2 py-1 text-[11px] text-muted-foreground"
            >
              {category}
            </span>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity disabled:opacity-50"
        disabled={busy}
        onClick={installed ? onUninstall : onInstall}
      >
        {busy ? "Processing…" : installed ? "Uninstall" : "Install extension"}
      </button>
      <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        Extensions are validated and recorded in Cortex&apos;s controlled installation registry.
      </p>
    </aside>
  );
}

function EmptyState({
  title,
  description,
  error = false,
}: {
  title: string;
  description: string;
  error?: boolean;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 px-5 py-6 text-center">
      <div className="max-w-sm space-y-1">
        {error ? <CircleAlertIcon className="mx-auto mb-2 size-4 text-amber-500" /> : null}
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ExtensionsLibrary({ query }: { query: string }) {
  const queryClient = useQueryClient();
  const normalizedQuery = query.trim();
  const searchQuery = useQuery(
    openVSXSearchQueryOptions(
      { query: normalizedQuery, options: { offset: 0, size: 24, sortBy: "relevance" } },
      normalizedQuery.length >= 2,
    ),
  );
  const installedQuery = useQuery(openVSXInstalledQueryOptions());
  const installMutation = useMutation(openVSXInstallMutationOptions(queryClient));
  const uninstallMutation = useMutation(openVSXUninstallMutationOptions(queryClient));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const extensions = searchQuery.data?.extensions ?? [];
  const selectedExtension = extensions.find(
    (extension) => `${extension.namespace}.${extension.name}` === selectedKey,
  );
  const detailsQuery = useQuery(
    openVSXDetailsQueryOptions(
      selectedExtension
        ? { namespace: selectedExtension.namespace, name: selectedExtension.name }
        : null,
    ),
  );
  const installedKeys = new Set(
    (installedQuery.data?.extensions ?? []).map(
      (extension) => `${extension.namespace}.${extension.name}@${extension.version}`,
    ),
  );
  const detail = detailsQuery.data ?? selectedExtension;
  const detailKey = detail ? `${detail.namespace}.${detail.name}@${detail.version}` : null;
  const installInput = detail
    ? { namespace: detail.namespace, name: detail.name, version: detail.version }
    : null;

  if (normalizedQuery.length < 2) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          title="Search Open VSX extensions"
          description="Enter at least two characters to search the real Open VSX registry."
        />
      </div>
    );
  }
  if (searchQuery.isLoading) {
    return (
      <div className="space-y-2">
        {["1", "2", "3", "4", "5"].map((key) => (
          <Skeleton key={key} className="h-[86px] w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (searchQuery.isError) {
    return (
      <EmptyState title="Open VSX search failed" description={searchQuery.error.message} error />
    );
  }
  if (extensions.length === 0) {
    return <EmptyState title="No extensions found" description="Try a different search term." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
      <div className="space-y-2">
        {extensions.map((extension) => {
          const key = `${extension.namespace}.${extension.name}`;
          return (
            <ExtensionCard
              key={key}
              extension={extension}
              selected={key === selectedKey}
              onSelect={() => setSelectedKey(key)}
            />
          );
        })}
      </div>
      {detail && detailKey && installInput ? (
        <ExtensionDetails
          extension={detail}
          installed={installedKeys.has(detailKey)}
          busy={installMutation.isPending || uninstallMutation.isPending}
          onInstall={() => installMutation.mutate(installInput)}
          onUninstall={() => uninstallMutation.mutate(installInput)}
        />
      ) : (
        <EmptyState
          title="Select an extension"
          description="Choose a result to inspect its metadata."
        />
      )}
    </div>
  );
}
