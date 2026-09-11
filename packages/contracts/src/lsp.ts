import { Schema } from "effect";

export const LspServerId = Schema.String.pipe(Schema.brand("LspServerId"));
export type LspServerId = typeof LspServerId.Type;

export const LspTransport = Schema.Literals(["stdio", "tcp", "socket"]);
export type LspTransport = typeof LspTransport.Type;

export const LspServerDefinition = Schema.Struct({
  id: LspServerId,
  languageIds: Schema.Array(Schema.String.check(Schema.isMinLength(1))),
  command: Schema.String.check(Schema.isMinLength(1)),
  args: Schema.Array(Schema.String),
  transport: LspTransport,
  rootPatterns: Schema.Array(Schema.String),
  enabled: Schema.Boolean,
});
export type LspServerDefinition = typeof LspServerDefinition.Type;

export const LspDiagnosticSeverity = Schema.Literals(["error", "warning", "information", "hint"]);
export type LspDiagnosticSeverity = typeof LspDiagnosticSeverity.Type;

export const LspDiagnostic = Schema.Struct({
  uri: Schema.String.check(Schema.isMinLength(1)),
  line: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  character: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  message: Schema.String.check(Schema.isMinLength(1)),
  severity: LspDiagnosticSeverity,
  source: Schema.optional(Schema.String),
  code: Schema.optional(Schema.Union([Schema.String, Schema.Number])),
});
export type LspDiagnostic = typeof LspDiagnostic.Type;

export const LspWorkspaceCapabilities = Schema.Struct({
  completion: Schema.Boolean,
  hover: Schema.Boolean,
  definition: Schema.Boolean,
  references: Schema.Boolean,
  rename: Schema.Boolean,
  formatting: Schema.Boolean,
  diagnostics: Schema.Boolean,
});
export type LspWorkspaceCapabilities = typeof LspWorkspaceCapabilities.Type;
