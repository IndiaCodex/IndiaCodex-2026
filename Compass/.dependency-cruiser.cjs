/**
 * Enforces the module dependency graph fixed in
 * docs/architecture/repository-structure.md#dependency-rules.
 *
 * This is the literal implementation of ADR 0003: the boundary is a CI
 * check, not a convention.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-has-no-internal-dependencies',
      comment:
        'core/domain must depend on nothing else in the repository (docs/architecture/repository-structure.md).',
      severity: 'error',
      from: { path: '^core/domain/src' },
      to: {
        path: '^(core/(application|testing)|plugins|storage)/',
      },
    },
    {
      name: 'application-depends-only-on-domain',
      comment:
        'core/application may depend only on core/domain, never on plugins, storage, or the testing package.',
      severity: 'error',
      from: { path: '^core/application/src' },
      to: { path: '^(core/testing|plugins|storage)/' },
    },
    {
      name: 'testing-depends-only-on-core',
      comment:
        'core/testing provides fixtures/fakes for core packages; it must not depend on concrete plugins or storage adapters.',
      severity: 'error',
      from: { path: '^core/testing/src' },
      to: { path: '^(plugins|storage)/' },
    },
    {
      name: 'plugin-sdk-depends-only-on-core',
      comment:
        'plugins/plugin-sdk depends only on core/domain and core/application (for port definitions).',
      severity: 'error',
      from: { path: '^plugins/plugin-sdk/src' },
      to: { path: '^(core/testing|storage)/' },
    },
    {
      name: 'storage-sdk-depends-only-on-core',
      comment:
        'storage/storage-sdk depends only on core/domain and core/application (for the SnapshotRepository port).',
      severity: 'error',
      from: { path: '^storage/storage-sdk/src' },
      to: { path: '^(core/testing|plugins)/' },
    },
    {
      name: 'storage-adapters-depend-only-on-storage-sdk-and-core',
      comment:
        'Concrete storage adapters depend on storage-sdk and core/application, never on plugins or the testing package.',
      severity: 'error',
      from: { path: '^storage/adapters/[^/]+/src' },
      to: { path: '^(core/testing|plugins)/' },
    },
    {
      name: 'midnight-plugin-depends-only-on-core-and-plugin-sdk',
      comment:
        'The Midnight plugin (plugins/midnight) depends on core/domain, core/application, and plugins/plugin-sdk — never on storage or the testing package. It must not know about any other ecosystem plugin either.',
      severity: 'error',
      from: { path: '^plugins/midnight/src' },
      to: { path: '^(core/testing|storage|plugins/(?!midnight|plugin-sdk))/' },
    },
    {
      name: 'nothing-inward-depends-on-interfaces',
      comment:
        'core/, plugins/, and storage/ must never import from interfaces/ — the engine has no knowledge of its consumers (docs/architecture/interfaces.md).',
      severity: 'error',
      from: { path: '^(core|plugins|storage)/' },
      to: { path: '^interfaces/' },
    },
    {
      name: 'reporting-depends-only-on-core',
      comment:
        'interfaces/reporting formats already-computed application/domain output; it must not depend on a concrete plugin, storage adapter, or another interface.',
      severity: 'error',
      from: { path: '^interfaces/reporting/src' },
      to: { path: '^(plugins|storage|interfaces/(?!reporting))/' },
    },
    {
      name: 'cli-does-not-depend-on-github-action',
      comment:
        'The CLI and the GitHub Action are independent consumers of the same application services; neither may import the other (docs/architecture/interfaces.md).',
      severity: 'error',
      from: { path: '^interfaces/cli/src' },
      to: { path: '^interfaces/github-action/' },
    },
    {
      name: 'github-action-does-not-depend-on-cli',
      comment: 'See cli-does-not-depend-on-github-action.',
      severity: 'error',
      from: { path: '^interfaces/github-action/src' },
      to: { path: '^interfaces/cli/' },
    },
    {
      name: 'no-circular',
      comment: 'Dependency cycles are not allowed anywhere in the workspace.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
