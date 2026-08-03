---
title: Scripting with Luau
sidebar_label: Scripting
description: The upstream Luau VM, the gradual type system, and how scripts map between disk and the DataModel.
---

Luau Engine embeds the upstream [Luau](https://luau.org) VM — the same one Roblox ships, including native code generation and the full gradual type system. Nothing about the language is forked, so language documentation at luau.org applies directly.

## Scripts on disk

The one meaningful difference from Studio: scripts are files. The suffix decides which class the instance becomes.

| File | Instance |
| --- | --- |
| `Foo.luau` | `ModuleScript` |
| `Foo.server.luau` | `Script` (`RunContext.Server`) |
| `Foo.client.luau` | `LocalScript` |
| `init.luau` | The containing folder becomes a `ModuleScript` |
| `init.server.luau` | The containing folder becomes a `Script` |

A folder containing `init.luau` collapses into a single ModuleScript with its siblings as children, which is how you write a module with submodules:

```text
src/shared/Inventory/
├── init.luau          -- ReplicatedStorage.Inventory
├── Item.luau          -- ReplicatedStorage.Inventory.Item
└── Slots.luau         -- ReplicatedStorage.Inventory.Slots
```

```luau title="src/shared/Inventory/init.luau"
local Item = require(script.Item)
local Slots = require(script.Slots)

local Inventory = {}
Inventory.__index = Inventory

export type Inventory = typeof(setmetatable({} :: {
	slots: { Slots.Slot },
	owner: Player,
}, Inventory))

function Inventory.new(owner: Player): Inventory
	return setmetatable({ slots = {}, owner = owner }, Inventory)
end

function Inventory.add(self: Inventory, item: Item.Item): boolean
	if #self.slots >= 32 then
		return false
	end
	table.insert(self.slots, { item = item, count = 1 })
	return true
end

return Inventory
```

## Types

Strict mode, `--!strict`, `--!nonstrict` and `--!nocheck` all behave as on Roblox, and the analyser is the same one that powers Studio's inline errors.

```luau
--!strict

type Weapon = {
	name: string,
	damage: number,
	cooldown: number,
	onHit: ((target: Humanoid) -> ())?,
}

local function fire(weapon: Weapon, target: Humanoid)
	target:TakeDamage(weapon.damage)
	if weapon.onHit then
		weapon.onHit(target)
	end
end
```

Set a project-wide default so every script starts checked:

```toml title="luauengine.toml"
[luau]
mode = "strict"
lints = ["all"]
warnings-as-errors = true
```

Run the analyser without launching the editor — this is what you want in CI:

```bash
luauengine check
luauengine check --target windows   # also checks capability guards
```

## The scheduler

`task.spawn`, `task.defer`, `task.delay`, `task.wait` and `task.cancel` behave identically, as do `RunService.Heartbeat`, `.RenderStepped` (client only) and `.Stepped`.

```luau
local RunService = game:GetService("RunService")

local elapsed = 0
local connection = RunService.Heartbeat:Connect(function(dt: number)
	elapsed += dt
	if elapsed >= 5 then
		print("five seconds of gameplay")
	end
end)

task.delay(10, function()
	connection:Disconnect()
end)
```

## Capability guards

Standalone targets do not have Roblox's platform services. Rather than discovering that at runtime, guard on `Engine.Capabilities` and let the analyser check it:

```luau
if Engine.Capabilities.Monetisation then
	local MarketplaceService = game:GetService("MarketplaceService")
	MarketplaceService:PromptProductPurchase(player, productId)
else
	openLocalStore(player)
end
```

`luauengine check --target windows` reports any platform-service call not inside such a guard, with file and line. Treat those warnings as errors in CI and the class of bug where a build works on Roblox and crashes on desktop simply stops happening.

## Engine-only APIs

The reverse guard is just as important — desktop APIs do not exist on Roblox:

```luau
if Engine.Platform ~= Enum.Platform.Roblox then
	local args = Engine.Args               -- { string }
	if table.find(args, "--windowed") then
		Engine.Window:SetFullscreen(false)
	end
end
```

## Requiring modules

`require` works by instance reference as it does on Roblox:

```luau
local Inventory = require(game.ReplicatedStorage.Inventory)
local Config = require(script.Parent.Config)
```

String requires (`require("@shared/Inventory")`) are available when enabled, resolved through aliases in the manifest:

```toml title="luauengine.toml"
[luau.aliases]
shared = "src/shared"
server = "src/server"
```

They are off by default because they do not exist on Roblox; enable them only if the Roblox target is not in your plans.

## Debugging

Breakpoints, conditional breakpoints, watches, the call stack and step in/over/out work in the editor for every target, including while a standalone build runs. Attach to a running executable:

```bash
luauengine debug attach --port 6009
```

The runtime also honours `--luau-debug` on the command line, which opens the debug port on a build you shipped to a tester.
