---
title: Migrating from Roblox Studio
sidebar_label: Migrating from Studio
description: Bring an existing place into Luau Engine, keep publishing to Roblox, and find out what needs changing before a standalone build.
---

Bringing a place across is usually a matter of opening it. The work, when there is any, is in deciding what a standalone build should do about the parts of your game that depend on Roblox itself.

## Open an existing place

**File → Open** accepts `.rbxl`, `.rbxlx`, `.rbxm` and `.rbxmx`. Everything comes across: the instance tree, scripts, attributes, `CollectionService` tags, packages, terrain and lighting.

From the CLI, converting a place into a project skeleton is one command:

```bash
luauengine import ./MyGame.rbxl --out ./my-game
```

That produces a `luauengine.toml`, extracts scripts into `src/` as `.luau` files, and rewrites the place as `.rbxlx`. Your original file is not modified.

:::note Round trips are lossless
Saving back to `.rbxl` produces a file Roblox Studio opens normally. You can move a project between the two editors indefinitely — nothing Luau Engine adds is written into the place file. Project-level settings live in `luauengine.toml`, which Studio ignores.
:::

## Keep shipping to Roblox

If Roblox is your only target, you are done. Set it as the default and publish as usual:

```toml title="luauengine.toml"
[targets]
default = "roblox"

[targets.roblox]
place-id = 1234567890
universe-id = 987654321
```

```bash
luauengine publish --roblox
```

Everything in [Publishing to Roblox](/docs/publish-roblox) applies unchanged.

## Preparing for a standalone build

A standalone target has no Roblox behind it. Four categories of code need attention.

### 1. Player identity and accounts

`Player.UserId`, `Player.DisplayName` and friends exist, but off Roblox there is no account system to populate them. By default the runtime assigns local identities. If you need real accounts, plug in your own provider:

```luau
if Engine.Platform ~= Enum.Platform.Roblox then
	Engine.Identity:SetProvider(require(script.Parent.MyAuthProvider))
end
```

### 2. Data persistence

`DataStoreService` has no Roblox backend outside Roblox. The runtime ships a local implementation that writes to the user's save directory, which is right for single-player and wrong for anything authoritative:

```luau
local DataStore = if Engine.Platform == Enum.Platform.Roblox
	then game:GetService("DataStoreService"):GetDataStore("Saves")
	else Engine.Storage:GetDataStore("Saves") -- local files, or your own backend
```

`Engine.Storage:SetBackend()` lets you point it at an HTTP service you control. See [Dedicated servers](/docs/dedicated-servers).

### 3. Monetisation and social

`MarketplaceService`, `GamePassService`, friends, groups and chat filtering are Roblox platform services. Off Roblox they are absent, and calls raise a clear error rather than silently no-op. Gate them:

```luau
if Engine.Capabilities.Monetisation then
	-- Roblox purchase flow
else
	-- your storefront, or nothing at all
end
```

### 4. Assets you do not own

This is the one that catches teams out. Free models, Toolbox audio and marketplace meshes are licensed for use *on Roblox*. They cannot be redistributed inside a standalone executable.

The analyser flags them for you:

```bash
luauengine check --target windows
```

Any asset without redistribution rights is reported with the instance path that references it. Replace it with something you own, or keep that content on the Roblox target only. [Licensing](/docs/licensing) covers this in detail.

## A staged approach that works

1. Open the place in Luau Engine and confirm it still runs against the `roblox` target. Nothing else changes.
2. Run `luauengine import` to move scripts onto disk and get them into version control properly.
3. Run `luauengine check --target windows` and read the report without fixing anything yet — it tells you how far you actually are.
4. Introduce `Engine.Capabilities` guards around platform services.
5. Replace or remove non-redistributable assets.
6. Build, run, fix what breaks, repeat.

Most projects clear steps 1–3 in an afternoon. Steps 4–6 scale with how deeply your game leans on Roblox platform features.

## Things that do not carry over

| Studio feature | Standalone equivalent |
| --- | --- |
| Team Create | Version control (Git) |
| Roblox analytics | `Engine.Telemetry`, or your own |
| Roblox moderation and chat filtering | None — you are responsible |
| Roblox matchmaking | Your own server list, or direct connect |
| Premium payouts, Robux, Game Passes | Your own storefront |
| Roblox avatar system | `Engine.Avatar` with your own rigs |
