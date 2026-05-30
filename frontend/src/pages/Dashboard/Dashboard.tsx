import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api';
import { UPLOADS_URL } from '../../config';
import Button from '../../components/common/Button/Button';
import Hero from '../../components/Hero/Hero';
import HeroVisual from '../../components/HeroVisual/HeroVisual';
import StreamingServices from '../../components/StreamingServices/StreamingServices';
import Features from '../../components/Features/Features';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import Blog from '../../components/Blog/Blog';
import FAQ from '../../components/FAQ/FAQ';
import Background from '../../components/Background/Background';
import CreateRoomModal from '../../components/CreateRoomModal/CreateRoomModal';
import logoImage from '../../assets/logo.png';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authService.getProfile();
        setUser(response.data.user);
      } catch (error) {
        toast.error('Session expired. Please log in again.');
        logout();
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomePage = location.pathname === '/dashboard';

  const scrollToTop = (e: React.MouseEvent) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.querySelector(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => { logout(); navigate('/'); setIsDropdownOpen(false); };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Background />
        <div className="dashboard-loading"><div className="dashboard-spinner" /><p>Loading your dashboard...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Background />

      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          <a href="/dashboard" className="navbar-logo" onClick={scrollToTop}>
            <img src={logoImage} alt="Syncphoria" className="logo-image" />
            <span className="logo-text">syncphoria</span>
          </a>

          <div className="navbar-links">
            <a href="#home" className="nav-link" onClick={scrollToTop}>Home</a>
            <a href="#features" className="nav-link" onClick={(e) => handleNavClick(e, '#features')}>Features</a>
            <a href="#how-it-works" className="nav-link" onClick={(e) => handleNavClick(e, '#how-it-works')}>How it works</a>
            <a href="#blog" className="nav-link" onClick={(e) => handleNavClick(e, '#blog')}>Blog</a>
            <a href="#faq" className="nav-link" onClick={(e) => handleNavClick(e, '#faq')}>FAQ</a>
          </div>

          <div className="navbar-actions">
            {user && (
              <>
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 7L13 10L8 13V7Z" fill="currentColor" />
                  </svg>
                  Create Room
                </Button>

                <div className="navbar-user-menu" ref={dropdownRef}>
                  <button className="navbar-user-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="navbar-user-avatar">
                      {user.avatar ? (
                        <img src={`${UPLOADS_URL}${user.avatar}`} alt={user.username} />
                      ) : (
                        <FiUser />
                      )}
                    </div>
                    <span className="navbar-username">{user.username}</span>
                    <FiChevronDown className={`navbar-chevron ${isDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="navbar-dropdown">
                      <button className="navbar-dropdown-item" onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }}>
                        <FiSettings /><span>Settings</span>
                      </button>
                      <div className="navbar-dropdown-divider" />
                      <button className="navbar-dropdown-item navbar-dropdown-item-danger" onClick={handleLogout}>
                        <FiLogOut /><span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-left"><Hero /></div>
          <div className="hero-right"><HeroVisual /></div>
        </div>
      </section>

      <div className="section-animate"><Features /></div>
      <div className="section-animate"><HowItWorks /></div>
      <div className="section-animate"><Blog /></div>
      <div className="section-animate"><FAQ /></div>
      <div className="section-animate"><StreamingServices /></div>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;