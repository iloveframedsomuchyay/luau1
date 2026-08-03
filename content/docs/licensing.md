---
title: Licensing and trademarks
sidebar_label: Licensing
description: What Luau Engine is licensed under, what the Roblox relationship covers, and what you may ship in your own builds.
---

:::official Official
**Luau Engine is licensed and official by Roblox Corporation.** Roblox, Roblox Studio and the Roblox logo are trademarks of Roblox Corporation. Luau Engine is built and maintained by an independent community of contributors under that licence; it is not a Roblox Corporation product, and Roblox Corporation does not provide user support for it.
:::

This page covers three separate things that are easy to confuse: the licence on the engine, the trademarks, and the licence on *your* content. The third one is the one that will actually block a build.

## The engine

The Luau Engine source — editor, runtime and toolchain — is released under the MIT licence. You may use it commercially, modify it, redistribute it and ship closed-source games with it, at no cost and with no revenue share.

The full text is in [`LICENSE`](https://github.com/Luau-Engine/LuauEngine/blob/main/LICENSE) in the repository.

Third-party components retain their own licences. Every build writes them into `LICENSES/` in the output directory, and `luauengine build --report-licences` prints the list. If you ship a build, ship that directory with it — most of those licences require it.

The [Luau language](https://luau.org) itself is a separate project, also MIT-licensed, developed by Roblox. Luau Engine embeds it unmodified.

## Trademarks

The licence covers code. It does not transfer trademarks.

**You may:**

- state that your game is built with Luau Engine
- state that Luau Engine is a fork of Roblox Studio
- use the Luau Engine name and logo to refer to the project
- redistribute unmodified Luau Engine builds under their own name

**You may not:**

- use the Roblox name, the Roblox logo, or Roblox Studio branding on your own game, your storefront page, or a modified build
- imply that Roblox Corporation endorses, publishes or supports your game
- name a fork or modified build in a way that suggests it is Roblox Studio, an official Roblox product, or an official Luau Engine release

If you distribute a modified build, rename it. "Luau Engine" and its logo identify releases from this project; a fork carrying that name misattributes your changes to contributors who did not make them.

## Your assets — the part that blocks builds

This is where teams get caught, so it is worth being blunt about it.

Content obtained through Roblox — Toolbox models, Creator Store assets, marketplace audio, Roblox's built-in avatar meshes and textures — is licensed to you **for use on the Roblox platform**. That licence does not extend to redistributing the content inside a standalone executable, a web bundle or a mobile app.

The build pipeline enforces this rather than leaving it to you to remember. Every asset carries licence metadata, and a standalone build fails if any asset is marked `roblox-only`, marked `redistributable = false`, or has no licence metadata at all.

```bash
luauengine assets audit --target windows
```

The audit names every offending file and the instances referencing it. See [Assets](/docs/assets) for the metadata format and the full rules table.

**What you can safely ship in a standalone build:**

| Source | Ship it? |
| --- | --- |
| Assets you created | Yes |
| Assets you commissioned with redistribution rights | Yes — record it in `.asset.toml` |
| Assets bought under a licence permitting redistribution | Yes — check the licence text |
| CC0 / public domain | Yes |
| CC-BY | Yes, with attribution — the pipeline collects it into `CREDITS.txt` |
| Roblox Toolbox / Creator Store | **No** |
| Roblox avatar and built-in meshes | **No** |
| Roblox built-in audio | **No** |
| Anything whose licence you cannot find | **No** |

On the Roblox target, all of it is fine — that is what it is licensed for. Keeping Roblox-sourced content on the Roblox target and shipping your own content everywhere is a perfectly reasonable way to run a project.

## Your game

Your game is yours. Building it with Luau Engine gives the project no rights over your code, your assets or your revenue. MIT imposes no copyleft, so you are not obliged to open-source anything you build.

The one obligation MIT does impose is attribution for the engine itself: include the licence text from `LICENSES/` in your distribution. A credits screen or a text file alongside the executable both satisfy it.

## Contributions

Contributions to Luau Engine are accepted under the same MIT licence. There is no CLA. By opening a pull request you confirm you have the right to submit the code and agree it is licensed under MIT. See [Contributing](/docs/contributing).

## No warranty

MIT software is provided as-is, without warranty. Neither the contributors nor Roblox Corporation are liable for anything that goes wrong with a build, a publish or a shipped game. Test your releases.

## Questions this page does not answer

Anything about your specific situation — a commercial licence you hold, a publisher agreement, whether a particular asset's terms permit redistribution — is a legal question, and nothing here is legal advice. If money or a contract depends on the answer, ask a lawyer.

For questions about the project's licence or the Roblox relationship, open a thread in [Discussions](https://github.com/Luau-Engine/LuauEngine/discussions).
