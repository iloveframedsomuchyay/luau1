---
title: Desktop export
sidebar_label: Desktop (Windows, macOS, Linux)
description: Compile your project into a native executable for Windows, macOS and Linux, with installers and store packaging.
---

Desktop is the most complete non-Roblox target. Builds are native executables with no Roblox client, no launcher and no account requirement.

## Build

```bash
luauengine build --target windows --release
luauengine build --target macos --release
luauengine build --target linux --release
```

Cross-compiling needs the target's SDK. `luauengine doctor --target macos` lists what is missing; macOS builds in particular require macOS or a licensed macOS CI runner.

## Configuration

```toml title="luauengine.toml"
[project]
name = "My Game"
version = "1.4.0"
identifier = "com.example.mygame"
publisher = "Example Studios"

[targets.windows]
arch = ["x86_64", "aarch64"]
icon = "assets/branding/icon.ico"
installer = true
portable = true
console = false                # true keeps a console window for logs

[targets.macos]
arch = ["universal"]
icon = "assets/branding/icon.icns"
category = "public.app-category.games"
minimum-os = "12.0"

[targets.linux]
formats = ["appimage", "tar.gz", "deb"]
icon = "assets/branding/icon.png"
categories = ["Game"]
```

## Output

```text
build/windows/
├── MyGame.exe
├── MyGame.lue
├── runtime/
├── CREDITS.txt
└── LICENSES/

build/windows/installer/
└── MyGame-1.4.0-x86_64-setup.exe

build/macos/
└── My Game.app/

build/linux/
├── MyGame-1.4.0-x86_64.AppImage
└── mygame_1.4.0_amd64.deb
```

## The window

```luau title="src/client/Window.client.luau"
if Engine.Platform == Enum.Platform.Roblox then
	return
end

local window = Engine.Window

window:SetTitle(`My Game {Engine.Version}`)
window:SetSize(1600, 900)
window:SetMinimumSize(1280, 720)
window:SetResizable(true)
window:SetFullscreen(false)

window.Resized:Connect(function(width: number, height: number)
	print(`window is now {width}x{height}`)
end)

window.CloseRequested:Connect(function()
	saveGame()
	Engine:Quit(0)
end)
```

`CloseRequested` fires instead of the window closing, so you own the shutdown path. If nothing handles it within five seconds the runtime closes anyway.

## Saving data

`Engine.Storage` writes to the platform's conventional per-user location, so you never hard-code a path:

| Platform | Location |
| --- | --- |
| Windows | `%APPDATA%\<publisher>\<name>` |
| macOS | `~/Library/Application Support/<identifier>` |
| Linux | `$XDG_DATA_HOME/<identifier>` |

```luau
Engine.Storage:WriteJSON("save.json", {
	level = 12,
	inventory = inventory:Serialise(),
	playtime = os.time() - sessionStart,
})

local save = Engine.Storage:ReadJSON("save.json")
if save then
	restore(save)
end

print(Engine.Storage:GetPath())     -- resolved directory
print(Engine.Storage:Exists("save.json"))
Engine.Storage:Delete("save.json")
```

For key/value access with a DataStore-shaped API:

```luau
local store = Engine.Storage:GetDataStore("PlayerData")
store:SetAsync(`player_{userId}`, data)
local loaded = store:GetAsync(`player_{userId}`)
```

## Command-line arguments

```luau
for _, arg in Engine.Args do
	if arg == "--windowed" then
		Engine.Window:SetFullscreen(false)
	elseif arg:match("^--server=") then
		connectTo(arg:sub(10))
	end
end
```

The runtime reserves `--render-backend`, `--luau-debug`, `--verbose`, `--safe-mode` and `--data-dir`. Everything else is yours.

## Store packaging

**Steam** — the build is a plain folder, so upload it with `steamcmd` as-is. The optional Steamworks bridge exposes achievements and cloud saves:

```toml
[targets.windows.steam]
app-id = 1234560
achievements = true
cloud-saves = true
```

```luau
if Engine.Capabilities.Steam then
	Engine.Steam:UnlockAchievement("FIRST_BOSS")
end
```

**itch.io** — `butler push build/windows my-user/my-game:windows`.

**Microsoft Store / Mac App Store** — set `packaging = "msix"` or `packaging = "pkg"` and supply signing identities. Both stores require sandbox entitlements; `luauengine doctor --target windows --store msix` checks them.

## Reducing size

A default release build is roughly 45–70 MB before assets. To trim it:

```toml
[targets.windows.optimise]
strip-symbols = true
compress-runtime = true       # LZ4 the runtime libraries
exclude-unused-services = true
```

`exclude-unused-services` drops engine services your scripts never reference, determined statically. `luauengine build --report-size` shows what each component contributes.
