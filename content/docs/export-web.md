---
title: Web export
sidebar_label: Web (WebAssembly)
description: Compile to WebAssembly and WebGPU, host it on any static file server, and keep the download small.
---

The web target compiles the runtime to WebAssembly and renders through WebGPU, falling back to WebGL 2. Output is static files — no server-side runtime — so it hosts on Cloudflare Pages, GitHub Pages, S3 or anything else that serves files.

:::note Beta
The web target is in beta. Rendering, input, audio and networking are complete; the gaps are listed under [Limitations](#limitations).
:::

## Build

```bash
luauengine build --target web --release
```

```text
build/web/
├── index.html
├── mygame.js           # loader
├── mygame.wasm         # runtime
├── mygame.lue          # your game
├── assets/             # streamed chunks (if streaming is enabled)
└── sw.js               # optional service worker
```

Serve it locally:

```bash
luauengine serve --target web --port 8080
```

## Configuration

```toml title="luauengine.toml"
[targets.web]
base-url = "/"
compression = "brotli"          # brotli | gzip | none
threads = true                  # SharedArrayBuffer; needs COOP/COEP headers
canvas-id = "game"
service-worker = true
initial-memory = 512            # MB
max-memory = 2048
```

## Embedding in a page

The generated `index.html` is a starting point. To embed in your own page:

```text
<canvas id="game" width="1280" height="720"></canvas>
<script src="/mygame.js"></script>
<script>
  LuauEngine.start({
    canvas: document.getElementById('game'),
    bundle: '/mygame.lue',
    onProgress: (loaded, total) => {
      document.getElementById('bar').style.width = (loaded / total * 100) + '%';
    },
    onReady: () => console.log('running'),
  });
</script>
```

## Required headers

If `threads = true`, the browser needs cross-origin isolation for `SharedArrayBuffer`:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

On Cloudflare Pages or Workers, a `_headers` file does it:

```text title="_headers"
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Resource-Policy: cross-origin
```

Without those headers the runtime falls back to single-threaded mode automatically — slower, but it still runs.

## Download size

Download size decides whether anybody plays. Two levers matter most.

**Stream assets** rather than packing them:

```toml
[assets.delivery]
mode = "stream"
base-url = "/assets/"
preload = ["textures/ui/*", "audio/ui/*", "models/player.glb"]
```

**Compress aggressively** for the web target:

```toml
[assets.textures.web]
format = "astc"
max-size = 1024

[assets.audio.web]
codec = "opus"
bitrate = 64
```

A trimmed runtime is around 8 MB Brotli-compressed. Check where the rest goes:

```bash
luauengine build --target web --report-size
```

## Web-specific APIs

```luau
if Engine.Platform == Enum.Platform.Web then
	print(Engine.Web.URL)
	print(Engine.Web.QueryParams.room)      -- ?room=abc123

	Engine.Web:SetTitle("My Game — Level 3")

	-- localStorage-backed; Engine.Storage uses this transparently too
	Engine.Web.LocalStorage:Set("save", saveData)
	local save = Engine.Web.LocalStorage:Get("save")

	Engine.Web:RequestFullscreen()
	Engine.Web:LockPointer()
end
```

## Limitations

- **No filesystem.** `Engine.Storage` is backed by `localStorage` and IndexedDB, with the browser's quota (typically 5–50 MB).
- **Audio needs a gesture.** Browsers block audio until the user interacts. The runtime queues playback until the first click or key press.
- **Pointer lock needs a gesture** too — call `LockPointer()` from an input handler, not on load.
- **No raw sockets.** Networking is WebSocket or WebRTC only. A dedicated server must expose a WebSocket endpoint; see [Dedicated servers](/docs/dedicated-servers).
- **Memory ceiling.** 32-bit browsers cap at 2 GB, and `max-memory` above 2048 needs the `memory64` proposal.
- **Future lighting** requires WebGPU; the WebGL 2 fallback downgrades to `ShadowMap`.

## Deploying to Cloudflare Pages

```bash
luauengine build --target web --release
npx wrangler pages deploy build/web --project-name my-game
```

Put the `_headers` file above in `build/web/` — set `[targets.web] extra-files = ["_headers"]` and it is copied into every build.
