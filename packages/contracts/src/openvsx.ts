import { Schema } from "effect";
import { ProjectId, TrimmedNonEmptyString } from "./baseSchemas";

export const OpenVSXFileLinks = Schema.Struct({
  download: Schema.String,
  icon: Schema.optional(Schema.String),
  readme: Schema.optional(Schema.String),
  changelog: Schema.optional(Schema.String),
  signature: Schema.optional(Schema.String),
  sha256: Schema.optional(Schema.String),
  publicKey: Schema.optional(Schema.String),
});
export type OpenVSXFileLinks = typeof OpenVSXFileLinks.Type;

export const OpenVSXExtensionReference = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: TrimmedNonEmptyString,
  url: Schema.String,
  downloadCount: Schema.optional(Schema.Number),
});
export type OpenVSXExtensionReference = typeof OpenVSXExtensionReference.Type;

export const OpenVSXExtension = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  displayName: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  version: TrimmedNonEmptyString,
  timestamp: Schema.optional(Schema.String),
  verified: Schema.optional(Schema.Boolean),
  deprecated: Schema.optional(Schema.Boolean),
  downloadCount: Schema.optional(Schema.Number),
  reviewCount: Schema.optional(Schema.Number),
  averageRating: Schema.optional(Schema.Number),
  url: Schema.String,
  files: OpenVSXFileLinks,
  categories: Schema.optional(Schema.Array(Schema.String)),
  tags: Schema.optional(Schema.Array(Schema.String)),
  engines: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  allVersions: Schema.optional(Schema.Record(Schema.String, Schema.String)),
});
export type OpenVSXExtension = typeof OpenVSXExtension.Type;

export const OpenVSXSearchOptions = Schema.Struct({
  offset: Schema.optional(Schema.Int.check(Schema.isGreaterThanOrEqualTo(0))),
  size: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThanOrEqualTo(100)),
  ),
  sortBy: Schema.optional(Schema.Literals(["relevance", "downloadCount", "rating", "timestamp"])),
});
export type OpenVSXSearchOptions = typeof OpenVSXSearchOptions.Type;

export const OpenVSXSearchResult = Schema.Struct({
  extensions: Schema.Array(OpenVSXExtension),
  offset: Schema.Int,
  totalSize: Schema.Int,
});
export type OpenVSXSearchResult = typeof OpenVSXSearchResult.Type;

export const OpenVSXVersionsResult = Schema.Struct({
  offset: Schema.Int,
  versions: Schema.Record(Schema.String, Schema.String),
});
export type OpenVSXVersionsResult = typeof OpenVSXVersionsResult.Type;

export const OpenVSXDownloadResult = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: TrimmedNonEmptyString,
  archivePath: TrimmedNonEmptyString,
  extensionPath: TrimmedNonEmptyString,
  downloadUrl: Schema.String,
  sha256: Schema.optional(Schema.String),
});
export type OpenVSXDownloadResult = typeof OpenVSXDownloadResult.Type;

export const OpenVSXInstalledExtension = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: TrimmedNonEmptyString,
  extensionPath: TrimmedNonEmptyString,
  archivePath: TrimmedNonEmptyString,
  sha256: TrimmedNonEmptyString,
  installedAt: TrimmedNonEmptyString,
});
export type OpenVSXInstalledExtension = typeof OpenVSXInstalledExtension.Type;

export const OpenVSXListInstalledResult = Schema.Struct({
  extensions: Schema.Array(OpenVSXInstalledExtension),
});
export type OpenVSXListInstalledResult = typeof OpenVSXListInstalledResult.Type;

export const OpenVSXSearchExtensionsInput = Schema.Struct({
  query: TrimmedNonEmptyString,
  options: Schema.optional(OpenVSXSearchOptions),
});
export type OpenVSXSearchExtensionsInput = typeof OpenVSXSearchExtensionsInput.Type;

export const OpenVSXGetExtensionDetailsInput = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
});
export type OpenVSXGetExtensionDetailsInput = typeof OpenVSXGetExtensionDetailsInput.Type;

export const OpenVSXDownloadExtensionInput = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: Schema.optional(TrimmedNonEmptyString),
  projectId: Schema.optional(ProjectId),
});
export type OpenVSXDownloadExtensionInput = typeof OpenVSXDownloadExtensionInput.Type;

export const OpenVSXUninstallExtensionInput = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: Schema.optional(TrimmedNonEmptyString),
});
export type OpenVSXUninstallExtensionInput = typeof OpenVSXUninstallExtensionInput.Type;

export const OpenVSXCacheExtensionInput = Schema.Struct({
  namespace: TrimmedNonEmptyString,
  name: TrimmedNonEmptyString,
  version: TrimmedNonEmptyString,
  projectId: Schema.optional(ProjectId),
});
export type OpenVSXCacheExtensionInput = typeof OpenVSXCacheExtensionInput.Type;
