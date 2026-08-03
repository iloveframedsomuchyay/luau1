---
title: Frequently asked questions
sidebar_label: FAQ
description: Common questions about Luau Engine, its relationship to Roblox, and what it can and cannot do.
---

## Is this actually official?

Luau Engine is licensed and official by Roblox Corporation. Roblox and Roblox Studio are trademarks of Roblox Corporation. Luau Engine is developed by an independent community of contributors under that licence — it is not a Roblox Corporation product, and Roblox does not provide support for it. Read [Licensing and trademarks](/docs/licensing) before you rely on that relationship for anything commercial, and before you use Roblox branding on your own builds.

## Is it free?

Yes. The editor, runtime and toolchain are free and open source. There are no seat licences, no revenue share and no paid tier. Publishing to Roblox is still governed by Roblox's own terms.

## Can I run other people's Roblox games outside Roblox?

No. Luau Engine exports projects you author, whose assets you own or have redistribution rights to. It does not decrypt, download or extract published Roblox experiences, and the asset licence checks in the build pipeline exist specifically to stop content licensed for Roblox-only use ending up in a standalone build.

## Can I still publish to Roblox?

Yes, and nothing about your game changes because of it. Publishing goes through the same Open Cloud APIs Studio uses. See [Publishing to Roblox](/docs/publish-roblox).

## Will my existing place work?

Almost certainly, for the Roblox target — open it and carry on. For a standalone build, the work is in the parts of your game that depend on Roblox platform services: monetisation, friends, moderation, DataStores, and Toolbox assets you do not own. `luauengine check --target windows` tells you exactly where you stand. See [Migrating from Roblox Studio](/docs/migrating-from-roblox-studio).

## Do my Studio plugins work?

Most of them, unmodified. The plugin API is preserved. Plugins that depend on Team Create or Roblox-hosted purchase flows do not. See [Plugins](/docs/plugins).

## Is the Luau language forked?

No. Luau Engine embeds the upstream [Luau](https://luau.org) VM, including native code generation and the full gradual type system. Language documentation at luau.org applies exactly.

## What about performance?

Roughly comparable to Roblox for the same scene, and often better on desktop because there is no client sandbox overhead and you control the render settings. The deterministic physics mode costs performance in exchange for reproducibility. Measure your own project — `luauengine profile` produces Chrome Trace files.

## Can I make money from a standalone build?

Yes. A standalone build is your software; sell it on Steam, itch.io or anywhere else. You are responsible for your own storefront, payments and refunds — there is no Robux and no Roblox payout involved. Note that assets you obtained through Roblox generally cannot ship in it.

## Is there multiplayer?

Yes. The client/server model is preserved and the `server` target builds a headless authoritative server you host yourself. There is no matchmaking, server browser or NAT punch-through in the box — you build or buy those. See [Dedicated servers](/docs/dedicated-servers).

## Is there moderation or chat filtering?

No. Roblox's moderation applies on Roblox. In a standalone build, user-generated text and images are entirely your responsibility, including any legal obligations that come with hosting them.

## What platforms can I build for?

Windows, macOS, Linux and Roblox are stable. Web and dedicated servers are in beta. Android and iOS are experimental. See [Publishing overview](/docs/publishing-overview).

## Does it collect telemetry?

No. Nothing is collected or transmitted unless you enable `Engine.Telemetry` in your own game, and that sends data to an endpoint you configure. The editor's update check contacts the release server for a version number and nothing else; `LUAUENGINE_NO_TELEMETRY=1` disables even that.

## How do I report a bug or ask for a feature?

The [issue tracker](https://github.com/Luau-Engine/LuauEngine/issues). Include your version (`luauengine --version`), platform, target and a minimal reproduction. For questions rather than bugs, use [Discussions](https://github.com/Luau-Engine/LuauEngine/discussions).

## Can I contribute?

Yes — see [Contributing](/docs/contributing). Documentation fixes are as welcome as engine work, and every page here has an "Edit this page" link at the bottom.

## What is the release cadence?

Minor releases roughly every six weeks, patch releases as needed. Breaking changes are confined to minor releases while the version is below 1.0 and are always listed in the release notes. Pin your toolchain with `.luauengine-version` if you need stability.
