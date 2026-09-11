import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import * as Path from "node:path";
import { promisify } from "node:util";

import type { OpenVSXDownloadResult } from "@cortex/contracts";
import { Data, Effect, Layer, ServiceMap } from "effect";
import { OpenVSXService } from "../../openvsx/Services/OpenVSXService";

const execFileAsync = promisify(execFile);

export interface LanguageServerCandidate {
  readonly languageId: string;
  readonly namespace: string;
  readonly name: string;
  readonly executableRelativePath?: string;
}

export interface LanguageServerResolution {
  readonly source: "local" | "openvsx";
  readonly command: string | null;
  readonly extensionPath: string | null;
  readonly package: OpenVSXDownloadResult | null;
}

export class LanguageServerManagerError extends Data.TaggedError("LanguageServerManagerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface LanguageServerManagerShape {
  readonly ensureServer: (
    candidate: LanguageServerCandidate,
    localCommand?: string,
  ) => Effect.Effect<LanguageServerResolution, LanguageServerManagerError>;
}

type OpenVSXDownloadProvider = Pick<
  import("../../openvsx/Services/OpenVSXService").OpenVSXServiceShape,
  "downloadExtension"
>;

export class LanguageServerManager extends ServiceMap.Service<
  LanguageServerManager,
  LanguageServerManagerShape
>()("cortex/lsp/Services/LanguageServerManager") {}

const localCommandExists = async (command: string): Promise<boolean> => {
  try {
    await execFileAsync("which", [command]);
    return true;
  } catch {
    return false;
  }
};

const readStaticServerEntrypoint = async (extensionPath: string, relativePath: string) => {
  const entrypoint = Path.resolve(extensionPath, relativePath);
  if (!entrypoint.startsWith(`${Path.resolve(extensionPath)}${Path.sep}`)) {
    throw new Error("Language server entrypoint escapes the extension directory");
  }
  await access(entrypoint);
  return entrypoint;
};

export const makeLanguageServerManager = (
  openVSX: OpenVSXDownloadProvider,
): LanguageServerManagerShape => {
  const openVSXService = openVSX;
  return {
    ensureServer: (candidate, localCommand) =>
      Effect.tryPromise({
        try: async (): Promise<LanguageServerResolution> => {
          if (localCommand && (await localCommandExists(localCommand))) {
            return { source: "local", command: localCommand, extensionPath: null, package: null };
          }
          const downloaded = await Effect.runPromise(
            openVSXService.downloadExtension({
              namespace: candidate.namespace,
              name: candidate.name,
            }),
          );
          if (candidate.executableRelativePath) {
            await readStaticServerEntrypoint(
              downloaded.extensionPath,
              candidate.executableRelativePath,
            );
          } else {
            // Reading package.json is deliberately limited to discovery. Cortex does
            // not execute extension JavaScript in the server process.
            await readFile(Path.join(downloaded.extensionPath, "package.json"), "utf8");
          }
          return {
            source: "openvsx",
            command: null,
            extensionPath: downloaded.extensionPath,
            package: downloaded,
          };
        },
        catch: (cause) =>
          new LanguageServerManagerError({
            message: cause instanceof Error ? cause.message : String(cause),
            cause,
          }),
      }),
  };
};

export const LanguageServerManagerLive = Layer.effect(
  LanguageServerManager,
  Effect.gen(function* () {
    const openVSX = yield* OpenVSXService;
    return makeLanguageServerManager(openVSX);
  }),
);
