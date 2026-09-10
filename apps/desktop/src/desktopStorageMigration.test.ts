import * as FS from "node:fs";
import * as OS from "node:os";
import * as Path from "node:path";

import { describe, expect, it } from "vitest";

import {
  acknowledgeCortexStorageSnapshot,
  readCortexStorageSnapshot,
  CORTEX_STORAGE_SNAPSHOT_MAX_BYTES,
  validateCortexStorageSnapshot,
} from "./desktopStorageMigration";

const snapshot = () => ({
  version: 1 as const,
  exportedAt: "2026-07-09T00:00:00.000Z",
  entries: {
    "cortex:theme": "dark",
    "cortex.openUsage.enabled": "true",
  },
});

describe("desktopStorageMigration", () => {
  it("reads a legacy snapshot and removes it after acknowledgement", async () => {
    const directory = FS.mkdtempSync(Path.join(OS.tmpdir(), "cortex-storage-migration-"));
    const target = Path.join(directory, "snapshot.json");
    try {
      FS.writeFileSync(target, `${JSON.stringify(snapshot())}\n`);
      expect(readCortexStorageSnapshot(target)).toEqual(snapshot());

      await acknowledgeCortexStorageSnapshot(target);
      expect(readCortexStorageSnapshot(target)).toBeNull();
    } finally {
      FS.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects malformed, disallowed, and oversized snapshots", () => {
    expect(validateCortexStorageSnapshot({ version: 1 })).toBeNull();
    expect(
      validateCortexStorageSnapshot({
        ...snapshot(),
        entries: { "foreign:theme": "dark" },
      }),
    ).toBeNull();
    expect(
      validateCortexStorageSnapshot({
        ...snapshot(),
        entries: { "cortex:large": "x".repeat(CORTEX_STORAGE_SNAPSHOT_MAX_BYTES) },
      }),
    ).toBeNull();
  });

  it("accepts renderer snapshots containing large composer drafts", () => {
    const largeDraft = "x".repeat(2 * 1024 * 1024);

    expect(
      validateCortexStorageSnapshot({
        ...snapshot(),
        entries: { "cortex:composer-drafts:v1": largeDraft },
      })?.entries["cortex:composer-drafts:v1"],
    ).toBe(largeDraft);
  });

  it("treats missing and malformed files as absent", () => {
    const directory = FS.mkdtempSync(Path.join(OS.tmpdir(), "cortex-storage-migration-"));
    const target = Path.join(directory, "snapshot.json");
    try {
      expect(readCortexStorageSnapshot(target)).toBeNull();
      FS.writeFileSync(target, "not json");
      expect(readCortexStorageSnapshot(target)).toBeNull();
    } finally {
      FS.rmSync(directory, { recursive: true, force: true });
    }
  });
});
