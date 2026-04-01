import dgram from 'dgram';
import net from 'net';
import { EventEmitter } from 'events';
import { NetworkMessage, Peer } from '../../shared/types';
import { CryptoService } from '../security/crypto';
import { MeshRouter } from '../mesh/router';

// constants
const DISCOVERY_PORT = 49152;
const DISCOVERY_MULTICAST = '224.0.0.114';
const TCP_PORT_MIN = 49153;
const TCP_PORT_MAX = 59153;

export class LANLayer extends EventEmitter {
  private crypto: CryptoService;
  private router: MeshRouter;
  
  private udpSocket: dgram.Socket;
  private tcpServer!: net.Server;
  private peerSockets = new Map<string, net.Socket>(); // peer UUID -> socket
  private broadcastInterval!: NodeJS.Timeout;
  
  public myIp: string;
  public myPort: number;
  
  constructor(router: MeshRouter, crypto: CryptoService) {
    super();
    this.router = router;
    this.crypto = crypto;
    // Just listen universally for discovery broadcast
    this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    
    // Find unused IP dynamically (e.g. 0.0.0.0 for bind but find real ip to broadcast)
    this.myIp = '127.0.0.1'; // We need network interfaces to broadcast actual LAN ip
    this.myPort = 0;
  }

  public async start() {
    // 1. Determine local IP
    this.myIp = this.getLocalIp();

    // 2. Start TCP server for incoming mesh connections
    await this.startTcpServer();

    // 3. Start UDP Discovery
    this.startDiscovery();
  }

  private getLocalIp(): string {
    const interfaces = require('os').networkInterfaces();
    let localIp = '127.0.0.1';
    for (const dev in interfaces) {
      interfaces[dev].forEach((details: any) => {
        if (details.family === 'IPv4' && !details.internal) {
          localIp = details.address;
        }
      });
    }
    return localIp;
  }

