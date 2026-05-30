import { FiUserPlus, FiPlay, FiMessageCircle } from 'react-icons/fi';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: <FiUserPlus />,
      title: 'Create Your Room',
      description: 'Sign up in seconds and create a private room. Get a unique code to share with your friends instantly.',
      color: '#5B3DF5',
      gradient: 'linear-gradient(135deg, #5B3DF5, #9B7DF5)',
    },
    {
      number: '02',
      icon: <FiPlay />,
      title: 'Share Your Screen',
      description: 'Pick a movie, show, or video. Share your screen with one click. Crystal clear quality, minimal lag.',
      color: '#F54768',
      gradient: 'linear-gradient(135deg, #F54768, #FF6B8A)',
    },
    {
      number: '03',
      icon: <FiMessageCircle />,
      title: 'Watch & Chat Together',
      description: 'Enjoy the show with real-time chat. React with emojis, share moments, and feel together even when apart.',
      color: '#43B581',
      gradient: 'linear-gradient(135deg, #43B581, #69D9A0)',
    },
  ];

  return (
    <section className="how-it-works-section" id="how-it-works">
      <div className="how-it-works-container">
        {/* Section Header */}
        <div className="how-it-works-header">
          <div className="how-it-works-badge">
            <span className="how-it-works-badge-dot" />
            How it works
          </div>
          <h2 className="how-it-works-title">
            Start watching in
            <br />
            <span className="how-it-works-title-accent">3 simple steps</span>
          </h2>
          <p className="how-it-works-description">
            No downloads, no complicated setup. Just create a room and invite your friends.
          </p>
        </div>

        {/* Steps */}
        <div className="steps-container">
          {/* Ligne de connexion */}
          <div className="steps-line" />
          
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="step-item"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Numéro */}
              <div className="step-number-wrapper">
                <div 
                  className="step-number"
                  style={{ 
                    borderColor: step.color,
                    boxShadow: `0 0 30px ${step.color}20`
                  }}
                >
                  <span style={{ color: step.color }}>{step.number}</span>
                </div>
                {/* Point de connexion sur la ligne */}
                <div 
                  className="step-dot"
                  style={{ background: step.color }}
                />
              </div>

              {/* Contenu */}
              <div className="step-content">
                <div 
                  className="step-icon-wrapper"
                  style={{ background: step.gradient }}
                >
                  <div className="step-icon">
                    {step.icon}
                  </div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;