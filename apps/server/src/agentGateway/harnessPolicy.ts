import type { ProviderKind } from "@cortex/contracts";

import { AUTOMATION_AUTHORING_GUIDANCE } from "./automationAuthoringGuidance.ts";

/** Canonical, versioned host policy delivered to every supported provider. */
export const CORTEX_HARNESS_POLICY_VERSION = "2026-09-03.1";
export const CORTEX_HARNESS_POLICY_MARKER = `[Cortex harness policy ${CORTEX_HARNESS_POLICY_VERSION}]`;

export interface CortexHarnessCapabilities {
  readonly gatewayControlAvailable: boolean;
}

/**
 * Render one truthful policy. Providers without a safely thread-scoped MCP
 * connection still receive host identity, but are never told they can mutate
 * Cortex resources.
 */
export function renderCortexHarnessPolicy(capabilities: CortexHarnessCapabilities): string {
  const controlPolicy = capabilities.gatewayControlAvailable
    ? [
        "Use the cortex_* tools for Cortex threads, projects, automations, and coordination.",
        "For any-language requests involving Cortex's integrated, embedded, or in-app browser, use browser_* autonomously as its canonical, complete control surface; never substitute Chrome, Computer Use, Playwright, OS-automation tools/skills, or change the user's active chat. Detailed rules live in each tool description.",
        "For any-language iOS app or simulator request, call device_* directly and autonomously as the canonical, complete control surface; never use xcrun simctl, AppleScript, Appium, idb, open Simulator.app, or substitute mobile/OS-automation tools/skills, because the user watches the streamed pane. Detailed rules live in each tool description.",
        "For thread discovery and diagnosis, use cortex_list_threads, cortex_read_thread, cortex_read_thread_activity, cortex_read_thread_events, cortex_read_thread_runtime_events, and cortex_diagnose_thread before SQLite or process logs. Use host storage only when tool coverage says required evidence is unavailable.",
        "After successfully creating a pull request for the current thread's own deliverable, call cortex_set_thread_pull_request with its URL. Never associate a pull request that the thread only reviews, references, or discusses.",
        "Provider-native subagent or Task tools are implementation details: they do not create Cortex threads and must not substitute for an explicit request to create Cortex threads.",
        "For a plural thread request, submit one exact cortex_create_threads plan. The array length is the exact requested count.",
        "If cortex_create_threads rejects the plan during validation or preflight before returning an operationId, correct that same plan and retry it with the same requestId. This is safe because no durable operation, thread, or worktree was created.",
        "Use cortex_capabilities to select canonical provider, model, and option values. Never guess a model slug or silently substitute a provider or model.",
        "Provider option keys are not interchangeable: Codex uses options.reasoningEffort and Claude Agent uses options.effort. Follow cortex_capabilities.targetConstruction for every provider instead of inspecting Cortex source code.",
        "When results are requested, call cortex_wait_for_threads for the created thread ids, wait for every requested result, then synthesize all outcomes.",
        "After cortex_create_threads returns an operationId, retries must keep the same requestId and exact plan. Report terminal operation failures as outcomes; do not create replacement threads unless the user gives a new instruction.",
        "Cortex automations support heartbeat, standalone, and dedicated modes plus interval, once, daily, weekdays, weekly, and cron schedules. Existing everyMinutes heartbeat calls remain supported. Use fastInterval: true only when the user explicitly accepts a sub-minute bounded loop.",
        "Mode controls execution: heartbeat appends to an idle target thread; standalone opens a fresh thread per independent run; dedicated reuses one automation-owned thread so runs build on each other without writing into another thread.",
        "Prefer dedicated for ongoing observation or tracking: standalone runs cannot see prior runs beyond memory, while dedicated keeps one growing thread.",
        'Mode does not restrict stop conditions. completionPolicy {"type":"ai-evaluated","stopWhen":"..."} works in both modes and disables the automation when the clause matches a successful run; prefer it over encoding the stop condition in the prompt. maxIterations remains the backstop, and an automation-dispatched run may always call cortex_cancel_automation on its own automation.',
        AUTOMATION_AUTHORING_GUIDANCE,
        "Prefer cortex_create_automation with suggested: true when the user has not explicitly asked to create an automation. Suggested automations remain disabled until the user accepts their proposal card.",
        "Before cortex_update_automation, call cortex_view_automation and resend the complete mutable configuration, including unchanged fields. Updates are full replacement and partial payloads are rejected.",
        'Automation-dispatched turns receive an identity/run/memory envelope in the current user message. Only that current turn is automation-dispatched; the status never carries into a later manual follow-up such as "continue", even in the same thread.',
        'During an automation-dispatched turn, persist durable context with cortex_update_automation_memory {"memory": "..."} before finishing; memory is full replacement, DB-backed, and capped at 32 KiB.',
        'Every automation-dispatched turn must finish by calling cortex_report_automation_result. Use decision "silent" only for a successful run with nothing requiring user attention; otherwise use "notify" with a concise title and summary. Failures remain visible regardless of this decision or the automation notification policy. Never call this tool for a manual follow-up turn.',
      ]
    : [
        "Cortex MCP control is unavailable in this provider session. Do not claim that Cortex threads, projects, or automations were created or changed.",
        "Provider-native subagent or Task tools do not create Cortex threads. If the user explicitly requests Cortex resource management, explain that this session cannot perform it.",
      ];

  return [
    CORTEX_HARNESS_POLICY_MARKER,
    "You are running inside Cortex. Cortex is the host and harness for this session.",
    "For known local files in user-facing Markdown, use readable labels and absolute file URLs, such as [config.ts](file:///absolute/path/config.ts). Relative links are only for the session working directory; otherwise use plain text and never invent a path.",
    'Cortex collapses progress and tools under "Worked for...". Final responses must restate every needed scope, plan, decision, result, caveat, instruction, or question. Never request approval using "this", "the above", or another referent available only in collapsed content.',
    "When a structured user-input tool is available for a genuine decision, prefer it and include all decision context in its question or card.",
    ...controlPolicy,
  ].join("\n");
}

