# Slide 3 — Why Existing Solutions Fail

## Title

Observability isn't assurance

## Content

- **LLM observability platforms** (LangSmith-style tracing, generic APM) —
  show a call graph. No portable, independently re-verifiable artifact; the
  trace lives in their database, trusted because you trust their database.
- **Blockchain explorers** — show a settled Masumi transaction. No visibility
  into _why_ the agent decided to make it, or what preceded it.
- **Generic application logging** — captures whatever a developer thought to
  `log.info` that day. No structural guarantee that every nondeterministic
  boundary was actually captured.
- **Masumi itself** — deliberately doesn't solve this. It proves _who_ an
  agent is and moves the money. It shouldn't also have to prove _what the
  agent did and why_ — that's a different, engineering-shaped problem.

## Speaker Notes

Don't trash-talk the alternatives — name the specific gap each one leaves.
"Tracing tools show you a call graph, not a proof. An explorer shows you a
settled transaction, not the reasoning that led to it. And Masumi shouldn't
have to solve this either — identity and payments are already a full-time
job for a protocol. What's missing is a layer whose only job is proving what
happened, the way OpenTelemetry sits around a distributed system instead of
being part of it."

## Visual Suggestions

A simple comparison table: rows = "Portable proof / Independent
re-verification / Captures agent reasoning / No AI in the trust path,"
columns = "Observability tools / Block explorer / Sentinel." Sentinel is the
only column with all four checked — let the table make the argument, not
adjectives.
