---
title: The project file
sidebar_label: Project file
description: Every section of luauengine.toml, and how the filesystem maps into the DataModel.
---

`luauengine.toml` sits at the root of a project and is the only file the toolchain needs to know what to build. It is plain TOML — readable, diffable and safe to hand-edit.

## A complete example

```toml title="luauengine.toml"
[project]
name = "My Game"
version = "1.4.0"
identifier = "com.example.mygame"
publisher = "Example Studios"
description = "A game built with Luau Engine."
licence = "MIT"

[places]
main = "places/main.rbxlx"

[targets]
default = "windows"
enabled = ["roblox", "windows", "macos", "linux", "web"]

[targets.roblox]
place-id = 1234567890
universe-id = 987654321

[targets.windows]
arch = ["x86_64"]
icon = "assets/branding/icon.ico"
installer = true

[targets.web]
base-url = "/play/"
compression = "brotli"

[luau]
mode = "strict"
lints = ["all"]
warnings-as-errors = true

[luau.aliases]
shared = "src/shared"

[assets]
source = "assets"

[assets.textures]
format = "bc7"
max-size = 2048

[sync]
"src/server" = "ServerScriptService"
"src/client" = "StarterPlayer/StarterPlayerScripts"
"src/shared" = "ReplicatedStorage"

[physics]
mode = "realtime"
step-rate = 60

[render]
backend = "auto"
msaa = 4
```

## `[project]`

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Display name; used for window titles and output filenames |
| `version` | string | Semver; exposed as `Engine.Version` |
| `identifier` | string | Reverse-DNS; used for bundle IDs and save paths |
| `publisher` | string | Used in installers and the Windows save path |
| `licence` | string | SPDX identifier, written into build output |
| `build-number` | string | `auto`, `fixed`, or `git-describe` |

## `[sync]` — filesystem to DataModel

This is the mapping that turns directories into instances. Keys are paths relative to the project root; values are DataModel paths.

```toml
[sync]
"src/server" = "ServerScriptService"
"src/client" = "StarterPlayer/StarterPlayerScripts"
"src/shared" = "ReplicatedStorage"
"src/first-person" = "StarterPlayer/StarterCharacterScripts"
"vendor" = "ReplicatedStorage/Packages"
```

File suffixes decide instance classes — see [Scripting](/docs/scripting) for the full table. In short: `.luau` becomes a `ModuleScript`, `.server.luau` a `Script`, `.client.luau` a `LocalScript`, and a folder containing `init.luau` collapses into a single script.

Non-script files can be mapped too:

```toml
[sync.rules]
"*.json" = "ModuleScript"     # parsed and returned as a table
"*.txt" = "StringValue"
"*.csv" = "ModuleScript"
```

Excludes accept globs:

```toml
[sync]
exclude = ["**/*.spec.luau", "**/node_modules/**", "scratch/**"]
```

:::note Precedence
Anything in the place file wins over anything on disk with the same name. If `ServerScriptService.Main` exists in `main.rbxlx` *and* as `src/server/Main.server.luau`, the file wins and the build warns. Keep scripts in exactly one place.
:::

## `[luau]`

| Key | Default | Notes |
| --- | --- | --- |
| `mode` | `"nonstrict"` | `strict`, `nonstrict` or `nocheck`; per-file `--!` comments override |
| `lints` | `[]` | `"all"`, or specific lint names |
| `warnings-as-errors` | `false` | Fails `check` on any warning |
| `native-codegen` | `true` | Native compilation in release builds |
| `string-requires` | `false` | Enables `require("@alias/Module")`; not Roblox-compatible |

## `[targets]`

`default` is used when `--target` is absent. `enabled` limits what `--all` builds. Each target gets its own `[targets.<name>]` table; keys are documented on the per-target pages under [Publishing](/docs/publishing-overview).

Targets can inherit from one another, which saves repeating desktop settings three times:

```toml
[targets.windows-demo]
extends = "windows"
[targets.windows-demo.defines]
DEMO_MODE = true
```

```luau
if Engine.Defines.DEMO_MODE then
	limitToFirstLevel()
end
```

## `[assets]`

Covered in full on [Assets](/docs/assets). The short version: `source` points at the asset root, and per-type tables (`[assets.textures]`, `[assets.audio]`, `[assets.models]`) set processing defaults with optional per-target overrides.

## `[scripts]` — task shortcuts

```toml
[scripts]
dev = "luauengine run --clients 2"
ship = "luauengine build --all --release && luauengine publish --roblox"
lint = "luauengine check --strict && luauengine format --check"
```

```bash
luauengine dev
luauengine ship
```

## `[workspace]` — multiple projects

For a repository containing several related projects:

```toml title="luauengine.toml"
[workspace]
members = ["games/lobby", "games/arena", "packages/shared"]

[workspace.shared]
luau = { mode = "strict", lints = ["all"] }
```

```bash
luauengine build --workspace
luauengine check --workspace
```

Members inherit `[workspace.shared]` and may override any of it locally.

## Validating

```bash
luauengine config validate
```

Reports unknown keys, type mismatches and paths that do not exist, with line numbers. Worth running after hand-editing.
