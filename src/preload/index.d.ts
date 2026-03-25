import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getMyInfo: () => Promise<{id: string, name: string}>;
      getPeers: () => Promise<any[]>;
      sendMessage: (to: string, content: string) => Promise<any>;
      updateName: (name: string) => Promise<void>;
      onPeersUpdated: (callback: (peers: any[]) => void) => void;
      onMessage: (callback: (msg: any) => void) => void;
    }
  }
}
