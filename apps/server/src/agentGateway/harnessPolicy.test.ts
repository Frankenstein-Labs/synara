import { assert, describe, it } from "@effect/vitest";

import {
  renderCortexHarnessPolicy,
  CORTEX_HARNESS_POLICY_MARKER,
  takeCortexHarnessPolicyForProviderSession,
  takeCortexHarnessPolicyTextPartForProviderSession,
  takeCortexHarnessPolicyForSession,
} from "./harnessPolicy.ts";

describe("Cortex harness policy", () => {
  it("identifies Cortex and explains exact batch coordination when MCP is available", () => {
    const policy = renderCortexHarnessPolicy({ gatewayControlAvailable: true });
    assert.include(policy, CORTEX_HARNESS_POLICY_MARKER);
    assert.include(policy, "Cortex is the host and harness");
    assert.include(policy, "one exact cortex_create_threads plan");
    assert.include(policy, "before returning an operationId");
    assert.include(policy, "cortex_wait_for_threads");
    assert.include(policy, "cortex_set_thread_pull_request");
    assert.include(policy, "current thread's own deliverable");
    assert.include(policy, "only reviews, references, or discusses");
    assert.include(policy, "use browser_* autonomously");
    assert.include(policy, "canonical, complete control surface");
    assert.include(policy, "never substitute Chrome");
    assert.include(policy, "user's active chat");
    assert.include(policy, "Detailed rules live in each tool description");
    assert.notInclude(policy, "BrowserInterruptedByHuman");
    assert.notInclude(policy, "start with browser_open");
    assert.include(policy, "do not create Cortex threads");
    assert.include(policy, "specific 3–8 word outcome label");
    assert.include(policy, "Assume no chat context");
    assert.include(policy, "notify-versus-silent criteria");
    assert.include(policy, 'later manual follow-up such as "continue"');
    assert.include(policy, "Never call this tool for a manual follow-up turn");
  });

  it("asks agents to emit known absolute file URLs instead of invented relative links", () => {
    const gateway = renderCortexHarnessPolicy({ gatewayControlAvailable: true });
    const identityOnly = renderCortexHarnessPolicy({ gatewayControlAvailable: false });

    for (const policy of [gateway, identityOnly]) {
      assert.include(policy, "[config.ts](file:///absolute/path/config.ts)");
      assert.include(policy, "Relative links are only for the session working directory");
      assert.include(policy, "use plain text and never invent a path");
    }
  });

  it("keeps final answers self-contained when intermediate progress is collapsed", () => {
    const gateway = renderCortexHarnessPolicy({ gatewayControlAvailable: true });
    const identityOnly = renderCortexHarnessPolicy({ gatewayControlAvailable: false });

    for (const policy of [gateway, identityOnly]) {
      assert.include(policy, 'under "Worked for..."');
      assert.include(policy, "Final responses must restate every needed scope");
      assert.include(policy, 'Never request approval using "this", "the above"');
      assert.include(policy, "structured user-input tool");
      assert.include(policy, "include all decision context");
    }
  });

  it("never advertises gateway mutation to providers without scoped MCP", () => {
    const policy = renderCortexHarnessPolicy({ gatewayControlAvailable: false });
    assert.include(policy, "Cortex MCP control is unavailable");
    assert.notInclude(policy, "one exact cortex_create_threads plan");
  });

  it("delivers a private host-context block once per provider session", () => {
    const state: { harnessPolicyDelivered?: boolean } = {};
    assert.include(
      takeCortexHarnessPolicyForSession(state, { gatewayControlAvailable: true }) ?? "",
      "<cortex_host_context>",
    );
    assert.isNull(takeCortexHarnessPolicyForSession(state, { gatewayControlAvailable: true }));
  });

  it("delivers once on fresh/load/fork sessions for every scoped MCP provider", () => {
    for (const provider of ["antigravity", "cursor", "grok", "droid", "opencode", "pi"] as const) {
      for (const lifecycle of ["fresh", "load", "fork"] as const) {
        const state: { harnessPolicyDelivered?: boolean } = {};
        const first =
          takeCortexHarnessPolicyTextPartForProviderSession(state, {
            provider,
            scopedGatewayConnectionAvailable: true,
          })?.text ?? "";
        assert.include(first, CORTEX_HARNESS_POLICY_MARKER, `${provider}/${lifecycle}`);
        assert.include(first, "Use the cortex_* tools", `${provider}/${lifecycle}`);
        assert.isNull(
          takeCortexHarnessPolicyForProviderSession(state, {
            provider,
            scopedGatewayConnectionAvailable: true,
          }),
          `${provider}/${lifecycle}`,
        );
      }
    }
  });

  it("keeps OpenCode and Pi identity-only until scoped setup succeeds", () => {
    for (const provider of ["opencode", "pi"] as const) {
      const text =
        takeCortexHarnessPolicyForProviderSession(
          {},
          { provider, scopedGatewayConnectionAvailable: false },
        ) ?? "";
      assert.include(text, CORTEX_HARNESS_POLICY_MARKER, provider);
      assert.include(text, "Cortex MCP control is unavailable", provider);
      assert.notInclude(text, "one exact cortex_create_threads plan", provider);
    }
  });

  it("routes iOS work to device tools without embedding per-tool instructions", () => {
    const policy = renderCortexHarnessPolicy({ gatewayControlAvailable: true });
    assert.include(policy, "any-language iOS app or simulator request");
    assert.include(policy, "call device_* directly and autonomously");
    assert.include(policy, "never use xcrun simctl");
    assert.include(policy, "open Simulator.app");
    assert.include(policy, "user watches the streamed pane");
    assert.notInclude(policy, "device_list first");
    assert.notInclude(policy, "com.apple.Preferences");
  });

  it("keeps the gateway policy below its prompt budget", () => {
    assert.isAtMost(renderCortexHarnessPolicy({ gatewayControlAvailable: true }).length, 6_000);
  });

  it("withholds device guidance from sessions with no gateway control", () => {
    const policy = renderCortexHarnessPolicy({ gatewayControlAvailable: false });

    // Promising tools this session cannot reach would be a lie.
    assert.notInclude(policy, "device_list");
    assert.notInclude(policy, "device_describe_ui");
  });
});
