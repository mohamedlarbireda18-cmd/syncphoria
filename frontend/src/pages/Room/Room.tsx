import { useState, useEffect, useRef } from 'react';
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
  } = useScreenShare({ roomCode: roomCode || '', socketRef, isHost });

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
  }, [roomCode, user]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await roomService.getMessages(roomCode!);
        const formatted = (res.data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: msg.createdAt,
        }));
        setMessages(formatted);
      } catch {}
    };
    if (roomCode) fetchMessages();
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !user || isLoading) return;

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join-room', roomCode, user.username);

    socket.on('receive-message', (data: any) => setMessages((prev) => [...prev, data]));

    socket.on('user-joined', (data: any) => {
      toast.success(`${data.username} joined`);
      if (isHost && isSharing && data.socketId) {
        setTimeout(() => createOfferForParticipant(data.socketId), 500);
      }
    });

    socket.on('user-left', (data: any) => toast.error(`${data.username} left`));

    socket.on('webrtc-offer', (data: any) => handleOffer(data.offer, data.from));
    socket.on('webrtc-answer', (data: any) => handleAnswer(data.answer, data.from));
    socket.on('webrtc-ice-candidate', (data: any) => handleIceCandidate(data.candidate, data.from));
    socket.on('screen-share-started', () => {});
    socket.on('screen-share-stopped', () => cleanupWebRTC());

    return () => {
      if (socket.connected) {
        socket.emit('leave-room', roomCode, user.username);
        socket.off('receive-message');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('webrtc-ice-candidate');
        socket.off('screen-share-started');
        socket.off('screen-share-stopped');
      }
    };
  }, [roomCode, user, isLoading, isHost, isSharing, createOfferForParticipant, handleOffer, handleAnswer, handleIceCandidate, cleanupWebRTC]);

  useEffect(() => {
    if (videoRef.current && remoteStream) videoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

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
      await roomService.leaveRoom(roomCode!);
      navigate('/dashboard');
      toast.success('Left room');
    } catch { toast.error('Failed to leave room'); }
  };

  const handleFullscreen = () => {
    if (!videoZoneRef.current) return;
    if (!document.fullscreenElement) videoZoneRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  if (isLoading) {
    return (
      <div className="room-page">
        <div className="room-loading"><div className="room-spinner" /><p>Joining room...</p></div>
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
          <button className="room-back-btn" onClick={() => navigate('/dashboard')}><FiArrowLeft /> Back</button>
          <div className="room-code-badge">
            <span>{roomCode}</span>
            <button className="room-copy-btn" onClick={handleCopyCode}>{copied ? <FiCheck /> : <FiCopy />}</button>
          </div>
        </div>
        <div className="room-header-center">
          <span className="room-participant-count"><FiUsers /> {room?.participants?.length || 0}</span>
          {isSharing && <span className="room-live-badge"><span className="live-dot" /> LIVE</span>}
        </div>
        <div className="room-header-right">
          <button className="room-icon-btn room-chat-toggle" onClick={() => setChatExpanded(!chatExpanded)}>
            {chatExpanded ? <FiChevronRight /> : <FiChevronLeft />}<FiMessageSquare />
          </button>
          <button className="room-leave-btn" onClick={handleLeaveRoom}><FiLogOut /> Leave</button>
        </div>
      </header>

      <div className={`room-main ${chatExpanded ? 'chat-expanded' : ''}`}>
        <div className="room-video-zone" ref={videoZoneRef}>
          {isSharing && localStream ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="room-video-element" />
          ) : remoteStream ? (
            <video ref={videoRef} autoPlay playsInline className="room-video-element" />
          ) : (
            <div className="room-placeholder">
              <div className="room-placeholder-icon"><FiMonitor /></div>
              <h2>{isHost ? 'Share Your Screen' : 'Waiting for host'}</h2>
              <p>{isHost ? 'Click below to start sharing' : `${room?.host?.username || 'Host'} will start sharing soon`}</p>
              {isHost && (
                <div style={{ marginTop: 8 }}>
                  {!isSharing ? (
                    <button className="room-share-btn" onClick={startScreenShare}><FiShare2 /> Share Screen</button>
                  ) : (
                    <button className="room-share-btn room-share-btn-stop" onClick={stopScreenShare}><FiStopCircle /> Stop Sharing</button>
                  )}
                </div>
              )}
              <div className="room-invite-code" style={{ marginTop: 24 }}>
                <span>{roomCode}</span>
                <button onClick={handleCopyCode}>{copied ? <FiCheck /> : <FiCopy />}</button>
              </div>
            </div>
          )}

          <div className="room-control-bar">
            <button className="control-btn" title="Fullscreen" onClick={handleFullscreen}>
              {isFullscreen ? <FiMinimize /> : <FiMaximize />}
            </button>
            <div className="control-divider" />
            <button className="control-btn danger" title="Leave" onClick={handleLeaveRoom}><FiLogOut /></button>
          </div>
        </div>

        <div className="room-sidebar">
          <div className="room-tabs">
            <button className={`room-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
              <FiMessageSquare /> Chat
            </button>
            <button className={`room-tab ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>
              <FiUsers /> ({room?.participants?.length || 0})
            </button>
          </div>
          <div className="room-tab-content">
            {activeTab === 'chat' && <Chat messages={messages} onSendMessage={handleSendMessage} currentUser={user} />}
            {activeTab === 'participants' && <Participants participants={room?.participants || []} hostId={room?.hostId} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;