import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Instinct, InstinctProposal } from "./instincts";
import { LspDiagnostic, LspServerDefinition } from "./lsp";

describe("Cortex Instincts contracts", () => {
  it("accepts a reviewable workspace convention", () => {
    const value = Schema.decodeUnknownSync(Instinct)({
      id: "prefer-vitest",
      projectId: "cortex",
      title: "Use Vitest for tests",
      instruction: "Keep new unit tests in Vitest and place them beside the source module.",
      scope: "workspace",
      source: "user",
      status: "active",
      confidence: 1,
      evidenceCount: 2,
      createdAt: "2026-09-10T00:00:00.000Z",
      updatedAt: "2026-09-10T00:00:00.000Z",
    });
    expect(value.scope).toBe("workspace");
    expect(value.status).toBe("active");
  });

  it("rejects an instinct proposal with an invalid confidence", () => {
    expect(() =>
      Schema.decodeUnknownSync(InstinctProposal)({
        title: "Unsafe proposal",
        instruction: "Do something",
        scope: "project",
        evidence: [],
        confidence: 1.5,
      }),
    ).toThrow();
  });
});

describe("Cortex LSP contracts", () => {
  it("accepts a stdio language server definition and diagnostics", () => {
    const server = Schema.decodeUnknownSync(LspServerDefinition)({
      id: "typescript",
      languageIds: ["typescript", "javascript"],
      command: "typescript-language-server",
      args: ["--stdio"],
      transport: "stdio",
      rootPatterns: ["package.json", "tsconfig.json"],
      enabled: true,
    });
    const diagnostic = Schema.decodeUnknownSync(LspDiagnostic)({
      uri: "file:///workspace/src/index.ts",
      line: 4,
      character: 2,
      message: "Cannot find name 'workspace'.",
      severity: "error",
      source: "typescript",
      code: 2304,
    });
    expect(server.transport).toBe("stdio");
    expect(diagnostic.severity).toBe("error");
  });
});
