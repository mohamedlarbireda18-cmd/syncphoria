import { useState, useRef } from 'react';
import { FiPlus, FiMinus, FiSend, FiMail, FiX, FiGlobe } from 'react-icons/fi';
import { SiGmail } from 'react-icons/si';
import emailjs from '@emailjs/browser';
import toast from 'react-hot-toast';
import './FAQ.css';

// Configuration EmailJS
const EMAILJS_SERVICE_ID = 'service_8kep0pb';
const EMAILJS_TEMPLATE_ID = 'template_a5wmlzt';
const EMAILJS_PUBLIC_KEY = '5QZURc_xkSieUNWvs';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: name,
          from_email: email,
          message: message,
          to_email: 'ewatchpartyversion1@gmail.com',
        },
        EMAILJS_PUBLIC_KEY
      );

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      formRef.current.reset();
    } catch (error) {
      console.error('EmailJS error:', error);
      toast.error('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEmailClient = (service: 'gmail' | 'outlook' | 'default') => {
    const email = 'ewatchpartyversion1@gmail.com';
    const subject = 'Syncphoria - Contact';
    
    let url = '';
    switch (service) {
      case 'gmail':
        url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}`;
        break;
      case 'outlook':
        url = `https://outlook.live.com/mail/0/deeplink/compose?to=${email}&subject=${encodeURIComponent(subject)}`;
        break;
      default:
        url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    }
    
    window.open(url, '_blank');
    setShowEmailModal(false);
  };

  const faqs = [
    {
      question: 'How many people can join a watch party?',
      answer: 'Syncphoria is optimized for small groups of 2-3 people for the best experience. This ensures minimal latency and crystal-clear streaming quality for everyone in the room.',
    },
    {
      question: 'Do I need to install anything to use Syncphoria?',
      answer: 'No installations required! Syncphoria works directly in your browser. Just create an account, start a room, and share the link with your friends.',
    },
    {
      question: 'Is my watch party private and secure?',
      answer: 'Absolutely. All rooms are private and can only be accessed with a unique room code. We use WebRTC with end-to-end encryption for all peer-to-peer connections.',
    },
    {
      question: 'What streaming services can I watch together?',
      answer: 'You can share any browser tab or application window. Netflix, Disney+, HBO Max, YouTube, Prime Video, Hulu, and any other streaming platform works perfectly.',
    },
    {
      question: 'Is there a limit to how long we can watch?',
      answer: 'No time limits! Watch for as long as you want. There are no restrictions on room duration during the beta period.',
    },
  ];

  return (
    <section className="faq-contact-section" id="faq">
      <div className="faq-contact-container">
        {/* Section Header */}
        <div className="faq-contact-header">
          <div className="faq-contact-badge">
            <span className="faq-contact-badge-dot" />
            Support
          </div>
          <h2 className="faq-contact-title">
            Frequently asked
            <br />
            <span className="faq-contact-title-accent">questions</span>
          </h2>
          <p className="faq-contact-description">
            Everything you need to know about Syncphoria. Can't find what you're looking for? Send us a message.
          </p>
        </div>

        {/* Grid FAQ + Contact */}
        <div className="faq-contact-grid">
          {/* Left - FAQ */}
          <div className="faq-list-wrapper">
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${openIndex === index ? 'faq-item-open' : ''}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={openIndex === index}
                  >
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-icon">
                      {openIndex === index ? <FiMinus /> : <FiPlus />}
                    </span>
                  </button>
                  <div 
                    className="faq-answer-wrapper"
                    style={{
                      maxHeight: openIndex === index ? '200px' : '0',
                      opacity: openIndex === index ? 1 : 0,
                    }}
                  >
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Contact Form */}
          <div className="contact-form-wrapper">
            <div className="contact-form-card">
              <h3 className="contact-form-title">Send us a message</h3>
              <p className="contact-form-subtitle">We'll get back to you within 24 hours.</p>

              <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us what's on your mind..."
                    className="form-textarea"
                    rows={5}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="form-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="form-loading-spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Send Message
                    </>
                  )}
                </button>
              </form>

              <div className="contact-alt">
                <span className="contact-alt-text">Or email us directly at</span>
                <button 
                  className="contact-alt-button"
                  onClick={() => setShowEmailModal(true)}
                >
                  <FiMail />
                  ewatchpartyversion1@gmail.com
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="email-modal-close"
              onClick={() => setShowEmailModal(false)}
            >
              <FiX />
            </button>
            
            <h3 className="email-modal-title">Choose your email service</h3>
            <p className="email-modal-subtitle">
              Open with your preferred email client
            </p>

            <div className="email-modal-options">
              <button 
                className="email-option"
                onClick={() => openEmailClient('gmail')}
              >
                <div className="email-option-icon gmail">
                  <SiGmail />
                </div>
                <div className="email-option-info">
                  <span className="email-option-name">Gmail</span>
                  <span className="email-option-desc">Open in Gmail</span>
                </div>
              </button>

              <button 
                className="email-option"
                onClick={() => openEmailClient('outlook')}
              >
                <div className="email-option-icon outlook">
                  <FiMail />
                </div>
                <div className="email-option-info">
                  <span className="email-option-name">Outlook</span>
                  <span className="email-option-desc">Open in Outlook</span>
                </div>
              </button>

              <button 
                className="email-option"
                onClick={() => openEmailClient('default')}
              >
                <div className="email-option-icon default">
                  <FiGlobe />
                </div>
                <div className="email-option-info">
                  <span className="email-option-name">Default</span>
                  <span className="email-option-desc">Open in default app</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FAQ;