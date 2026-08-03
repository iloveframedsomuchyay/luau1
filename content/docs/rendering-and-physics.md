---
title: Rendering and physics
sidebar_label: Rendering & physics
description: Render backends, lighting, and the deterministic physics solver shared with Roblox.
---

## Render backends

The renderer targets a backend per platform. It is chosen automatically and can be overridden.

| Platform | Default | Also available |
| --- | --- | --- |
| Windows | Direct3D 11 | Direct3D 12, Vulkan |
| macOS | Metal | — |
| Linux | Vulkan | OpenGL 4.3 |
| Web | WebGPU | WebGL 2 (fallback) |
| Server | Headless | — |

```toml title="luauengine.toml"
[render]
backend = "auto"
vsync = true
msaa = 4
shadow-quality = "high"       # off | low | medium | high
```

```bash
MyGame.exe --render-backend vulkan --no-vsync
```

Users can override at runtime with those flags, which is worth remembering when a player reports a driver-specific crash — asking them to try another backend is often a one-message fix.

## Lighting

`Lighting` behaves as it does on Roblox, including `Technology`:

```luau
local Lighting = game:GetService("Lighting")

Lighting.Technology = Enum.Technology.Future
Lighting.Ambient = Color3.fromRGB(60, 65, 80)
Lighting.OutdoorAmbient = Color3.fromRGB(140, 150, 170)
Lighting.ClockTime = 14.5
Lighting.GeographicLatitude = 41.7
Lighting.ExposureCompensation = 0.25
```

Post-processing effects — `BloomEffect`, `ColorCorrectionEffect`, `DepthOfFieldEffect`, `SunRaysEffect`, `BlurEffect` — all parent to `Lighting` and work the same way.

:::note Future lighting on the web
`Enum.Technology.Future` requires compute shaders. On WebGPU it works; on the WebGL 2 fallback the runtime silently downgrades to `ShadowMap`. Test the fallback path if you care about older browsers.
:::

## Resolution and presentation

```luau
if Engine.Platform ~= Enum.Platform.Roblox then
	Engine.Window:SetSize(1920, 1080)
	Engine.Window:SetFullscreen(true)
	Engine.Window:SetVSync(true)

	-- Render at 70% and upscale — a cheap quality slider
	Engine.Render:SetResolutionScale(0.7)
	Engine.Render:SetFrameRateCap(144)
end
```

`Engine.Render:GetStats()` returns draw calls, triangle count, GPU frame time and VRAM usage, which is enough to build an in-game performance overlay without the MicroProfiler.

## Physics

The physics solver is the same one Roblox uses, so behaviour carries across unchanged: constraints, assemblies, network ownership, collision groups and `PhysicsService` all behave as documented for Roblox.

```luau
local PhysicsService = game:GetService("PhysicsService")

PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:CollisionGroupSetCollidable("Players", "Projectiles", false)

part.CollisionGroup = "Projectiles"
```

### Determinism

Standalone targets can opt into a fixed-step deterministic solver, which Roblox does not expose. This is what you need for lockstep multiplayer or replay files:

```toml title="luauengine.toml"
[physics]
mode = "deterministic"     # realtime | deterministic
step-rate = 60
```

In deterministic mode the solver runs at a fixed rate independent of frame rate, and floating-point behaviour is pinned across platforms. It costs some performance and is not available on the Roblox target.

### Tuning

```luau
workspace.Gravity = 196.2
workspace:SetAttribute("SolverIterations", 8)

local part = Instance.new("Part")
part.CustomPhysicalProperties = PhysicalProperties.new(0.7, 0.3, 0.5, 1, 1)
```

## Performance

Both profilers from Studio come across:

- **MicroProfiler** (`Ctrl+F6`) — per-frame CPU breakdown
- **Developer Console** (`F9`) — memory, network and script performance

Plus a CLI profiler for headless runs, which is how you profile a dedicated server:

```bash
luauengine profile --target windows --duration 30 --out profile.json
luauengine profile view profile.json
```

The trace file is Chrome Trace format, so `chrome://tracing` and Perfetto open it directly if you prefer those.
