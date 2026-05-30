import { FiMonitor, FiMessageSquare, FiUsers, FiZap, FiShield, FiSmile } from 'react-icons/fi';
import './Features.css';

const Features = () => {
  const features = [
    {
      icon: <FiMonitor />,
      title: 'Screen Sharing',
      description: 'Share your screen, a browser tab, or a specific application in real-time with crystal clear quality.',
      gradient: 'linear-gradient(135deg, #5B3DF5, #9B7DF5)',
    },
    {
      icon: <FiMessageSquare />,
      title: 'Live Chat',
      description: 'Chat instantly with emojis, reactions, and real-time messaging while watching together.',
      gradient: 'linear-gradient(135deg, #F54768, #FF6B8A)',
    },
    {
      icon: <FiUsers />,
      title: 'Private Rooms',
      description: 'Create secure private rooms for up to 3 people. Share a simple code to invite friends instantly.',
      gradient: 'linear-gradient(135deg, #43B581, #69D9A0)',
    },
    {
      icon: <FiZap />,
      title: 'Ultra Low Latency',
      description: 'Powered by WebRTC for peer-to-peer streaming with minimal delay. Every frame stays in sync.',
      gradient: 'linear-gradient(135deg, #F5A623, #FFC04D)',
    },
    {
      icon: <FiShield />,
      title: 'Secure & Private',
      description: 'End-to-end encrypted connections. Your watch parties are private and protected at all times.',
      gradient: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
    },
    {
      icon: <FiSmile />,
      title: 'Emoji Reactions',
      description: 'React in real-time with emojis. Express yourself without interrupting the viewing experience.',
      gradient: 'linear-gradient(135deg, #00CEC9, #55EFC4)',
    },
  ];

  return (
    <section className="features-section" id="features">
      <div className="features-container">
        {/* Section Header */}
        <div className="features-header">
          <div className="features-badge">
            <span className="features-badge-dot" />
            Features
          </div>
          <h2 className="features-title">
            Everything you need
            <br />
            <span className="features-title-accent">to watch together</span>
          </h2>
          <p className="features-description">
            Powerful features designed to make your watch parties seamless, 
            fun, and unforgettable.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="feature-icon-wrapper"
                style={{ background: feature.gradient }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;