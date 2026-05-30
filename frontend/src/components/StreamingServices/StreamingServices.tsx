import './StreamingServices.css';

// Import des logos
import netflixLogo from '../../assets/netflix.png';
import hboLogo from '../../assets/hbo.jpg';
import youtubeLogo from '../../assets/youtube.jpg';
import disneyLogo from '../../assets/disney.png';
import primeLogo from '../../assets/prime.png';
import huluLogo from '../../assets/hulu.jpg';

const StreamingServices = () => {
  const services = [
    { name: 'Netflix', logo: netflixLogo },
    { name: 'Disney+', logo: disneyLogo },
    { name: 'HBO Max', logo: hboLogo },
    { name: 'Prime Video', logo: primeLogo },
    { name: 'Hulu', logo: huluLogo },
    { name: 'YouTube', logo: youtubeLogo },
  ];

  return (
    <section className="streaming-services">
      <div className="streaming-container">
        <h2 className="streaming-title">Stream your favorites, together.</h2>
        <div className="streaming-logos">
          {services.map((service) => (
            <div key={service.name} className="streaming-logo-item">
              <div className="streaming-logo">
                <img 
                  src={service.logo} 
                  alt={service.name} 
                  className="streaming-logo-img"
                />
              </div>
              <span className="streaming-name">{service.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StreamingServices;