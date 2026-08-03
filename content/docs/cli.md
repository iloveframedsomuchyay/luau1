---
title: CLI reference
sidebar_label: CLI
description: Every luauengine subcommand, its flags, and the exit codes CI cares about.
---

Everything the editor does is available from `luauengine`. The editor itself shells out to it, so anything you can click you can script.

```bash
luauengine <command> [subcommand] [options]
luauengine help <command>
```

## Global options

| Flag | Effect |
| --- | --- |
| `--project <path>` | Project directory or `luauengine.toml` (default: nearest ancestor) |
| `--target <name>` | Override the target for this invocation |
| `--verbose`, `-v` | Verbose output; repeat for more |
| `--quiet`, `-q` | Errors only |
| `--json` | Machine-readable output |
| `--no-colour` | Disable ANSI colour |
| `--version` | Print version and exit |

## Project

```bash
luauengine new <name> [--template baseplate|empty|platformer|obby]
luauengine init                       # add a manifest to an existing folder
luauengine import <place.rbxl> [--out <dir>]
luauengine open [place]               # launch the editor
```

## Build and run

```bash
luauengine build [--target <t>] [--release] [--out <dir>] [--all] [--report-size]
luauengine run [--target <t>] [--clients <n>] [--server-only]
luauengine serve [--target web] [--port 8080]
luauengine clean [--all]
```

| Flag | Effect |
| --- | --- |
| `--release` | Strip symbols, full Luau optimisation, native codegen, no debug port |
| `--all` | Build every target in `targets.enabled` |
| `--report-size` | Print a size breakdown by component |
| `--clients <n>` | Number of clients to launch alongside the server |
| `--server-only` | Run the server without any client |

## Check and test

```bash
luauengine check [--target <t>] [--strict]
luauengine test [--filter <pattern>] [--reporter tap|json|pretty]
luauengine lint [--fix]
luauengine format [--check]
```

`check` runs type checking, lints, capability-guard analysis and asset licence auditing. It is the command to gate a pull request on.

## Assets

```bash
luauengine assets process [--target <t>] [--force]
luauengine assets list [--unused] [--by-size]
luauengine assets audit [--target <t>]
luauengine assets upload --roblox [--force]
luauengine assets status --roblox
luauengine assets report --size
```

## Publish

```bash
luauengine publish --roblox [--place-id <id>] [--mode published|saved] [--message <text>]
luauengine publish --roblox --all-places
luauengine publish --target windows --to steam
luauengine publish --target web --to cloudflare
```

## Authentication

```bash
luauengine auth roblox            # interactive OAuth
luauengine auth list
luauengine auth logout roblox
```

CI should set `ROBLOX_API_KEY` in the environment rather than running `auth`.

## Toolchain

```bash
luauengine toolchain list
luauengine toolchain install <version>
luauengine toolchain default <version>
luauengine toolchain remove <version>
luauengine self-update
```

A `.luauengine-version` file in the project root pins the toolchain for every checkout.

## Plugins

```bash
luauengine plugin list
luauengine plugin install <name>
luauengine plugin remove <name>
luauengine plugin package <dir> [--out <file>]
luauengine plugin publish <dir>
luauengine plugin doctor <name>
```

## Debug and profile

```bash
luauengine debug attach [--port 6009]
luauengine profile [--target <t>] [--duration <s>] [--out profile.json]
luauengine profile view <file>
luauengine doctor [--target <t>]
```

## CI

```bash
luauengine ci build --all --release --out ./artifacts
luauengine ci check --strict
luauengine ci publish --roblox
```

The `ci` prefix forces non-interactive mode, disables progress animation, emits structured logs and treats warnings as errors unless `--allow-warnings` is passed.

## Configuration

```bash
luauengine config get <key>
luauengine config set <key> <value>
luauengine config list
luauengine config edit
```

User-level configuration (SDK paths, editor preferences, telemetry opt-in) lives outside the project — see [Installation](/docs/installation) for the per-platform location.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success |
| `1` | General failure |
| `2` | Invalid usage or arguments |
| `3` | Check failed (type errors, lints, capability violations) |
| `4` | Asset licence violation |
| `5` | Missing toolchain or SDK |
| `6` | Authentication failure |
| `7` | Network or upload failure |

Code `3` and code `4` are the two worth branching on in CI: the first is a code problem, the second means something in `assets/` cannot legally ship to that target.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ROBLOX_API_KEY` | Roblox Open Cloud key for non-interactive publishing |
| `LUAUENGINE_HOME` | Override the toolchain install directory |
| `LUAUENGINE_CACHE` | Override the build cache directory |
| `LUAUENGINE_TARGET` | Default target when `--target` is absent |
| `LUAUENGINE_NO_TELEMETRY` | Set to `1` to disable all telemetry |
