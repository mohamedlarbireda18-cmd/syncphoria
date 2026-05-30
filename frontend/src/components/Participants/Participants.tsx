import { FiAward } from 'react-icons/fi';
import { UPLOADS_URL } from '../../config';
import './Participants.css';

interface Participant {
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface ParticipantsProps {
  participants: Participant[];
  hostId: string;
}

const Participants = ({ participants, hostId }: ParticipantsProps) => {
  return (
    <div className="participants-container">
      {participants.map((p) => (
        <div key={p.user.id} className="participant-item">
          <div className="participant-avatar">
            {p.user.avatar ? (
              <img src={`http://localhost:5000${p.user.avatar}`} alt="" />
            ) : (
              <div className="participant-avatar-placeholder">
                {p.user.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <span className="participant-name">{p.user.username}</span>
          {p.user.id === hostId && <FiAward className="participant-crown" />}
        </div>
      ))}
    </div>
  );
};

export default Participants;