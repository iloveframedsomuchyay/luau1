---
title: Dedicated servers
sidebar_label: Dedicated servers
description: Build a headless authoritative server, run it in a container, and connect clients to it.
---

The `server` target produces a headless build with no renderer, no audio and no window — the authoritative half of your game, running wherever you put it. This is the piece Roblox normally hosts for you.

:::note Beta
The server target is in beta. It is stable enough to run, and the networking protocol is still subject to change between minor versions. Pin your toolchain version for anything you deploy.
:::

## Build

```bash
luauengine build --target server --release
```

```text
build/server/
├── mygame-server          # or .exe on Windows
├── mygame.lue
└── runtime/
```

```bash
./mygame-server --port 7777 --max-players 32
```

## Configuration

```toml title="luauengine.toml"
[targets.server]
port = 7777
max-players = 32
tick-rate = 30
headless = true
docker = true                # also emit a Dockerfile and build an image
auth = "none"                # none | token | custom
```

`docker = true` writes a Dockerfile into `build/server/` and, when Docker is available, builds `mygame-server:1.4.0`.

## What runs where

The server runs only server code. `Script` instances with `RunContext.Server` execute; `LocalScript`s do not. `RunService:IsServer()` returns `true`, `IsClient()` returns `false`, and `IsStudio()` returns `false`.

```luau
local RunService = game:GetService("RunService")

if not RunService:IsServer() then
	return
end

local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	print(`{player.Name} connected from {player:GetAttribute("RemoteAddress")}`)
	loadPlayerData(player)
end)

Players.PlayerRemoving:Connect(function(player)
	savePlayerData(player)
end)
```

Rendering-dependent APIs are absent, not stubbed — touching `Lighting.Technology` or `Camera` on the server raises. That is deliberate: it surfaces client code that leaked into a server script.

## Connecting a client

```luau
-- client
local ok, err = Engine.Network:Connect("play.example.com", 7777)
if not ok then
	warn(`could not connect: {err}`)
end

Engine.Network.Disconnected:Connect(function(reason)
	showDisconnectScreen(reason)
end)
```

Or from the command line, which is what a server browser or an invite link ultimately does:

```bash
MyGame.exe --server=play.example.com:7777
```

Web clients need WebSocket transport, since browsers cannot open raw sockets:

```toml
[targets.server.transport]
protocols = ["udp", "websocket"]
websocket-port = 7778
tls-cert = "env:TLS_CERT_PATH"
tls-key = "env:TLS_KEY_PATH"
```

## Persistence

`Engine.Storage` on a server defaults to local files, which is fine for a single instance and wrong for anything horizontally scaled. Point it at a backend you control:

```luau
Engine.Storage:SetBackend({
	get = function(key: string): string?
		local ok, response = pcall(function()
			return Engine.Http:Get(`{DB_URL}/kv/{key}`, { Authorization = DB_TOKEN })
		end)
		return if ok then response.Body else nil
	end,

	set = function(key: string, value: string): boolean
		local ok = pcall(function()
			Engine.Http:Put(`{DB_URL}/kv/{key}`, value, { Authorization = DB_TOKEN })
		end)
		return ok
	end,
})

-- DataStore-shaped code now works against your backend unchanged
local store = Engine.Storage:GetDataStore("PlayerData")
store:SetAsync(`player_{userId}`, data)
```

## Authentication

`auth = "none"` accepts any connection, which is right for a LAN game and wrong for anything public.

```luau
Engine.Network:SetAuthHandler(function(request)
	local claims = verifyJWT(request.Token)
	if not claims then
		return { accepted = false, reason = "Invalid token" }
	end
	return {
		accepted = true,
		userId = claims.sub,
		displayName = claims.name,
	}
end)
```

The returned `userId` and `displayName` populate the `Player` instance, so gameplay code that reads `player.UserId` keeps working.

## Containers

```text title="build/server/Dockerfile"
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      libstdc++6 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /srv
COPY mygame-server mygame.lue ./
COPY runtime/ ./runtime/
EXPOSE 7777/udp 7778/tcp
ENTRYPOINT ["./mygame-server", "--port", "7777"]
```

```bash
docker build -t mygame-server:1.4.0 build/server
docker run -p 7777:7777/udp -p 7778:7778 mygame-server:1.4.0
```

The container exposes `/healthz` on the WebSocket port for orchestrator health checks.

## Monitoring

```bash
./mygame-server --metrics-port 9090
```

Prometheus metrics: `luauengine_players_connected`, `luauengine_tick_duration_seconds`, `luauengine_physics_step_seconds`, `luauengine_luau_memory_bytes`, `luauengine_network_bytes_total`.

```luau
Engine.Telemetry:Counter("boss_defeated"):Increment()
Engine.Telemetry:Gauge("active_matches"):Set(#matches)
Engine.Telemetry:Histogram("match_duration_seconds"):Observe(duration)
```

Custom metrics appear on the same endpoint.
