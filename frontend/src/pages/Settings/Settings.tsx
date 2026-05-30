import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiCamera, FiArrowLeft, FiSave, FiEye, FiEyeOff, FiX, FiCheck, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { authService } from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { UPLOADS_URL } from '../../config';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { setUser: setStoreUser, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'password' | 'countdown' | 'deleting'>('idle');
  const [countdown, setCountdown] = useState(10);

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authService.getProfile();
        const u = res.data.user;
        setUsername(u.username);
        setEmail(u.email);
        setAvatarPreview(u.avatar ? `${UPLOADS_URL}${u.avatar}` : null);
      } catch {
        toast.error('Failed to load profile');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setShowCropper(true);
      setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setImgElement(e.currentTarget);
  }, []);

  const getCroppedImg = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!completedCrop || !imgElement) { reject(new Error('No crop data')); return; }
      const image = imgElement;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No 2d context')); return; }
      ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas is empty')); return; }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop, imgElement]);

  const handleCropAndUpload = async () => {
    try {
      const blob = await getCroppedImg();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const res = await authService.uploadAvatar(file);
      const updatedUser = res.data.user;
      setAvatarPreview(`${UPLOADS_URL}${updatedUser.avatar}`);
      setStoreUser(updatedUser);
      setShowCropper(false);
      setCropImage(null);
      setImgElement(null);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile({ username, email });
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('Both fields required');
    setIsSaving(true);
    try {
      await authService.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep('password');
    setDeletePassword('');
    setCountdown(10);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep('idle');
    setDeletePassword('');
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleVerifyPassword = async () => {
    if (!deletePassword) { toast.error('Please enter your password'); return; }
    try {
      await authService.login({ email, password: deletePassword });
      setDeleteStep('countdown');
      startCountdown();
    } catch (err: any) {
      toast.error('Incorrect password');
    }
  };

  const startCountdown = () => {
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleDeleteNow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDeleteNow = async () => {
    setDeleteStep('deleting');
    try {
      await authService.deleteAccount();
      logout();
      navigate('/');
      toast.success('Account deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setDeleteStep('idle');
    }
  };

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setDeleteStep('idle');
    setDeletePassword('');
    setShowDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div className="settings-page">
        <div className="settings-loading"><div className="settings-spinner" /><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-bg">
        <div className="settings-bg-orb settings-bg-orb-1" />
        <div className="settings-bg-orb settings-bg-orb-2" />
        <div className="settings-bg-grid" />
      </div>

      {showCropper && cropImage && (
        <div className="crop-modal-overlay" onClick={() => setShowCropper(false)}>
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crop-modal-header">
              <h3>Crop your photo</h3>
              <button className="crop-modal-close" onClick={() => setShowCropper(false)}><FiX /></button>
            </div>
            <div className="crop-container">
              <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1} circularCrop>
                <img src={cropImage} onLoad={onImageLoad} alt="Crop" className="crop-image" />
              </ReactCrop>
            </div>
            <div className="crop-modal-actions">
              <button className="crop-cancel-btn" onClick={() => setShowCropper(false)}>Cancel</button>
              <button className="crop-save-btn" onClick={handleCropAndUpload}><FiCheck /> Save</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={closeDeleteModal}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <Toaster position="top-center" containerStyle={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }} toastOptions={{ duration: 3000, style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(240, 71, 71, 0.4)', borderRadius: '12px', fontSize: '14px', maxWidth: '400px' } }} />
            <div className="delete-modal-header">
              <FiAlertTriangle className="delete-modal-icon" />
              <h2>Delete Account</h2>
            </div>
            <div className="delete-modal-body">
              {deleteStep === 'password' && (
                <>
                  <p className="delete-modal-warning">This action is <strong>irreversible</strong>. All your data, rooms, and messages will be permanently deleted.</p>
                  <div className="settings-form-group">
                    <label>Enter your password to continue</label>
                    <div className="settings-input-wrapper">
                      <input type={showDeletePassword ? 'text' : 'password'} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Your password" autoFocus />
                      <button className="settings-input-toggle" onClick={() => setShowDeletePassword(!showDeletePassword)}>{showDeletePassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>
                  </div>
                  <div className="delete-modal-actions">
                    <button className="crop-cancel-btn" onClick={closeDeleteModal}>Cancel</button>
                    <button className="delete-btn-danger" onClick={handleVerifyPassword} disabled={!deletePassword}>Continue</button>
                  </div>
                </>
              )}
              {deleteStep === 'countdown' && (
                <div className="delete-countdown-container">
                  <p className="delete-modal-warning">Your account will be deleted in:</p>
                  <div className="delete-countdown-circle">
                    <span className="delete-countdown-number">{countdown}</span>
                    <span className="delete-countdown-label">seconds</span>
                  </div>
                  <div className="delete-modal-actions">
                    <button className="delete-btn-cancel-countdown" onClick={cancelCountdown}>Cancel</button>
                  </div>
                </div>
              )}
              {deleteStep === 'deleting' && (
                <div className="delete-countdown-container">
                  <div className="settings-spinner" />
                  <p className="delete-modal-warning">Deleting your account...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="settings-container">
        <div className="settings-header">
          <button className="settings-back-btn" onClick={() => navigate('/dashboard')}><FiArrowLeft /> Back</button>
          <h1 className="settings-title">Settings</h1>
        </div>

        <div className="settings-top-row">
          <div className="settings-avatar-card">
            <div className="settings-avatar-preview" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <FiUser className="settings-avatar-placeholder" />}
              <div className="settings-avatar-overlay"><FiCamera /><span>Change</span></div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelectFile} hidden />
            <p className="settings-avatar-hint">Click to change</p>
          </div>

          <div className="settings-card-compact">
            <h3><FiUser /> Profile</h3>
            <div className="settings-form-group"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} /></div>
            <div className="settings-form-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <button className="settings-save-btn-sm" onClick={handleUpdateProfile} disabled={isSaving}><FiSave /> {isSaving ? 'Saving...' : 'Save'}</button>
          </div>

          <div className="settings-card-compact">
            <h3><FiLock /> Password</h3>
            <div className="settings-form-group">
              <label>Current</label>
              <div className="settings-input-wrapper">
                <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                <button className="settings-input-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>
            <div className="settings-form-group">
              <label>New</label>
              <div className="settings-input-wrapper">
                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <button className="settings-input-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <FiEyeOff /> : <FiEye />}</button>
              </div>
            </div>
            <button className="settings-save-btn-sm settings-password-btn" onClick={handleUpdatePassword} disabled={isSaving}><FiLock /> {isSaving ? 'Updating...' : 'Update'}</button>
          </div>
        </div>

        <div className="settings-card-compact settings-delete-card">
          <h3><FiTrash2 /> Danger Zone</h3>
          <p className="settings-delete-warning">Once deleted, there is no going back.</p>
          <button className="settings-save-btn-sm settings-delete-btn" onClick={openDeleteModal}><FiTrash2 /> Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;