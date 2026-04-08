<div align="center">
  <img src="resources/icon.png" width="128" />
  <h1>MeshLink</h1>
  <p><strong>A Cross-Platform Offline P2P Mesh Communication Desktop Application</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Electron-39-blue?style=for-the-badge&logo=electron" alt="Electron"/>
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/Node.js-22-green?style=for-the-badge&logo=node.js" alt="Node.js"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind"/>
  </p>
</div>

---

## 📖 Overview

**MeshLink** is a fully decentralized, off-the-grid peer-to-peer (P2P) desktop communication tool. It functions entirely autonomously without an internet connection or any centralized server infrastructure. By leveraging UDP multicasting for local device discovery and establishing a robust raw TCP mesh network, MeshLink enables seamless, symmetric-encrypted messaging between Windows, macOS, and Linux devices physically connected to the same LAN or Wi-Fi network.

## ✨ Core Features

* **Serverless P2P Discovery:** Employs background UDP (`dgram`) multicast mechanisms to dynamically scan and identify adjacent MeshLink nodes on the local network footprint.
* **Flooding Mesh Routing Engine:** Intelligent multi-hop packet proxying effectively routes traffic across devices. Utilizes strict `TTL` (Time-to-Live) tracking and algorithmic LRU memory caching to permanently mitigate infinite packet loop floods.
* **Advanced Cryptography Layer:** Secures all cross-network communication symmetrically using zero-dependency natively accelerated `AES-256-GCM` encryption buffers.

* **High-Performance Architecture:** Uses raw TCP framing (`net`) for reliable data transports rather than WebSockets, reducing socket overhead overhead by preventing HTTP handshakes limits during massive broadcast storms.
* **Premium UX/UI:** An exquisitely engineered frontend rendering layer structured using `React` and `Tailwind CSS 4` featuring strict typing, glassmorphism abstractions, and interactive peer visual identities.

## 🛠️ Technology Stack
<div style="margin: 32px 0;">
  <table style="border-collapse: collapse; width: 100%; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font-family: system-ui, -apple-system, sans-serif;">
    <thead>
      <tr style="background-color: #2563eb; color: #ffffff; text-align: left;">
        <th style="padding: 16px 24px; font-weight: 600; letter-spacing: 0.5px;">Architecture Layer</th>
        <th style="padding: 16px 24px; font-weight: 600; letter-spacing: 0.5px;">File / Component</th>
        <th style="padding: 16px 24px; font-weight: 600; letter-spacing: 0.5px;">Technology</th>
        <th style="padding: 16px 24px; font-weight: 600; letter-spacing: 0.5px;">Description</th>
      </tr>
    </thead>
    <tbody style="color: #334155; font-size: 14px;">
      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">GUI Framework</td>
        <td style="padding: 16px 24px;">Electron Main/Renderer</td>
        <td style="padding: 16px 24px; font-style: italic;">Electron.js</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Desktop application container</td>
      </tr>
      <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">Frontend UI</td>
        <td style="padding: 16px 24px;">React Components</td>
        <td style="padding: 16px 24px; font-style: italic;">React 19, Tailwind CSS v4</td>
        <td style="padding: 16px 24px; line-height: 1.5;">User interface and styling</td>
      </tr>
      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">Networking Layer</td>
        <td style="padding: 16px 24px;"><code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #b91c1c;">src/main/network/lan.ts</code></td>
        <td style="padding: 16px 24px; font-style: italic;">Node.js dgram & net</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Local network UDP discovery and TCP connections</td>
      </tr>
      <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">Mesh Controller</td>
        <td style="padding: 16px 24px;"><code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #b91c1c;">src/main/mesh/router.ts</code></td>
        <td style="padding: 16px 24px; font-style: italic;">Node.js Event Emitter</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Multi-hop packet routing and deduplication</td>
      </tr>
      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">Cryptography</td>
        <td style="padding: 16px 24px;">Node native crypto</td>
        <td style="padding: 16px 24px; font-style: italic;">AES-256-GCM</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Symmetric zero-dependency payload encryption</td>
      </tr>
      <tr style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">IPC Bridge</td>
        <td style="padding: 16px 24px;"><code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #b91c1c;">src/preload/index.ts</code></td>
        <td style="padding: 16px 24px; font-style: italic;">contextBridge</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Secure UI-to-Backend communication</td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 16px 24px; font-weight: bold; color: #0f172a;">Build / Tooling</td>
        <td style="padding: 16px 24px;"><code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #b91c1c;">electron-builder.yml</code></td>
        <td style="padding: 16px 24px; font-style: italic;">Vite, electron-builder</td>
        <td style="padding: 16px 24px; line-height: 1.5;">Cross-platform packaging (EXE, DMG, AppImage)</td>
      </tr>
    </tbody>
  </table>
