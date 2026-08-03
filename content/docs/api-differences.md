---
title: API differences
sidebar_label: API differences
description: Exactly which Roblox APIs behave differently outside Roblox, and the full Engine global reference.
---

This page is the authoritative list of where Luau Engine diverges from Roblox. If an API is not mentioned here, it behaves identically.

## Service availability

| Service | Roblox | Desktop / Web | Server |
| --- | --- | --- | --- |
| `Workspace`, `Lighting`, `RunService` | Yes | Yes | Partial (no rendering) |
| `Players`, `ReplicatedStorage`, `ServerStorage` | Yes | Yes | Yes |
| `CollectionService`, `TweenService`, `PhysicsService` | Yes | Yes | Yes |
| `UserInputService`, `ContextActionService` | Yes | Yes | No |
| `SoundService` | Yes | Yes | No |
| `HttpService` | Yes | Yes (no domain allow-list) | Yes |
| `DataStoreService` | Yes | Local implementation | Local or pluggable |
| `TeleportService` | Yes | Maps to `Engine.Network` | Maps to `Engine.Network` |
| `TextService` | Yes | Layout only, no filtering | Layout only |
| `MarketplaceService`, `GamePassService` | Yes | **Absent** | **Absent** |
| `SocialService`, `FriendService` | Yes | **Absent** | **Absent** |
| `PolicyService`, `TextChatService` filtering | Yes | **Absent** | **Absent** |
| `AnalyticsService` | Yes | Maps to `Engine.Telemetry` | Maps to `Engine.Telemetry` |

Absent means `game:GetService()` raises rather than returning a stub, so the failure is loud and immediate.

## Capability flags

```luau
Engine.Capabilities = {
	Monetisation = false,   -- MarketplaceService, GamePassService
	Social = false,         -- friends, groups, presence
	Moderation = false,     -- chat filtering, asset moderation
	CloudData = false,      -- Roblox-hosted DataStores
	Teleport = false,       -- Roblox place teleports
	Avatar = false,         -- Roblox avatar system
	Steam = false,          -- Steamworks bridge, desktop only
	Filesystem = true,      -- real filesystem access
	NativeWindow = true,    -- Engine.Window
}
```

Values are resolved at build time, so `luauengine check` can prove statically whether a guarded call is reachable on a given target.

## Behavioural differences

**`HttpService`** — no domain allow-list and no per-minute request cap outside Roblox. Code written against Roblox's limits still works; code written against no limits will fail when you build for Roblox.

**`DataStoreService`** — outside Roblox this is local file storage by default. It has no cross-instance consistency, no versioning and no `GetVersionAsync`. `UpdateAsync` is atomic within a single process only. For anything authoritative, use `Engine.Storage:SetBackend()` — see [Dedicated servers](/docs/dedicated-servers).

**`Player.UserId`** — negative on standalone builds unless you install an identity provider. Never assume it is a Roblox user ID.

**`TeleportService`** — `TeleportAsync` maps to `Engine.Network:Connect()` where a place ID becomes a server address configured in the manifest. Reserved servers and teleport data are not supported.

**`TextService:FilterStringAsync`** — returns text unchanged outside Roblox. There is no moderation backend. If your game has user-generated text, you are responsible for filtering it.

**`Enum.Platform`** — extended with `Windows`, `MacOS`, `Linux`, `Web`, `Server`, plus the existing Roblox values. `Enum.Platform.Roblox` is added and is what you compare against to detect the Roblox target.

## The `Engine` global

### `Engine` root

| Member | Type | Availability |
| --- | --- | --- |
| `Engine.Platform` | `Enum.Platform` | All |
| `Engine.Version` | `string` | All |
| `Engine.BuildNumber` | `string` | All |
| `Engine.Capabilities` | `{ [string]: boolean }` | All |
| `Engine.Defines` | `{ [string]: any }` | All |
| `Engine.Args` | `{ string }` | Desktop, server |
| `Engine:Quit(code: number?)` | function | Desktop, server |
| `Engine:Restart()` | function | Desktop |

### `Engine.Window` — desktop

