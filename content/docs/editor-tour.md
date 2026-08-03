---
title: Editor tour
sidebar_label: Editor tour
description: What is familiar, what moved, and what Luau Engine Studio adds on top of the Roblox Studio layout.
---

If you have used Roblox Studio, you already know most of this. This page covers the differences rather than re-explaining the panels you have open every day.

## Unchanged

The core editing surface is the fork's inheritance and is deliberately left alone:

- **Explorer** and **Properties**, including attributes and tags
- **Output**, **Command bar** and the script editor with Luau autocomplete, signature help and inline type errors
- **Toolbox** for local and studio asset libraries
- **Terrain Editor**, **Model** and **Avatar** tabs
- Play, Play Here, Run and Stop, with the same F5/F8/F7 shortcuts
- The **Script Debugger**: breakpoints, watches, call stack, step in/over/out
- **MicroProfiler** (Ctrl+F6) and the Developer Console (F9)

Plugins written against the Studio plugin API load unmodified in the majority of cases. See [Plugins](/docs/plugins) for the exceptions.

## New: the Target bar

A target selector sits in the toolbar next to Play. It controls what **Play** launches and what **Build** produces:

| Control | Effect |
| --- | --- |
| Target dropdown | Chooses the active target (`roblox`, `windows`, `web`, `server`, …) |
| Play | Runs a local session using the active target's runtime |
| Build | Compiles the active target into `build/<target>/` |
| Publish | Uploads or packages according to target settings |

Switching targets does not change your place. It changes which runtime the editor loads and which capability set the analyser checks against — so if you use a desktop-only API while `roblox` is active, you get a warning at edit time rather than a surprise later.

## New: Project panel

Studio treats a place as an opaque file. Luau Engine adds a **Project** panel showing the on-disk tree next to the instance tree, because scripts are real files. From it you can:

- open a script from disk, edit it, and see the change reflected in the DataModel immediately
- add or remove filesystem mappings without hand-editing `luauengine.toml`
- see which instances are backed by files and which live only in the place

Two-way sync is on by default: editing a script in an external editor updates the running session, and editing in Studio writes to disk.

## New: Build Output

A dedicated pane for toolchain output — compilation, asset processing, packaging, publishing — kept separate from game `print` output so a failing build is not buried under runtime logs. Double-clicking an error jumps to the source line.

## New: Asset pipeline panel

Standalone builds ship their own assets, so imports are a first-class step rather than an upload. The panel lists every source file under `assets/`, the processed output for the active target, and the compression settings applied. See [Assets](/docs/assets).

## Changed behaviour

- **Saving.** `Ctrl+S` writes `.rbxlx` (XML) by default rather than binary `.rbxl`, so places diff sensibly in version control. Binary is still available under **File → Save As**.
- **The Toolbox.** Roblox-hosted assets remain available for the `roblox` target. For standalone targets, assets you do not own the redistribution rights to are flagged and excluded from the build. See [Licensing](/docs/licensing).
- **Team Create** is replaced by ordinary version control. There is no hosted collaborative session; the workflow is branches and pull requests.
- **Settings** are stored in a readable file you can commit. **File → Settings → Open settings file** opens it.

## Keyboard shortcuts

Studio shortcuts are preserved. Additions:

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+B` | Build the active target |
| `Ctrl+Shift+T` | Cycle target |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+P` | Quick-open a file from the project |
| `Ctrl+Shift+O` | Toggle the Project panel |

The full list, including how to rebind, is in [Keybindings](/docs/keybindings).