</div>
| Architecture Layer | Technology |
| :--- | :--- |
| **GUI Framework** | Electron.js (Main / Preload / Renderer instances) |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Networking Layer** | Node.js native `dgram` (UDP), `net` (TCP) |
| **Cryptography** | Node.js native `crypto` |
| **Tooling & Build** | Vite, `electron-vite`, `electron-builder` |

## 🚀 Getting Started

### 1. Local Development

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

```bash
# Clone the repository
git clone https://github.com/your-org/meshlink.git
cd meshlink

# Install all sub-dependencies
npm install

# Start the Vite + Electron development environment
npm run dev
```

*Note on Testing:* Due to standard OS loopback boundaries on UDP multicast sockets, testing peer discovery behaves best when run across two entirely separate physical computers communicating under the same router. Alternatively, use isolated Docker containers (instructions below).

### 2. Docker Deployment

Because MeshLink directly binds to hardware network adapters to emit local broadcast pulses, containerizing requires passing through your host's X11 Display context and utilizing host networking bindings.

```bash
# Open X11 socket (For Linux Hosts)
xhost +local:docker

# Build & Boot the container
docker compose up --build
```
*Note: Ensure `network_mode: "host"` is kept in the `docker-compose.yml` to allow the UDP pulses to break out of the docker bridge into the physical LAN.*

## 📦 Production Builds & Distribution

MeshLink leverages `electron-builder` to automatically generate cross-platform binaries directly out of your workspace.

```bash
# Windows binary (.exe inside /dist)
npm run build:win

# macOS mountable image (.dmg inside /dist)
npm run build:mac

# Linux standalone portable package (.AppImage inside /dist)
npm run build:linux
```

We highly recommend using the `.AppImage` (Linux) or `.exe` (Windows) formats for true "plug-and-play" secure thumb-drive distribution to offline zones.

## 🏗️ Architectural Topology

MeshLink adheres rigorously to Electron's security boundaries (Context Isolation enabled).
1. **Network Process:** (`src/main/network/lan.ts`): Binds UDP on `49152` communicating over multcast `224.0.0.114`. Automatically negotiates reverse TCP binds to dynamically randomized server sockets (ports `49153-59153`).
2. **Mesh Controller:** (`src/main/mesh/router.ts`): Serves as the central Event Emitter traffic cop. Validates parsed incoming JSON from TCP byte streams, strips dead `TTL` hops, executes LRU duplicate cache invalidations, and retransmits broadcast sequences to adjacent local TCP nodes.
3. **IPC Bridge:** (`src/preload/index.ts`): Highly constrained `contextBridge.exposeInMainWorld` interface passing deterministic UI instructions to Electron's sandbox. 

## 🗺️ Roadmap & Limitations

1. **Bluetooth Low Energy (BLE) Fallback:** 
   Currently deferred. Implementations relying on `@abandonware/noble` impose extreme cross-compilation strictness on C++ headers per-device (Windows vs MacOS). LAN operates as the dominant active transport constraint in Prototype 1.
2. **Dynamic Key Exchange:**
   Current infrastructure shares symmetric mesh keys (`crypto.scryptSync()`). Phase 2 will implement independent peer-to-peer `Diffie-Hellman` handshakes per socket negotiation resolving pure Zero-Knowledge protocols (E2EE) natively.
3. **Advanced Payloads:** 
   Expanding the payload JSON formats beyond `text` to serialize raw binary chunks for localized file-sharing without internet bandwidth costs.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
