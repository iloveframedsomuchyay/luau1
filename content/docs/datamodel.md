---
title: The DataModel
sidebar_label: DataModel
description: Instances, services and the hierarchy behave as they do in Roblox — with a few additions for standalone builds.
---

The DataModel is unchanged. `game` is the root, services hang off it, and `Instance` behaves exactly as it does on Roblox — same properties, same events, same parenting rules, same replication model.

## Services

Every service you would reach for is present:

```luau
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CollectionService = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
```

Services fall into three groups:

| Group | Behaviour off Roblox |
| --- | --- |
| **Engine services** — `Workspace`, `Lighting`, `RunService`, `Players`, `ReplicatedStorage`, `CollectionService`, `TweenService`, `PhysicsService`, `SoundService`, `UserInputService` | Identical |
| **Adapted services** — `DataStoreService`, `HttpService`, `TeleportService`, `TextService` | Present with a local or pluggable implementation |
| **Platform services** — `MarketplaceService`, `GamePassService`, `SocialService`, `PolicyService` | Absent; calls raise an error |

Check before you call:

```luau
if Engine.Capabilities.Monetisation then
	local MarketplaceService = game:GetService("MarketplaceService")
	-- …
end
```

`Engine.Capabilities` is a plain table of booleans resolved at build time, so the analyser can flag unguarded platform calls statically.

## Instances

`Instance.new`, `:Clone()`, `:Destroy()`, `:FindFirstChild()`, `:WaitForChild()`, `:GetDescendants()`, `:IsA()` — all present, all with the same semantics.

```luau
local part = Instance.new("Part")
part.Size = Vector3.new(4, 1, 4)
part.Position = Vector3.new(0, 10, 0)
part.Anchored = true
part.BrickColor = BrickColor.new("Really blue")
part.Parent = workspace
```

Attributes and tags work the same way and are the recommended place for gameplay metadata, because they survive round trips through both editors:

```luau
part:SetAttribute("Damage", 25)
CollectionService:AddTag(part, "Hazard")

for _, hazard in CollectionService:GetTagged("Hazard") do
	print(hazard:GetAttribute("Damage"))
end
```

## Replication

The client/server split is preserved. `RunService:IsServer()` and `:IsClient()` behave as expected, `RemoteEvent` and `RemoteFunction` work identically, and the same replication filtering applies to `ReplicatedStorage` versus `ServerStorage`.

```luau
-- server
local remote = Instance.new("RemoteEvent")
remote.Name = "Damaged"
remote.Parent = ReplicatedStorage
remote:FireClient(player, 25)

-- client
ReplicatedStorage:WaitForChild("Damaged").OnClientEvent:Connect(function(amount)
	print("took", amount)
end)
```

In a single-player standalone build the server and client run in the same process, but the boundary is still enforced — code that would fail to replicate on Roblox fails locally too, so you cannot accidentally write a game that only works offline.

## Additions

Standalone targets add instances that have no Roblox counterpart. They are inert on the `roblox` target, so leaving them in your place is safe.

| Instance | Purpose |
| --- | --- |
| `EngineConfiguration` | Per-place engine settings — window defaults, tick rate, render backend |
| `AssetManifest` | Declares which assets ship with a build and their licence metadata |
| `PlatformBinding` | Maps abstract actions to per-platform inputs |

```luau
local config = Instance.new("EngineConfiguration")
config.WindowTitle = "My Game"
config.DefaultResolution = Vector2.new(1600, 900)
config.TickRate = 60
config.Parent = game
```

## The `Engine` global

Available on every target; on Roblox it reports `Engine.Platform == Enum.Platform.Roblox` and exposes only the members that make sense there.

| Member | Purpose |
| --- | --- |
| `Engine.Platform` | Current target as an `Enum.Platform` |
| `Engine.Capabilities` | Booleans for optional platform features |
| `Engine.Window` | Title, size, fullscreen, close events (desktop) |
| `Engine.Storage` | Save files, local data stores, pluggable backends |
| `Engine.Identity` | Local or custom player identity |
| `Engine.Args` | Command-line arguments passed to the executable |
| `Engine.Telemetry` | Optional, opt-in analytics sink |
| `Engine:Quit(code)` | Shut down cleanly |

Full signatures are in [API differences](/docs/api-differences).
