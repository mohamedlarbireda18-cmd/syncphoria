import { FiAward } from 'react-icons/fi';
import { UPLOADS_URL } from '../../config';
import './Participants.css';

interface Participant {
  id?: string;
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
  username?: string;
  avatar?: string;
  socketId?: string;
}

interface ParticipantsProps {
  participants: Participant[];
  hostId: string;
}

const Participants = ({ participants, hostId }: ParticipantsProps) => {
  // Vérifier si participants existe et est un tableau
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    return (
      <div className="participants-container">
        <div className="no-participants">No participants yet</div>
      </div>
    );
  }

  // Fonction pour obtenir l'ID du participant
  const getParticipantId = (p: Participant): string => {
    return p?.id || p?.user?.id || '';
  };

  // Fonction pour obtenir le username
  const getParticipantUsername = (p: Participant): string => {
    return p?.username || p?.user?.username || 'Unknown';
  };

  // Fonction pour obtenir l'avatar
  const getParticipantAvatar = (p: Participant): string | null => {
    const avatar = p?.avatar || p?.user?.avatar;
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${UPLOADS_URL}${avatar}`;
  };

  return (
    <div className="participants-container">
      {participants.map((p, index) => {
        const participantId = getParticipantId(p);
        const username = getParticipantUsername(p);
        const avatar = getParticipantAvatar(p);
        const isHost = participantId === hostId;

        // Si pas d'ID, utiliser l'index comme key
        const key = participantId || `participant-${index}`;

        return (
          <div key={key} className="participant-item">
            <div className="participant-avatar">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={username}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className={`participant-avatar-placeholder ${avatar ? '' : 'show'}`}>
                {username.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>
            <span className="participant-name">{username}</span>
            {isHost && <FiAward className="participant-crown" />}
          </div>
        );
      })}
    </div>
  );
};

export default Participants;