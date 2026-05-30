import Button from '../common/Button/Button';
import Avatar from '../common/Avatar/Avatar';
import './Hero.css';

const Hero = () => {
  const avatars = [
    { name: 'Alex', src: '' },
    { name: 'Sarah', src: '' },
    { name: 'Mike', src: '' },
    { name: 'Emma', src: '' },
  ];

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          {/* Badge */}
          <div className="hero-badge">
            <span className="badge-dot" />
            Watch together. Anytime, anywhere.
          </div>

          {/* Heading */}
          <h1 className="hero-title">
            Watch Together
            <br />
            <span className="hero-title-accent">Anywhere</span>
          </h1>

          {/* Description */}
          <p className="hero-description">
            Share your screen, watch movies, and connect with friends in real time. 
            Built for unforgettable moments together.
          </p>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <Button variant="primary" size="lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 7L13 10L8 13V7Z" fill="currentColor" />
              </svg>
              Create Room 
            </Button>
            <Button variant="secondary" size="lg">
              Join Room
            </Button>
          </div>

          {/* Social Proof */}
          <div className="social-proof">
            <div className="avatar-stack">
              {avatars.map((avatar, index) => (
                <div
                  key={index}
                  className="avatar-stack-item"
                  style={{ zIndex: avatars.length - index }}
                >
                  <Avatar name={avatar.name} size="md" />
                </div>
              ))}
              <div className="avatar-stack-count">+12K</div>
            </div>
            <div className="social-proof-info">
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} width="16" height="16" viewBox="0 0 16 16" fill="#FFB800">
                    <path d="M8 1L10.18 5.42L15 6.14L11.5 9.58L12.34 14.36L8 12.08L3.66 14.36L4.5 9.58L1 6.14L5.82 5.42L8 1Z" />
                  </svg>
                ))}
              </div>
              <span className="rating-text">4.9 / 5 from 12K+ users</span>
            </div>
          </div>
        </div>

        {/* Hero Visual placeholder - will be replaced by HeroVisual component */}
        <div className="hero-visual-wrapper">
          {/* HeroVisual will go here */}
        </div>
      </div>
    </section>
  );
};

export default Hero;