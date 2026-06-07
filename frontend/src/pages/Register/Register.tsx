import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { SiGoogle, SiGithub } from 'react-icons/si';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import { API_URL } from '../../config';
import { authService } from '../../services/api';
import logoImage from '../../assets/logo.png';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = { username: '', email: '', password: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      await emailjs.send(
        'service_8kep0pb',
        'template_52vaxo1',
        {
          to_name: formData.username,
          code: response.data.verificationCode,
          to_email: formData.email,
        },
        '5QZURc_xkSieUNWvs'
      );

      toast.success('Check your email for the verification code!');
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className="register-page">
      <div className="register-bg">
        <div className="register-bg-orb register-bg-orb-1" />
        <div className="register-bg-orb register-bg-orb-2" />
        <div className="register-bg-orb register-bg-orb-3" />
        <div className="register-bg-grid" />
      </div>

      <div className="register-container">
        <div className="register-brand">
          <Link to="/" className="register-logo">
            <img src={logoImage} alt="Syncphoria" className="register-logo-img" />
            <span className="register-logo-text">syncphoria</span>
          </Link>
          
          <div className="register-brand-content">
            <h1 className="register-brand-title">
              Start watching<br />
              <span className="register-brand-accent">together</span>
            </h1>
            <p className="register-brand-description">
              Create your free account and start hosting watch parties in seconds. No credit card required.
            </p>
          </div>

          <div className="register-brand-features">
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>Free unlimited rooms</span></div>
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>HD screen sharing</span></div>
            <div className="brand-feature"><span className="brand-feature-check">✓</span><span>Real-time chat</span></div>
          </div>
        </div>

        <div className="register-form-side">
          <div className="register-form-card">
            <div className="register-form-header">
              <h2>Create your account</h2>
              <p>Already have an account? <Link to="/login" className="register-link">Sign in</Link></p>
            </div>

            <div className="register-social">
              <button className="social-btn" type="button" onClick={handleGoogleLogin}>
                <SiGoogle />
                <span>Google</span>
              </button>
              <button className="social-btn" type="button">
                <SiGithub />
                <span>GitHub</span>
              </button>
            </div>

            <div className="register-divider"><span>or continue with email</span></div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group-register">
                <label htmlFor="username" className="form-label-register">Username</label>
                <div className="form-input-wrapper">
                  <FiUser className="form-input-icon" />
                  <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" className={`form-input-register ${errors.username ? 'input-error' : ''}`} />
                </div>
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>

              <div className="form-group-register">
                <label htmlFor="email" className="form-label-register">Email</label>
                <div className="form-input-wrapper">
                  <FiMail className="form-input-icon" />
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className={`form-input-register ${errors.email ? 'input-error' : ''}`} />
                </div>
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              <div className="form-group-register">
                <label htmlFor="password" className="form-label-register">Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-input-icon" />
                  <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" className={`form-input-register ${errors.password ? 'input-error' : ''}`} />
                  <button type="button" className="form-input-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>

              <div className="form-group-register">
                <label htmlFor="confirmPassword" className="form-label-register">Confirm Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-input-icon" />
                  <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className={`form-input-register ${errors.confirmPassword ? 'input-error' : ''}`} />
                  <button type="button" className="form-input-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FiEyeOff /> : <FiEye />}</button>
                </div>
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="register-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="register-spinner" />Creating account...</>
                ) : (
                  <>Create Account<FiArrowRight /></>
                )}
              </button>
            </form>

            <p className="register-terms">
              By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;