```luau
Engine.Window:SetTitle(title: string)
Engine.Window:SetSize(width: number, height: number)
Engine.Window:GetSize(): (number, number)
Engine.Window:SetMinimumSize(width: number, height: number)
Engine.Window:SetResizable(resizable: boolean)
Engine.Window:SetFullscreen(fullscreen: boolean)
Engine.Window:IsFullscreen(): boolean
Engine.Window:SetVSync(enabled: boolean)
Engine.Window:SetIcon(assetPath: string)
Engine.Window:Focus()

Engine.Window.Resized: RBXScriptSignal      -- (width, height)
Engine.Window.Moved: RBXScriptSignal        -- (x, y)
Engine.Window.FocusChanged: RBXScriptSignal -- (focused)
Engine.Window.CloseRequested: RBXScriptSignal
```

### `Engine.Storage` — all targets

```luau
Engine.Storage:GetPath(): string
Engine.Storage:Exists(name: string): boolean
Engine.Storage:Read(name: string): string?
Engine.Storage:Write(name: string, contents: string): boolean
Engine.Storage:ReadJSON(name: string): any?
Engine.Storage:WriteJSON(name: string, value: any): boolean
Engine.Storage:Delete(name: string): boolean
Engine.Storage:List(): { string }

Engine.Storage:GetDataStore(name: string): DataStore
Engine.Storage:SetBackend(backend: StorageBackend)
```

On web, this is backed by `localStorage` and IndexedDB, subject to browser quota.

### `Engine.Render` — desktop, web, mobile

```luau
Engine.Render:SetResolutionScale(scale: number)   -- 0.25 … 2.0
Engine.Render:SetFrameRateCap(fps: number)        -- 0 = uncapped
Engine.Render:GetBackend(): string
Engine.Render:GetStats(): RenderStats             -- draw calls, tris, GPU ms, VRAM
```

### `Engine.Input` — all interactive targets

```luau
Engine.Input:BindAction(name: string, handler: (Enum.UserInputState) -> (), bindings: Bindings)
Engine.Input:UnbindAction(name: string)
Engine.Input:GetBinding(name: string): Bindings
Engine.Input:SetBinding(name: string, bindings: Bindings)
```

### `Engine.Network` — desktop, web, server

```luau
Engine.Network:Connect(host: string, port: number): (boolean, string?)
Engine.Network:Disconnect()
Engine.Network:IsConnected(): boolean
Engine.Network:GetPing(): number
Engine.Network:SetAuthHandler(handler: (AuthRequest) -> AuthResponse)   -- server

Engine.Network.Connected: RBXScriptSignal
Engine.Network.Disconnected: RBXScriptSignal    -- (reason)
```

### `Engine.Identity` — non-Roblox targets

```luau
Engine.Identity:SetProvider(provider: IdentityProvider)
Engine.Identity:GetLocalPlayer(): Player
Engine.Identity:SignOut()
```

### `Engine.Device` — mobile, desktop

```luau
Engine.Device.Model: string
Engine.Device.MemoryMB: number
Engine.Device.Tier: "low" | "mid" | "high"
Engine.Device.SafeAreaInsets: { top: number, bottom: number, left: number, right: number }
Engine.Device.LowPowerMode: boolean
```

### `Engine.App` — mobile

```luau
Engine.App.WillSuspend: RBXScriptSignal
Engine.App.DidResume: RBXScriptSignal
Engine.App.MemoryWarning: RBXScriptSignal
```

### `Engine.Web` — web only

```luau
Engine.Web.URL: string
Engine.Web.QueryParams: { [string]: string }
Engine.Web.LocalStorage: { Get: (string) -> string?, Set: (string, string) -> () }
Engine.Web:SetTitle(title: string)
Engine.Web:RequestFullscreen()
Engine.Web:LockPointer()
```

### `Engine.Telemetry` — all targets, opt-in

```luau
Engine.Telemetry:Counter(name: string): Counter
Engine.Telemetry:Gauge(name: string): Gauge
Engine.Telemetry:Histogram(name: string): Histogram
Engine.Telemetry:SetEnabled(enabled: boolean)
```

Disabled unless you enable it. Nothing is collected or transmitted by the engine itself.

## Type definitions

Definition files for the engine additions ship with the toolchain, so autocomplete and strict mode understand them:

```bash
luauengine types emit --out ./types
```

Point your editor's Luau LSP at that directory to get the same completions outside Luau Engine Studio.
