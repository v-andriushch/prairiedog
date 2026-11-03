<p align="center"><img src="assets/logo/logo.svg" alt="prairiedog" width="360"></p>

A self-hosted job-watch bot: collects listings from job boards, filters and scores them against your CV (rules, embeddings, a local LLM), and pings you on Telegram. Web UI, REST API and an MCP endpoint come later.

**Status:** early development.

## Development

Tool versions (Node, pnpm, gitleaks) are pinned in `mise.toml`.

```sh
mise install    # Node, pnpm, gitleaks
pnpm install    # also installs the pre-commit secret scan (husky)
pnpm check      # lint, format, typecheck, module boundaries, tests
```

## Layout

| Path                 | What                                                    |
| -------------------- | ------------------------------------------------------- |
| `modules/collector`  | source adapters, raw listings, dedupe, change detection |
| `modules/evaluator`  | rule filters, embeddings, LLM fit check                 |
| `modules/notifier`   | Telegram, security digests                              |
| `modules/web`        | users, auth, ratings, applications, CVs, REST + MCP     |
| `packages/contracts` | the only shared code: event and job payload types       |

Modules are future services. Each owns its own data and talks to the others only through the job queue and events; `pnpm boundaries` (dependency-cruiser, see `.dependency-cruiser.cjs`) fails the build if a module imports another one.
