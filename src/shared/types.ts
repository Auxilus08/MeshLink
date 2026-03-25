export interface Peer {
  id: string;
  name: string;
  transport: 'LAN' | 'BLE';
  address?: string; // IP or Mac
  port?: number;
  lastSeen: number;
}

export interface NetworkMessage {
  id: string;
  from: string; // Sender UUID
  to: string;   // Recipient UUID or 'broadcast'
  type: 'text' | 'handshake' | 'peer-info';
  content: any; // The encrypted payload (or plaintext if handshake)
  ttl: number;
  hops: number;
  timestamp: number;
}
