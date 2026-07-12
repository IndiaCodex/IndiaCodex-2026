import { useBatcherStore } from "@/stores/useBatcherStore";
import { useInterval } from "./useInterval";

/** Polls /api/congestion once a second and pushes the score into the store. */
export function useCongestion() {
  const setScore = useBatcherStore((s) => s.setScore);

  useInterval(async () => {
    try {
      const res = await fetch("/api/congestion");
      if (!res.ok) return;
      const { score } = await res.json();
      if (typeof score === "number") setScore(score);
    } catch {
      // keep last score on failure — never blank the gauge
    }
  }, 1000);
}

/** Drive the demo congestion slider (override) or flip the real/demo mode. */
export async function postCongestion(body: { mode?: string; override?: number | null }) {
  try {
    await fetch("/api/congestion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* ignore */
  }
}
