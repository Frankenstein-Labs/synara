import type {
  OpenVSXDownloadExtensionInput,
  OpenVSXGetExtensionDetailsInput,
  OpenVSXSearchExtensionsInput,
} from "@cortex/contracts";
import { mutationOptions, queryOptions, type QueryClient } from "@tanstack/react-query";
import { ensureNativeApi } from "../nativeApi";

const OPEN_VSX_STALE_TIME_MS = 60_000;

export const openVSXQueryKeys = {
  all: ["openvsx"] as const,
  search: (input: OpenVSXSearchExtensionsInput) =>
    [
      "openvsx",
      "search",
      input.query,
      input.options?.offset ?? 0,
      input.options?.size ?? 24,
    ] as const,
  details: (input: OpenVSXGetExtensionDetailsInput) =>
    ["openvsx", "details", input.namespace, input.name] as const,
  installed: ["openvsx", "installed"] as const,
};

function requireExtensionsApi() {
  const extensions = ensureNativeApi().extensions;
  if (!extensions) throw new Error("Open VSX is unavailable in this runtime.");
  return extensions;
}

export function openVSXSearchQueryOptions(input: OpenVSXSearchExtensionsInput, enabled = true) {
  return queryOptions({
    queryKey: openVSXQueryKeys.search(input),
    queryFn: () => requireExtensionsApi().search(input),
    enabled: enabled && input.query.trim().length > 0,
    staleTime: OPEN_VSX_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function openVSXDetailsQueryOptions(
  input: OpenVSXGetExtensionDetailsInput | null,
  enabled = true,
) {
  return queryOptions({
    queryKey: openVSXQueryKeys.details(input ?? { namespace: "", name: "" }),
    queryFn: () => {
      if (!input) throw new Error("Extension details are unavailable.");
      return requireExtensionsApi().details(input);
    },
    enabled: enabled && input !== null,
    staleTime: OPEN_VSX_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function openVSXInstalledQueryOptions() {
  return queryOptions({
    queryKey: openVSXQueryKeys.installed,
    queryFn: () => requireExtensionsApi().listInstalled(),
    staleTime: OPEN_VSX_STALE_TIME_MS,
    refetchOnWindowFocus: false,
  });
}

export function openVSXInstallMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (input: OpenVSXDownloadExtensionInput) => requireExtensionsApi().install(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: openVSXQueryKeys.installed }),
  });
}

export function openVSXUninstallMutationOptions(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: (input: OpenVSXDownloadExtensionInput) => requireExtensionsApi().uninstall(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: openVSXQueryKeys.installed }),
  });
}
