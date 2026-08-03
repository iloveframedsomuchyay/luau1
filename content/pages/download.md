---
title: Download Luau Engine
description: Free and open source. Get the editor and toolchain for Windows, macOS or Linux.
---

The current release is **0.9.4**. Every download includes Luau Engine Studio and the `luauengine` command-line toolchain.

## Windows

| Download | Notes |
| --- | --- |
| [Installer (x64)](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Recommended. Windows 10 20H2 or newer |
| [Installer (ARM64)](https://github.com/Luau-Engine/LuauEngine/releases/latest) | For Snapdragon and other ARM devices |
| [Portable (.zip)](https://github.com/Luau-Engine/LuauEngine/releases/latest) | No installer; unpack and run |

```bash
winget install LuauEngine.Studio
```

## macOS

| Download | Notes |
| --- | --- |
| [Universal .dmg](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Apple Silicon and Intel. macOS 12 or newer. Signed and notarised |

```bash
brew install --cask luau-engine
```

## Linux

| Download | Notes |
| --- | --- |
| [AppImage (x86_64)](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Runs on most distributions |
| [.deb](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Debian, Ubuntu and derivatives |
| [.rpm](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Fedora, RHEL and derivatives |
| [.tar.gz](https://github.com/Luau-Engine/LuauEngine/releases/latest) | Portable |

```bash
curl -LO https://luauengine.org/dl/latest/LuauEngineStudio-x86_64.AppImage
chmod +x LuauEngineStudio-x86_64.AppImage
./LuauEngineStudio-x86_64.AppImage
```

## Toolchain only

For CI runners and headless servers, install the CLI without the editor:

```bash
curl -fsSL https://luauengine.org/install.sh | sh
```

```bash
irm https://luauengine.org/install.ps1 | iex
```

## Verify your download

Each release publishes `SHA256SUMS` and a detached signature next to the binaries:

```bash
sha256sum -c SHA256SUMS --ignore-missing
```

## Build from source

```bash
git clone https://github.com/Luau-Engine/LuauEngine
cd LuauEngine
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
```

Full instructions, including prerequisites per platform, are in [Contributing](/docs/contributing).

## System requirements

| | Minimum | Recommended |
| --- | --- | --- |
| OS | Windows 10 20H2, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 24.04 |
| CPU | x86-64 with SSE4.2, or ARM64 | 6+ cores |
| Memory | 8 GB | 16 GB |
| GPU | Direct3D 11 / Metal 2 / Vulkan 1.1 | Anything from the last five years |
| Disk | 4 GB | 12 GB with build caches |

## Previous releases

Every release, with its notes and checksums, is on the [releases page](https://github.com/Luau-Engine/LuauEngine/releases). To pin a specific toolchain version for a project:

```bash
luauengine toolchain install 0.9.3
luauengine toolchain default 0.9.3
```

## Licence

Luau Engine is free software under the MIT licence, and is licensed and official by Roblox Corporation. See [Licensing and trademarks](/docs/licensing) for what that covers — particularly if you plan to ship a standalone build containing assets obtained through Roblox.
