import { useRef, useEffect } from 'react';
import { FiMonitor } from 'react-icons/fi';
import './VideoPlayer.css';

interface VideoPlayerProps {
  roomCode: string;
  remoteStream: MediaStream | null;
  isSharing: boolean;
  isHost: boolean;
  hostUsername?: string;
}

const VideoPlayer = ({ roomCode, remoteStream, isSharing, isHost, hostUsername }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (remoteStream) {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-player-active"
      />
    );
  }

  return (
    <div className="video-player-placeholder">
      <FiMonitor className="video-icon" />
      <h3>{isHost ? 'Ready to Share' : 'Waiting for Host'}</h3>
      <p>{isHost ? 'Click Share Screen below' : `${hostUsername || 'Host'} will start sharing soon`}</p>
      <span className="video-room-code">Room: {roomCode}</span>
    </div>
  );
};

export default VideoPlayer;