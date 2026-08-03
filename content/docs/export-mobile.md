---
title: Mobile export
sidebar_label: Mobile (Android, iOS)
description: Experimental Android and iOS output — building, signing, input and the current limitations.
---

:::warning Experimental
Mobile targets are experimental. They build and run, but the APIs are not stable, performance work is ongoing, and store submission requires manual steps. Do not plan a commercial mobile release on them yet. Progress is tracked on the [roadmap](/docs/roadmap).
:::

## Prerequisites

**Android** — JDK 17, Android SDK 34+, NDK r26+. Point the toolchain at them:

```bash
luauengine config set android.sdk-path "$ANDROID_HOME"
luauengine config set android.ndk-version "26.1.10909125"
luauengine doctor --target android
```

**iOS** — macOS with Xcode 15+ and an Apple Developer account. Building for a device requires a provisioning profile; the simulator does not.

## Build

```bash
luauengine build --target android --release
luauengine build --target ios --release
```

```text
build/android/
├── MyGame-1.4.0.apk         # sideload / testing
└── MyGame-1.4.0.aab         # Play Store

build/ios/
└── MyGame.xcodeproj/        # open in Xcode to archive and submit
```

The iOS target deliberately stops at an Xcode project. Apple's signing and submission flow changes often enough that owning it yourself is more reliable than having the toolchain guess.

## Configuration

```toml title="luauengine.toml"
[targets.android]
package = "com.example.mygame"
min-sdk = 26
target-sdk = 34
abi = ["arm64-v8a", "x86_64"]
orientation = "landscape"       # landscape | portrait | sensor
icon = "assets/branding/icon-android.png"

[targets.android.signing]
keystore = "env:ANDROID_KEYSTORE_PATH"
keystore-password = "env:ANDROID_KEYSTORE_PASSWORD"
key-alias = "release"
key-password = "env:ANDROID_KEY_PASSWORD"

[targets.ios]
bundle-id = "com.example.mygame"
minimum-os = "15.0"
orientation = "landscape"
icon = "assets/branding/icon-ios.png"
team-id = "env:APPLE_TEAM_ID"
```

## Touch input

`UserInputService` reports touch as it does on Roblox:

```luau
local UserInputService = game:GetService("UserInputService")

if UserInputService.TouchEnabled then
	UserInputService.TouchTap:Connect(function(positions, processed)
		if not processed then
			fireAt(positions[1])
		end
	end)

	UserInputService.TouchPinch:Connect(function(_, scale, velocity, state)
		camera.FieldOfView = math.clamp(camera.FieldOfView / scale, 40, 100)
	end)
end
```

For anything more involved, bind abstract actions once and let the engine map them per platform:

```luau
Engine.Input:BindAction("Jump", function(state)
	if state == Enum.UserInputState.Begin then
		humanoid.Jump = true
	end
end, {
	keyboard = Enum.KeyCode.Space,
	gamepad = Enum.KeyCode.ButtonA,
	touch = { button = "jump", position = UDim2.new(1, -120, 1, -120), size = 90 },
})
```

On touch platforms that draws an on-screen button; elsewhere it binds the key or gamepad button and draws nothing.

## Device considerations

```luau
if Engine.Platform == Enum.Platform.Android or Engine.Platform == Enum.Platform.IOS then
	local device = Engine.Device

	print(device.Model, device.MemoryMB, device.Tier)   -- Tier: "low" | "mid" | "high"

	if device.Tier == "low" then
		Engine.Render:SetResolutionScale(0.6)
		game:GetService("Lighting").Technology = Enum.Technology.Compatibility
	end

	Engine.Device.SafeAreaInsets     -- notch/rounded-corner padding for UI
	Engine.Device.LowPowerMode       -- battery saver active
end
```

`Engine.Device.SafeAreaInsets` is worth wiring into your UI early — retrofitting notch handling to a finished HUD is unpleasant.

## Lifecycle

Mobile apps get suspended without warning. Handle it:

```luau
Engine.App.WillSuspend:Connect(function()
	saveGame()
	pauseAudio()
end)

Engine.App.DidResume:Connect(function()
	resumeAudio()
end)

Engine.App.MemoryWarning:Connect(function()
	Engine.Assets:PurgeCache()
end)
```

Save in `WillSuspend`, not on a timer. It is the only callback guaranteed to run before the OS reclaims the process.

## Known limitations

| Area | Status |
| --- | --- |
| Rendering | Vulkan on Android, Metal on iOS; Future lighting unsupported on both |
| Audio | Works; occasional latency spikes on Android after resume |
| In-app purchases | Not implemented |
| Push notifications | Not implemented |
| Google Play Games / Game Center | Not implemented |
| Background audio | Not implemented |
| iOS App Store submission | Manual, through the generated Xcode project |
| Build size | Larger than it should be; runtime trimming is in progress |
