import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend } from 'react-icons/fi';
import { UPLOADS_URL } from '../../config';
import './Chat.css';

interface Message {
  username: string;
  message: string;
  avatar?: string;
  timestamp: string;
}

interface ChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentUser: any;
}

const EMOJIS = ['😂', '🔥', '😱', '👏', '🤣', '😊'];

const Chat = ({ messages, onSendMessage, currentUser }: ChatProps) => {
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLength = useRef(messages.length);

  // Vérifier si on est en bas du scroll
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 50;
    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(isBottom);
  }, []);

  // Scroll to bottom (dans le container uniquement)
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Scroller en bas si on est déjà en bas
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Scroll initial
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Écouter le scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', checkIfAtBottom);
    return () => container.removeEventListener('scroll', checkIfAtBottom);
  }, [checkIfAtBottom]);

  const handleAddEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    setIsAtBottom(true);
    setTimeout(scrollToBottom, 100);
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-message ${msg.username === currentUser?.username ? 'own' : ''}`}
          >
            {msg.username !== currentUser?.username && (
              <div className="chat-avatar">
                {msg.avatar ? (
                  <img src={`http://localhost:5000${msg.avatar}`} alt="" />
                ) : (
                  <div className="chat-avatar-placeholder">{msg.username[0]?.toUpperCase()}</div>
                )}
              </div>
            )}
            <div className="chat-bubble">
              <span className="chat-username">{msg.username}</span>
              <p className="chat-text">{msg.message}</p>
              <span className="chat-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-panel">
        <div className="chat-emoji-toolbar">
          {EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className="emoji-button"
              onClick={() => handleAddEmoji(emoji)}
              aria-label={`Add ${emoji} emoji`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;