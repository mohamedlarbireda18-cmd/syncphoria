import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || 'your email';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/verify-email', { email, code });
      
      // ✅ Un seul toast avec ID unique pour éviter les doublons
      toast.success('You can now sign in .', {
        id: 'verify-success',
        duration: 5000,
      });
      navigate('/login', { state: { email, justVerified: true } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-bg">
        <div className="verify-bg-orb verify-bg-orb-1" />
        <div className="verify-bg-orb verify-bg-orb-2" />
      </div>

      <div className="verify-container">
        <Link to="/register" className="verify-back">
          <FiArrowLeft /> Back to sign up
        </Link>

        <div className="verify-card">
          <div className="verify-icon-wrapper">
            <FiMail className="verify-icon" />
          </div>
          
          <h1 className="verify-title">Check your email</h1>
          <p className="verify-description">
            We sent a 6-digit verification code to <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} className="verify-form">
            <div className="verify-input-group">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="verify-input"
                autoFocus
              />
            </div>

            <button type="submit" className="verify-btn" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>Verifying...</>
              ) : (
                <>Verify Email <FiArrowRight /></>
              )}
            </button>
          </form>

          <p className="verify-resend">
            Didn't receive the code?{' '}
            <button className="verify-resend-btn" onClick={() => toast.success('Code resent!')}>
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;