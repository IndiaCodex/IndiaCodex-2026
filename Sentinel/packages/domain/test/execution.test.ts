import { describe, expect, it } from "vitest";
import { timelineByKind } from "../src/index.js";
import { fixedExecutionId, makeLifecycleEvent, makeToolEventWithSnapshot } from "./fixtures.js";

describe("timelineByKind", () => {
  it("filters the shared Timeline down to one Event kind", () => {
    const executionId = fixedExecutionId();
    const started = makeLifecycleEvent(executionId, 0, "started");
    const { event: toolEvent } = makeToolEventWithSnapshot(executionId, 1);
    const completed = makeLifecycleEvent(executionId, 2, "completed");

    const execution = { timeline: [started, toolEvent, completed] };

    expect(timelineByKind(execution, "lifecycle")).toEqual([started, completed]);
    expect(timelineByKind(execution, "tool")).toEqual([toolEvent]);
    expect(timelineByKind(execution, "payment")).toEqual([]);
  });
});
