---
title: Roadmap
sidebar_label: Roadmap
description: What is done, what is being worked on now, and what is planned for 1.0 and beyond.
---

Dates are intentions, not commitments. The [milestones](https://github.com/Luau-Engine/LuauEngine/milestones) on GitHub are the live version of this page.

## Current release — 0.9.x

Stable and in use:

- Studio-forked editor with the full panel set and plugin API
- Upstream Luau VM with native codegen and the gradual type system
- Complete DataModel, replication and task scheduler
- Roblox publishing through Open Cloud
- Desktop targets: Windows, macOS, Linux — installers, signing, store packaging
- Asset pipeline with licence enforcement
- `luauengine` CLI and CI mode
- Filesystem/DataModel sync with `.rbxlx` as the default place format

## In progress — 0.10

Targeted for **Q4 2026**.

| Item | Status |
| --- | --- |
| Web target out of beta — WebGPU parity, faster startup | In progress |
| Dedicated server out of beta — protocol freeze | In progress |
| Structural `.rbxlx` merge driver, shipped by default | In progress |
| Incremental builds — sub-second rebuilds for script-only changes | In progress |
| Editor extension host — panels written in Luau | Design |
| Android: in-app purchases and Play Games sign-in | Not started |

## Planned — 1.0

Targeted for **mid 2027**. 1.0 means the public API is stable and semver applies to it.

- **Stable engine API.** `Engine.*` frozen; breaking changes only in major releases.
- **Mobile out of experimental.** Android and iOS to the standard the desktop targets meet today, including store submission paths.
- **Console research.** Investigation only; console SDKs are under NDA and cannot be distributed with an open-source toolchain. Expect a documented path for licensed developers rather than a bundled target.
- **Asset streaming v2.** Chunked delivery with predictive preloading, aimed at the web target.
- **Multi-place standalone.** Roblox's teleport-between-places model working in standalone builds.
- **Editor performance.** Large-place load times and Explorer responsiveness on trees over 100k instances.

## Under consideration

Discussed, not committed. Weigh in on [Discussions](https://github.com/Luau-Engine/LuauEngine/discussions).

- Headless editor mode for automated place manipulation
- Visual scripting, interoperating with Luau modules
- A first-party networking layer above `Engine.Network` — prediction, rollback, interest management
- Ray-traced lighting on backends that support it
- A package registry for Luau libraries
- Linux ARM64 desktop builds

## Explicitly not planned

Stated plainly so nobody builds a plan around them:

- **Running published Roblox experiences outside Roblox.** Not a goal, not a side effect, and actively prevented by the asset licence checks.
- **A Roblox client replacement.** Standalone builds do not connect to Roblox servers.
- **Team Create.** Version control is the collaboration model.
- **A hosted service.** No accounts, no cloud builds, no hosting. Luau Engine is software you run.
- **Bundling Roblox-owned assets.** Avatar meshes, built-in audio and Toolbox content stay on Roblox.

## Release cadence

Minor releases roughly every six weeks; patches as needed. Below 1.0, breaking changes may land in minor releases and are always listed in the release notes. Pin your toolchain with `.luauengine-version` if you need stability across a team.

Announcements go to [News](/news) and the [releases page](https://github.com/Luau-Engine/LuauEngine/releases).
