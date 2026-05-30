import { useEffect, useState } from 'react';
import './Background.css';

const Background = () => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 4 + 2}px`,
        height: `${Math.random() * 4 + 2}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 3 + 3}s`,
        opacity: Math.random() * 0.5 + 0.2,
      },
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="background-container">
      {/* Gradient orbs */}
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />
      
      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={particle.style}
        />
      ))}
      
      {/* Vignette */}
      <div className="vignette" />
      
      {/* Grid overlay */}
      <div className="grid-overlay" />
    </div>
  );
};

export default Background;