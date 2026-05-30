import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiPlus, FiLogIn, FiCopy, FiCheck } from 'react-icons/fi';
import { Toaster } from 'react-hot-toast';
import { roomService } from '../../services/api';
import toast from 'react-hot-toast';
import './CreateRoomModal.css';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateRoomModal = ({ isOpen, onClose }: CreateRoomModalProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [title, setTitle] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await roomService.createRoom(title ? { title } : {});
      const room = response.data.room;
      setCreatedRoomCode(room.roomCode);
      toast.success('Room created!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    setIsLoading(true);
    try {
      await roomService.joinRoom({ roomCode: roomCode.toUpperCase() });
      toast.success('Joined room!');
      onClose();
      navigate(`/room/${roomCode.toUpperCase()}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Room not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToRoom = () => {
    onClose();
    navigate(`/room/${createdRoomCode}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Toaster dédié à la modale */}
        <Toaster
          position="top-center"
          containerStyle={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(91, 61, 245, 0.3)',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '400px',
            },
          }}
        />

        {/* Header */}
        <div className="modal-header">
          <h2>Create or Join a Room</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setCreatedRoomCode(''); }}
          >
            <FiPlus /> Create
          </button>
          <button
            className={`modal-tab ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            <FiLogIn /> Join
          </button>
        </div>

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="modal-body">
            {createdRoomCode ? (
              <div className="room-created">
                <div className="room-created-icon">🎉</div>
                <h3>Room Created!</h3>
                <p>Share this code with friends:</p>
                <div className="room-code-display">
                  <span>{createdRoomCode}</span>
                  <button className="copy-btn" onClick={handleCopyCode}>
                    {copied ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
                <button className="modal-btn primary" onClick={handleGoToRoom}>
                  Go to Room
                </button>
              </div>
            ) : (
              <>
                <div className="modal-input-group">
                  <label>Room Title (optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Movie Night"
                    maxLength={50}
                  />
                </div>
                <button
                  className="modal-btn primary"
                  onClick={handleCreate}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Join Tab */}
        {activeTab === 'join' && (
          <div className="modal-body">
            <div className="modal-input-group">
              <label>Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                maxLength={6}
              />
            </div>
            <button
              className="modal-btn primary"
              onClick={handleJoin}
              disabled={isLoading || !roomCode.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoomModal;