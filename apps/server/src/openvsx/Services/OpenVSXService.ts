import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import * as Path from "node:path";

import type {
  OpenVSXDownloadExtensionInput,
  OpenVSXDownloadResult,
  OpenVSXExtension,
  OpenVSXGetExtensionDetailsInput,
  OpenVSXInstalledExtension,
  OpenVSXListInstalledResult,
  OpenVSXSearchExtensionsInput,
  OpenVSXSearchResult,
  OpenVSXUninstallExtensionInput,
} from "@cortex/contracts";
import { Data, Effect, Layer, ServiceMap } from "effect";

const execFileAsync = promisify(execFile);
const DEFAULT_REGISTRY_URL = "https://open-vsx.org/api";
const MAX_ARCHIVE_BYTES = 250 * 1024 * 1024;
type OpenVSXFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class OpenVSXError extends Data.TaggedError("OpenVSXError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface OpenVSXServiceShape {
  readonly searchExtensions: (
    input: OpenVSXSearchExtensionsInput,
  ) => Effect.Effect<OpenVSXSearchResult, OpenVSXError>;
  readonly getExtensionDetails: (
    input: OpenVSXGetExtensionDetailsInput,
  ) => Effect.Effect<OpenVSXExtension, OpenVSXError>;
  readonly downloadExtension: (
    input: OpenVSXDownloadExtensionInput,
  ) => Effect.Effect<OpenVSXDownloadResult, OpenVSXError>;
  readonly listInstalledExtensions: () => Effect.Effect<OpenVSXListInstalledResult, OpenVSXError>;
  readonly installExtension: (
    input: OpenVSXDownloadExtensionInput,
  ) => Effect.Effect<OpenVSXInstalledExtension, OpenVSXError>;
  readonly uninstallExtension: (
    input: OpenVSXUninstallExtensionInput,
  ) => Effect.Effect<void, OpenVSXError>;
}

export class OpenVSXService extends ServiceMap.Service<OpenVSXService, OpenVSXServiceShape>()(
  "cortex/openvsx/Services/OpenVSXService",
) {}

export interface OpenVSXServiceOptions {
  readonly registryUrl?: string;
  readonly cacheRoot: string;
  readonly fetch?: OpenVSXFetch;
}

const safeSegment = (value: string, label: string): string => {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value === "." || value === "..") {
    throw new Error(`Invalid ${label}`);
  }
  return value;
};

const isWithin = (root: string, candidate: string): boolean => {
  const relative = Path.relative(Path.resolve(root), Path.resolve(candidate));
  return relative.length > 0 && !relative.startsWith("..") && !Path.isAbsolute(relative);
};

const urlSegment = (value: string, label: string): string =>
  encodeURIComponent(safeSegment(value, label));

