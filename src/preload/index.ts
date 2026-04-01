import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getMyInfo: () => ipcRenderer.invoke('get-my-info'),
  getPeers: () => ipcRenderer.invoke('get-peers'),
  sendMessage: (to: string, content: string) => ipcRenderer.invoke('send-message', to, content),
  updateName: (name: string) => ipcRenderer.invoke('update-name', name),
  
  onPeersUpdated: (callback: (peers: any[]) => void) => {
    ipcRenderer.removeAllListeners('peers-updated')
    ipcRenderer.on('peers-updated', (_event, value) => callback(value))
  },
  onMessage: (callback: (msg: any) => void) => {
    ipcRenderer.removeAllListeners('message')
    ipcRenderer.on('message', (_event, value) => callback(value))
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
