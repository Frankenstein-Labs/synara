import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  CORTEX_DESKTOP_SMOKE_USER_DATA_ENV,
  CORTEX_SOURCE_DESKTOP_BUILD_MARKER,
} from "@cortex/shared/desktopIdentity";
import { spawnSourceDesktop } from "./source-desktop-launch.mjs";

function captureSourceDesktopSpawn(environment, overrides = {}) {
  const child = { on: vi.fn() };
  const spawnProcess = vi.fn(() => child);

  const result = spawnSourceDesktop({
    desktopDirectory: "/workspace/apps/desktop",
    electronPath: "/runtime/electron",
    environment,
    homeDirectory: "/Users/tester",
    platform: "darwin",
    readBuiltMain: () => CORTEX_SOURCE_DESKTOP_BUILD_MARKER,
    spawnProcess,
    ...overrides,
  });

  return { child, result, spawnProcess };
}

describe("source desktop launch", () => {
  it("spawns current source builds with an isolated development environment", () => {
    const environment = {
      ELECTRON_RUN_AS_NODE: "1",
      PATH: "/usr/bin",
    };

    const { child, result, spawnProcess } = captureSourceDesktopSpawn(environment);

    expect(result).toBe(child);
    expect(spawnProcess).toHaveBeenCalledWith("/runtime/electron", ["dist-electron/main.js"], {
      cwd: "/workspace/apps/desktop",
      env: {
        PATH: "/usr/bin",
        CORTEX_DESKTOP_FLAVOR: "development",
        CORTEX_HOME: join("/Users/tester", ".cortex-dev"),
        CORTEX_SOURCE_DESKTOP_BUILD_MARKER,
      },
      stdio: "inherit",
    });
    expect(environment).toEqual({
      ELECTRON_RUN_AS_NODE: "1",
      PATH: "/usr/bin",
    });
  });

  it("preserves an explicit Cortex home", () => {
    const readWindowsEnvironment = vi.fn(() => ({
      CORTEX_HOME: "C:\\Users\\tester\\persisted-cortex-home",
    }));
    const { spawnProcess } = captureSourceDesktopSpawn(
      { CORTEX_HOME: "/tmp/custom-cortex-home" },
      { platform: "win32", readWindowsEnvironment },
    );

    expect(spawnProcess.mock.calls[0][2].env).toMatchObject({
      CORTEX_DESKTOP_FLAVOR: "development",
      CORTEX_HOME: "/tmp/custom-cortex-home",
    });
    expect(readWindowsEnvironment).not.toHaveBeenCalled();
  });

  it("preserves a persisted Windows Cortex home", () => {
    const { spawnProcess } = captureSourceDesktopSpawn(
      {},
      {
        platform: "win32",
        readWindowsEnvironment: () => ({
          Cortex_Home: "C:\\Users\\tester\\persisted-cortex-home",
        }),
      },
    );

    expect(spawnProcess.mock.calls[0][2].env.CORTEX_HOME).toBe(
      "C:\\Users\\tester\\persisted-cortex-home",
    );
  });

  it("preserves Canary flavor and storage defaults", () => {
    const { spawnProcess } = captureSourceDesktopSpawn({
      CORTEX_DESKTOP_FLAVOR: "canary",
    });

    expect(spawnProcess.mock.calls[0][2].env).toMatchObject({
      CORTEX_DESKTOP_FLAVOR: "canary",
      CORTEX_HOME: join("/Users/tester", ".cortex-canary"),
    });
  });

  it("guards and spawns the smoke desktop with its isolated environment", () => {
    const smokeHome = "/tmp/cortex-desktop-smoke";
    const smokeUserData = join(smokeHome, "electron-user-data");
    const stdio = ["pipe", "pipe", "pipe"];
    const { spawnProcess } = captureSourceDesktopSpawn(
      {
        CORTEX_HOME: smokeHome,
        [CORTEX_DESKTOP_SMOKE_USER_DATA_ENV]: smokeUserData,
      },
      { stdio },
    );

    expect(spawnProcess.mock.calls[0][2].env).toMatchObject({
      CORTEX_HOME: smokeHome,
      [CORTEX_DESKTOP_SMOKE_USER_DATA_ENV]: smokeUserData,
    });
    expect(spawnProcess.mock.calls[0][2].stdio).toBe(stdio);
  });

  it("rejects stale built desktop output before spawning Electron", () => {
    const spawnProcess = vi.fn();

    expect(() =>
      spawnSourceDesktop({
        desktopDirectory: "/workspace/apps/desktop",
        electronPath: "/runtime/electron",
        environment: {},
        homeDirectory: "/Users/tester",
        platform: "darwin",
        readBuiltMain: () => "stale desktop output",
        spawnProcess,
      }),
    ).toThrow(/desktop build is stale/i);
    expect(spawnProcess).not.toHaveBeenCalled();
  });
});