export const CORTEX_GATEWAY_HARNESS_POLICY = renderCortexHarnessPolicy({
  gatewayControlAvailable: true,
});

export interface CortexHarnessPolicyDeliveryState {
  harnessPolicyDelivered?: boolean | undefined;
}

const PROVIDERS_WITH_THREAD_SCOPED_CORTEX_MCP = new Set<ProviderKind>([
  "codex",
  "claudeAgent",
  "antigravity",
  "cursor",
  "grok",
  "droid",
  "devin",
  "opencode",
  "pi",
]);

export function providerHasCortexGatewayControl(input: {
  readonly provider: ProviderKind;
  readonly scopedGatewayConnectionAvailable: boolean;
}): boolean {
  return (
    input.scopedGatewayConnectionAvailable &&
    PROVIDERS_WITH_THREAD_SCOPED_CORTEX_MCP.has(input.provider)
  );
}

/** Return the private host-context block exactly once for one provider session. */
export function takeCortexHarnessPolicyForSession(
  state: CortexHarnessPolicyDeliveryState,
  capabilities: CortexHarnessCapabilities,
): string | null {
  if (state.harnessPolicyDelivered === true) return null;
  state.harnessPolicyDelivered = true;
  return [
    "<cortex_host_context>",
    renderCortexHarnessPolicy(capabilities),
    "</cortex_host_context>",
  ].join("\n");
}

/**
 * Provider-aware delivery guard. The transport flag must only become true
 * after a provider has installed thread-scoped gateway tools successfully.
 */
export function takeCortexHarnessPolicyForProviderSession(
  state: CortexHarnessPolicyDeliveryState,
  input: {
    readonly provider: ProviderKind;
    readonly scopedGatewayConnectionAvailable: boolean;
  },
): string | null {
  return takeCortexHarnessPolicyForSession(state, {
    gatewayControlAvailable: providerHasCortexGatewayControl(input),
  });
}

export function takeCortexHarnessPolicyTextPartForProviderSession(
  state: CortexHarnessPolicyDeliveryState,
  input: {
    readonly provider: ProviderKind;
    readonly scopedGatewayConnectionAvailable: boolean;
  },
): { readonly type: "text"; readonly text: string } | null {
  const text = takeCortexHarnessPolicyForProviderSession(state, input);
  return text === null ? null : { type: "text", text };
}
