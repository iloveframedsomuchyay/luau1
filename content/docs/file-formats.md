---
title: File formats
sidebar_label: File formats
description: Which files a Luau Engine project contains, which to commit, and what the .lue bundle holds.
---

## Formats you will see

| Extension | What it is | Commit it? |
| --- | --- | --- |
| `.rbxlx` | Place, XML — the recommended format | Yes |
| `.rbxl` | Place, binary — Roblox's default | Prefer `.rbxlx` |
| `.rbxmx` / `.rbxm` | Model, XML / binary | Yes |
| `.luau` | Luau source | Yes |
| `luauengine.toml` | Project manifest | Yes |
| `.asset.toml` | Per-asset processing and licence metadata | Yes |
| `assets/.lock` | Cached Roblox asset IDs | Yes |
| `.luauengine-version` | Pinned toolchain version | Yes |
| `.lue` | Compiled build bundle | No — build output |
| `.luaubc` | Compiled Luau bytecode | No — intermediate |
| `build/`, `.luauengine/` | Build output and cache | No |

A reasonable `.gitignore`:

```text title=".gitignore"
build/
.luauengine/
*.lue
*.luaubc
*.rbxl.lock
```

## Why `.rbxlx` over `.rbxl`

Binary places are one opaque blob. Two people editing different corners of the same place produce a conflict Git cannot resolve, and a code review shows "binary file changed".

XML places are line-oriented. You get real diffs, you can resolve most conflicts by hand, and a reviewer can see that a pull request moved a spawn point rather than taking it on trust. The cost is file size — roughly 3–5× larger — which Git compresses away in the pack file.

Convert an existing place:

```bash
luauengine convert place.rbxl --to rbxlx
```

Both formats load in either editor. `.rbxlx` is simply better behaved in version control.

## Keeping places small

The most effective thing you can do is move scripts out of the place and onto disk, which `luauengine import` does for you. After that a place holds geometry and configuration, and the parts that change most often — scripts — are ordinary text files.

```bash
luauengine import ./MyGame.rbxl --out ./my-game
```

## The `.lue` bundle

A build bundle is a signed, content-addressed archive:

```text
MyGame.lue
├── manifest.json      # version, target, capabilities, asset index
├── datamodel.bin      # serialised DataModel
├── scripts/           # compiled Luau bytecode, one chunk per script
├── assets/            # processed assets, content-addressed
└── signature          # Ed25519 signature over the manifest
```

Because chunks are content-addressed, a patch ships only what changed:

```bash
luauengine bundle diff old.lue new.lue --out patch.luep
luauengine bundle apply patch.luep --to old.lue
```

Inspect one:

```bash
luauengine bundle info MyGame.lue
luauengine bundle list MyGame.lue --by-size
luauengine bundle extract MyGame.lue --out ./extracted
```

`extract` works only on bundles you built — signature verification requires the signing key, which is what stops `.lue` files being a convenient way to lift other people's content.

## Source control notes

**Large files.** Meshes, textures and audio belong in Git LFS:

```text title=".gitattributes"
*.png filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.glb filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.rbxl filter=lfs diff=lfs merge=lfs -text
```

Note `.rbxlx` is deliberately absent — it is text and should stay in Git proper.

**Merge conflicts in a place file.** `luauengine merge` understands `.rbxlx` structurally and resolves conflicts that touch different instances:

```bash
luauengine merge --ours place.ours.rbxlx --theirs place.theirs.rbxlx --base place.base.rbxlx --out place.rbxlx
```

Register it as a Git merge driver so it runs automatically:

```bash
git config merge.rbxlx.driver "luauengine merge --base %O --ours %A --theirs %B --out %A"
```

```text title=".gitattributes"
*.rbxlx merge=rbxlx
```

Conflicts that touch the *same* instance still need a human, but those are rare and obvious when they happen.
