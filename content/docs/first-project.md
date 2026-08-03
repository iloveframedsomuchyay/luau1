---
title: Your first project
sidebar_label: Your first project
description: Create a project, script it in Luau, run it in the editor, and compile it to a standalone executable.
---

This walkthrough goes from an empty folder to a running desktop build in about ten minutes. It assumes you have [installed](/docs/installation) the editor and the CLI.

## Create the project

From the editor, choose **File → New Project** and pick the *Baseplate* template. From a terminal:

```bash
luauengine new my-first-game --template baseplate
cd my-first-game
```

Either way you end up with:

```text
my-first-game/
├── luauengine.toml        # project manifest: name, targets, build settings
├── places/
│   └── main.rbxlx         # the place, stored as readable XML
├── src/
│   ├── server/            # scripts mapped into ServerScriptService
│   ├── client/            # scripts mapped into StarterPlayerScripts
│   └── shared/            # modules mapped into ReplicatedStorage
└── assets/                # meshes, textures, audio you own
```

The `src/` tree is mapped into the DataModel at load time, so scripts live on disk as ordinary `.luau` files that Git can diff. See [Project file](/docs/project-file) for how that mapping is configured.

## Write some Luau

Create `src/server/Greeter.server.luau`:

```luau title="src/server/Greeter.server.luau"
local Players = game:GetService("Players")

local function onPlayerAdded(player: Player)
	print(`{player.Name} joined`)

	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local score = Instance.new("IntValue")
	score.Name = "Score"
	score.Value = 0
	score.Parent = leaderstats
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

Nothing here is Luau Engine specific — it is the same code you would write in Studio, type annotations and all.

## Run it

Press **F5**, or:

```bash
luauengine run
```

The editor starts a local session with a server and one client, exactly like Studio's Play Solo. Output, the script debugger, breakpoints and the microprofiler all behave the way you expect.

To test replication, start extra clients:

```bash
luauengine run --clients 2
```

## Add something a standalone build can do

Standalone targets expose an `Engine` global for things Roblox hosts on your behalf — the window, the filesystem, command-line arguments. Guard it so the same code still runs on Roblox:

```luau title="src/client/Window.client.luau"
if Engine.Platform == Enum.Platform.Roblox then
	return -- nothing to do; Roblox owns the window
end

Engine.Window:SetTitle("My First Game")
Engine.Window:SetSize(1600, 900)

Engine.Window.CloseRequested:Connect(function()
	print("Saving before exit…")
	Engine.Storage:WriteJSON("save.json", { lastPlayed = os.time() })
	Engine:Quit()
end)
```

`Engine.Storage` writes to the per-user save directory for the platform, so you are not guessing at paths. The full surface is in [API differences](/docs/api-differences).

## Build a standalone executable

```bash
luauengine build --target windows --release
```

Output lands in `build/windows/`:

```text
build/windows/
├── MyFirstGame.exe
├── MyFirstGame.lue        # compiled place + scripts + assets
└── runtime/               # engine runtime libraries
```

Double-click the executable and your game runs with no editor and no Roblox client involved. Swap `--target` for `macos`, `linux`, `web` or `server` — see [Publishing overview](/docs/publishing-overview).

:::note Cross-compiling
Building for a platform you are not on needs that platform's SDK. `luauengine doctor --target macos` tells you what is missing. Most teams let CI build the targets they cannot build locally.
:::

## Publish to Roblox instead

The same project publishes upstream without changes:

```bash
luauengine publish --roblox --place-id 1234567890
```

Authenticate once with `luauengine auth roblox` and the credential is stored in your OS keychain. Details in [Publishing to Roblox](/docs/publish-roblox).

## Next steps

- [Editor tour](/docs/editor-tour) — what moved, what is new
- [Scripting](/docs/scripting) — Luau, types and the engine additions
- [Project file](/docs/project-file) — configure targets and the filesystem mapping
