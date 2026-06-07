import { Peer } from 'peerjs';

let peer: Peer | null = null;
let isConnecting = false;

export const createPeer = (): Peer => {
  if (peer) return peer;

  if (isConnecting) {
    throw new Error('Peer is already initializing');
  }

  isConnecting = true;

  const peerHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const secure = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;
  const peerPort = 9000;

  peer = new Peer({
    host: peerHost,
    port: peerPort,
    path: '/peerjs',
    secure,
    debug: 2,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80?transport=udp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=udp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
      // For debugging NAT/firewall issues, force relay (TURN) to ensure media relay.
      // If this fixes the issue, deploy a reliable TURN (coturn) for production.
      iceTransportPolicy: 'relay',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      sdpSemantics: 'unified-plan',
    },
  });

  peer.on('open', (id) => {
    console.log('✅ Peer ready:', id);
    isConnecting = false;
  });

  peer.on('error', (err) => {
    console.error('❌ Peer error:', err);
    isConnecting = false;
  });

  peer.on('disconnected', () => {
    console.warn('⚠️ Peer disconnected');
  });

  return peer;
};

export const getPeer = (): Peer | null => peer;

export const destroyPeer = (): void => {
  if (!peer) return;

  try {
    peer.destroy();
  } catch (e) {
    console.warn('Peer destroy error:', e);
  }

  peer = null;
  isConnecting = false;
};