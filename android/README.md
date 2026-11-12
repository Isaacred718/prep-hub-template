# Android and Meta Quest app

This folder packages the web app in the repository root as an Android app.
The web files are copied into the APK when it is built, so the app works with
no connection.

## Build

Needs JDK 17 or newer and the Android SDK (platform 35). From this folder:

```
./gradlew assemblePhoneRelease assembleQuestRelease
```

The APKs land in `app/build/outputs/apk/phone/release/` and
`app/build/outputs/apk/quest/release/`. The GitHub workflow
`.github/workflows/android.yml` runs the same build and attaches both APKs to
the run as artifacts.

## Install

- **Phone or tablet:** copy the `-phone-` APK to the device and open it.
  Android asks once to allow installs from that source.
- **Meta Quest 2 / 3 / Pro:** turn on developer mode for the headset, then
  `adb install <name>-quest-<version>.apk` (or drag it into SideQuest or Meta
  Quest Developer Hub). It appears in the app library under
  **Unknown sources** and opens as a flat panel you can move and resize.

## What the two flavors change

| | phone | quest |
|---|---|---|
| Window | full screen | 2D panel, resizable (default size: `questWidthDp` x `questHeightDp` in `app.properties`, 1024 x 640 if unset) |
| Page hooks | `html.native-app` | `html.native-app.quest` (larger targets, hover outlines) |
| Target SDK | 34 | 32 |

Both expose `window.NATIVE_APP` and `window.AndroidShell` to the page
(`saveFile`, `share`, `openExternal`, `keepAwake`). The Back button calls
`window.__nativeBack()` first so the page can close a sheet or dialog.

## Settings

`app.properties` holds the app name, application id, version and which web
files to include. Icons are in `app/src/main/res/mipmap-*`.

## Signing

`keystore/sideload.keystore` is committed on purpose so that every build,
local or CI, can install over the previous one. It is a sideloading key only.
Create a private key before publishing to any store.
