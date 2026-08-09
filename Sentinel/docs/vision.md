# Vision & Business Case

Status: Foundational — written in Step 1, before implementation began.
The mission, problem framing, and differentiation below have held
unchanged through the Hackathon MVP build; see
[`architecture.md`](architecture.md) and [`roadmap.md`](roadmap.md) for
what's actually been built against this vision, and how it's scoped for
now.

## 1. Vision

> Every autonomous agent execution should be as inspectable, reproducible,
> and auditable as a compiled build.

Software engineering became trustworthy at scale because it built layers of
assurance around itself: version control, CI, testing, observability,
incident review. None of that assurance exists yet for autonomous AI
agents — systems that make decisions, call tools, and now, through
protocols like Masumi, spend and receive money without a human in the loop.

Sentinel's vision is to be that assurance layer: the infrastructure that
lets an engineering team treat an AI agent's behavior as a first-class,
version-controlled, testable engineering artifact — not an opaque process
you can only observe through its side effects.

The reference point is deliberately infrastructural, not conversational.
Sentinel's ambition is closer to OpenTelemetry, Terraform, or Temporal than
to a chatbot debugging tool: unglamorous, deterministic, and load-bearing
enough that other tools get built on top of it.

## 2. The Engineering Problem

Agent workflows are distributed systems: they chain LLM calls, tool
invocations, payments, human approvals, and retries, often across multiple
processes and providers, with the added complication that one of the
"nodes" in the system (the LLM) is intentionally nondeterministic.

This produces a specific set of unanswered engineering questions:

| Question                              | Why it's hard today                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Why did this payment happen?          | Payment triggers are buried in agent reasoning with no linkage back to the decision that caused them.                      |
| Why did this decision occur?          | Decision rationale lives in an LLM call that isn't captured as a structured, queryable artifact.                           |
| Which tool failed, and how?           | Tool invocations are logged inconsistently, if at all, and rarely correlated to the execution that made them.              |
| Can I replay this execution?          | Nothing captures the full input/output state needed to reproduce a run without re-calling live, nondeterministic services. |
| Can QA validate this workflow?        | There is no scenario/fixture model for agent behavior — no equivalent of integration tests.                                |
| Can an auditor inspect the execution? | No standard export format ties decisions, tool calls, and payments into one verifiable record.                             |
| Can we compare two runs?              | There is no unified data model that makes two executions structurally comparable.                                          |

These are not gaps in any single agent framework — they are the absence of
a category. Masumi solves the protocol problem (how agents transact and
establish identity). It does not solve, and is not trying to solve, the
engineering assurance problem. That gap is Sentinel's reason to exist.

## 3. Business Case

Autonomous agents doing consequential things — spending money, taking
actions on a user's behalf, making decisions that affect other systems —
cannot reach enterprise or regulated environments without an assurance
story. This is not a hypothetical adoption blocker; it is the same pattern
that gated every prior wave of infrastructure adoption:

- Microservices did not become an enterprise default until observability
  (metrics, tracing, logging) made them debuggable — this is what companies
  like Datadog and New Relic were built on.
- CI/CD did not become trustworthy until deterministic test suites made
  regressions visible before deploy.
- Infrastructure-as-code did not scale past small teams until plan/diff
  tooling made changes reviewable and reversible.

The agent economy that Masumi enables — agents that hold identity,
transact, and act autonomously — sits at the same point in its adoption
curve that microservices were at before observability existed. Sentinel is
the missing precondition, not an optional add-on:

- **De-risks adoption of paid agent workflows.** Enterprises will not let
  agents move money or take irreversible actions without a way to explain
  and audit every one of those actions after the fact.
- **Collapses incident response time.** Root-causing a failed or
  disputed agent execution should take minutes via replay, not hours of
  reconstructing logs across services.
- **Produces compliance-grade evidence.** Regulated industries (finance,
  healthcare, insurance) require an audit trail for automated
  decision-making; Sentinel's export is designed to be that artifact.
- **Strengthens the Masumi ecosystem without competing with it.** Sentinel
  makes Masumi-based agents easier to trust and ship, which grows the
  number of serious (not demo-grade) integrations against Masumi.
