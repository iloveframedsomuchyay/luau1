---
title: Introduction
sidebar_label: Introduction
description: Luau Engine is a free and open-source fork of Roblox Studio that builds for Roblox and for platforms Roblox never reached.
---

**Luau Engine** is a fork of Roblox Studio, released as free and open-source software. It keeps the editor, the DataModel and the Luau runtime you already work with every day, and adds a build pipeline that can compile the same project into a standalone game for Windows, macOS, Linux, the web and dedicated servers — as well as publishing to Roblox exactly as Studio does.

:::official Official
Luau Engine is licensed and official by Roblox Corporation. Roblox and Roblox Studio are trademarks of Roblox Corporation; Luau Engine is developed by an independent community of contributors under that licence. See [Licensing and trademarks](/docs/licensing) for the full terms and for what you may and may not call your own builds.
:::

## Why a fork?

Roblox Studio is an extremely good editor for a very specific target. The instance tree, the property grid, the scripting model and the Luau type system make it fast to go from an idea to a running experience, and a huge amount of collective knowledge is built on top of that workflow.

The limitation has always been the destination. A place you build in Studio runs on Roblox and nowhere else. Luau Engine keeps the first half — the tools and the mental model — and replaces the second half with a target you choose at build time.

Concretely, Luau Engine gives you:

- **The same editor.** Explorer, Properties, Toolbox, Output, the script editor with Luau autocomplete and type hints, and the plugin API. Most Studio plugins load without modification.
- **The same runtime semantics.** `game`, services, `Instance` hierarchies, signals, attributes, `CollectionService` tags, the task scheduler, and the upstream [Luau](https://luau.org) VM including native code generation.
- **Source you can read and change.** The editor, the runtime and the toolchain are open. Fix a bug, add an importer, ship a private build for your studio.
- **Targets past Roblox.** Native desktop executables, a WebAssembly bundle, a headless dedicated server, and experimental mobile output — from one project.

## What it is not

Being direct about the boundaries saves everyone time:

- It is **not a way to run Roblox experiences outside Roblox.** You cannot take somebody else's place, or content licensed to you only through Roblox, and export it. Exporting is for projects whose assets you own or have redistribution rights to.
- It is **not a Roblox client.** Standalone builds do not connect to Roblox servers, matchmaking, monetisation or moderation. If your game needs those, publish to Roblox.
- It is **not bug-for-bug identical.** A handful of Roblox-hosted services have no standalone equivalent and behave differently or not at all. Those differences are enumerated in [API differences](/docs/api-differences).

## How a project flows through the engine

```text
  your project (.rbxlx + luauengine.toml)
              │
        ┌─────┴─────┐
        │  editor   │  Luau Engine Studio — edit, run, debug
        └─────┬─────┘
              │  luauengine build --target <t>
   ┌──────────┼──────────┬───────────┬──────────────┐
   ▼          ▼          ▼           ▼              ▼
 Roblox   Windows /   Web        Dedicated      Android /
 place    macOS /     (wasm)     server          iOS
          Linux                                (experimental)
```

The project is the source of truth. Nothing about a target is baked into your place file — you pick targets in `luauengine.toml`, and the same tree of instances and scripts is compiled for each one.

## Where to go next

| If you want to… | Read |
| --- | --- |
| Install the editor | [Installation](/docs/installation) |
| Build something end to end | [Your first project](/docs/first-project) |
| Bring an existing place across | [Migrating from Roblox Studio](/docs/migrating-from-roblox-studio) |
| Understand the export targets | [Publishing overview](/docs/publishing-overview) |
| Drive everything from a terminal | [CLI reference](/docs/cli) |

If you are new to the Luau language itself rather than to the engine, the language documentation lives at [luau.org](https://luau.org).
