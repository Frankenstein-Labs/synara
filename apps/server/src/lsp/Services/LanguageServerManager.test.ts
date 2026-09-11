import { mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { makeLanguageServerManager } from "./LanguageServerManager";

const packageResult = (root: string) => ({
  namespace: "cortex",
  name: "typescript-language-server",
  version: "1.0.0",
  archivePath: path.join(root, "package.vsix"),
  extensionPath: path.join(root, "extension"),
  downloadUrl: "https://example.test/package.vsix",
});

describe("LanguageServerManager", () => {
  it("prefers an installed local server", async () => {
    const manager = makeLanguageServerManager({
      downloadExtension: () => Effect.die("Open VSX must not be called"),
    });
    const result = await Effect.runPromise(
      manager.ensureServer(
        { languageId: "typescript", namespace: "cortex", name: "typescript-language-server" },
        "node",
      ),
    );
    expect(result.source).toBe("local");
    expect(result.command).toBe("node");
  });

  it("uses Open VSX for a static server package and validates package metadata", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "cortex-lsp-test-"));
    const extensionPath = path.join(root, "extension");
    await import("node:fs/promises").then(({ mkdir }) => mkdir(extensionPath, { recursive: true }));
    await writeFile(path.join(extensionPath, "package.json"), JSON.stringify({ contributes: {} }));
    const manager = makeLanguageServerManager({
      downloadExtension: () => Effect.succeed(packageResult(root)),
    });
    try {
      const result = await Effect.runPromise(
        manager.ensureServer({
          languageId: "typescript",
          namespace: "cortex",
          name: "typescript-language-server",
        }),
      );
      expect(result.source).toBe("openvsx");
      expect(result.extensionPath).toBe(extensionPath);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
