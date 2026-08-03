---
title: Installation
sidebar_label: Installation
description: Install Luau Engine Studio and the luauengine command-line tools on Windows, macOS or Linux.
---

Luau Engine ships as two pieces that install together:

- **Luau Engine Studio** — the editor, forked from Roblox Studio.
- **`luauengine`** — the command-line toolchain used for builds, tests and publishing. The editor shells out to it, and so can your CI.

## System requirements

| | Minimum | Recommended |
| --- | --- | --- |
| OS | Windows 10 20H2, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 24.04 |
| CPU | x86-64 with SSE4.2, or ARM64 | 6+ cores |
| Memory | 8 GB | 16 GB |
| GPU | Direct3D 11 / Metal 2 / Vulkan 1.1 | Anything from the last five years |
| Disk | 4 GB | 12 GB with build caches |

## Windows

Download the installer from the [downloads page](/download) and run it, or use winget:

```bash
winget install LuauEngine.Studio
```

A portable build is also published as a `.zip` if you would rather not run an installer — unpack it anywhere and run `LuauEngineStudio.exe`.

## macOS

```bash
brew install --cask luau-engine
```

Or download the `.dmg` and drag **Luau Engine Studio** to Applications. The release builds are signed and notarised, so Gatekeeper will not prompt.

## Linux

The AppImage runs on any reasonably current distribution:

```bash
curl -LO https://luauengine.org/dl/latest/LuauEngineStudio-x86_64.AppImage
chmod +x LuauEngineStudio-x86_64.AppImage
./LuauEngineStudio-x86_64.AppImage
```

Distribution packages are also published for Debian/Ubuntu (`.deb`) and Fedora (`.rpm`). On a bare server where you only need the toolchain, install the CLI on its own:

```bash
curl -fsSL https://luauengine.org/install.sh | sh
```

That script drops a single static `luauengine` binary into `~/.luauengine/bin` and prints the line to add to your shell profile.

:::tip Verify what you downloaded
Every release publishes `SHA256SUMS` and a detached signature alongside the binaries. Check them before installing on anything you care about:

```bash
sha256sum -c SHA256SUMS --ignore-missing
```
:::

## Confirm the install

```bash
luauengine --version
luauengine doctor
```

`doctor` checks the pieces that usually go wrong — graphics backend, toolchain paths, SDKs for any cross-compilation targets you have enabled — and tells you exactly what is missing.

## Build from source

You need CMake 3.24+, a C++20 compiler and Python 3.10+.

```bash
git clone https://github.com/Luau-Engine/LuauEngine
cd LuauEngine
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
```

A full build takes roughly 15–40 minutes depending on your machine. `cmake --build build --target studio` builds only the editor if you do not need the export toolchains.

## Updating

The editor checks for releases on launch and can update itself in place. To pin a version — which you want in CI — use the toolchain manager:

```bash
luauengine toolchain install 0.9.4
luauengine toolchain default 0.9.4
```

Committing a `.luauengine-version` file to your repository pins every checkout of that project to the same toolchain.

## Uninstalling

Windows: remove **Luau Engine Studio** from Installed apps. macOS: `brew uninstall --cask luau-engine`, or drag the app to the Bin. Linux: delete the AppImage, or use your package manager.

User data lives in `%LOCALAPPDATA%\LuauEngine` on Windows, `~/Library/Application Support/LuauEngine` on macOS and `~/.local/share/luauengine` on Linux. Removing it clears settings, plugins and build caches.
