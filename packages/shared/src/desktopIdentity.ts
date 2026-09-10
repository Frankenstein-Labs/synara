// FILE: desktopIdentity.ts
// Purpose: Defines the canonical desktop application identity across packaging and runtime.

export const CORTEX_DESKTOP_SCHEME = "cortex";
export const CORTEX_DESKTOP_ORIGIN = `${CORTEX_DESKTOP_SCHEME}://app`;
export const CORTEX_DESKTOP_ENTRY_URL = `${CORTEX_DESKTOP_ORIGIN}/index.html`;
export const CORTEX_DESKTOP_UPDATE_CHANNEL = "cortex";
export const CORTEX_PRODUCTION_BUNDLE_ID = "com.emanueledipietro.cortex";
export const CORTEX_DEVELOPMENT_BUNDLE_ID = `${CORTEX_PRODUCTION_BUNDLE_ID}.dev`;
export const CORTEX_CANARY_BUNDLE_ID = `${CORTEX_PRODUCTION_BUNDLE_ID}.canary`;
export const CORTEX_CANARY_DESKTOP_SCHEME = "cortex-canary";
export const CORTEX_CANARY_DESKTOP_ORIGIN = `${CORTEX_CANARY_DESKTOP_SCHEME}://app`;
export const CORTEX_CANARY_DESKTOP_ENTRY_URL = `${CORTEX_CANARY_DESKTOP_ORIGIN}/index.html`;
export const CORTEX_SOURCE_DESKTOP_BUILD_MARKER = "cortex-source-desktop-build-v2";
export const CORTEX_DESKTOP_SMOKE_USER_DATA_ENV = "CORTEX_DESKTOP_SMOKE_USER_DATA";

export type CortexDesktopFlavor = "production" | "development" | "canary";

export interface CortexDesktopIdentity {
  readonly flavor: CortexDesktopFlavor;
  readonly displayName: string;
  readonly bundleId: string;
  readonly scheme: string;
  readonly origin: string;
  readonly entryUrl: string;
  readonly userDataDirectoryName: string;
  readonly defaultHomeDirectoryName: string;
  readonly usesScriptedUpdates: boolean;
}

export function resolveCortexDesktopFlavor(input: {
  readonly isDevelopment: boolean;
  readonly requestedFlavor?: string | undefined;
  readonly allowDevelopmentOverride?: boolean | undefined;
}): CortexDesktopFlavor {
  const requestedFlavor = input.requestedFlavor?.trim().toLowerCase();
  if (requestedFlavor === "canary") {
    return "canary";
  }
  if (
    requestedFlavor === "development" &&
    (input.isDevelopment || input.allowDevelopmentOverride === true)
  ) {
    return "development";
  }
  return input.isDevelopment ? "development" : "production";
}

export function cortexDesktopIdentity(flavor: CortexDesktopFlavor): CortexDesktopIdentity {
  if (flavor === "canary") {
    return {
      flavor,
      displayName: "Cortex Canary",
      bundleId: CORTEX_CANARY_BUNDLE_ID,
      scheme: CORTEX_CANARY_DESKTOP_SCHEME,
      origin: CORTEX_CANARY_DESKTOP_ORIGIN,
      entryUrl: CORTEX_CANARY_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "cortex-canary",
      defaultHomeDirectoryName: ".cortex-canary",
      usesScriptedUpdates: true,
    };
  }
  if (flavor === "development") {
    return {
      flavor,
      displayName: "Cortex (Dev)",
      bundleId: CORTEX_DEVELOPMENT_BUNDLE_ID,
      scheme: CORTEX_DESKTOP_SCHEME,
      origin: CORTEX_DESKTOP_ORIGIN,
      entryUrl: CORTEX_DESKTOP_ENTRY_URL,
      userDataDirectoryName: "cortex-dev",
      defaultHomeDirectoryName: ".cortex-dev",
      usesScriptedUpdates: false,
    };
  }
  return {
    flavor,
    displayName: "Cortex",
    bundleId: CORTEX_PRODUCTION_BUNDLE_ID,
    scheme: CORTEX_DESKTOP_SCHEME,
    origin: CORTEX_DESKTOP_ORIGIN,
    entryUrl: CORTEX_DESKTOP_ENTRY_URL,
    userDataDirectoryName: "cortex",
    defaultHomeDirectoryName: ".cortex",
    usesScriptedUpdates: false,
  };
}
