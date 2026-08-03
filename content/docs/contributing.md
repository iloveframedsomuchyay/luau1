---
title: Contributing
sidebar_label: Contributing
description: Build the engine from source, find something to work on, and get a pull request merged.
---

Luau Engine is built by contributors. Bug reports, documentation fixes and engine work are all welcome, and none of them require permission to start.

## Getting the source

```bash
git clone https://github.com/Luau-Engine/LuauEngine
cd LuauEngine
git submodule update --init --recursive
```

Prerequisites: CMake 3.24+, a C++20 compiler (MSVC 2022, Clang 15+, GCC 12+), Python 3.10+, and Ninja if you want faster builds.

```bash
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build --parallel
```

A cold build takes 15–40 minutes. Incremental builds are seconds. Useful targets:

```bash
cmake --build build --target studio      # editor only
cmake --build build --target runtime     # runtime only
cmake --build build --target cli         # luauengine
cmake --build build --target tests
```

## Repository layout

```text
LuauEngine/
├── src/
│   ├── studio/      # editor — panels, viewport, docking
│   ├── runtime/     # DataModel, scheduler, replication
│   ├── render/      # backends: d3d11, d3d12, vulkan, metal, webgpu
│   ├── physics/     # solver, constraints, collision
│   ├── assets/      # importers and the processing pipeline
│   ├── targets/     # per-target build and packaging
│   └── cli/         # luauengine
├── vendor/          # third-party, including luau/
├── tests/
├── docs/            # engine internals
└── website/         # this site
```

## Running the tests

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build -R runtime          # a subset
luauengine test --project tests/fixtures/basic
```

Every pull request runs the full suite on Windows, macOS and Linux. Get it green locally first — CI queue time is the slowest part of review.

## Finding something to work on

- [`good first issue`](https://github.com/Luau-Engine/LuauEngine/labels/good%20first%20issue) — scoped, with enough context to start
- [`help wanted`](https://github.com/Luau-Engine/LuauEngine/labels/help%20wanted) — larger, nobody assigned
- [`docs`](https://github.com/Luau-Engine/LuauEngine/labels/docs) — writing, no C++ required

For anything substantial, open an issue describing the approach before writing the code. It is a much cheaper conversation than a rejected pull request.

## Pull requests

1. Branch from `main`: `git checkout -b fix/mesh-import-normals`
2. Keep it focused — one logical change per PR
3. Add a test that fails before the change and passes after
4. Run `./scripts/format.sh` (clang-format for C++, `luauengine format` for Luau)
5. Write a commit message that says what changed and why

Conventional commits are used for the changelog:

```text
fix(assets): preserve vertex normals when importing glTF

The importer recomputed normals unconditionally, discarding
authored smoothing groups on models exported from Blender.

Fixes #412
```

Prefixes: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `ci`, `chore`.

## Code style

**C++** — C++20, four spaces, `clang-format` enforced in CI. `PascalCase` for types, `camelCase` for functions and variables, `m_` prefix for private members. Prefer `std::unique_ptr` over raw owning pointers, and avoid exceptions in the runtime hot path.

**Luau** — `luauengine format`, strict mode, type annotations on public APIs.

## Documentation

This website lives in `website/` in the repository. Every page has an "Edit this page on GitHub" link at the bottom that takes you straight to the right file.

```bash
cd website
npm install
npm run serve      # http://localhost:8787
```

Pages are Markdown with frontmatter in `content/docs/`. Add a new one by creating the file and listing its slug in `site.config.mjs` — the sidebar, prev/next links and search index all follow from that.

## Reporting bugs

Include:

- `luauengine --version` and your OS
- the target you were building for
- a minimal project that reproduces it
- what you expected and what happened
- the Build Output log if the failure was in a build

A reproduction is worth more than a description. Most issues without one stall waiting for information.

## Security

Do not open a public issue for a security problem. Email **security@luauengine.org** with the details. You will get an acknowledgement within 72 hours and credit in the release notes unless you would rather not have it.

## Governance

Maintainers are listed in `MAINTAINERS.md`. Changes to the engine's public API or the build pipeline go through an RFC in `docs/rfcs/` — open a pull request adding one and it gets discussed there before implementation.

Everyone participating is expected to follow the [Code of Conduct](https://github.com/Luau-Engine/LuauEngine/blob/main/CODE_OF_CONDUCT.md).
