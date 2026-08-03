---
title: Publishing to Roblox
sidebar_label: Publish to Roblox
description: Authenticate, publish places and universes to roblox.com, and automate it from CI.
---

The Roblox target publishes exactly as Roblox Studio does — the same place, the same universe, the same result. Nothing about your game changes because it was authored in Luau Engine.

## Authenticate

```bash
luauengine auth roblox
```

This opens a browser, completes the OAuth flow and stores the token in your OS keychain (Credential Manager, Keychain, or Secret Service). Tokens are never written to the project.

For CI, use an API key from the [Creator Dashboard](https://create.roblox.com/dashboard/credentials) instead:

```bash
export ROBLOX_API_KEY="…"
luauengine publish --roblox --place-id 1234567890
```

The key needs **Place management: write** for the universe you publish to.

## Configure

```toml title="luauengine.toml"
[targets.roblox]
place-id = 1234567890
universe-id = 987654321
publish-mode = "published"      # published | saved
```

`saved` uploads a new version without making it live, which is what you want for a staging branch.

## Publish

```bash
luauengine publish --roblox
luauengine publish --roblox --place-id 1234567890
luauengine publish --roblox --mode saved
luauengine publish --roblox --message "v1.4.0 — new boss arena"
```

From the editor: set the target to `roblox` and use **Publish**, or `Ctrl+Alt+P`.

## Multiple places in one universe

Games with several places declare them all and publish selectively:

```toml
[targets.roblox]
universe-id = 987654321

[[targets.roblox.places]]
name = "Lobby"
place-id = 1234567890
file = "places/lobby.rbxlx"

[[targets.roblox.places]]
name = "Arena"
place-id = 1234567891
file = "places/arena.rbxlx"
```

```bash
luauengine publish --roblox --place Arena
luauengine publish --roblox --all-places
```

## Uploading assets

Assets referenced as `asset://` are uploaded on first publish and their IDs cached in `assets/.lock`:

```json title="assets/.lock"
{
  "models/crate.glb": { "id": "rbxassetid://18273645", "hash": "sha256:9f2c…" },
  "audio/theme.ogg":  { "id": "rbxassetid://18273646", "hash": "sha256:1ab7…" }
}
```

Commit that file. Without it every publish from a fresh checkout re-uploads everything and produces duplicate assets in your inventory.

```bash
luauengine assets upload --roblox          # upload without publishing
luauengine assets upload --roblox --force  # re-upload regardless of hash
```

Uploads are subject to Roblox moderation. `luauengine assets status --roblox` shows anything still pending review.

## Automating from GitHub Actions

```text title=".github/workflows/publish.yml"
name: Publish to Roblox
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Luau-Engine/setup-luauengine@v1
        with:
          version: '0.9.4'
      - run: luauengine check --target roblox
      - run: luauengine publish --roblox --message "${{ github.ref_name }}"
        env:
          ROBLOX_API_KEY: ${{ secrets.ROBLOX_API_KEY }}
```

## Things to know

:::warning Publishing is not reversible from the CLI
`--mode published` makes the version live immediately. There is no `luauengine unpublish`. Roll back through the Creator Dashboard's version history, or publish with `--mode saved` and promote from the dashboard once you have checked it.
:::

- **Rate limits.** Roblox limits publishes per place per minute. The CLI backs off and retries; `--no-retry` fails fast instead.
- **Place size.** The same limits Studio enforces apply. `luauengine build --target roblox --report-size` prints the breakdown before you hit one.
- **Engine-only instances.** `EngineConfiguration`, `AssetManifest` and `PlatformBinding` are stripped from the Roblox upload — they mean nothing there.
- **Team Create.** Not supported. If your team uses Team Create, publishing from Luau Engine will overwrite the live place with your local copy; coordinate through version control instead.
