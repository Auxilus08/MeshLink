import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { randomUUID } from 'crypto'
import { MeshRouter } from './mesh/router'
import { CryptoService } from './security/crypto'
import { LANLayer } from './network/lan'
import { NetworkMessage } from '../shared/types'

let mainWindow: BrowserWindow;
let router: MeshRouter;
let lan: LANLayer;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Mesh Systems
  const myId = randomUUID();
  const myName = `User-${myId.substring(0, 4)}`;
  
  router = new MeshRouter(myId, myName);
  const cryptoService = new CryptoService();
  lan = new LANLayer(router, cryptoService);
  
  await lan.start();

  ipcMain.handle('get-my-info', () => {
    return { id: router.myId, name: router.myName };
  });

  ipcMain.handle('get-peers', () => {
    return router.getPeers();
  });

  ipcMain.handle('send-message', (_, to: string, content: string) => {
    const msg = router.createMessage(to, 'text', content);
    // broadcast natively via LAN to all connected peers
    lan.broadcast(msg);
    // Since we created it, we can just echo it back as 'delivered/sent' if needed, but UI knows it sent it
    return msg;
  });

  ipcMain.handle('update-name', (_, name: string) => {
    router.myName = name;
    // Broadcast a new handshake to let everyone know name changed
    const p = { id: router.myId, name: router.myName, transport: 'LAN' as const, address: lan.myIp, port: lan.myPort };
    const msg = router.createMessage('broadcast', 'handshake', p);
    lan.broadcast(msg);
  });

  // Wiring Router events to Renderer
  router.on('peers-updated', (peers) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('peers-updated', peers);
    }
  });

  router.on('message', (msg: NetworkMessage) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('message', msg);
    }
  });

  router.on('forward', (msg: NetworkMessage) => {
    // router asked us to forward to LAN
    lan.broadcast(msg);
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (lan) lan.stop();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
