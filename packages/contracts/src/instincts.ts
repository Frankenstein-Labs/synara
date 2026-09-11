import { Schema } from "effect";
import { ProjectId } from "./baseSchemas";

/** A reviewable project convention surfaced by Cortex rather than silently applied. */
export const InstinctId = Schema.String.pipe(Schema.brand("InstinctId"));
export type InstinctId = typeof InstinctId.Type;

export const InstinctSource = Schema.Literals(["user", "workspace", "assistant"]);
export type InstinctSource = typeof InstinctSource.Type;

export const InstinctScope = Schema.Literals(["project", "workspace", "file-pattern"]);
export type InstinctScope = typeof InstinctScope.Type;

export const InstinctStatus = Schema.Literals(["proposed", "active", "paused", "rejected"]);
export type InstinctStatus = typeof InstinctStatus.Type;

const InstinctTitle = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(120));
const InstinctInstruction = Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2_000));
const InstinctPattern = Schema.String.check(Schema.isMaxLength(240));
const InstinctConfidence = Schema.Number.check(
  Schema.isGreaterThanOrEqualTo(0),
  Schema.isLessThanOrEqualTo(1),
);

export const Instinct = Schema.Struct({
  id: InstinctId,
  projectId: ProjectId,
  title: InstinctTitle,
  instruction: InstinctInstruction,
  scope: InstinctScope,
  pattern: Schema.optional(InstinctPattern),
  source: InstinctSource,
  status: InstinctStatus,
  confidence: InstinctConfidence,
  evidenceCount: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});
export type Instinct = typeof Instinct.Type;

export const InstinctProposal = Schema.Struct({
  title: InstinctTitle,
  instruction: InstinctInstruction,
  scope: InstinctScope,
  pattern: Schema.optional(InstinctPattern),
  evidence: Schema.Array(Schema.String.check(Schema.isMaxLength(500))),
  confidence: InstinctConfidence,
});
export type InstinctProposal = typeof InstinctProposal.Type;

export const InstinctsListResult = Schema.Struct({
  instincts: Schema.Array(Instinct),
  proposals: Schema.Array(InstinctProposal),
});
export type InstinctsListResult = typeof InstinctsListResult.Type;
