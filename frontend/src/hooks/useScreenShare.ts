import { useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
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
};

interface UseScreenShareProps {
  roomCode: string;
  socketRef: React.MutableRefObject<any>;
  isHost: boolean;
}

export const useScreenShare = ({ roomCode, socketRef, isHost }: UseScreenShareProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const getSocket = () => socketRef.current;

  const startScreenShare = useCallback(async () => {
    const socket = getSocket();
    console.log('🖥️ startScreenShare | isHost:', isHost, '| socket:', !!socket);
    if (!isHost || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: true,
      });

      console.log('✅ Screen capture successful | tracks:', stream.getVideoTracks().length);
      localStreamRef.current = stream;
      setIsSharing(true);

      socket.emit('screen-share-started', roomCode);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('❌ Failed to start screen share:', err);
    }
  }, [isHost, roomCode]);

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
    socket?.emit('screen-share-stopped', roomCode);
  }, [roomCode]);

  const createOfferForParticipant = useCallback(async (participantSocketId: string) => {
    const socket = getSocket();
    console.log('📤 Creating offer for:', participantSocketId);
    if (!localStreamRef.current || !socket) return;

    const oldPc = peerConnectionsRef.current.get(participantSocketId);
    if (oldPc) oldPc.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(participantSocketId, pc);

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', roomCode, {
          candidate: event.candidate,
          to: participantSocketId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state (host):', pc.connectionState);
      if (pc.connectionState === 'connected') console.log('✅ WebRTC connected! (host)');
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state (host):', pc.iceConnectionState);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('📤 Sending offer to:', participantSocketId);

    socket.emit('webrtc-offer', roomCode, { offer, to: participantSocketId });
  }, [roomCode]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, fromSocketId: string) => {
    const socket = getSocket();
    console.log('📥 Received offer from:', fromSocketId);

    if (isHost) { console.log('❌ Ignoring offer (isHost)'); return; }
    if (!socket) return;

    const oldPc = peerConnectionsRef.current.get(fromSocketId);
    if (oldPc) oldPc.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(fromSocketId, pc);

    pc.ontrack = (event) => {
      console.log('📺 Received remote track!', event.streams.length);
      if (event.streams[0]) setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-ice-candidate', roomCode, { candidate: event.candidate, to: fromSocketId });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state (participant):', pc.connectionState);
      if (pc.connectionState === 'connected') console.log('✅ WebRTC connected! (participant)');
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state (participant):', pc.iceConnectionState);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
    pending.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
    pendingCandidatesRef.current.delete(fromSocketId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc-answer', roomCode, { answer, to: fromSocketId });
  }, [isHost, roomCode]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, fromSocketId?: string) => {
    console.log('📥 Received answer');
    for (const [id, pc] of peerConnectionsRef.current.entries()) {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Answer applied to PC:', id);

        if (fromSocketId) {
          const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
          pending.forEach((c) => pc.addIceCandidate(new RTCIceCandidate(c)));
          pendingCandidatesRef.current.delete(fromSocketId);
        }
        return;
      }
    }
    console.log('❌ No PC in have-local-offer state');
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, fromSocketId?: string) => {
    let added = false;

    for (const [id, pc] of peerConnectionsRef.current.entries()) {
      if (pc.remoteDescription) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); added = true; } catch (e) {}
      }
    }

    if (!added && fromSocketId) {
      const pending = pendingCandidatesRef.current.get(fromSocketId) || [];
      pending.push(candidate);
      pendingCandidatesRef.current.set(fromSocketId, pending);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    peerConnectionsRef.current.forEach((pc) => {
      pc.onicecandidate = null;
      pc.ontrack = null;
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
  };
};