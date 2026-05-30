import './Avatar.css';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  isHost?: boolean;
  isActive?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isHost = false,
  isActive = false,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`avatar-wrapper avatar-${size} ${isActive ? 'avatar-active' : ''}`}>
      <div className="avatar">
        {src ? (
          <img src={src} alt={name} className="avatar-img" />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
        {isHost && <span className="host-badge">HOST</span>}
      </div>
    </div>
  );
};

export default Avatar;