import { describe, expect, it } from "vitest";

import {
  resolveCortexDesktopFlavor,
  CORTEX_CANARY_BUNDLE_ID,
  CORTEX_CANARY_DESKTOP_ENTRY_URL,
  CORTEX_CANARY_DESKTOP_ORIGIN,
  CORTEX_DESKTOP_ENTRY_URL,
  CORTEX_DESKTOP_ORIGIN,
  CORTEX_DESKTOP_UPDATE_CHANNEL,
  CORTEX_DEVELOPMENT_BUNDLE_ID,
  CORTEX_PRODUCTION_BUNDLE_ID,
  cortexDesktopIdentity,
} from "./desktopIdentity";

describe("desktopIdentity", () => {
  it("uses the exact canonical production and development bundle IDs", () => {
    expect(CORTEX_PRODUCTION_BUNDLE_ID).toBe("com.emanueledipietro.cortex");
    expect(CORTEX_DEVELOPMENT_BUNDLE_ID).toBe("com.emanueledipietro.cortex.dev");
    expect(cortexDesktopIdentity("production").bundleId).toBe(CORTEX_PRODUCTION_BUNDLE_ID);
    expect(cortexDesktopIdentity("development").bundleId).toBe(CORTEX_DEVELOPMENT_BUNDLE_ID);
  });

  it("uses the exact packaged renderer origin and entry URL", () => {
    expect(CORTEX_DESKTOP_ORIGIN).toBe("cortex://app");
    expect(CORTEX_DESKTOP_ENTRY_URL).toBe("cortex://app/index.html");
  });

  it("uses the isolated Cortex desktop update channel", () => {
    expect(CORTEX_DESKTOP_UPDATE_CHANNEL).toBe("cortex");
  });

  it("gives Canary a fully separate desktop identity and storage profile", () => {
    expect(CORTEX_CANARY_BUNDLE_ID).toBe("com.emanueledipietro.cortex.canary");
    expect(CORTEX_CANARY_DESKTOP_ORIGIN).toBe("cortex-canary://app");
    expect(CORTEX_CANARY_DESKTOP_ENTRY_URL).toBe("cortex-canary://app/index.html");
    expect(cortexDesktopIdentity("canary")).toEqual({
      flavor: "canary",
      displayName: "Cortex Canary",
      bundleId: CORTEX_CANARY_BUNDLE_ID,
      scheme: "cortex-canary",
      origin: CORTEX_CANARY_DESKTOP_ORIGIN,
      entryUrl: CORTEX_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "cortex-canary",
      defaultHomeDirectoryName: ".cortex-canary",
      usesScriptedUpdates: true,
    });
  });

  it("selects explicit source flavors without changing packaged Stable", () => {
    expect(resolveCortexDesktopFlavor({ isDevelopment: false })).toBe("production");
    expect(resolveCortexDesktopFlavor({ isDevelopment: true })).toBe("development");
    expect(
      resolveCortexDesktopFlavor({ isDevelopment: false, requestedFlavor: "development" }),
    ).toBe("production");
    expect(
      resolveCortexDesktopFlavor({
        isDevelopment: false,
        requestedFlavor: "development",
        allowDevelopmentOverride: true,
      }),
    ).toBe("development");
    expect(resolveCortexDesktopFlavor({ isDevelopment: false, requestedFlavor: " canary " })).toBe(
      "canary",
    );
    expect(resolveCortexDesktopFlavor({ isDevelopment: true, requestedFlavor: "canary" })).toBe(
      "canary",
    );
  });

  it("isolates development and Canary homes from packaged Stable", () => {
    expect(cortexDesktopIdentity("development").defaultHomeDirectoryName).toBe(".cortex-dev");
    expect(cortexDesktopIdentity("canary").defaultHomeDirectoryName).toBe(".cortex-canary");
    expect(cortexDesktopIdentity("production").defaultHomeDirectoryName).toBe(".cortex");
  });
});
