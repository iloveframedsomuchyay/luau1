---
title: Publishing overview
sidebar_label: Overview
description: Every target Luau Engine can build, what each one produces, and how to configure them.
---

One project, many destinations. Targets are declared in `luauengine.toml` and selected at build time; the place file itself never changes.

## Targets

| Target | Output | Status |
| --- | --- | --- |
| `roblox` | A published place or universe on roblox.com | Stable |
| `windows` | `.exe` + runtime, installer or portable `.zip` | Stable |
| `macos` | Universal `.app`, `.dmg`, notarisation-ready | Stable |
| `linux` | AppImage, `.tar.gz`, `.deb`, `.rpm` | Stable |
| `web` | WebAssembly + WebGPU bundle for static hosting | Beta |
| `server` | Headless authoritative build, Docker image optional | Beta |
| `android` | `.apk` and `.aab`, signed with your keystore | Experimental |
| `ios` | Xcode project for your own signing | Experimental |

## Declaring targets

```toml title="luauengine.toml"
[project]
name = "My Game"
version = "1.4.0"
identifier = "com.example.mygame"

[targets]
default = "windows"
enabled = ["roblox", "windows", "macos", "linux", "web"]

[targets.roblox]
place-id = 1234567890
universe-id = 987654321

[targets.windows]
arch = ["x86_64", "aarch64"]
icon = "assets/branding/icon.ico"
installer = true

[targets.web]
base-url = "/play/"
compression = "brotli"
```

## Building

```bash
luauengine build                       # the default target
luauengine build --target macos        # a specific one
luauengine build --all                 # everything in `enabled`
luauengine build --target windows --release
```

Debug builds are the default: unstripped symbols, the debug port open, hot-reload enabled. `--release` strips symbols, enables full Luau optimisation and native codegen, and turns off the debug port.

Output goes to `build/<target>/`, overridable with `--out`.

## What a build contains

```text
build/windows/
├── MyGame.exe          # launcher; sets up the runtime and loads the bundle
├── MyGame.lue          # compiled place, scripts and packed assets
├── runtime/            # engine shared libraries
├── CREDITS.txt         # attribution collected from asset licences
└── LICENSES/           # third-party licence texts
```

The `.lue` bundle holds the compiled DataModel, Luau bytecode and processed assets in one signed archive. It is content-addressed, so shipping a patch means shipping the chunks that changed.

## The check step

Every build runs a check first. Run it alone to see problems without waiting for a full compile:

```bash
luauengine check --target windows
```

It reports:

- Luau type errors and lints
- platform-service calls not behind an `Engine.Capabilities` guard
- assets whose licence forbids redistribution on this target
- `rbxassetid://` references in a non-Roblox target
- missing SDKs for the requested target

Wire it into CI and most cross-target breakage never reaches a build.

## Versioning

```toml
[project]
version = "1.4.0"
build-number = "auto"     # auto | fixed | git-describe
```

`auto` increments per build, `git-describe` uses `git describe --tags --always`. The value is available at runtime:

```luau
print(Engine.Version)       -- "1.4.0"
print(Engine.BuildNumber)   -- "1.4.0-42-g8c31a9f"
```

## Signing

```toml
[targets.windows.signing]
certificate = "env:WINDOWS_CERT_PATH"
password = "env:WINDOWS_CERT_PASSWORD"
timestamp-url = "http://timestamp.digicert.com"

[targets.macos.signing]
identity = "env:APPLE_DEVELOPER_ID"
notarize = true
apple-id = "env:APPLE_ID"
team-id = "env:APPLE_TEAM_ID"
```

`env:` values are read from the environment at build time, so secrets stay out of the repository.

## Continuous integration

```bash
luauengine ci build --all --release --out ./artifacts
```

`ci` runs non-interactively, emits machine-readable logs and exits non-zero on any check failure. A GitHub Actions workflow is in [Contributing](/docs/contributing).

## Per-target detail

- [Publishing to Roblox](/docs/publish-roblox)
- [Desktop export](/docs/export-desktop)
- [Web export](/docs/export-web)
- [Mobile export](/docs/export-mobile)
- [Dedicated servers](/docs/dedicated-servers)
