import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import Button from '../common/Button/Button';
import { useAuthStore } from '../../store/authStore';
import logoImage from '../../assets/logo.png';
import './Navbar.css';

interface NavbarProps {
  isAuthenticated?: boolean;
  user?: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
    createdAt?: string;
  } | null;
}

const Navbar = ({ isAuthenticated = false, user = null }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHomePage = location.pathname === '/' || location.pathname === '/dashboard';

  const handleNavClick = (e: React.MouseEvent, sectionId: string) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.querySelector(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <a href="/" className="navbar-logo" onClick={scrollToTop}>
          <img src={logoImage} alt="Syncphoria" className="logo-image" />
          <span className="logo-text">syncphoria</span>
        </a>

        {/* Navigation Links */}
        <div className="navbar-links">
          <a
            href={isHomePage ? '#home' : '/'}
            className="nav-link"
            onClick={(e) => isHomePage ? scrollToTop(e) : null}
          >
            Home
          </a>
          <a href="#features" className="nav-link" onClick={(e) => handleNavClick(e, '#features')}>
            Features
          </a>
          <a href="#how-it-works" className="nav-link" onClick={(e) => handleNavClick(e, '#how-it-works')}>
            How it works
          </a>
          <a href="#blog" className="nav-link" onClick={(e) => handleNavClick(e, '#blog')}>
            Blog
          </a>
          <a href="#faq" className="nav-link" onClick={(e) => handleNavClick(e, '#faq')}>
            FAQ
          </a>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <>
              <Button variant="primary" size="sm" onClick={() => navigate('/room/create')}>
                + Create Room
              </Button>

              <div className="navbar-user-menu" ref={dropdownRef}>
                <button
                  className="navbar-user-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <div className="navbar-user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} />
                    ) : (
                      <FiUser />
                    )}
                  </div>
                  <span className="navbar-username">{user.username}</span>
                  <FiChevronDown className={`navbar-chevron ${isDropdownOpen ? 'open' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="navbar-dropdown">
                    <button
                      className="navbar-dropdown-item"
                      onClick={() => {
                        navigate('/settings');
                        setIsDropdownOpen(false);
                      }}
                    >
                      <FiSettings />
                      <span>Settings</span>
                    </button>
                    <div className="navbar-dropdown-divider" />
                    <button
                      className="navbar-dropdown-item navbar-dropdown-item-danger"
                      onClick={handleLogout}
                    >
                      <FiLogOut />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;