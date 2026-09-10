/**
 * Public contracts for the Cortex agent-control gateway.
 *
 * New gateway tools decode these schemas before doing any work. Keeping the
 * limits here ensures the MCP surface, server implementation, and tests share
 * the same definition of an exact creation/wait plan.
 */
import { Schema } from "effect";

import { ProjectId, ThreadId, TurnId } from "./baseSchemas";
import { ModelSelection, ProviderKind } from "./orchestration";
import { ProviderModelDescriptor } from "./providerDiscovery";
import { ServerProviderAuthStatus } from "./server";

export const CORTEX_GATEWAY_MAX_THREADS_PER_OPERATION = 20;
export const CORTEX_GATEWAY_MAX_REQUEST_ID_LENGTH = 256;
export const CORTEX_GATEWAY_MAX_WAIT_MS = 60_000;

export const CortexGatewayErrorCode = Schema.Literals([
  "caller_session_inactive",
  "caller_turn_inactive",
  "capability_denied",
  "provider_unavailable",
  "model_unavailable",
  "model_option_unavailable",
  "idempotency_conflict",
  "creation_plan_locked",
  "creation_limit_exceeded",
  "thread_not_found",
  "wait_timed_out",
  "operation_failed",
]);
export type CortexGatewayErrorCode = typeof CortexGatewayErrorCode.Type;

export const CortexGatewayError = Schema.Struct({
  code: CortexGatewayErrorCode,
  message: Schema.String,
  details: Schema.optional(Schema.Unknown),
});
export type CortexGatewayError = typeof CortexGatewayError.Type;

export const CortexGatewayErrorResult = Schema.Struct({
  error: CortexGatewayError,
});
export type CortexGatewayErrorResult = typeof CortexGatewayErrorResult.Type;

export const CortexContextResult = Schema.Struct({
  harness: Schema.Struct({
    name: Schema.Literal("Cortex"),
    policyVersion: Schema.String,
  }),
  caller: Schema.Struct({
    threadId: ThreadId,
    turnId: Schema.NullOr(TurnId),
    provider: ProviderKind,
    projectId: ProjectId,
  }),
  capabilities: Schema.Struct({
    threadRead: Schema.Boolean,
    threadCreate: Schema.Boolean,
    threadWait: Schema.Boolean,
    automations: Schema.Boolean,
  }),
});
export type CortexContextResult = typeof CortexContextResult.Type;

export const CortexCreateThreadSpec = Schema.Struct({
  prompt: Schema.String.check(Schema.isNonEmpty()),
  title: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  target: ModelSelection,
  projectId: Schema.optional(ProjectId),
  environment: Schema.optional(Schema.Literals(["local", "worktree"])),
  baseRef: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  // Legacy inputs remain decodable for replay/backward compatibility, but the
  // MCP catalog no longer advertises branch-backed worktree creation.
  baseBranch: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  branchName: Schema.optional(Schema.String.check(Schema.isNonEmpty())),
  runtimeMode: Schema.optional(Schema.Literals(["approval-required", "full-access"])),
});
export type CortexCreateThreadSpec = typeof CortexCreateThreadSpec.Type;

const CortexGatewayRequestId = Schema.String.check(Schema.isNonEmpty()).check(
  Schema.isMaxLength(CORTEX_GATEWAY_MAX_REQUEST_ID_LENGTH),
);

export const CortexCreateThreadsInput = Schema.Struct({
  requestId: CortexGatewayRequestId,
  threads: Schema.Array(CortexCreateThreadSpec)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(CORTEX_GATEWAY_MAX_THREADS_PER_OPERATION)),
}).annotate({ parseOptions: { onExcessProperty: "error" } });
export type CortexCreateThreadsInput = typeof CortexCreateThreadsInput.Type;

export const CortexProviderCatalog = Schema.Struct({
  provider: ProviderKind,
  defaultModel: Schema.NullOr(Schema.String),
  models: Schema.Array(ProviderModelDescriptor),
  enabled: Schema.Boolean,
  available: Schema.Boolean,
  authStatus: Schema.optional(ServerProviderAuthStatus),
  source: Schema.optional(Schema.String),
  error: Schema.optional(Schema.String),
});
export type CortexProviderCatalog = typeof CortexProviderCatalog.Type;

export const CortexGatewayTargetOptionValue = Schema.Union([
  Schema.String,
  Schema.Number,
  Schema.Boolean,
]);
export type CortexGatewayTargetOptionValue = typeof CortexGatewayTargetOptionValue.Type;

