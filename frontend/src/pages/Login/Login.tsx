import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { SiGoogle, SiGithub } from 'react-icons/si';
import toast from 'react-hot-toast';
import { authService } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import logoImage from '../../assets/logo.png';
import { API_URL } from '../../config';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  // ✅ Pré-remplit l'email si l'utilisateur vient de vérifier son email
  useEffect(() => {
    const state = location.state as { email?: string; justVerified?: boolean } | null;
    if (state?.justVerified && state?.email) {
      setFormData(prev => ({ ...prev, email: state.email! }));
      // ✅ ID unique pour éviter les doublons (StrictMode)
      toast.success('Email verified! ', {
        id: 'email-verified',
        duration: 3000,
      });
      // Nettoie le state pour ne pas réafficher au refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;
  setIsLoading(true);

  try {
    const response = await authService.login({
      email: formData.email,
      password: formData.password,
    });

    const { token, user } = response.data;

    // ✅ Stocke le token
    localStorage.setItem('token', token);

    // ✅ Met à jour le store
    useAuthStore.setState({
      user: user,
      token: token,
      isAuthenticated: true,
    });

    toast.success(`Welcome back, ${user.username}! 🎉`);
    
   
    setTimeout(() => {
      navigate('/dashboard');
    }, 100);
  } catch (error: any) {
    const message = error.response?.data?.message || 'Invalid email or password';
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <Link to="/" className="login-logo">
            <img src={logoImage} alt="Syncphoria" className="login-logo-img" />
            <span className="login-logo-text">syncphoria</span>
          </Link>

          <div className="login-brand-content">
            <h1 className="login-brand-title">
              Welcome<br />
              <span className="login-brand-accent">back</span>
            </h1>
            <p className="login-brand-description">
              Pick up right where you left off. Your watch parties are waiting for you.
            </p>
          </div>

          <div className="login-brand-features">
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>Resume your rooms</span></div>
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>Continue conversations</span></div>
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>Invite more friends</span></div>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-card">
            <div className="login-form-header">
              <h2>Sign in to your account</h2>
              <p>Don't have an account? <Link to="/register" className="login-link">Create one</Link></p>
            </div>

            <div className="login-social">
              <button className="social-btn" type="button" onClick={handleGoogleLogin}>
                <SiGoogle />
                <span>Google</span>
              </button>
              <button className="social-btn" type="button">
                <SiGithub />
                <span>GitHub</span>
              </button>
            </div>

            <div className="login-divider"><span>or continue with email</span></div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group-login">
                <label htmlFor="email" className="form-label-login">Email</label>
                <div className="form-input-wrapper">
                  <FiMail className="form-input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`form-input-login ${errors.email ? 'input-error' : ''}`}
                  />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group-login">
                <label htmlFor="password" className="form-label-login">Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`form-input-login ${errors.password ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="login-forgot">
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot your password?
                </Link>
              </div>

              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="login-spinner" />Signing in...</>
                ) : (
                  <>Sign In<FiArrowRight /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;