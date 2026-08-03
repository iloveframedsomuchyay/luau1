---
title: "Why standalone builds refuse to ship Toolbox assets"
date: 2026-06-09
author: The Luau Engine team
description: The build pipeline blocks Roblox-sourced content in standalone exports on purpose. Here is the reasoning, and how to work with it.
---

The single most common issue we get is a variant of this:

> My game runs fine on the Roblox target but `luauengine build --target windows` fails with "asset cannot be redistributed". Can I turn this off?

No, and this post explains why, plus what to do instead.

## What is happening

Content obtained through Roblox — Toolbox models, Creator Store assets, marketplace audio, built-in avatar meshes — is licensed to you **for use on the Roblox platform**. That is what the licence grants and where it stops. Packing it into a Windows executable, a web bundle or an APK is redistribution, which that licence does not cover.

So the pipeline tags those assets `roblox-only` on import, and a standalone build fails if any are referenced:

```text
error[E0402]: asset cannot be redistributed on target `windows`
  → assets/models/tree_pack_01.glb
    licence: roblox-only (imported from Creator Store)
    referenced by:
      Workspace.Forest.Tree_01.MeshId
      Workspace.Forest.Tree_02.MeshId
```

On the Roblox target the same asset builds and publishes without complaint. That is the licence working as intended, not a limitation we bolted on.

## Why it is not a flag

We were asked repeatedly for `--allow-unlicensed-assets`. We are not adding it.

A flag like that has exactly one use: shipping content you do not have the right to ship. The person who trips over the error is usually not trying to do anything wrong — they grabbed a free model two years ago and forgot. A hard failure at build time turns that into a five-minute fix. A flag turns it into something they discover after release, from a lawyer.

The check also protects the project's relationship with Roblox. Luau Engine is licensed and official by Roblox Corporation, and part of what that licence is built on is that the engine does not become a route for moving Roblox-licensed content off Roblox. We take that seriously because the alternative is not having the licence.

## What to do instead

**Find out how much is affected.** The audit is fast and non-destructive:

```bash
luauengine assets audit --target windows
```

Most projects have far less blocked content than expected — usually a handful of props and a music track.

**Replace what is blocked.** Model it, commission it, or source it from somewhere with clear redistribution terms. Record the terms so future-you does not have to re-derive them:

```toml title="assets/models/tree.asset.toml"
[licence]
type = "licensed"
author = "Kenney"
redistributable = true
attribution = "Nature Kit by Kenney (CC0)"
```

**Or keep those assets on Roblox.** Nothing forces every target to ship the same content. Guard the Roblox-only pieces and substitute elsewhere:

```luau
if Engine.Platform == Enum.Platform.Roblox then
	tree.MeshId = "rbxassetid://18273645"
else
	tree.MeshId = "asset://models/tree_owned.glb"
end
```

**Check early.** Add the audit to CI on day one and the problem never accumulates:

```bash
luauengine check --target windows   # includes the licence audit
```

Exit code `4` means specifically an asset licence violation, so you can branch on it.

## Assets you make are always fine

Anything you create, commission with redistribution rights, or obtain under CC0/CC-BY ships everywhere. `cc-by` attribution is collected automatically into `CREDITS.txt` in the build output, so crediting is not something you have to remember either.

Full rules in [Assets](/docs/assets) and [Licensing](/docs/licensing).
