---
title: "Luau Engine 0.9.4"
date: 2026-07-22
author: The Luau Engine team
description: Faster incremental builds, WebGPU compute on the web target, structural .rbxlx merging, and 40-odd fixes.
---

0.9.4 is a maintenance release focused on build times and the web target. Upgrade with `luauengine self-update`, or grab it from the [downloads page](/download).

## Faster incremental builds

Script-only changes no longer trigger a full asset pass. The pipeline now hashes the asset graph separately from the DataModel, so editing a `.luau` file and rebuilding for desktop went from ~14 s to ~1.2 s on our reference project.

```bash
luauengine build --target windows
# → 1.2s (assets cached, 1 script recompiled)
```

Force a full rebuild with `--force` if you suspect the cache is wrong. If you find a case where it is, please [file it](https://github.com/Luau-Engine/LuauEngine/issues) — cache correctness bugs are a priority.

## WebGPU compute on the web target

Compute shaders now work on WebGPU, which means `Enum.Technology.Future` renders correctly in Chrome 121+, Edge 121+ and Safari 18. The WebGL 2 fallback still downgrades to `ShadowMap`, and now logs a warning at startup instead of doing it silently.

## Structural `.rbxlx` merging

`luauengine merge` resolves place-file conflicts that touch different instances, instead of leaving you to pick a whole file. Register it as a Git merge driver:

```bash
git config merge.rbxlx.driver "luauengine merge --base %O --ours %A --theirs %B --out %A"
```

Add `*.rbxlx merge=rbxlx` to `.gitattributes` and most place conflicts stop needing a human. Full details in [File formats](/docs/file-formats).

## Asset audit reports instance paths

`luauengine assets audit` previously told you an asset could not ship. It now tells you which instances reference it:

```text
error[E0402]: asset cannot be redistributed on target `windows`
  → assets/audio/theme.ogg
    licence: roblox-only
    referenced by:
      Workspace.Ambience.ThemeSound.SoundId
      ReplicatedStorage.Audio.Tracks.Menu
```

## Fixes

- glTF import preserved authored vertex normals instead of recomputing them (#412)
- `Engine.Storage:WriteJSON` no longer truncates on write failure, so a full disk cannot destroy a save
- `CollectionService:GetTagged` returned stale results after `:Destroy()` on the server target
- MicroProfiler traces from the server target opened as empty in Perfetto
- Windows installer failed on paths containing non-ASCII characters
- `luauengine check` exit code was `1` rather than `3` for capability violations
- Deterministic physics drifted between x86-64 and ARM64 after ~40 minutes
- 33 more — see the [full changelog](https://github.com/Luau-Engine/LuauEngine/releases/tag/v0.9.4)

## Coming next

0.10 takes the web and dedicated-server targets out of beta and adds the Luau-scripted editor extension host. See the [roadmap](/docs/roadmap).
