import { FiClock, FiUser } from 'react-icons/fi';
import './Blog.css';

const Blog = () => {
  const articles = [
    {
      id: 1,
      title: 'The Future of Virtual Watch Parties: Trends to Watch in 2026',
      excerpt: 'Discover how AI, VR, and new streaming technologies are transforming the way we watch content together online.',
      author: 'Sarah Chen',
      date: 'May 15, 2026',
      readTime: '5 min read',
      category: 'Trends',
      gradient: 'linear-gradient(135deg, #5B3DF5, #3B1DC8)',
    },
    {
      id: 2,
      title: 'How to Host the Perfect Movie Night with Friends Online',
      excerpt: 'Tips and tricks for creating an unforgettable virtual cinema experience that your friends will love.',
      author: 'Alex Rivera',
      date: 'May 10, 2026',
      readTime: '7 min read',
      category: 'Guides',
      gradient: 'linear-gradient(135deg, #F54768, #C7385A)',
    },
    {
      id: 3,
      title: 'WebRTC vs Traditional Streaming: What Powers Real-Time Watching',
      excerpt: 'A deep dive into the technology behind synchronized viewing and why latency matters for watch parties.',
      author: 'Marcus Lee',
      date: 'May 5, 2026',
      readTime: '6 min read',
      category: 'Technology',
      gradient: 'linear-gradient(135deg, #43B581, #2D8A5E)',
    },
  ];

  return (
    <section className="blog-section" id="blog">
      <div className="blog-container">
        {/* Section Header */}
        <div className="blog-header">
          <div className="blog-header-top">
            <div className="blog-badge">
              <span className="blog-badge-dot" />
              Blog
            </div>
          </div>
          <h2 className="blog-title">
            Latest from
            <br />
            <span className="blog-title-accent">our blog</span>
          </h2>
          <p className="blog-description">
            Insights, guides, and updates about watch parties, streaming tech, and building better shared experiences.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="blog-grid">
          {articles.map((article, index) => (
            <article 
              key={article.id} 
              className="blog-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image placeholder avec dégradé */}
              <div 
                className="blog-card-image"
                style={{ background: article.gradient }}
              >
                <div className="blog-card-image-overlay">
                  <span className="blog-card-category">{article.category}</span>
                </div>
                {/* Formes décoratives */}
                <div className="blog-card-shapes">
                  <div className="blog-shape shape-1" />
                  <div className="blog-shape shape-2" />
                </div>
              </div>

              {/* Contenu */}
              <div className="blog-card-content">
                <div className="blog-card-meta">
                  <span className="blog-meta-item">
                    <FiUser size={14} />
                    {article.author}
                  </span>
                  <span className="blog-meta-separator">•</span>
                  <span className="blog-meta-item">
                    <FiClock size={14} />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="blog-card-title">
                  {article.title}
                </h3>

                <p className="blog-card-excerpt">{article.excerpt}</p>

                <div className="blog-card-footer">
                  <span className="blog-card-date">{article.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;