  private async startTcpServer() {
    return new Promise<void>((resolve, reject) => {
      this.tcpServer = net.createServer((socket) => {
        // A peer connected
        this.handlePeerSocket(socket);
      });
      // Try to bind randomly in our port range
      const randomPort = Math.floor(Math.random() * (TCP_PORT_MAX - TCP_PORT_MIN + 1)) + TCP_PORT_MIN;
      this.tcpServer.listen(randomPort, '0.0.0.0', () => {
        this.myPort = (this.tcpServer.address() as net.AddressInfo).port;
        console.log(`TCP server listening on port ${this.myPort}`);
        resolve();
      });
      
      this.tcpServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log('Port occupied, retrying...');
          this.tcpServer.listen(0, '0.0.0.0');
        } else {
          reject(err);
        }
      });
    });
  }

  private handlePeerSocket(socket: net.Socket, knownPeerId?: string) {
    // Receive data frames
    socket.on('data', (d) => {
      // Split by newline or use length prefixing for proper JSON framing
      const messages = d.toString().split('\n').filter(Boolean);
      for (const m of messages) {
        try {
          const parsed = JSON.parse(m);
          // If we are parsing network packets that are encrypted:
          if (parsed && parsed.iv && parsed.content && parsed.authTag) {
             const decrypted = this.crypto.decrypt(parsed);
             if (decrypted) {
               // We need to associate this socket with a peer ID on handshake!
               if (decrypted.type === 'handshake') {
                 const newPeerId = decrypted.from;
                 // Prevent duplicates
                 if (!this.peerSockets.has(newPeerId)) {
                   this.peerSockets.set(newPeerId, socket);
                   this.router.registerPeer(decrypted.content as Omit<Peer, 'lastSeen'>);
                   // Send handshake back if not known
                   if (!knownPeerId) {
                     this.greetPeer(socket);
                   }
                 }
               }
               // Normal message
               this.router.handleIncomingMessage(decrypted, decrypted.from);
             }
          }
        } catch(e) { /* ignore fragment */ }
      }
    });

    socket.on('error', () => {
      // socket error, delete peer
      this.peerSockets.forEach((s, id) => {
        if (s === socket) {
          this.peerSockets.delete(id);
          this.router.removePeer(id);
        }
      });
    });

    socket.on('close', () => { /* remove dead socket */ });
  }

  private startDiscovery() {
    this.udpSocket.bind(DISCOVERY_PORT, () => {
      this.udpSocket.setBroadcast(true);
      try {
        this.udpSocket.addMembership(DISCOVERY_MULTICAST);
      } catch (e) {
        // Can be ignored if multicast is not fully supported
      }
      console.log('UDP discovery listening');
    });

    this.udpSocket.on('message', (msg, rinfo) => {
      if (rinfo.address === this.myIp && rinfo.port === this.myPort) return; // Self message
      try {
        const payload = JSON.parse(msg.toString());
        if (payload.id && payload.id !== this.router.myId && payload.ip && payload.port) {
          // It's a valid MeshLink discovery ping! Connect if we don't have them
          const connectingIp = rinfo.address; // Use the actual receipt address over LAN, ignore self-reported local IP 
          if (!this.peerSockets.has(payload.id)) {
            this.connectToPeer(payload.id, connectingIp, payload.port);
          }
        }
      } catch (e) {}
    });

    // Send UDP broadcast
    const broadcastMsg = JSON.stringify({
      id: this.router.myId,
      name: this.router.myName,
      ip: this.myIp,
      port: this.myPort,
      transport: 'LAN'
    });
    
    const sendPulse = () => {
      const interfaces = require('os').networkInterfaces();
      for (const dev in interfaces) {
        interfaces[dev].forEach((details: any) => {
          if (details.family === 'IPv4' && !details.internal) {
            const ipParts = details.address.split('.').map(Number);
            const maskParts = details.netmask.split('.').map(Number);
            const broadcastParts = ipParts.map((ipPart: number, i: number) => ipPart | (~maskParts[i] & 255));
            const broadcastIp = broadcastParts.join('.');
            try {
              this.udpSocket.send(broadcastMsg, 0, broadcastMsg.length, DISCOVERY_PORT, broadcastIp, () => {});
            } catch (e) {} // ignore send errors for specific adapters
          }
        });
      }
      
      try { this.udpSocket.send(broadcastMsg, 0, broadcastMsg.length, DISCOVERY_PORT, '255.255.255.255', () => {}); } catch(e) {}
      this.udpSocket.send(broadcastMsg, 0, broadcastMsg.length, DISCOVERY_PORT, DISCOVERY_MULTICAST, () => {});
    };

    sendPulse();
    this.broadcastInterval = setInterval(sendPulse, 5000); // 5 sec pings
  }

  private connectToPeer(id: string, ip: string, port: number) {
    const socket = net.createConnection({ host: ip, port }, () => {
      this.peerSockets.set(id, socket);
      this.handlePeerSocket(socket, id);
      this.greetPeer(socket);
    });
    socket.on('error', () => { /* connection refused or timed out, just ignore */ });
  }

  private greetPeer(socket: net.Socket) {
    // Send my info as handshake
    const p: Omit<Peer, 'lastSeen'> = {
      id: this.router.myId,
      name: this.router.myName,
      transport: 'LAN',
      address: this.myIp,
      port: this.myPort
    };
    const hand = this.router.createMessage('broadcast', 'handshake', p);
    const encrypted = this.crypto.encrypt(hand);
    socket.write(JSON.stringify(encrypted) + '\n');
  }

  public broadcast(msg: NetworkMessage) {
    // Forward to all directly connected sockets
    const encrypted = this.crypto.encrypt(msg);
    const packet = JSON.stringify(encrypted) + '\n';
    for (const [id, socket] of this.peerSockets.entries()) {
      // Don't bounce back to original sender (handled loosely by router, but explicitly here too)
      if (msg.from !== id) {
        try {
          socket.write(packet);
        } catch { }
      }
    }
  }

  public stop() {
    clearInterval(this.broadcastInterval);
    this.udpSocket.close();
    this.tcpServer.close();
    for (const socket of this.peerSockets.values()) {
      socket.destroy();
    }
  }
}
