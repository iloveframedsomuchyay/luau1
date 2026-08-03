---
title: Assets and the import pipeline
sidebar_label: Assets
description: How meshes, textures, audio and fonts get from your disk into a build, and what you are allowed to ship.
---

On Roblox, assets live on Roblox's CDN and you reference them by ID. A standalone build has no CDN — it ships its own content. Luau Engine therefore treats assets as project files with a processing pipeline, while keeping `rbxassetid://` working for the Roblox target.

## Where assets live

```text
assets/
├── models/      .fbx .obj .gltf .glb
├── textures/    .png .jpg .tga .ktx2
├── audio/       .ogg .wav .mp3 .flac
├── fonts/       .ttf .otf
└── video/       .webm .mp4
```

Anything under `assets/` is picked up automatically. Reference it with the `asset://` scheme:

```luau
local part = Instance.new("MeshPart")
part.MeshId = "asset://models/crate.glb"
part.TextureID = "asset://textures/crate_albedo.png"
part.Parent = workspace

local sound = Instance.new("Sound")
sound.SoundId = "asset://audio/ambient_forest.ogg"
sound.Parent = workspace
```

`asset://` resolves on every target. For the Roblox target the pipeline uploads the file once, caches the resulting ID in `assets/.lock`, and rewrites the reference — so the same code works in both places without an `if`.

:::tip Mixing schemes
`rbxassetid://` still works, but only on the Roblox target. Builds for other targets fail the check step with the exact instance path, because there is nothing to resolve it against.
:::

## Processing

Each target gets its own processed output. Defaults are sensible; override per directory or per file.

```toml title="luauengine.toml"
[assets]
source = "assets"

[assets.textures]
format = "bc7"          # desktop
max-size = 2048
mipmaps = true
generate-normal-maps = false

[assets.textures.web]
format = "astc"         # web/mobile override
max-size = 1024

[assets.audio]
codec = "opus"
bitrate = 96
mono-below = 0.25       # sounds shorter than 250ms become mono

[assets.models]
generate-collision = "convex"
optimise-meshes = true
```

Run it explicitly, or let a build do it:

```bash
luauengine assets process --target windows
luauengine assets list --unused
luauengine assets report --size
```

`--size` prints a breakdown by directory and file, which is the fastest way to find the 40 MB texture nobody meant to commit.

## Per-file overrides

Drop an `.asset.toml` next to a file to override its settings:

```toml title="assets/textures/skybox.asset.toml"
format = "bc6h"
max-size = 4096
mipmaps = false
srgb = false
```

## Licence metadata

Every asset carries licence metadata, and it is enforced at build time. This is the mechanism that keeps you from accidentally redistributing content you are only licensed to use on Roblox.

```toml title="assets/audio/theme.asset.toml"
[licence]
type = "owned"                # owned | licensed | roblox-only | cc-by | public-domain
author = "Jane Doe"
redistributable = true
attribution = "Music by Jane Doe"
```

Rules applied per target:

| Licence type | Roblox target | Standalone targets |
| --- | --- | --- |
| `owned` | ships | ships |
| `licensed` with `redistributable = true` | ships | ships |
| `licensed` with `redistributable = false` | ships | **build fails** |
| `roblox-only` | ships | **build fails** |
| `cc-by` | ships | ships, attribution collected |
| unspecified | ships with a warning | **build fails** |

```bash
luauengine assets audit --target windows
```

The audit lists every asset that would block a standalone build, with the instances referencing it. Attribution for `cc-by` assets is collected into `CREDITS.txt` in the build output automatically.

:::warning Toolbox content
Models, audio and images obtained through the Roblox Toolbox or Creator Store are, by default, licensed for use on Roblox only. They are marked `roblox-only` on import and will block a standalone build. This is deliberate — see [Licensing](/docs/licensing).
:::

## Streaming versus packing

By default everything is packed into the `.lue` bundle. For large projects, stream instead:

```toml title="luauengine.toml"
[assets.delivery]
mode = "stream"                 # pack | stream
base-url = "https://cdn.example.com/mygame/"
preload = ["textures/ui/*", "audio/ui/*"]
```

Streaming builds ship a small manifest and fetch content on demand, which is usually what you want for the web target where download size gates whether anyone plays at all.

## Fonts

```luau
local label = Instance.new("TextLabel")
label.FontFace = Font.new("asset://fonts/Inter-Variable.ttf", Enum.FontWeight.SemiBold)
```

Roblox's built-in fonts (`Enum.Font.Gotham` and friends) are available on the Roblox target. On standalone targets they resolve to a bundled metric-compatible substitute unless you ship your own — the build warns when a substitution happens so the change is never silent.
