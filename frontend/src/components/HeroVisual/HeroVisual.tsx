import Avatar from '../common/Avatar/Avatar';
import './HeroVisual.css';

const HeroVisual = () => {
  const chatMessages = [
    { user: 'Alex', message: 'This scene is incredible! 😱', time: '12:34' },
    { user: 'Kadour', message: 'The cinematography is mind-blowing', time: '12:35' },
    { user: 'Mike', message: 'Best movie night ever! 🎬', time: '12:35' },
    { user: 'You', message: 'ka7al ka7al 🔥', time: '12:36' },
  ];

  const participants = [
    { name: 'Kadour', isHost: true, isActive: true },
    { name: 'Alex Kim', isHost: false, isActive: false },
    { name: 'Mike Johnson', isHost: false, isActive: false },
    { name: 'You', isHost: false, isActive: false },
  ];

  return (
    <div className="hero-visual">
      {/* Main Player Card */}
      <div className="player-card">
        {/* Screen Share Label */}
        <div className="screen-share-label">
          <div className="label-dot" />
          Abdou is sharing his screen
        </div>

        {/* Player Badges */}
        <div className="player-badges">
          <span className="badge-live">
            <span className="live-dot" />
            LIVE
          </span>
          <span className="badge-quality">1080P</span>
        </div>

        {/* Movie Display */}
        <div className="movie-display">
          <div className="movie-backdrop">
            <div className="space-dust" />
            <div className="planet-shadow" />
            <div className="stars-field" />
            <div className="nebula-glow" />
          </div>
          
          <div className="movie-content-overlay">
            <div className="movie-genre-badge">SCI-FI • ADVENTURE</div>
            <h2 className="movie-title-main">INTERSTELLAR</h2>
            <p className="movie-director">Directed by Christopher Nolan</p>
            <div className="movie-rating-row">
              <span className="imdb-badge">IMDb 8.7</span>
              <span className="movie-year">2014</span>
              <span className="movie-duration">2h 49m</span>
            </div>
          </div>
        </div>

        {/* Video Controls */}
        <div className="player-controls">
          <div className="progress-bar-wrapper">
            <div className="progress-bar">
              <div className="progress-fill" />
              <div className="progress-thumb" />
            </div>
          </div>
          
          <div className="controls-row">
            <div className="controls-left">
              <button className="control-btn" title="Play">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M5 3L14 9L5 15V3Z" />
                </svg>
              </button>
              <button className="control-btn" title="Pause">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <rect x="4" y="3" width="4" height="12" rx="1" />
                  <rect x="10" y="3" width="4" height="12" rx="1" />
                </svg>
              </button>
              <button className="control-btn" title="Volume">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M2 6V12H5L10 16V2L5 6H2Z" />
                  <path d="M12 5C13.5 6.5 13.5 9.5 12 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
              <span className="time-display">
                <span className="time-current">01:24:56</span>
                <span className="time-separator">/</span>
                <span className="time-total">02:49:00</span>
              </span>
            </div>
            
            <div className="controls-right">
              <button className="control-btn" title="Settings">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M9 1.5V3.5M9 14.5V16.5M16.5 9H14.5M3.5 9H1.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button className="control-btn" title="Fullscreen">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                  <path d="M3 6V2H7M11 2H15V6M15 12V16H11M7 16H3V12" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel - Maintenant positionné à droite sans conflit */}
      <div className="chat-panel">
        <div className="chat-panel-header">
          <div className="chat-header-left">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2H14V10H4.5L2 12.5V2Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            <span className="chat-title">Live Chat</span>
          </div>
          <div className="chat-header-right">
            <span className="online-dot" />
            <span className="online-count">4 online</span>
          </div>
        </div>
        
        <div className="chat-messages-container">
          {chatMessages.map((msg, index) => (
            <div key={index} className="chat-message-item">
              <Avatar name={msg.user} size="sm" />
              <div className="message-body">
                <div className="message-top">
                  <span className="message-username">{msg.user}</span>
                  <span className="message-time">{msg.time}</span>
                </div>
                <p className="message-content">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="chat-input-area">
          <div className="emoji-bar">
            {['❤️', '😂', '🔥', '😱', '🎬', '🍿'].map((emoji, i) => (
              <button key={i} className="emoji-btn">{emoji}</button>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              type="text"
              className="chat-message-input"
              placeholder="Type a message..."
              readOnly
            />
            <button className="send-message-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8L14 2L8 14L6 10L2 8Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Participants Bar - Positionnée SOUS le player card */}
      <div className="participants-bar">
        <div className="participants-label">PARTICIPANTS</div>
        <div className="participants-list">
          {participants.map((p, index) => (
            <div key={index} className="participant-item">
              <div className="participant-avatar-wrapper">
                <Avatar name={p.name} size="md" isHost={p.isHost} isActive={p.isActive} />
                {p.isActive && <div className="speaking-indicator" />}
              </div>
              <span className="participant-name-label">
                {p.name.split(' ')[0]}
                {p.isHost && <span className="host-tag">Host</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dock - Tout en bas */}
      <div className="action-dock">
        <button className="dock-button" title="Share Screen">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="2" y="2" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 13V17M7 17H13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button className="dock-button" title="Microphone">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M4 10C4 13.5 7 16 10 16C13 16 16 13.5 16 10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button className="dock-button" title="Camera">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="2" y="5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M15 9L19 6V15L15 12V9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <button className="dock-button dock-button-leave" title="Leave Room">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect x="2" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M14 10H18M16 8L18 10L16 12" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HeroVisual;