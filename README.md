# [MQ3T](https://mq3t.guillaumechx.dev/)

[//]: # (![https://img.shields.io/badge/Release-working%20on%20it%20!!-red]&#40;https://img.shields.io/badge/Release-working%20on%20it%20!!-red&#41;)
[![Release Version](https://img.shields.io/github/v/release/ChxGuillaume/MQ3T?label=Release)](https://github.com/ChxGuillaume/MQ3T/releases)
[![Download Total](https://img.shields.io/github/downloads/ChxGuillaume/MQ3T/total?label=Downloads)](https://github.com/ChxGuillaume/MQ3T/releases)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/ChxGuillaume/MQ3T/.github%2Fworkflows%2Fbuild-windows.yml?logo=github&label=Build%20Windows)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/ChxGuillaume/MQ3T/.github%2Fworkflows%2Fbuild-mac.yml?logo=github&label=Build%20Mac)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/ChxGuillaume/MQ3T/.github%2Fworkflows%2Fbuild-linux.yml?logo=github&label=Build%20Linux)


| ![Connections Theme Mix](docs/screenshots/connections-dark.png) | ![Settings](docs/screenshots/settings-mix.png) |
|-----------------------------------------------------------------|------------------------------------------------|
| ![Topics List](docs/screenshots/topics/topics-2-mix.png)        | ![Actions](docs/screenshots/actions-light.png) |

### MQ3T is a MQTT client for Windows, macOS and Linux.

It allows you to visualize your MQTT topics, subscribe to them and publish messages.

You can simplify your development processes by using the built-in actions.

# Download

## Stores

|                                    <img src='docs/platforms-logo/windows-logo.png' height='100'>                                    |                                  <img src='docs/platforms-logo/apple-logo.png' height='100'>                                   |                                       <img src='docs/platforms-logo/ubuntu-logo.svg' height='100'>                                        |
|:-----------------------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------:|
| [<img src="docs/download-logo/microsoft-store.svg" alt="Alt Text" height="50">](	https://www.microsoft.com/store/apps/9N95JHMPSSQJ) | [<img src="docs/download-logo/mac-app-store.svg" alt="Alt Text" height="50">](https://apps.apple.com/fr/app/mq3t/id6479254709) | <a href="https://snapcraft.io/mq3t"><img alt="Get it from the Snap Store" src=https://snapcraft.io/en/dark/install.svg height="50" /></a> |

## Installers

|                   <img src='docs/platforms-logo/windows-logo.png' height='100'>                   |                 <img src='docs/platforms-logo/apple-logo.png' height='100'>                 |                    <img src='docs/platforms-logo/linux-logo.png' height='100'>                     |               <img src='docs/platforms-logo/debian-logo.png' height='100'>               |
|:-------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------:|:----------------------------------------------------------------------------------------:|
| [Windows Portable](https://mq3t.guillaumechx.dev/download.html?os=windows&arch=x64&type=portable) | [Mac Apple Silicon](https://mq3t.guillaumechx.dev/download.html?os=mac&arch=arm64&type=dmg) |  [AppImage (x64)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=x86_64&type=AppImage)  |  [Deb (x64)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=amd64&type=deb)   |
|    [Windows Setup](https://mq3t.guillaumechx.dev/download.html?os=windows&arch=x64&type=setup)    |      [Mac Intel](https://mq3t.guillaumechx.dev/download.html?os=mac&arch=x64&type=dmg)      | [AppImage (arm64)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=arm64&type=AppImage)  | [Deb (arm64)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=arm64&type=deb)  |
|                                                                                                   |                                                                                             | [AppImage (armv7)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=armv7l&type=AppImage) | [Deb (armv7)](https://mq3t.guillaumechx.dev/download.html?os=linux&arch=armv7l&type=deb) |

## Project Setup

### Install dependencies

```bash
npm ci
```

### Development

```bash
npm run dev
```

# Project Structure

- `build/` - Build resources
- `resources/` - Static application resources
- `src/` - Main application source code
  - `main/` - Main process source code
  - `preload/` - Preload process source code (used to communicate between main and renderer process)
  - `renderer/` - Renderer process source code
    - `src/` - Vue.js source code
      - `assets/` - Static assets
      - `components/` - Vue.js components
      - `composables/` - Vue.js composables
      - `store/` - Pinia store
      - `tabs/` - Application tabs
      - `App.vue` - Vue.js root component
      - `main.ts` - Vue.js entrypoint
    - `types/` - TypeScript types

## Build

### Build the application

```bash
npm run build
```

## Package

```bash
# For windows (exe)
npm run package:win

# For windows (Microsoft Store)
npm run package:win:store

# For macOS (dmg)
npm run package:mac

# For macOS (App Store)
npm run package:mac:store

# For Linux
npm run package:linux

# For Snapcraft
npm run package:linux:snap
```

# License
[![https://img.shields.io/github/license/ChxGuillaume/MQ3T?color=green&label=License](https://img.shields.io/github/license/ChxGuillaume/MQ3T?color=green&label=License)](https://www.tldrlegal.com/license/gnu-general-public-license-v3-gpl-3)

[GPL-3.0 License](LICENSE)
