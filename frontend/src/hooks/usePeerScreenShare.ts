import { useEffect, useState, useRef, useCallback } from 'react';
import { Peer, MediaConnection } from 'peerjs';
import { createPeer } from '../services/peer';
import toast from 'react-hot-toast';

interface Props {
  roomCode: string;
  username: string;
  socketRef: React.MutableRefObject<any>;
  isHost: boolean;
  userId: string;
  socketReady: boolean;
}

export const usePeerScreenShare = ({
  roomCode,
  username,
  socketRef,
  isHost,
  userId,
  socketReady,
}: Props) => {
  const [isSharing, setIsSharing] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  console.log('🎬 usePeerScreenShare hook called - isHost:', isHost, 'socketReady:', socketReady, 'roomCode:', roomCode);

  const peerRef = useRef<Peer | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const hasJoinedRoom = useRef(false);
  const peerIdSent = useRef(false);
  const pendingHostPeerId = useRef<string | null>(null);
  const screenShareStartedEmitted = useRef(false);

  // Helper: create a tiny silent/placeholder MediaStream to ensure SDP negotiation
  const createSilentStream = useCallback((): MediaStream => {
    // Create a tiny canvas video track (1x1) and a silent audio track when possible.
    try {
      // create canvas video track
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.fillRect(0, 0, 1, 1);
      // @ts-ignore
      const videoStream = (canvas as any).captureStream ? (canvas as any).captureStream(15) : new MediaStream();

      // create silent audio track if possible
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      let audioStream: MediaStream | null = null;
      if (typeof AudioContext === 'function') {
        try {
          const audioCtx = new AudioContext();
          const oscillator = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          gain.gain.value = 0;
          oscillator.connect(gain);
          const destination = audioCtx.createMediaStreamDestination();
          gain.connect(destination);
          oscillator.start();
          audioStream = destination.stream;
        } catch (e) {
          console.warn('⚠️ createSilentStream audio creation failed', e);
        }
      }

      // merge tracks: prefer video + audio if available
      const outStream = new MediaStream();
      // add video tracks from canvas
      videoStream.getVideoTracks().forEach((t) => outStream.addTrack(t));
      // add audio tracks if available
      if (audioStream) {
        audioStream.getAudioTracks().forEach((t) => outStream.addTrack(t));
      }

      console.log('🎵 Created placeholder stream (video+optional audio)', {
        streamId: outStream.id,
        tracks: outStream.getTracks().map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled }))
      });

      return outStream as MediaStream;
    } catch (e) {
      console.warn('⚠️ createSilentStream failed, returning empty MediaStream', e);
      return new MediaStream();
    }
  }, []);

  // =========================
  // INIT PEER
  // =========================
  useEffect(() => {
    if (peerRef.current) return;

    const peer = createPeer();
    peerRef.current = peer;

    const handleOpen = (id: string) => {
      console.log('✅ Peer ready:', id);
      setPeerId(id);
    };

    const handleError = (err: any) => {
      console.error('❌ Peer error:', err);
    };

    peer.on('open', handleOpen);
    peer.on('error', handleError);

    // If the Peer was already opened before we attached the listener,
    // `peer.id` will be set — use it to initialize state immediately.
    if ((peer as any).id) {
      console.log('ℹ️ Peer already open, setting peerId from peer.id:', (peer as any).id);
      setPeerId((peer as any).id);
    } else {
      // In some dev environments the 'open' event may fire before our handler
      // attaches. Poll for `peer.id` briefly to catch that case.
      let checks = 0;
      const maxChecks = 50; // ~5s at 100ms
      const interval = setInterval(() => {
        checks += 1;
        if ((peer as any).id) {
          console.log('🔎 Polled and found peer.id:', (peer as any).id);
          setPeerId((peer as any).id);
          clearInterval(interval);
        } else if (checks >= maxChecks) {
          clearInterval(interval);
        }
      }, 100);

      // ensure we clear interval on unmount
      const origReturn = () => {
        try {
          peer.off('open', handleOpen);
          peer.off('error', handleError);
        } catch (e) {
          /* ignore */
        }
        clearInterval(interval);
      };

      // Replace the effect cleanup to include interval cleanup
      return origReturn;
    }
    return () => {
      try {
        peer.off('open', handleOpen);
        peer.off('error', handleError);
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // If we received host peerId before our Peer was ready, connect when ready
  // (moved below connectToHost declaration)

  // =========================
  // JOIN ROOM
  // =========================
  useEffect(() => {
    if (!socketReady || hasJoinedRoom.current) return;

    const effectivePeerId = peerId || peerRef.current?.id || '';
    console.log('🚪 Attempting to join room - socketReady:', socketReady, 'peerId(state):', peerId, 'peerRef.id:', peerRef.current?.id, 'hasJoinedRoom:', hasJoinedRoom.current);

    socketRef.current?.emit('join-room', roomCode, username, userId, effectivePeerId);

    hasJoinedRoom.current = true;
    if (effectivePeerId) {
      peerIdSent.current = true;
      if (!peerId && peerRef.current?.id) {
        // ensure state reflects actual peer id
        setPeerId(peerRef.current.id as string);
      }
    }
  }, [socketReady, roomCode, username, userId, peerId]);

  // If we joined the room earlier but sent an empty peerId, re-emit join-room
  // once the peerId becomes available so the server/participants know our id.
  useEffect(() => {
    if (!socketReady) return;
    if (!hasJoinedRoom.current) return;
    if (!peerId) return;
    if (peerIdSent.current) return;

    console.log('🔁 Re-emitting join-room now that peerId is available:', peerId);
    socketRef.current?.emit('join-room', roomCode, username, userId, peerId);
    peerIdSent.current = true;
  }, [peerId, socketReady, roomCode, username, userId, socketRef]);

  // =========================
  // HOST: RECEIVE CALL
  // =========================
  useEffect(() => {
    if (!isHost) return;

    const peer = peerRef.current;
    if (!peer) {
      console.log('⚠️ Host effect: peer not ready yet');
      return;
    }

    console.log('👂 Host listening for incoming calls');

    const handleCall = (call: MediaConnection) => {
      console.log('📞 Incoming call from:', call.peer);

      const stream = localStreamRef.current;

      if (!stream) {
        console.log('❌ No screen stream yet, declining call');
        return;
      }

      console.log('✅ Answering with screen stream');
      try {
        console.log('✅ Host answering - localStream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, settings: (t as any).getSettings ? (t as any).getSettings() : null })));
      } catch (e) {
        console.warn('⚠️ Failed to log localStream track settings', e);
      }
      call.answer(stream);

      call.on('stream', (remoteStream) => {
        console.log('📺 Host received participant stream (not needed)');
        try {
          console.log('📺 Host remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        } catch (e) {
          console.warn('⚠️ Failed to log host remote stream tracks', e);
        }
      });

      call.on('error', (err) => {
        console.error('❌ Call error on host side:', err);
      });

      // start stats polling for this incoming call (host side)
      try {
        const getPCFromCall = (c: any) => c.peerConnection || c.connection?.peerConnection || c._negotiator?.pc || null;
        const pc = getPCFromCall(call as any);
        if (pc) {
          const id = setInterval(async () => {
            try {
              const stats = await pc.getStats();
              const inbound = [] as any[];
              stats.forEach((r: any) => {
                if (r.type === 'inbound-rtp' && (r.kind === 'video' || r.mediaType === 'video')) inbound.push({ id: r.id, packetsReceived: r.packetsReceived, framesDecoded: r.framesDecoded, bytesReceived: r.bytesReceived });
              });
              console.log('📊 Host RTCPeerConnection inbound video stats:', inbound.length ? inbound : 'none');
            } catch (e) {
              /* ignore */
            }
          }, 2000);
          (call as any)._statsIntervalId = id;
        }
      } catch (e) {
        /* ignore */
      }

      call.on('close', () => {
        console.log('📞 Host call closed');
        try { if ((call as any)._statsIntervalId) clearInterval((call as any)._statsIntervalId); } catch (e) { /* ignore */ }
      });
    };

    peer.on('call', handleCall);

    return () => {
      peer.off('call', handleCall);
    };
  }, [isHost]);

  // =========================
  // PARTICIPANT: CONNECT TO HOST
  // =========================
  const connectToHost = useCallback((hostPeerId: string) => {
    const peer = peerRef.current;
    if (!peer || !hostPeerId) return;

    console.log('📞 Participant calling host:', hostPeerId);

    // Use a tiny silent stream to ensure SDP negotiation succeeds in all browsers
    const placeholderStream = createSilentStream();
    console.log('📡 Participant placeholder stream created for call:', {
      streamId: placeholderStream.id,
      tracks: placeholderStream.getTracks().map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState }))
    });

    const call = peer.call(hostPeerId, placeholderStream);

    if (!call) {
      console.error('❌ Failed to create call');
      // cleanup placeholder tracks
      placeholderStream.getTracks().forEach((t) => t.stop());
      return;
    }

    // Start polling getStats() for this call (helps diagnose RTP/frame issues)
    const getPCFromCall = (c: any) => c.peerConnection || c.connection?.peerConnection || c._negotiator?.pc || null;
    const startStatsPolling = (c: any, label: string) => {
      const pc = getPCFromCall(c);
      if (!pc) {
        console.warn('⚠️ Unable to find RTCPeerConnection for stats polling', label);
        return null;
      }
        // attach ICE event logging (do not replace existing handlers)
        try {
          if (!(pc as any)._iceLoggingAttached) {
            pc.addEventListener && pc.addEventListener('icecandidate', (ev: any) => {
              console.log(`🧭 ${label} icecandidate:`, ev && ev.candidate ? { candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex } : null);
            });
            pc.addEventListener && pc.addEventListener('iceconnectionstatechange', () => {
              console.log(`🔔 ${label} iceConnectionState changed:`, pc.iceConnectionState, 'connectionState:', pc.connectionState);
            });
            (pc as any)._iceLoggingAttached = true;
          }
        } catch (e) {
          console.warn('⚠️ Failed to attach ICE logging', e);
        }
      console.log('📊 Starting stats polling for', label);
      // helper: dump transceivers/senders/receivers
      const dumpPCDiagnostics = (pc: any, lbl: string) => {
        try {
          const transceivers = (pc.getTransceivers ? pc.getTransceivers() : []).map((t: any) => ({ mid: t.mid, direction: t.direction, senderTrack: t.sender?.track ? { id: t.sender.track.id, kind: t.sender.track.kind } : null, receiverTrack: t.receiver?.track ? { id: t.receiver.track.id, kind: t.receiver.track.kind } : null }));
          const senders = (pc.getSenders ? pc.getSenders() : []).map((s: any) => ({ id: s.id, track: s.track ? { id: s.track.id, kind: s.track.kind, readyState: s.track.readyState } : null }));
          const receivers = (pc.getReceivers ? pc.getReceivers() : []).map((r: any) => ({ id: r.id, track: r.track ? { id: r.track.id, kind: r.track.kind, readyState: r.track.readyState } : null }));
          console.log(`🔧 PC Diagnostics (${lbl}) state: connectionState=${pc.connectionState} iceConnectionState=${pc.iceConnectionState}`, { transceivers, senders, receivers });
        } catch (e) {
          console.warn('⚠️ dumpPCDiagnostics failed', e);
        }
      };

      const id = setInterval(async () => {
        try {
          const stats = await pc.getStats();
          const summaries: any[] = [];
          const codecs: any[] = [];
          let candidatePair: any = null;
          stats.forEach((report: any) => {
            if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.mediaType === 'video')) {
              summaries.push({ id: report.id, type: report.type, kind: report.kind || report.mediaType, packetsReceived: report.packetsReceived, framesDecoded: report.framesDecoded, bytesReceived: report.bytesReceived, jitter: report.jitter });
            }
            if (report.type === 'outbound-rtp' && (report.kind === 'video' || report.mediaType === 'video')) {
              summaries.push({ id: report.id, type: report.type, packetsSent: report.packetsSent, framesEncoded: report.framesEncoded, bytesSent: report.bytesSent });
            }
            if (report.type === 'codec') {
              codecs.push({ id: report.id, mimeType: report.mimeType, payloadType: report.payloadType });
            }
            if (report.type === 'candidate-pair' && report.nominated) {
              candidatePair = report;
            }
          });
          if (summaries.length) console.log(`📊 RTCPeerConnection stats (${label}):`, summaries);
          else console.log(`📊 RTCPeerConnection stats (${label}): no video rtp reports yet`);
          if (codecs.length) console.log(`🔣 ${label} codecs:`, codecs);
          if (candidatePair) console.log(`🔗 ${label} nominated candidate-pair:`, { state: candidatePair.state, availableOutgoingBitrate: candidatePair.availableOutgoingBitrate, availableIncomingBitrate: candidatePair.availableIncomingBitrate, bytesReceived: candidatePair.bytesReceived, bytesSent: candidatePair.bytesSent });
          if (pc.localDescription) console.log(`📄 ${label} localDescription mlines:`, (pc.localDescription.sdp || '').split('\n').filter((l: string) => l.startsWith('m=')));
          if (pc.remoteDescription) console.log(`📄 ${label} remoteDescription mlines:`, (pc.remoteDescription.sdp || '').split('\n').filter((l: string) => l.startsWith('m=')));

          // dump transceivers/senders/receivers every poll
          dumpPCDiagnostics(pc, label);
        } catch (e) {
          console.warn('⚠️ getStats error', e);
        }
      }, 2000);
      c._statsIntervalId = id;
      c._stopStats = () => clearInterval(id);
      return id;
    };

    // start polling immediately for the outgoing call
    try { startStatsPolling(call, `participant->host:${hostPeerId}`); } catch (e) { /* ignore */ }

    call.on('stream', (stream) => {
      console.log('📺 Participant received remote stream, tracks:', stream.getTracks().length);
      try {
        const infos = stream.getTracks().map((t) => {
          let settings: any = null;
          let constraints: any = null;
          let capabilities: any = null;
          try {
            settings = (t as any).getSettings ? (t as any).getSettings() : null;
          } catch (e) {
            settings = `error: ${(e as any).message}`;
          }
          try {
            constraints = (t as any).getConstraints ? (t as any).getConstraints() : null;
          } catch (e) {
            constraints = `error: ${(e as any).message}`;
          }
          try {
            capabilities = (t as any).getCapabilities ? (t as any).getCapabilities() : null;
          } catch (e) {
            capabilities = `error: ${(e as any).message}`;
          }
          // listen to track lifecycle
          try {
            (t as any).onmute = () => console.log('🔇 track muted', t.kind);
            (t as any).onunmute = () => console.log('🔊 track unmuted', t.kind);
            (t as any).onended = () => console.log('⛔ track ended', t.kind);
          } catch (e) {
            /* ignore */
          }
          return {
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
            settings,
            constraints,
            capabilities,
          };
        });
        console.log('🔎 Participant remote stream track info:', JSON.stringify(infos));
      } catch (e) {
        console.warn('⚠️ Failed to log participant stream track settings', e);
      }

      console.log('🔄 Setting remote stream for playback, tracks:', stream.getTracks().map((t) => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      setRemoteStream(stream);
      toast.success('Screen connected');

      // dump PC diagnostics for this call when we received the remote stream
      try {
        const pc = getPCFromCall(call as any);
        if (pc) {
          console.log('🔍 Participant found RTCPeerConnection for diagnostics after stream');
          try {
            const trans = pc.getTransceivers ? pc.getTransceivers() : [];
            console.log('🔁 Participant transceivers after stream:', trans.map((t: any) => ({ mid: t.mid, direction: t.direction, senderTrack: t.sender?.track?.id, receiverTrack: t.receiver?.track?.id })));
            console.log('📡 Participant pc connectionState/ice:', pc.connectionState, pc.iceConnectionState);
          } catch (e) { console.warn('⚠️ participant dump transceivers failed', e); }
        } else {
          console.warn('⚠️ participant could not find RTCPeerConnection for call');
        }
      } catch (e) { /* ignore */ }

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          const ImageCaptureConstructor = (window as any).ImageCapture;
          if (typeof ImageCaptureConstructor === 'function') {
            const imageCapture = new ImageCaptureConstructor(videoTrack);
            imageCapture.grabFrame()
              .then((bitmap: any) => {
                console.log('🖼️ grabFrame succeeded:', bitmap.width, bitmap.height);
              })
              .catch((err: any) => {
                console.warn('⚠️ grabFrame failed on remote video track', err);
              });
          } else {
            console.warn('⚠️ ImageCapture is not available in this browser');
          }
        } catch (err) {
          console.warn('⚠️ Failed to execute ImageCapture debug on remote track', err);
        }
      }

      // we can stop the placeholder tracks now (if any)
      placeholderStream.getTracks().forEach((t) => t.stop());
    });

    call.on('error', (err) => {
      console.error('❌ Call error on participant side:', err);
      placeholderStream.getTracks().forEach((t) => t.stop());
    });

    call.on('close', () => {
      console.log('📞 Participant call closed');
      setRemoteStream(null);
      placeholderStream.getTracks().forEach((t) => t.stop());
      try { if ((call as any)._stopStats) (call as any)._stopStats(); } catch (e) { /* ignore */ }
    });
  }, [createSilentStream]);

  // If we received host peerId before our Peer was ready, connect when ready
  // PARTICIPANT: consume pending host peerId
  useEffect(() => {
    if (!peerId || isHost) return;

    console.log('✨ Participant peerId ready:', peerId);

    const pending = pendingHostPeerId.current;
    if (pending) {
      console.log('🔄 Consuming pending hostPeerId:', pending);
      pendingHostPeerId.current = null;
      connectToHost(pending);
    }
  }, [peerId, isHost, connectToHost]);

  // HOST: emit screen-share-started when peerId becomes available (if already sharing)
  useEffect(() => {
    if (!isHost || !peerId || !isSharing) return;
    if (screenShareStartedEmitted.current) return;

    console.log('📢 Host emitting screen-share-started now that peerId is ready');
    socketRef.current?.emit('screen-share-started', roomCode, peerId);
    screenShareStartedEmitted.current = true;
  }, [isHost, peerId, isSharing, roomCode, socketRef]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    if (isHost || !socketReady) return;

    const socket = socketRef.current;
    if (!socket) return;

    console.log('👂 Participant listening for screen-share events - socketReady:', socketReady, 'peerId:', peerId);

    const handleStart = ({ peerId: hostPeerId }: any) => {
      console.log('📡 screen-share-started received, hostPeerId:', hostPeerId);
      if (!hostPeerId) return;

      // If our peerId is not ready yet, store pending host id
      if (!peerId) {
        console.log('⏳ peerId not ready yet, storing pending hostPeerId:', hostPeerId);
        pendingHostPeerId.current = hostPeerId;
        return;
      }

      console.log('🤙 Calling connectToHost with:', hostPeerId);
      connectToHost(hostPeerId);
    };

    const handleStop = () => {
      console.log('📴 screen-share-stopped received');
      setRemoteStream(null);
    };

    socket.on('screen-share-started', handleStart);
    socket.on('screen-share-stopped', handleStop);

    return () => {
      socket.off('screen-share-started', handleStart);
      socket.off('screen-share-stopped', handleStop);
    };
  }, [socketReady, isHost, peerId, connectToHost]);

  // =========================
  // START SHARE (HOST)
  // =========================
  const startScreenShare = useCallback(async () => {
    if (!isHost) {
      console.log('⛔ startScreenShare called but not host');
      return;
    }

    console.log('🎬 Host starting screen share - peerId:', peerId);

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsSharing(true);
    console.log('✅ Screen captured, stream tracks:', stream.getTracks().length);

    // If peerId is ready, notify others immediately. Otherwise we'll emit when peerId becomes available.
    if (peerId) {
      console.log('📢 Emitting screen-share-started to room');
      socketRef.current?.emit('screen-share-started', roomCode, peerId);
      screenShareStartedEmitted.current = true;
    } else {
      console.log('⏳ peerId not ready yet, will emit when available');
    }

    stream.getVideoTracks()[0].onended = () => {
      console.log('🛑 Screen share ended (user stopped sharing)');
      stopScreenShare();
    };
  }, [isHost, peerId, roomCode, socketRef]);

  // =========================
  // STOP SHARE
  // =========================
  const stopScreenShare = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    setIsSharing(false);
    setRemoteStream(null);
    screenShareStartedEmitted.current = false;

    socketRef.current?.emit('screen-share-stopped', roomCode);
  }, [roomCode]);

  return {
    isSharing,
    remoteStream,
    localStream,
    startScreenShare,
    stopScreenShare,
    peerId,
  };
};