- **Open-source distribution is the adoption strategy.** Like
  OpenTelemetry, Sentinel's value compounds through ecosystem
  instrumentation — the more agent frameworks and LLM providers have a
  Sentinel adapter, the more indispensable the platform becomes,
  independent of any single vendor.

## 4. Target Users

Each user group has a distinct job-to-be-done; the platform must serve all
of them from the same underlying data model, not bolt-on features per
persona.

| User                      | Job-to-be-done                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Platform Engineers        | Provide a shared, reliable way for every team's agents to be observable and debuggable, without each team inventing its own logging. |
| Backend Engineers         | Trace a production failure back to the exact tool call, payment, or decision that caused it.                                         |
| AI Engineers              | Understand why an agent made a specific decision, and iterate without guessing.                                                      |
| QA Engineers              | Write repeatable test scenarios for agent behavior and catch regressions before deploy.                                              |
| DevOps Engineers          | Integrate replay and scenario testing into CI/CD gates.                                                                              |
| Engineering Managers      | Get a reliable answer to "is this agent system reliable enough to ship" backed by data, not vibes.                                   |
| CTOs                      | Justify to the business and to customers that autonomous, paying agents are governed and auditable.                                  |
| Enterprise Security Teams | Verify agent actions against policy after the fact, with tamper-evident evidence.                                                    |
| Auditors                  | Inspect a complete, signed record of an execution without needing engineering to reconstruct it manually.                            |

## 5. Success Metrics

**North Star:** Percentage of production agent executions that are fully
replayable and explainable on demand.

Supporting metrics, grouped by what they prove:

- **Trust in the platform**
  - Time-to-root-cause for a failed execution (target: minutes, not hours)
  - Replay fidelity rate — % of captured executions that replay to an
    identical decision/tool/payment sequence
  - Audit export acceptance rate in compliance review
- **Adoption**
  - Number of distinct agent projects instrumented with the Sentinel SDK
  - Number of community-built adapters (LLM providers, agent frameworks,
    storage backends)
  - Time-to-first-trace — time from install to seeing a first captured
    execution (developer experience proxy)
- **Engineering rigor enabled**
  - % of agent workflows with scenario tests running in CI
  - Number of regressions caught by scenario testing before production
- **Ecosystem health**
  - GitHub stars, external contributors, issues resolved by non-maintainers
  - Number of Masumi-integrated projects that list Sentinel as part of
    their stack

## 6. Differentiation

Sentinel is frequently adjacent to, but distinct from, three existing
categories:

**vs. APM / observability platforms (Datadog, New Relic, Grafana).**
These tools trace infrastructure — requests, latency, errors. They have no
concept of an agent decision, a tool-call semantics, or a payment
lifecycle, and no replay model that accounts for LLM nondeterminism.
Sentinel's timeline model is domain-specific to agent execution, not a
generic span tree.

**vs. LLM observability tools (LangSmith, Langfuse, Helicone).** These
tools are strong at prompt/response logging and are typically coupled to a
specific agent framework or LLM provider. They stop at visibility.
Sentinel's differentiation is what happens after visibility: deterministic
replay, scenario-based testing as a CI primitive, structural execution
comparison, and signed audit export — engineering assurance, not just
logging. Sentinel is also explicitly framework- and provider-agnostic via
its adapter architecture.

**vs. Masumi itself.** Masumi is the protocol and settlement layer — agent
identity, registry, and payment rails. Sentinel does not replace or wrap
Masumi's protocol responsibilities; it observes and verifies what happens
around them. The relationship is the same shape as OpenTelemetry to a web
application, or Terraform Cloud to Terraform: infrastructure that makes the
underlying system trustworthy at scale, without being the system.

**A structural differentiator that cuts across all three:** Sentinel never
uses AI to generate its own engineering logic. Replay, comparison, and
failure analysis are deterministic and rule-based. This is a deliberate
constraint, not a limitation — a platform whose job is to make agents
verifiable cannot itself introduce a second layer of unverifiable,
model-generated behavior. Where existing tools increasingly reach for an
LLM to "summarize" a trace, Sentinel treats that as a correctness risk to
be designed around, not a convenience to add.