export const CortexGatewayTargetOptionRule = Schema.Struct({
  key: Schema.String,
  valueType: Schema.Literals(["string", "number", "boolean"]),
  allowedValues: Schema.Array(CortexGatewayTargetOptionValue),
  allowedValuesSource: Schema.Literals(["provider-contract", "model-discovery"]),
});
export type CortexGatewayTargetOptionRule = typeof CortexGatewayTargetOptionRule.Type;

export const CortexGatewayTargetConstruction = Schema.Struct({
  modelValueSource: Schema.Literal("providers[].models[].slug"),
  primaryOptionKey: Schema.String,
  alternativeOptionKeys: Schema.Array(Schema.String),
  optionSelectionRule: Schema.String,
  providerOptions: Schema.Array(CortexGatewayTargetOptionRule),
  optionsByModel: Schema.Record(Schema.String, Schema.Array(CortexGatewayTargetOptionRule)),
  exampleTarget: Schema.NullOr(ModelSelection),
});
export type CortexGatewayTargetConstruction = typeof CortexGatewayTargetConstruction.Type;

export const CortexCapabilitiesResult = Schema.Struct({
  targetConstruction: Schema.Record(Schema.String, CortexGatewayTargetConstruction),
  providers: Schema.Array(CortexProviderCatalog),
  limits: Schema.Struct({
    maxThreadsPerOperation: Schema.Int,
    maxWaitMs: Schema.Int,
    oneCreationPlanPerActiveTurn: Schema.Boolean,
  }),
});
export type CortexCapabilitiesResult = typeof CortexCapabilitiesResult.Type;

export const CortexCreatedThreadResult = Schema.Struct({
  index: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  threadId: ThreadId,
  projectId: ProjectId,
  title: Schema.String,
  target: ModelSelection,
  provider: ProviderKind,
  model: Schema.String,
  runtimeMode: Schema.Literals(["approval-required", "full-access"]),
  environment: Schema.Literals(["local", "worktree"]),
  branch: Schema.NullOr(Schema.String),
  worktreePath: Schema.NullOr(Schema.String),
  status: Schema.Literal("task_dispatched"),
});
export type CortexCreatedThreadResult = typeof CortexCreatedThreadResult.Type;

export const CortexCreateThreadsResult = Schema.Struct({
  operationId: Schema.String,
  requestId: CortexGatewayRequestId,
  requestedCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
  createdCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  threadIds: Schema.Array(ThreadId),
  threads: Schema.Array(CortexCreatedThreadResult),
});
export type CortexCreateThreadsResult = typeof CortexCreateThreadsResult.Type;

export const CortexWaitForThreadsInput = Schema.Struct({
  threadIds: Schema.Array(ThreadId)
    .check(Schema.isMinLength(1))
    .check(Schema.isMaxLength(CORTEX_GATEWAY_MAX_THREADS_PER_OPERATION)),
  runIds: Schema.optional(
    Schema.Array(Schema.NullOr(TurnId)).check(
      Schema.isMaxLength(CORTEX_GATEWAY_MAX_THREADS_PER_OPERATION),
    ),
  ),
  timeoutMs: Schema.optional(
    Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)).check(
      Schema.isLessThanOrEqualTo(CORTEX_GATEWAY_MAX_WAIT_MS),
    ),
  ),
}).annotate({ parseOptions: { onExcessProperty: "error" } });
export type CortexWaitForThreadsInput = typeof CortexWaitForThreadsInput.Type;

export const CortexWaitedThreadResult = Schema.Struct({
  threadId: ThreadId,
  runId: Schema.NullOr(TurnId),
  state: Schema.Literals(["idle", "pending", "running", "completed", "error", "interrupted"]),
  terminal: Schema.Boolean,
  timedOut: Schema.Boolean,
  summary: Schema.NullOr(Schema.String),
  summaryTruncated: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
  readThread: Schema.Struct({
    tool: Schema.Literal("cortex_read_thread"),
    arguments: Schema.Struct({ threadId: ThreadId }),
  }),
});
export type CortexWaitedThreadResult = typeof CortexWaitedThreadResult.Type;

export const CortexWaitForThreadsResult = Schema.Struct({
  callerThreadId: ThreadId,
  runIds: Schema.Array(Schema.NullOr(TurnId)),
  allTerminal: Schema.Boolean,
  timedOut: Schema.Boolean,
  threads: Schema.Array(CortexWaitedThreadResult),
});
export type CortexWaitForThreadsResult = typeof CortexWaitForThreadsResult.Type;
