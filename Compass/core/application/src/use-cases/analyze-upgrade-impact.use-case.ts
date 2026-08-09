import { evaluateCompatibility, NotFoundError } from '@compass/domain';
import type { Component, ComponentId, Constraint, ReleaseId, VersionScheme } from '@compass/domain';
import type { SnapshotRepositoryPort } from '../ports/snapshot-repository.port.js';

export interface AnalyzeUpgradeImpactQuery {
  readonly targetReleaseId: ReleaseId;
}

export interface BlockedComponent {
  readonly componentId: ComponentId;
  readonly dependentReleaseId: ReleaseId;
  readonly declaredConstraint: Constraint;
}

export interface UpgradeImpactAnalysis {
  readonly targetReleaseId: ReleaseId;
  /** Components with a known dependency on the target's component whose declared constraint the target release violates. */
  readonly blockedComponents: readonly BlockedComponent[];
  /** Components with a known dependency on the target's component that remain fine with the target release. */
  readonly compatibleComponentIds: readonly ComponentId[];
  /** Components with a known dependency on the target's component that Compass has no verdict for (no rule fired, no evidence). */
  readonly unverifiedComponentIds: readonly ComponentId[];
}

/**
 * The "who does this upgrade affect" half of the Upgrade Advisor
 * (docs/architecture/use-cases — "Blocked Components", "Required Upgrades").
 * Scoped to direct (one-hop) dependents only — see docs/midnight-plugin.md
 * (or the Step 3.2 assessment) for why transitive, multi-hop dependency
 * ordering and required-intermediate-version resolution are explicitly
 * deferred rather than built here.
 */
export class AnalyzeUpgradeImpactUseCase {
  public constructor(
    private readonly snapshotRepository: SnapshotRepositoryPort,
    private readonly versionScheme: VersionScheme,
  ) {}

  public async execute(query: AnalyzeUpgradeImpactQuery): Promise<UpgradeImpactAnalysis> {
    const snapshot = await this.snapshotRepository.getLatest();
    if (!snapshot) {
      throw new NotFoundError('Snapshot', '(latest)');
    }

    const targetRelease = snapshot.releases.find((release) => release.id === query.targetReleaseId);
    if (!targetRelease) throw new NotFoundError('Release', query.targetReleaseId);
    const targetComponent = snapshot.components.find((component) => component.id === targetRelease.componentId);
    if (!targetComponent) throw new NotFoundError('Component', targetRelease.componentId);

    const blockedComponents: BlockedComponent[] = [];
    const compatibleComponentIds: ComponentId[] = [];
    const unverifiedComponentIds: ComponentId[] = [];

    for (const dependentRelease of snapshot.releases) {
      const dependency = dependentRelease.dependencies.find((dep) => dep.targetComponentId === targetComponent.id);
      if (!dependency) continue;

      const dependentComponent = mustFind(snapshot.components, dependentRelease.componentId);

      const evaluation = evaluateCompatibility({
        releaseA: dependentRelease,
        componentA: dependentComponent,
        releaseB: targetRelease,
        componentB: targetComponent,
        dependency,
        rules: snapshot.compatibilityRules,
        evidence: snapshot.evidence,
        versionScheme: this.versionScheme,
      });

      if (evaluation.status === 'incompatible') {
        blockedComponents.push({
          componentId: dependentComponent.id,
          dependentReleaseId: dependentRelease.id,
          declaredConstraint: dependency.constraint,
        });
      } else if (evaluation.status === 'compatible') {
        compatibleComponentIds.push(dependentComponent.id);
      } else {
        unverifiedComponentIds.push(dependentComponent.id);
      }
    }

    return {
      targetReleaseId: targetRelease.id,
      blockedComponents,
      compatibleComponentIds,
      unverifiedComponentIds,
    };
  }
}

function mustFind(components: readonly Component[], id: ComponentId): Component {
  const found = components.find((component) => component.id === id);
  if (!found) throw new NotFoundError('Component', id);
  return found;
}