const responseJson = async <T>(response: Response, operation: string): Promise<T> => {
  if (!response.ok) {
    throw new Error(`${operation} failed with HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

const extractArchive = async (archivePath: string, extensionPath: string): Promise<void> => {
  const { stdout } = await execFileAsync("unzip", ["-Z1", archivePath], {
    maxBuffer: 4 * 1024 * 1024,
  });
  for (const entry of stdout.split("\n").filter(Boolean)) {
    const normalized = entry.replaceAll("\\", "/");
    if (normalized.startsWith("/") || normalized.split("/").includes("..")) {
      throw new Error(`Unsafe VSIX archive entry: ${entry}`);
    }
  }
  await mkdir(extensionPath, { recursive: true });
  await execFileAsync("unzip", ["-q", archivePath, "-d", extensionPath]);
};

const assertSafeExtractedTree = async (current: string): Promise<void> => {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = Path.join(current, entry.name);
    const stat = await lstat(entryPath);
    if (stat.isSymbolicLink()) throw new Error(`Symlink is not allowed in VSIX: ${entry.name}`);
    if (entry.isDirectory()) await assertSafeExtractedTree(entryPath);
  }
};

const readManifest = async (extensionPath: string): Promise<Record<string, unknown>> => {
  const manifestPath = Path.join(extensionPath, "extension", "package.json");
  const raw = await readFile(manifestPath, "utf8");
  const manifest: unknown = JSON.parse(raw);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("VSIX package.json must contain an object manifest");
  }
  const record = manifest as Record<string, unknown>;
  if (typeof record.name !== "string" || typeof record.version !== "string") {
    throw new Error("VSIX manifest must declare name and version");
  }
  if (
    record.contributes !== undefined &&
    (typeof record.contributes !== "object" || record.contributes === null)
  ) {
    throw new Error("VSIX manifest contributions must be an object");
  }
  return record;
};

export const makeOpenVSXService = (options: OpenVSXServiceOptions): OpenVSXServiceShape => {
  const registryUrl = (options.registryUrl ?? DEFAULT_REGISTRY_URL).replace(/\/$/, "");
  const request = options.fetch ?? globalThis.fetch;
  if (!request) throw new Error("Fetch is not available in this runtime");
  const registryPath = Path.join(options.cacheRoot, "installed.json");

  const readInstalled = async (): Promise<OpenVSXInstalledExtension[]> => {
    try {
      const value: unknown = JSON.parse(await readFile(registryPath, "utf8"));
      return Array.isArray(value) ? (value as OpenVSXInstalledExtension[]) : [];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  };

  const writeInstalled = async (extensions: OpenVSXInstalledExtension[]): Promise<void> => {
    await mkdir(options.cacheRoot, { recursive: true });
    const temporaryPath = `${registryPath}.tmp-${process.pid}`;
    await writeFile(temporaryPath, `${JSON.stringify(extensions, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, registryPath);
  };

  const searchExtensions = (input: OpenVSXSearchExtensionsInput) =>
    Effect.tryPromise({
      try: async (): Promise<OpenVSXSearchResult> => {
        const params = new URLSearchParams({ query: input.query });
        if (input.options?.offset !== undefined) params.set("offset", String(input.options.offset));
        if (input.options?.size !== undefined) params.set("size", String(input.options.size));
        if (input.options?.sortBy !== undefined) params.set("sortBy", input.options.sortBy);
        const response = await request(`${registryUrl}/-/search?${params}`);
        return responseJson<OpenVSXSearchResult>(response, "Open VSX search");
      },
      catch: (error) => error,
    }).pipe(
      Effect.mapError(
        (error) =>
          new OpenVSXError({
            operation: "searchExtensions",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      ),
    );

  const getExtensionDetails = (input: OpenVSXGetExtensionDetailsInput) =>
    Effect.tryPromise({
      try: async (): Promise<OpenVSXExtension> => {
        const response = await request(
          `${registryUrl}/${urlSegment(input.namespace, "namespace")}/${urlSegment(input.name, "extension")}`,
        );
        return responseJson<OpenVSXExtension>(response, "Open VSX extension details");
      },
      catch: (error) => error,
    }).pipe(
      Effect.mapError(
        (error) =>
          new OpenVSXError({
            operation: "getExtensionDetails",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      ),
    );

  const downloadExtension = (input: OpenVSXDownloadExtensionInput) =>
    Effect.tryPromise({
      try: async (): Promise<OpenVSXDownloadResult> => {
        const namespace = safeSegment(input.namespace, "namespace");
        const name = safeSegment(input.name, "extension");
        const details = await Effect.runPromise(
          input.version
            ? getExtensionDetails({ namespace, name }).pipe(
                Effect.flatMap((extension) => {
                  const versionUrl = extension.allVersions?.[input.version!];
                  if (!versionUrl) {
                    return Effect.fail(
                      new OpenVSXError({
                        operation: "downloadExtension",
                        message: `Version ${input.version} not found`,
                      }),
                    );
                  }
                  return Effect.tryPromise({
                    try: async () =>
                      responseJson<OpenVSXExtension>(
                        await request(versionUrl),
                        "Open VSX version details",
                      ),
                    catch: (error) => error,
                  });
                }),
              )
            : getExtensionDetails({ namespace, name }),
        );
        const version = input.version ?? details.version;
        const downloadUrl = details.files.download;
        const response = await request(downloadUrl);
        if (!response.ok) throw new Error(`VSIX download failed with HTTP ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength > MAX_ARCHIVE_BYTES)
          throw new Error("VSIX archive exceeds the size limit");
        const versionDir = Path.join(
          options.cacheRoot,
          namespace,
          name,
          safeSegment(version, "version"),
        );
        const archivePath = Path.join(versionDir, `${namespace}.${name}-${version}.vsix`);
        const extensionPath = Path.join(versionDir, "extension");
        await mkdir(versionDir, { recursive: true });
        const temporaryArchivePath = `${archivePath}.tmp-${process.pid}`;
        await writeFile(temporaryArchivePath, bytes);
        try {
          await rm(extensionPath, { recursive: true, force: true });
          await extractArchive(temporaryArchivePath, extensionPath);
          await rename(temporaryArchivePath, archivePath);
        } catch (error) {
          await rm(temporaryArchivePath, { force: true }).catch(() => undefined);
          throw error;
        }
        const sha256 = createHash("sha256")
          .update(await readFile(archivePath))
          .digest("hex");
        return {
          namespace,
          name,
          version,
          archivePath,
          extensionPath,
          downloadUrl,
          sha256,
        } satisfies OpenVSXDownloadResult;
      },
      catch: (error) => error,
    }).pipe(
      Effect.mapError((error) =>
        error instanceof OpenVSXError
          ? error
          : new OpenVSXError({
              operation: "downloadExtension",
              message: error instanceof Error ? error.message : String(error),
              cause: error,
            }),
      ),
    );

  const listInstalledExtensions = () =>
    Effect.tryPromise({
      try: async (): Promise<OpenVSXListInstalledResult> => ({ extensions: await readInstalled() }),
      catch: (error) => error,
    }).pipe(
      Effect.mapError(
        (error) =>
          new OpenVSXError({
            operation: "listInstalledExtensions",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      ),
    );

  const installExtension = (input: OpenVSXDownloadExtensionInput) =>
    Effect.tryPromise({
      try: async (): Promise<OpenVSXInstalledExtension> => {
        const downloaded = await Effect.runPromise(downloadExtension(input));
        await assertSafeExtractedTree(downloaded.extensionPath);
        await readManifest(downloaded.extensionPath);
        const installed: OpenVSXInstalledExtension = {
          namespace: downloaded.namespace,
          name: downloaded.name,
          version: downloaded.version,
          extensionPath: downloaded.extensionPath,
          archivePath: downloaded.archivePath,
          sha256: downloaded.sha256 ?? "",
          installedAt: new Date().toISOString(),
        };
        const existing = await readInstalled();
        const next = existing.filter(
          (item) => !(item.namespace === installed.namespace && item.name === installed.name),
        );
        await writeInstalled([...next, installed]);
        return installed;
      },
      catch: (error) => error,
    }).pipe(
      Effect.mapError(
        (error) =>
          new OpenVSXError({
            operation: "installExtension",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      ),
    );

  const uninstallExtension = (input: OpenVSXUninstallExtensionInput) =>
    Effect.tryPromise({
      try: async (): Promise<void> => {
        const installed = await readInstalled();
        const matches = installed.filter(
          (item) =>
            item.namespace === input.namespace &&
            item.name === input.name &&
            (input.version === undefined || item.version === input.version),
        );
        if (matches.length === 0) throw new Error("Extension is not installed");
        for (const item of matches) {
          const versionDirectory = Path.dirname(item.archivePath);
          if (!isWithin(options.cacheRoot, versionDirectory)) {
            throw new Error("Installed extension path is outside the Open VSX cache");
          }
          await rm(versionDirectory, { recursive: true, force: true });
        }
        await writeInstalled(
          installed.filter(
            (item) =>
              !matches.some(
                (match) =>
                  match.namespace === item.namespace &&
                  match.name === item.name &&
                  match.version === item.version,
              ),
          ),
        );
      },
      catch: (error) => error,
    }).pipe(
      Effect.mapError(
        (error) =>
          new OpenVSXError({
            operation: "uninstallExtension",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      ),
    );

  return {
    searchExtensions,
    getExtensionDetails,
    downloadExtension,
    listInstalledExtensions,
    installExtension,
    uninstallExtension,
  };
};

export const makeOpenVSXServiceLive = (options: OpenVSXServiceOptions) =>
  Layer.succeed(OpenVSXService, makeOpenVSXService(options));

export const OpenVSXServiceLive = makeOpenVSXServiceLive({
  cacheRoot: Path.join(
    process.env.CORTEX_HOME ?? Path.join(process.env.HOME ?? ".", ".cortex"),
    "cache",
    "openvsx",
  ),
});
