import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { Effect } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { makeOpenVSXService } from "./OpenVSXService";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

const tempDirectory = async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "cortex-openvsx-test-"));
  tempDirectories.push(directory);
  return directory;
};

describe("OpenVSXService", () => {
  it("parses search and extension detail responses through the public API shape", async () => {
    const calls: string[] = [];
    const service = makeOpenVSXService({
      cacheRoot: await tempDirectory(),
      fetch: async (input) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("/-/search")) {
          return new Response(
            JSON.stringify({
              extensions: [
                {
                  namespace: "redhat",
                  name: "java",
                  displayName: "Language Support for Java",
                  description: "Java language server",
                  version: "1.57.2026090408",
                  url: "https://open-vsx.org/api/redhat/java",
                  files: { download: "https://example.test/java.vsix" },
                },
              ],
              offset: 0,
              totalSize: 1,
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            namespace: "redhat",
            name: "java",
            displayName: "Language Support for Java",
            version: "1.57.2026090408",
            url: "https://open-vsx.org/api/redhat/java",
            files: { download: "https://example.test/java.vsix" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    const search = await Effect.runPromise(service.searchExtensions({ query: "java" }));
    const details = await Effect.runPromise(
      service.getExtensionDetails({ namespace: "redhat", name: "java" }),
    );
    expect(search.extensions[0]?.name).toBe("java");
    expect(details.files.download).toBe("https://example.test/java.vsix");
    expect(calls).toHaveLength(2);
  });

  it("downloads and extracts a VSIX into the isolated Cortex cache", async () => {
    const root = await tempDirectory();
    const source = path.join(root, "extension");
    const archive = path.join(root, "java.vsix");
    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "java" }));
    await writeFile(path.join(root, "server.js"), "static server asset");
    execFileSync("zip", ["-q", archive, "package.json", "server.js"], { cwd: root });
    const archiveBytes = await readFile(archive);

    const service = makeOpenVSXService({
      cacheRoot: path.join(root, "cache"),
      fetch: async (input) => {
        const url = String(input);
        if (url.endsWith("/redhat/java")) {
          return new Response(
            JSON.stringify({
              namespace: "redhat",
              name: "java",
              version: "1.0.0",
              url: "https://open-vsx.org/api/redhat/java",
              files: { download: "https://example.test/java.vsix" },
            }),
            { status: 200 },
          );
        }
        return new Response(archiveBytes, { status: 200 });
      },
    });

    const result = await Effect.runPromise(
      service.downloadExtension({ namespace: "redhat", name: "java" }),
    );
    expect(result.version).toBe("1.0.0");
    expect(await readFile(path.join(result.extensionPath, "server.js"), "utf8")).toBe(
      "static server asset",
    );
    expect(result.sha256).toHaveLength(64);
  });

  it("rejects path traversal in extension identifiers", async () => {
    const service = makeOpenVSXService({
      cacheRoot: await tempDirectory(),
      fetch: globalThis.fetch,
    });
    await expect(
      Effect.runPromise(service.getExtensionDetails({ namespace: "../escape", name: "java" })),
    ).rejects.toMatchObject({ _tag: "OpenVSXError" });
  });
});
