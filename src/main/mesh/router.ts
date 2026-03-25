import { randomUUID } from 'crypto';
import { Peer, NetworkMessage } from '../../shared/types';
import { EventEmitter } from 'events';

const TTL_DEFAULT = 10;
const CACHE_SIZE = 1000;
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class MeshRouter extends EventEmitter {
  public peers = new Map<string, Peer>();
  private seenMessages = new Map<string, number>(); // msgId -> timestamp
  public myId: string;
  public myName: string;

  constructor(myId: string, myName: string) {
    super();
    this.myId = myId;
    this.myName = myName;

    // Periodic cleanup of seen messages
    setInterval(() => this.cleanupCache(), CACHE_EXPIRY_MS / 2);
  }

  public registerPeer(peer: Omit<Peer, 'lastSeen'>) {
    const p: Peer = { ...peer, lastSeen: Date.now() };
    this.peers.set(p.id, p);
    this.emit('peers-updated', Array.from(this.peers.values()));
  }

  public removePeer(peerId: string) {
    this.peers.delete(peerId);
    this.emit('peers-updated', Array.from(this.peers.values()));
  }

  public getPeers(): Peer[] {
    // Only return peers seen recently (e.g. within last 120s)
    const now = Date.now();
    for (const [id, peer] of this.peers.entries()) {
      if (now - peer.lastSeen > 120000) {
        this.peers.delete(id);
      }
    }
    return Array.from(this.peers.values());
  }

  public handleIncomingMessage(msg: NetworkMessage, sourcePeerId?: string) {
    if (!msg || !msg.id) return;
    
    // 1. Duplicate check
    if (this.seenMessages.has(msg.id)) {
      return; // Already seen, discard
    }
    this.seenMessages.set(msg.id, Date.now());

    // 2. Is it for me? Or broadcast?
    if (msg.to === this.myId || msg.to === 'broadcast') {
      this.emit('message', msg);
    } // else we just forward it

    // 3. TTL Check and Forwarding
    if (msg.ttl > 1) {
      const forwardMsg = { ...msg, ttl: msg.ttl - 1, hops: msg.hops + 1 };
      this.emit('forward', forwardMsg, sourcePeerId);
    }
  }

  public createMessage(to: string, type: 'text' | 'handshake' | 'peer-info', content: any): NetworkMessage {
    const msg: NetworkMessage = {
      id: randomUUID(),
      from: this.myId,
      to,
      type,
      content,
      ttl: TTL_DEFAULT,
      hops: 0,
      timestamp: Date.now(),
    };
    // Cache our own message so we don't process it if it loops back
    this.seenMessages.set(msg.id, Date.now());
    return msg;
  }

  private cleanupCache() {
    const now = Date.now();
    // Use iteration map
    for (const [id, timestamp] of this.seenMessages.entries()) {
      if (now - timestamp > CACHE_EXPIRY_MS) {
        this.seenMessages.delete(id);
      }
    }
    if (this.seenMessages.size > CACHE_SIZE) {
      // Just clear some space natively if needed, Map iterates in insertion order
      let toRemove = this.seenMessages.size - CACHE_SIZE;
      for (const [id] of this.seenMessages.entries()) {
        if (toRemove-- <= 0) break;
        this.seenMessages.delete(id);
      }
    }
  }
}
