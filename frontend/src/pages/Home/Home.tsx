import Navbar from '../../components/Navbar/Navbar';
import Hero from '../../components/Hero/Hero';
import HeroVisual from '../../components/HeroVisual/HeroVisual';
import StreamingServices from '../../components/StreamingServices/StreamingServices';
import Features from '../../components/Features/Features';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import Blog from '../../components/Blog/Blog';
import FAQ from '../../components/FAQ/FAQ';
import Background from '../../components/Background/Background';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <Background />
      <Navbar />
      
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-left">
            <Hero />
          </div>
          <div className="hero-right">
            <HeroVisual />
          </div>
        </div>
      </section>
      
      <div className="section-animate"><Features /></div>
      <div className="section-animate"><HowItWorks /></div>
      <div className="section-animate"><Blog /></div>
      <div className="section-animate"><FAQ /></div>
      <div className="section-animate"><StreamingServices /></div>
    </div>
  );
};

export default Home;