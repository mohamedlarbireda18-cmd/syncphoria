import { useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 2,
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
};

interface UseScreenShareProps {
  roomCode: string;
  socketRef: React.MutableRefObject<any>;
  isHost: boolean;
  participants?: Array<{ socketId?: string; id?: string; username?: string }>;
}

export const useScreenShare = ({ roomCode, socketRef, isHost, participants = [] }: UseScreenShareProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const getSocket = () => socketRef.current;

  const sendOffersToAllParticipants = useCallback(async () => {
    console.log('📤 sendOffersToAllParticipants | participants reçus:', participants.length);
    console.log('📤 Détail des participants:', participants.map(p => ({ id: p.id, username: p.username, socketId: p.socketId })));
    
    if (!localStreamRef.current) {
      console.log('❌ No local stream available');
      return;
    }

    const socket = getSocket();
    if (!socket) {
      console.log('❌ No socket available');
      return;
    }

    console.log('📤 Mon socketId:', socket.id);
    
    const otherParticipants = participants.filter(p => {
      const hasSocketId = p.socketId && p.socketId !== '';
      const notSelf = p.socketId !== socket.id;
      return hasSocketId && notSelf;
    });
    
    console.log('📤 Participants avec socketId valide:', otherParticipants.length);
    
    if (otherParticipants.length === 0) {
      console.log('⚠️ Aucun participant avec socketId trouvé.');
      return;
    }
    
    for (const participant of otherParticipants) {
      if (participant.socketId) {
        console.log(`📤 Envoi offre à ${participant.username || participant.id} (socket: ${participant.socketId})`);
        await createOfferForParticipant(participant.socketId);
      }
    }
  }, [participants]);

  const startScreenShare = useCallback(async () => {
    const socket = getSocket();
    console.log('🖥️ startScreenShare | isHost:', isHost, '| socket:', !!socket);
    if (!isHost || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      console.log('✅ Screen capture successful | tracks:', stream.getVideoTracks().length);
      localStreamRef.current = stream;
      setIsSharing(true);

      socket.emit('screen-share-started', roomCode);
      
      setTimeout(async () => {
        console.log('📤 Envoi des offres à tous les participants...');
        await sendOffersToAllParticipants();
      }, 1000);

      stream.getVideoTracks()[0].onended = () => {
        console.log('📺 Screen share window closed by user');
        stopScreenShare();
      };
    } catch (err) {
      console.error('❌ Failed to start screen share:', err);
      toast.error('Failed to start screen share. Please check permissions.');
    }
  }, [isHost, roomCode, sendOffersToAllParticipants]);

  const stopScreenShare = useCallback(() => {
    const socket = getSocket();
    console.log('🛑 stopScreenShare');
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();

    setIsSharing(false);
    setRemoteStream(null);
    socket?.emit('screen-share-stopped', roomCode);
  }, [roomCode]);

  const createOfferForParticipant = useCallback(async (participantSocketId: string) => {
    const socket = getSocket();
    console.log('📤 Creating offer for participant socket:', participantSocketId);
    
    if (!localStreamRef.current) {
      console.log('❌ No local stream available');
      return;
    }
    
    if (!socket) {
      console.log('❌ No socket available');
      return;
    }

    if (peerConnectionsRef.current.has(participantSocketId)) {
      console.log('⚠️ Offer already exists for:', participantSocketId);
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(participantSocketId, pc);

    localStreamRef.current.getTracks().forEach((track) => {
      console.log(`📤 Adding track ${track.kind} to peer connection`);
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', participantSocketId);
        socket.emit('webrtc-ice-candidate', roomCode, {
          candidate: event.candidate,
          to: participantSocketId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state (host):', pc.connectionState, 'to:', participantSocketId);
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC connected! (host)');
        toast.success('Screen share connected!');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ WebRTC connection failed to:', participantSocketId);
        toast.error('Failed to connect screen share');
        peerConnectionsRef.current.delete(participantSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state (host):', pc.iceConnectionState, 'to:', participantSocketId);
    };

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('📤 Sending offer to:', participantSocketId);

      socket.emit('webrtc-offer', roomCode, { 
        offer, 
        to: participantSocketId 
      });
    } catch (error) {
      console.error('❌ Error creating offer:', error);
    }
  }, [roomCode]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromSocketId: string) => {
    const socket = getSocket();
    console.log('📥 Received offer from:', fromSocketId, '| isHost:', isHost);

    if (isHost) {
      console.log('⚠️ Ignoring offer (isHost)');
      return;
    }
    
    if (!socket) return;

    const oldPc = peerConnectionsRef.current.get(fromSocketId);
    if (oldPc) {
      oldPc.close();
      peerConnectionsRef.current.delete(fromSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(fromSocketId, pc);

    pc.ontrack = (event) => {
      console.log('📺 Received remote track!', event.streams.length);
      if (event.streams[0]) {
        console.log('✅ Setting remote stream');
        setRemoteStream(event.streams[0]);
        toast.success('Screen share connected!');
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to host:', fromSocketId);
        socket.emit('webrtc-ice-candidate', roomCode, { 
          candidate: event.candidate, 
          to: fromSocketId 
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state (participant):', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅ WebRTC connected! (participant)');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ WebRTC connection failed');
        toast.error('Failed to connect to screen share');
        peerConnectionsRef.current.delete(fromSocketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state (participant):', pc.iceConnectionState);
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
      for (const c of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
          console.log('✅ Added pending ICE candidate');
        } catch (e) {
          console.log('⚠️ Failed to add pending ICE candidate:', e);
        }
      }
      pendingCandidatesRef.current.delete(fromSocketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('📤 Sending answer to:', fromSocketId);
      socket.emit('webrtc-answer', roomCode, { 
        answer, 
        to: fromSocketId 
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
    }
  }, [isHost, roomCode]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromSocketId?: string) => {
    console.log('📥 Received answer from:', fromSocketId);
    
    if (!fromSocketId) return;
    
    const pc = peerConnectionsRef.current.get(fromSocketId);
    if (!pc) {
      console.log('❌ No PC found for:', fromSocketId);
      return;
    }

    if (pc.signalingState !== 'have-local-offer') {
      console.log('⚠️ PC not in have-local-offer state, current:', pc.signalingState);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Answer applied for:', fromSocketId);

      const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
      for (const c of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c));
          console.log('✅ Added pending ICE candidate after answer');
        } catch (e) {}
      }
      pendingCandidatesRef.current.delete(fromSocketId);
    } catch (error) {
      console.error('❌ Error applying answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromSocketId?: string) => {
    if (!fromSocketId) return;
    
    const pc = peerConnectionsRef.current.get(fromSocketId);
    
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added for:', fromSocketId);
      } catch (e) {
        console.log('⚠️ Failed to add ICE candidate:', e);
      }
    } else {
      const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
      pending.push(candidate);
      pendingCandidatesRef.current.set(fromSocketId, pending);
      console.log('📦 Stored ICE candidate for later:', fromSocketId);
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up all WebRTC connections');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    });
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStream(null);
    setIsSharing(false);
  }, []);

  return {
    isSharing,
    remoteStream,
    localStream: localStreamRef.current,
    startScreenShare,
    stopScreenShare,
    createOfferForParticipant,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
    sendOffersToAllParticipants,
  };
};