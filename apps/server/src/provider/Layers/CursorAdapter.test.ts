// FILE: CursorAdapter.test.ts
// Purpose: Characterizes Cursor's private Cortex host-policy delivery.
// Layer: Provider adapter tests

import { CORTEX_HARNESS_POLICY_MARKER } from "../../agentGateway/harnessPolicy.ts";
import { describe, expect, it } from "vitest";

import { takeCursorCortexHarnessPolicyTextPart } from "./CursorAdapter.ts";

describe("Cursor Cortex harness policy", () => {
  it("delivers scoped MCP host context exactly once per fresh/load/fork session", () => {
    for (const lifecycle of ["fresh", "load", "fork"] as const) {
      const state: { harnessPolicyDelivered?: boolean } = {};
      const first = takeCursorCortexHarnessPolicyTextPart(state, true);
      expect(first?.text, lifecycle).toContain(CORTEX_HARNESS_POLICY_MARKER);
      expect(first?.text, lifecycle).toContain("Use the cortex_* tools");
      expect(takeCursorCortexHarnessPolicyTextPart(state, true), lifecycle).toBeNull();
    }
  });

  it("stays truthful without a scoped gateway connection", () => {
    expect(takeCursorCortexHarnessPolicyTextPart({}, false)?.text).toContain(
      "Cortex MCP control is unavailable",
    );
  });
});
