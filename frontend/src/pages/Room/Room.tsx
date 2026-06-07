import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiCopy,
  FiCheck,
  FiLogOut,
  FiUsers,
  FiMessageSquare,
  FiMonitor,
  FiMaximize,
  FiMinimize,
  FiChevronLeft,
  FiChevronRight,
  FiShare2,
  FiStopCircle,
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { roomService } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { usePeerScreenShare } from '../../hooks/usePeerScreenShare';
import Chat from '../../components/Chat/Chat';
import Participants from '../../components/Participants/Participants';
import toast from 'react-hot-toast';
import './Room.css';

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [room, setRoom] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [socketReady, setSocketReady] = useState(false);

  const socketRef = useRef<any>(null);
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const userId = (user as any)?._id || (user as any)?.id;
  const username = (user as any)?.username || '';

  useEffect(() => {
    if (!roomCode || !user || isLoading) return;

    const socket = connectSocket();
    socketRef.current = socket;

    console.log('🔌 Socket connecting...');

    const handleConnect = () => {
      console.log('✅ Socket connected with id:', socket.id);
      setSocketReady(true);
    };

    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected');
      setSocketReady(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('receive-message', (data: any) =>
      setMessages((prev) => [...prev, data])
    );

    socket.on('user-joined', (data: any) =>
      toast.success(`${data.username} joined`)
    );

    socket.on('user-left', () => toast.error('User left'));

    socket.on('room-participants', (data: any) => {
      setRoom((current: any) =>
        current ? { ...current, participants: data.participants } : current
      );
    });

    socket.onAny((event: string, ...args: any[]) => {
      console.log('📡 Socket event:', event, args);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-participants');
      socket.offAny();

      if (socket.connected) {
        socket.emit('leave-room', roomCode, username, userId);
        socket.disconnect();
      }
    };
  }, [roomCode, user, isLoading, userId, username]);

  const {
    isSharing,
    remoteStream,
    localStream,
    startScreenShare,
    stopScreenShare,
  } = usePeerScreenShare({
    roomCode: roomCode || '',
    username,
    socketRef,
    isHost,
    userId: userId || '',
    socketReady,
  });

  useEffect(() => {
    console.log('🔴🔴🔴 REMOTE STREAM CHANGED in Room:', !!remoteStream);
    if (remoteStream) {
      console.log('🔴🔴🔴 remoteStream is now available!');
      console.log('🔴🔴🔴 Stream tracks:', remoteStream.getTracks().length);
    }
  }, [remoteStream]);

  useEffect(() => {
    console.log(
      '🎥 VIDEO REF EFFECT - remoteStream:',
      !!remoteStream,
      'videoRef:',
      !!videoRef.current
    );

    if (videoRef.current && remoteStream) {
      console.log('🎥 Assigning stream to video element');
      console.log('🎥 remoteStream details:', {
        id: remoteStream.id,
        active: remoteStream.active,
        videoTracks: remoteStream.getVideoTracks().length,
        audioTracks: remoteStream.getAudioTracks().length,
        videoTrackDetails: remoteStream.getVideoTracks().map(t => ({
          id: t.id,
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          label: t.label
        }))
      });
      try {
        // Reset srcObject to null first to ensure clean state
        if (videoRef.current.srcObject) {
          console.log('🎥 Resetting existing srcObject');
          videoRef.current.srcObject = null;
        }

        videoRef.current.onloadedmetadata = () => console.log('📽️ video onloadedmetadata');
        videoRef.current.oncanplay = () => console.log('📽️ video oncanplay');
        videoRef.current.onplaying = () => {
          console.log('📽️ video onplaying');
        };
        videoRef.current.onpause = () => console.log('📽️ video onpause');
        videoRef.current.onerror = (e) => console.error('📽️ video error', e);
        videoRef.current.onwaiting = () => console.log('⌛ video waiting');
        videoRef.current.onstalled = () => console.log('⚠️ video stalled');
        videoRef.current.onsuspend = () => console.log('⏸️ video suspend');
        videoRef.current.onended = () => console.log('⛔ video ended');
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        console.log('🎥 Using native remoteStream for video attachment, tracks:', remoteStream.getTracks().map(t => ({ id: t.id, kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
        videoRef.current.srcObject = remoteStream;
        console.log('🎥 srcObject assigned immediately:', {
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
          readyState: videoRef.current.readyState,
          networkState: videoRef.current.networkState,
          paused: videoRef.current.paused,
          currentTime: videoRef.current.currentTime
        });
        
        // Check video element properties
        const computedStyle = window.getComputedStyle(videoRef.current);
        console.log('🎥 Video element computed style:', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          width: computedStyle.width,
          height: computedStyle.height
        });
        
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        setTimeout(() => {
          console.log('🎥 Delayed play attempt state:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            paused: videoRef.current?.paused
          });
          const playPromise = videoRef.current?.play();
          if (playPromise) {
            playPromise
              .then(() => console.log('✅ video play() succeeded after delay'))
              .catch((e) => console.error('❌ Play error after delay:', e));
          } else {
            console.warn('⚠️ play() returned no promise after delay');
          }
        }, 400);
        console.log('🎥 video srcObject set, attempted delayed play');
        
        // Monitor state changes over time
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          if (checkCount > 10) {
            clearInterval(checkInterval);
            return;
          }
          console.log(`🎥 State check ${checkCount}ms:`, {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            networkState: videoRef.current?.networkState,
            paused: videoRef.current?.paused
          });
        }, 100);

        try {
          let debugVideo = document.getElementById('debug-remote-video') as HTMLVideoElement | null;
          if (!debugVideo) {
            debugVideo = document.createElement('video');
            debugVideo.id = 'debug-remote-video';
            debugVideo.style.position = 'fixed';
            debugVideo.style.right = '10px';
            debugVideo.style.bottom = '10px';
            debugVideo.style.width = '200px';
            debugVideo.style.height = '120px';
            debugVideo.style.zIndex = '99999';
            debugVideo.style.background = '#000';
            debugVideo.style.border = '2px solid #5B3DF5';
            debugVideo.muted = true;
            debugVideo.autoplay = true;
            debugVideo.playsInline = true;
            document.body.appendChild(debugVideo);
            console.log('🎥 Debug video element created and appended to DOM');
          }
          // Reset srcObject
          if (debugVideo.srcObject) {
            console.log('🎥 Debug video: resetting existing srcObject');
            debugVideo.srcObject = null;
          }
          debugVideo.onloadedmetadata = () => console.log('🎬 Debug video onloadedmetadata');
          debugVideo.onplaying = () => console.log('🎬 Debug video onplaying');
          debugVideo.onerror = (e) => console.error('🎬 Debug video error', e);
          console.log('🎬 Attaching debugging video to native remote stream');
          debugVideo.srcObject = remoteStream;
          console.log('🎥 Debug video srcObject assigned, videoWidth:', debugVideo.videoWidth, 'videoHeight:', debugVideo.videoHeight);
          debugVideo.muted = true;
          debugVideo.playsInline = true;
          debugVideo.autoplay = true;
          setTimeout(() => {
            console.log('🎥 Debug delayed play attempt state:', {
              videoWidth: debugVideo.videoWidth,
              videoHeight: debugVideo.videoHeight,
              readyState: debugVideo.readyState,
              networkState: debugVideo.networkState,
              paused: debugVideo.paused
            });
            const debugPlayPromise = debugVideo.play();
            if (debugPlayPromise) {
              debugPlayPromise
                .then(() => console.log('✅ Debug video play() succeeded after delay'))
                .catch((e) => console.error('❌ Debug video play failed after delay', e));
            } else {
              console.warn('⚠️ Debug play() returned no promise after delay');
            }
          }, 400);
          console.log('🎥 Debug video attached to DOM');
        } catch (e) {
          console.warn('⚠️ Failed to attach debug video element', e);
        }
      } catch (e) {
        console.error('🎥 Failed to attach stream to video element', e);
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.error('Local play error:', e));
    }
  }, [localStream]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await roomService.getRoom(roomCode!);
        setRoom(res.data.room);
        setIsHost(res.data.room.hostId === userId);
      } catch {
        toast.error('Room not found');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (roomCode) fetchRoom();
  }, [roomCode, userId, navigate]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await roomService.getMessages(roomCode!);
        setMessages(
          res.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: msg.createdAt,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    if (roomCode) fetchMessages();
  }, [roomCode]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !socketRef.current || !user) return;

    const data = {
      username: user.username,
      message,
      avatar: user.avatar,
      userId,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('send-message', roomCode, data);
  };

  const handleLeaveRoom = async () => {
    try {
      stopScreenShare();
      socketRef.current?.emit('leave-room', roomCode, user?.username, userId);
      await roomService.leaveRoom(roomCode!);
      navigate('/dashboard');
      toast.success('Left room');
    } catch {
      toast.error('Failed to leave room');
    }
  };

  const handleFullscreen = () => {
    if (!videoZoneRef.current) return;

    if (!document.fullscreenElement) {
      videoZoneRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="room-page">
        <div className="room-loading">
          <div className="room-spinner" />
          <p>Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page">
      {remoteStream && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999,
            background: 'green',
            color: 'white',
            padding: 10,
            fontSize: 12,
          }}
        >
          ✅ SCREEN SHARE ACTIF !
        </div>
      )}

      <div className="room-ambiance">
        <div className="room-ambiance-orb room-ambiance-orb-1" />
        <div className="room-ambiance-orb room-ambiance-orb-2" />
      </div>

      <header className="room-header">
        <div className="room-header-left">
          <button
            className="room-back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <FiArrowLeft /> Back
          </button>

          <div className="room-code-badge">
            <span>{roomCode}</span>
            <button className="room-copy-btn" onClick={handleCopyCode}>
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>

        <div className="room-header-center">
          <span className="room-participant-count">
            <FiUsers /> {room?.participants?.length || 0}
          </span>
          {isSharing && (
            <span className="room-live-badge">
              <span className="live-dot" /> LIVE
            </span>
          )}
        </div>

        <div className="room-header-right">
          <button
            className="room-icon-btn room-chat-toggle"
            onClick={() => setChatExpanded(!chatExpanded)}
          >
            {chatExpanded ? <FiChevronRight /> : <FiChevronLeft />}
            <FiMessageSquare />
          </button>

          <button className="room-leave-btn" onClick={handleLeaveRoom}>
            <FiLogOut /> Leave
          </button>
        </div>
      </header>

      <div className={`room-main ${chatExpanded ? 'chat-expanded' : ''}`}>
        <div className="room-video-zone" ref={videoZoneRef}>
          {isSharing && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="room-video-element"
            />
          ) : remoteStream ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  zIndex: 10,
                  background: 'red',
                  color: 'white',
                  padding: 5,
                  fontSize: 10,
                }}
              >
                VIDEO RENDERED
              </div>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="room-video-element"
              />
            </>
          ) : (
            <div className="room-placeholder">
              <div className="room-placeholder-icon">
                <FiMonitor />
              </div>
              <h2>{isHost ? 'Share Your Screen' : 'Waiting for host'}</h2>
              <p>
                {isHost
                  ? 'Click below to start sharing'
                  : `${room?.host?.username || 'Host'} will start sharing soon`}
              </p>

              {isHost && (
                <div style={{ marginTop: 8 }}>
                  {!isSharing ? (
                    <button className="room-share-btn" onClick={startScreenShare}>
                      <FiShare2 /> Share Screen
                    </button>
                  ) : (
                    <button
                      className="room-share-btn room-share-btn-stop"
                      onClick={stopScreenShare}
                    >
                      <FiStopCircle /> Stop Sharing
                    </button>
                  )}
                </div>
              )}

              <div className="room-invite-code" style={{ marginTop: 24 }}>
                <span>Room Code: {roomCode}</span>
                <button onClick={handleCopyCode}>
                  {copied ? <FiCheck /> : <FiCopy />}
                </button>
              </div>
            </div>
          )}

          <div className="room-control-bar">
            <button className="control-btn" onClick={handleFullscreen}>
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
            <div className="control-divider" />
            <button className="control-btn danger" onClick={handleLeaveRoom}>
              <FiLogOut />
            </button>
          </div>
        </div>

        <div className="room-sidebar">
          <div className="room-tabs">
            <button
              className={`room-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <FiMessageSquare /> Chat
            </button>
            <button
              className={`room-tab ${
                activeTab === 'participants' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('participants')}
            >
              <FiUsers /> ({room?.participants?.length || 0})
            </button>
          </div>

          <div className="room-tab-content">
            {activeTab === 'chat' && (
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUser={user}
              />
            )}
            {activeTab === 'participants' && (
              <Participants
                participants={room?.participants || []}
                hostId={room?.hostId || ''}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;