---
title: "Introducing Luau Engine"
date: 2026-03-14
author: The Luau Engine team
description: An open-source fork of Roblox Studio that builds for Roblox — and for Windows, macOS, Linux and the web.
---

Today we are releasing **Luau Engine**: a free and open-source fork of Roblox Studio that keeps the editor you already know and lets you compile the same project into a standalone game.

Luau Engine is licensed and official by Roblox Corporation. Roblox and Roblox Studio are trademarks of Roblox Corporation; the engine itself is built by an independent community of contributors under that licence.

## The problem we started with

Roblox Studio is a genuinely excellent editor. The instance tree, the property grid, the scripting model, the Luau type system — it is fast to think in, and an enormous amount of collective knowledge sits on top of it.

The constraint was always the destination. Everything you build in Studio runs on Roblox and nowhere else. For a lot of projects that is exactly right. For others it means either accepting the ceiling or rewriting the whole thing in an engine with a completely different mental model.

Luau Engine keeps the first half and replaces the second.

## What you get

**The editor, unchanged.** Explorer, Properties, Toolbox, Output, the script editor with Luau autocomplete and inline type errors, the debugger, the MicroProfiler. Most Studio plugins load without modification.

**The runtime, unchanged.** `game`, services, `Instance`, signals, attributes, tags, the task scheduler, replication, and the upstream Luau VM with native codegen and the full gradual type system.

**A target you choose.** The same project builds for Roblox, for native Windows, macOS and Linux executables, for the web as WebAssembly, and for a headless dedicated server you host yourself.

```bash
luauengine build --target windows --release
luauengine build --target web
luauengine publish --roblox --place-id 1234567890
```

**Source you can change.** MIT-licensed, all of it. Fix a bug, add an importer, ship a private build for your studio.

## What we are not doing

Being clear about this from day one:

- Luau Engine does **not** run published Roblox experiences outside Roblox. It exports projects you author, from assets you own.
- Standalone builds are **not** Roblox clients — no Roblox servers, matchmaking, monetisation or moderation.
- Content you obtained through the Toolbox or Creator Store **cannot** ship in a standalone build. The pipeline enforces this at build time rather than leaving it to memory. We wrote about the reasoning in [a separate post](/news/asset-licence-enforcement).

## Where it stands

Editor, runtime, Roblox publishing and the desktop targets are stable. The web target and dedicated servers are in beta. Android and iOS are experimental. The [roadmap](/docs/roadmap) has the detail.

## Getting started

```bash
luauengine new my-game --template baseplate
cd my-game
luauengine run
```

- [Download](/download)
- [Introduction](/docs/introduction)
- [Your first project](/docs/first-project)
- [Migrating from Roblox Studio](/docs/migrating-from-roblox-studio)

If you have an existing place, open it. That is the whole migration for the Roblox target — and `luauengine check --target windows` will tell you honestly how far you are from a standalone build.

We would rather hear what breaks than not. [Issues](https://github.com/Luau-Engine/LuauEngine/issues) and [Discussions](https://github.com/Luau-Engine/LuauEngine/discussions) are both open.
