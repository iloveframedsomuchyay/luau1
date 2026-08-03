---
title: Keybindings
sidebar_label: Keybindings
description: Default shortcuts, what Luau Engine adds on top of Studio, and how to rebind them.
---

Roblox Studio's shortcuts are preserved. This page lists the defaults and the additions, and shows how to rebind.

On macOS, read `Ctrl` as `Cmd` unless noted.

## File and project

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | New project |
| `Ctrl+O` | Open place |
| `Ctrl+S` | Save place |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+P` | Quick-open a file from the project |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+O` | Toggle the Project panel |
| `Ctrl+,` | Settings |

## Build and run

| Shortcut | Action |
| --- | --- |
| `F5` | Play |
| `F8` | Stop |
| `F7` | Run (server only) |
| `Ctrl+F5` | Play Here |
| `Ctrl+Shift+B` | Build the active target |
| `Ctrl+Shift+T` | Cycle target |
| `Ctrl+Alt+P` | Publish the active target |
| `Ctrl+Shift+K` | Check (types, lints, licences) |

## Editing

| Shortcut | Action |
| --- | --- |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+D` | Duplicate selection |
| `Ctrl+G` | Group into a Model |
| `Ctrl+U` | Ungroup |
| `Alt+Click` | Select the deepest instance under the cursor |
| `Ctrl+L` | Lock / unlock selection |
| `Ctrl+H` | Toggle visibility of selection |
| `F` | Frame the selection in the viewport |

## Viewport navigation

| Shortcut | Action |
| --- | --- |
| `W` `A` `S` `D` | Move the camera |
| `Q` / `E` | Down / up |
| `Right-drag` | Look |
| `Middle-drag` | Pan |
| `Scroll` | Zoom |
| `Shift` (held) | Move slowly |
| `1` – `4` | Select, Move, Scale, Rotate tool |

## Script editor

| Shortcut | Action |
| --- | --- |
| `Ctrl+Space` | Trigger autocomplete |
| `Ctrl+/` | Toggle line comment |
| `Alt+Up` / `Alt+Down` | Move line up / down |
| `Ctrl+Shift+D` | Duplicate line |
| `F12` | Go to definition |
| `Shift+F12` | Find all references |
| `F2` | Rename symbol |
| `Ctrl+Shift+F` | Find in all scripts |
| `Ctrl+K Ctrl+F` | Format selection |
| `Ctrl+Shift+L` | Select all occurrences |

## Debugging

| Shortcut | Action |
| --- | --- |
| `F9` | Toggle breakpoint / Developer Console |
| `F10` | Step over |
| `F11` | Step into |
| `Shift+F11` | Step out |
| `Ctrl+F6` | MicroProfiler |
| `Ctrl+Shift+F9` | Clear all breakpoints |

## Panels

| Shortcut | Action |
| --- | --- |
| `Ctrl+1` | Explorer |
| `Ctrl+2` | Properties |
| `Ctrl+3` | Output |
| `Ctrl+4` | Project |
| `Ctrl+5` | Build Output |
| `Ctrl+6` | Asset pipeline |

## Rebinding

**File → Settings → Keybindings**, or edit the file directly. Open it with **File → Settings → Open settings file**, or:

```bash
luauengine config edit --section keybindings
```

```toml title="keybindings.toml"
[keybindings]
"build.active-target" = "Ctrl+B"
"target.cycle" = "Ctrl+T"
"project.quick-open" = "Ctrl+E"

# Unbind by assigning an empty string
"editor.duplicate-line" = ""

# Chords are supported
"editor.format-document" = "Ctrl+K Ctrl+D"
```

Command identifiers are listed by:

```bash
luauengine config list --section keybindings --all
```

The command palette (`Ctrl+Shift+P`) also shows the current binding next to each command, which is usually the quickest way to find an identifier.

## Presets

```toml
[keybindings]
preset = "studio"      # studio | vscode | vim
```

`studio` is the default. `vscode` remaps the script editor to VS Code conventions while leaving viewport and Explorer shortcuts alone. `vim` enables modal editing in the script editor only. Individual bindings set after `preset` override it.
