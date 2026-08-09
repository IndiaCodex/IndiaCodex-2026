import { describe, expect, it } from 'vitest';
import { runCompatibility } from '../src/commands/compatibility.js';
import { APP_COMPONENT, APP_RELEASE_ID, buildTestEcosystem, LATER, LIB_RELEASE_2, LIB_RELEASE_3 } from './test-ecosystem.js';

describe('runCompatibility', () => {
  it('recommends the upgrade and reports no blocked components when the stack stays compatible', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runCompatibility(runtimeV1, {
      targetReleaseId: LIB_RELEASE_2,
      subjectComponentId: APP_COMPONENT.id,
      stackReleaseIds: [APP_RELEASE_ID],
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('### Upgrade Advisor:');
    expect(result.output).toContain('✅ Upgrade');
    expect(result.output).toContain('### Upgrade Impact: moving to');
    expect(result.output).toContain('**Blocked (declared constraint violated)**\n_None._');
  });

  it('recommends avoiding the upgrade and flags the blocked component when a dependency constraint is violated', async () => {
    const { runtimeV1, runtimeV2, clock } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();
    clock.advanceTo(LATER);
    await runtimeV2.ingestSnapshot.execute();

    const result = await runCompatibility(runtimeV1, {
      targetReleaseId: LIB_RELEASE_3,
      subjectComponentId: APP_COMPONENT.id,
      stackReleaseIds: [APP_RELEASE_ID],
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('❌ Avoid');
    expect(result.output).toContain('app-a');
  });

  it('still reports ecosystem-wide impact when no subject/stack is given', async () => {
    const { runtimeV1 } = buildTestEcosystem();
    await runtimeV1.ingestSnapshot.execute();

    const result = await runCompatibility(runtimeV1, { targetReleaseId: LIB_RELEASE_2 });

    expect(result.output).not.toContain('### Upgrade Advisor:');
    expect(result.output).toContain('### Upgrade Impact: moving to');
  });
});
