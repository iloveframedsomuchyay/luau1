---
title: Plugins
sidebar_label: Plugins
description: Run existing Roblox Studio plugins, and write new ones against the extended plugin API.
---

Luau Engine keeps the Studio plugin API. Most plugins written for Roblox Studio load and run without modification.

## Installing plugins

Three sources, in order of preference:

**From a local file** — drop a `.rbxm` or `.rbxmx` into the plugins directory:

| Platform | Path |
| --- | --- |
| Windows | `%LOCALAPPDATA%\LuauEngine\Plugins` |
| macOS | `~/Library/Application Support/LuauEngine/Plugins` |
| Linux | `~/.local/share/luauengine/plugins` |

**From a project** — plugins committed under `plugins/` in your project load only for that project, which keeps a team on the same tooling:

```toml title="luauengine.toml"
[plugins]
local-dir = "plugins"
auto-reload = true
```

**From the registry**:

```bash
luauengine plugin install rojo
luauengine plugin list
luauengine plugin remove rojo
```

The Roblox Creator Store is also browsable for the Roblox target from the Toolbox, exactly as in Studio.

## Compatibility

| API | Status |
| --- | --- |
| `plugin:CreateToolbar`, `CreateButton` | Works |
| `plugin:CreateDockWidgetPluginGui` | Works |
| `plugin:GetMouse`, `Activate`, `Deactivate` | Works |
| `plugin:GetSetting` / `SetSetting` | Works |
| `ChangeHistoryService` | Works |
| `Selection` service | Works |
| `plugin:OpenScript` | Works |
| `plugin:CreatePluginAction` | Works |
| `HttpService` from a plugin | Works, permission-prompted on first use |
| `plugin:GetJoinData`, Team Create APIs | Not available |
| Roblox-hosted marketplace purchase prompts | Roblox target only |

If a plugin fails to load, the reason is printed in Build Output rather than swallowed. `luauengine plugin doctor <name>` reports which APIs it touches and which of those are unavailable.

## Writing a plugin

Identical to Studio:

```luau title="plugins/QuickTag/init.server.luau"
local CollectionService = game:GetService("CollectionService")
local Selection = game:GetService("Selection")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local toolbar = plugin:CreateToolbar("Quick Tag")
local button = toolbar:CreateButton("Tag Hazard", "Tag the selection as Hazard", "")

button.Click:Connect(function()
	local recording = ChangeHistoryService:TryBeginRecording("Tag Hazard")
	if not recording then
		return
	end

	for _, instance in Selection:Get() do
		CollectionService:AddTag(instance, "Hazard")
	end

	ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit)
end)
```

## Engine plugin extensions

Plugins can also reach the build system through the `enginePlugin` global, which has no Studio equivalent. It is `nil` when a plugin runs in Roblox Studio, so guard on it and your plugin stays portable.

```luau
if enginePlugin then
	-- Add a step that runs before every build
	enginePlugin:AddBuildStep({
		name = "Validate spawn points",
		phase = "pre-build",
		run = function(context)
			local spawns = context.DataModel.Workspace:GetChildren()
			if #spawns == 0 then
				context:Error("No spawn points in Workspace")
			end
		end,
	})

	-- Register a target-aware asset importer
	enginePlugin:AddAssetImporter({
		extensions = { ".tiled.json" },
		import = function(file, target)
			return convertTilemap(file, target)
		end,
	})
end
```

Available extension points:

| Method | Purpose |
| --- | --- |
| `AddBuildStep` | Hook `pre-build`, `post-build`, `pre-publish`, `post-publish` |
| `AddAssetImporter` | Handle new source file formats |
| `AddTarget` | Register a custom export target |
| `AddPanel` | Add a dockable panel with a Luau-driven UI |
| `AddCommand` | Add a command-palette entry and optional CLI subcommand |

## Publishing a plugin

```bash
luauengine plugin package ./plugins/QuickTag --out QuickTag.rbxm
luauengine plugin publish ./plugins/QuickTag
```

Publishing pushes to the community registry. A `plugin.toml` supplies the metadata:

```toml title="plugins/QuickTag/plugin.toml"
name = "quick-tag"
display-name = "Quick Tag"
version = "1.2.0"
author = "you"
licence = "MIT"
description = "Tag the current selection with one click."
min-engine-version = "0.9.0"
studio-compatible = true
```

Setting `studio-compatible = true` also produces an `.rbxm` that installs into Roblox Studio, so one source tree serves both editors.
