/**
 * Architecture rules (ArchUnit-style), checked in CI by `pnpm boundaries`.
 * Modules are future services: they may only share code through packages/contracts.
 * See ARCHITECTURE.md §1.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-imports',
      comment:
        'A module must not import another module (code or DB schema). Talk through the queue/events and share types via packages/contracts.',
      severity: 'error',
      from: { path: '^modules/([^/]+)/' },
      to: { path: '^modules/', pathNot: '^modules/$1/' },
    },
    {
      name: 'packages-stay-generic',
      comment: 'Shared packages must not depend on modules or apps.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^(modules|apps)/' },
    },
    {
      name: 'modules-dont-import-apps',
      comment: 'Apps wire modules together; modules never import apps.',
      severity: 'error',
      from: { path: '^modules/' },
      to: { path: '^apps/' },
    },
    {
      name: 'ui-not-server',
      comment:
        'The React UI talks to the server over HTTP only; it may import packages/contracts, nothing server-side.',
      severity: 'error',
      from: { path: '^apps/ui/' },
      to: { path: '^(modules|apps/(?!ui/))' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      comment: 'Imports must resolve (catches typos and undeclared packages).',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    // Our code, plus unresolved @prairiedog/* imports so not-to-unresolvable can flag them.
    includeOnly: '^(apps|modules|packages)/|^@prairiedog/',
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)node_modules/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'node', 'default'],
    },
  },
};
