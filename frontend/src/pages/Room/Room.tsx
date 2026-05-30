import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCopy, FiCheck, FiLogOut, FiUsers, FiMessageSquare, FiMonitor, FiMaximize, FiMinimize, FiChevronLeft, FiChevronRight, FiShare2, FiStopCircle } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { roomService } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { useScreenShare } from '../../hooks/useScreenShare';
import { UPLOADS_URL } from '../../config';
import Chat from '../../components/Chat/Chat';
import Participants from '../../components/Participants/Participants';
import toast from 'react-hot-toast';
import './Room.css';

const Room = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
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

  const socketRef = useRef<any>(null);
  const videoZoneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isSharing,
    remoteStream,
    localStream,
    startScreenShare,
    stopScreenShare,
    createOfferForParticipant,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup: cleanupWebRTC,
    sendOffersToAllParticipants,
  } = useScreenShare({ 
    roomCode: roomCode || '', 
    socketRef, 
    isHost,
    participants: room?.participants || []
  });

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await roomService.getRoom(roomCode!);
        setRoom(res.data.room);
        const userId = (user as any)?._id || (user as any)?.id;
        setIsHost(res.data.room.hostId === userId);
      } catch {
        toast.error('Room not found');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    if (roomCode) fetchRoom();
  }, [roomCode, user, navigate]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await roomService.getMessages(roomCode!);
        const formatted = (res.data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.createdAt,
        }));
        setMessages(formatted);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    if (roomCode) fetchMessages();
  }, [roomCode]);

  // Handle user join - NE PAS AJOUTER MANUELLEMENT (laisser handleRoomParticipants gérer)
  const handleUserJoined = useCallback((data: any) => {
    console.log('👤 User joined event:', data);
    toast.success(`${data.username} joined`);
    
    // Ne pas modifier room ici pour éviter les doublons
    // La liste sera mise à jour par handleRoomParticipants
    
    // Si host partage, envoyer offre au nouveau participant
    if (isHost && isSharing && data.socketId) {
      console.log('📤 New participant joined while sharing, sending offer...');
      setTimeout(() => createOfferForParticipant(data.socketId), 500);
    }
  }, [isHost, isSharing, createOfferForParticipant]);

  // Handle user leave
  const handleUserLeft = useCallback((data: any) => {
    console.log('👤 User left event:', data);
    toast.error(`${data.username} left`);
    
    setRoom((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants?.filter((p: any) => p.id !== data.userId) || []
      };
    });
  }, []);

  // Handle room participants list - REMPLACE complètement la liste
  const handleRoomParticipants = useCallback((data: { participants: Array<{ userId: string; username: string; socketId: string }> }) => {
    console.log('📋 Received participants list from server:', data.participants);
    
    setRoom((prev: any) => {
      if (!prev) return prev;
      
      // Transformer les participants du serveur au format attendu
      const newParticipants = data.participants.map(p => ({
        id: p.userId,
        username: p.username,
        socketId: p.socketId
      }));
      
      return {
        ...prev,
        participants: newParticipants // Remplacer complètement, pas ajouter
      };
    });
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    if (!roomCode || !user || isLoading) return;

    const socket = connectSocket();
    socketRef.current = socket;
    
    const userId = (user as any)?._id || (user as any)?.id;
    console.log('🔌 Emitting join-room with userId:', userId);
    socket.emit('join-room', roomCode, user.username, userId);

    // Message handlers
    socket.on('receive-message', (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    // Participant handlers
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    
    // Participants list handlers (utiliser seulement room-participants-list)
    socket.on('room-participants-list', handleRoomParticipants);

    // WebRTC signaling handlers
    socket.on('webrtc-offer', (data: any) => {
      console.log('📥 Received offer from:', data.from);
      handleOffer(data.offer, data.from);
    });
    
    socket.on('webrtc-answer', (data: any) => {
      console.log('📥 Received answer from:', data.from);
      handleAnswer(data.answer, data.from);
    });
    
    socket.on('webrtc-ice-candidate', (data: any) => {
      console.log('📥 Received ICE candidate from:', data.from);
      handleIceCandidate(data.candidate, data.from);
    });
    
    // Screen share handlers
    socket.on('screen-share-started', (data: any) => {
      console.log('📺 Screen share started by host:', data.hostId);
    });
    
    socket.on('screen-share-stopped', () => {
      console.log('🛑 Screen share stopped');
      cleanupWebRTC();
    });

    // Demander la liste des participants
    setTimeout(() => {
      console.log('📋 Requesting participants list...');
      socket.emit('get-room-participants', roomCode);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.emit('leave-room', roomCode, user.username, userId);
        socket.off('receive-message');
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
        socket.off('room-participants-list', handleRoomParticipants);
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('screen-share-started');
        socket.off('screen-share-stopped');
      }
    };
  }, [roomCode, user, isLoading, handleUserJoined, handleUserLeft, handleRoomParticipants, handleOffer, handleAnswer, handleIceCandidate, cleanupWebRTC]);

  // Rafraîchir la liste des participants périodiquement (mais pas trop souvent)
  useEffect(() => {
    if (!socketRef.current || !roomCode) return;
    
    // Rafraîchir la liste toutes les 10 secondes
    const interval = setInterval(() => {
      if (socketRef.current) {
        console.log('📋 Refreshing participants list...');
        socketRef.current.emit('get-room-participants', roomCode);
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [roomCode]);

  // Send offers to all participants when screen sharing starts
  useEffect(() => {
    if (isHost && isSharing && room?.participants && room.participants.length > 0) {
      console.log('🎬 Screen sharing started, sending offers to all participants...');
      console.log('📋 Current participants:', room.participants);
      setTimeout(() => {
        sendOffersToAllParticipants();
      }, 500);
    }
  }, [isHost, isSharing, room?.participants, sendOffersToAllParticipants]);

  // Video element connections
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      console.log('🎥 Connected remote stream to video element');
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('🎥 Connected local stream to video element');
    }
  }, [localStream]);

  // Fullscreen handler
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !socketRef.current || !user) return;
    socketRef.current.emit('send-message', roomCode, {
      username: user.username,
      message,
      avatar: user.avatar,
      userId: (user as any)._id || (user as any).id,
    });
  };

  const handleLeaveRoom = async () => {
    try {
      cleanupWebRTC();
      if (socketRef.current) {
        const userId = (user as any)?._id || (user as any)?.id;
        socketRef.current.emit('leave-room', roomCode, user?.username, userId);
      }
      await roomService.leaveRoom(roomCode!);
      navigate('/dashboard');
      toast.success('Left room');
    } catch (error) {
      console.error('Failed to leave room:', error);
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

  const handleStartScreenShare = async () => {
    console.log('🎬 Starting screen share...');
    await startScreenShare();
  };

  const handleStopScreenShare = () => {
    console.log('🛑 Stopping screen share...');
    stopScreenShare();
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
      <div className="room-ambiance">
        <div className="room-ambiance-orb room-ambiance-orb-1" />
        <div className="room-ambiance-orb room-ambiance-orb-2" />
      </div>

      <header className="room-header">
        <div className="room-header-left">
          <button className="room-back-btn" onClick={() => navigate('/dashboard')}>
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
            title={chatExpanded ? "Collapse chat" : "Expand chat"}
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
          {/* Screen share video */}
          {isSharing && localStream ? (
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="room-video-element" 
            />
          ) : remoteStream ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="room-video-element" 
            />
          ) : (
            /* Placeholder when no screen share */
            <div className="room-placeholder">
              <div className="room-placeholder-icon">
                <FiMonitor />
              </div>
              <h2>{isHost ? 'Share Your Screen' : 'Waiting for host'}</h2>
              <p>
                {isHost 
                  ? 'Click below to start sharing your screen with participants' 
                  : `${room?.host?.username || 'Host'} will start sharing soon`}
              </p>
              
              {isHost && (
                <div style={{ marginTop: 8 }}>
                  {!isSharing ? (
                    <button 
                      className="room-share-btn" 
                      onClick={handleStartScreenShare}
                    >
                      <FiShare2 /> Share Screen
                    </button>
                  ) : (
                    <button 
                      className="room-share-btn room-share-btn-stop" 
                      onClick={handleStopScreenShare}
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
              
              {!isHost && !isSharing && !remoteStream && (
                <div className="room-waiting-message">
                  <div className="waiting-spinner"></div>
                  <p>Waiting for host to start sharing...</p>
                </div>
              )}
            </div>
          )}

          {/* Video controls */}
          <div className="room-control-bar">
            <button 
              className="control-btn" 
              title="Fullscreen" 
              onClick={handleFullscreen}
            >
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
            <div className="control-divider" />
            <button 
              className="control-btn danger" 
              title="Leave Room" 
              onClick={handleLeaveRoom}
            >
              <FiLogOut />
            </button>
          </div>
        </div>

        {/* Sidebar with chat and participants */}
        <div className="room-sidebar">
          <div className="room-tabs">
            <button 
              className={`room-tab ${activeTab === 'chat' ? 'active' : ''}`} 
              onClick={() => setActiveTab('chat')}
            >
              <FiMessageSquare /> Chat
            </button>
            <button 
              className={`room-tab ${activeTab === 'participants' ? 'active' : ''}`} 
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