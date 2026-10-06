import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Copy } from 'lucide-react';
import ToolHeader from '../../components/ToolHeader';
import { useToast } from '../../components/ToastProvider';
import { useSupport } from '../../components/SupportProvider';

const MetaTagGenerator = () => {
  const [data, setData] = useState({
    title: 'My Awesome Site',
    description: 'This is a description of my site.',
    keywords: 'web, design, development',
    author: 'John Doe',
    url: 'https://example.com',
    image: 'https://example.com/og-image.jpg',
    themeColor: '#000000',
    twitterHandle: '@johndoe'
  });

  const showToast = useToast();
  const showSupport = useSupport();

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const generateTags = () => {
    return `<!-- Primary Meta Tags -->
<title>${data.title}</title>
<meta name="title" content="${data.title}">
<meta name="description" content="${data.description}">
<meta name="keywords" content="${data.keywords}">
<meta name="author" content="${data.author}">
<meta name="theme-color" content="${data.themeColor}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${data.url}">
<meta property="og:title" content="${data.title}">
<meta property="og:description" content="${data.description}">
<meta property="og:image" content="${data.image}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${data.url}">
<meta property="twitter:title" content="${data.title}">
<meta property="twitter:description" content="${data.description}">
<meta property="twitter:image" content="${data.image}">
${data.twitterHandle ? `<meta name="twitter:creator" content="${data.twitterHandle}">` : ''}`.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateTags());
    showToast('Meta tags copied!', 'success');
    setTimeout(showSupport, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container animate-float"
    >
      <ToolHeader title="Meta Tag Generator" subtitle="Generate perfect SEO meta tags and social media cards for any website" />

      <div className="glass-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Site Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Site Title</label>
              <input type="text" className="input-glass" name="title" value={data.title} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Site Description</label>
              <textarea className="textarea-glass" name="description" value={data.description} onChange={handleChange} style={{ minHeight: '80px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Keywords (Comma separated)</label>
              <input type="text" className="input-glass" name="keywords" value={data.keywords} onChange={handleChange} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Author</label>
                <input type="text" className="input-glass" name="author" value={data.author} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Theme Color</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="color" name="themeColor" value={data.themeColor} onChange={handleChange} style={{ height: '40px', width: '40px', padding: '0', border: 'none', borderRadius: '4px', background: 'transparent' }} />
                  <input type="text" className="input-glass" name="themeColor" value={data.themeColor} onChange={handleChange} style={{ flex: 1 }} />
                </div>
              </div>
            </div>

            <h3 style={{ color: 'var(--primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Social Media</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Site URL</label>
              <input type="text" className="input-glass" name="url" value={data.url} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Social Card Image URL</label>
              <input type="text" className="input-glass" name="image" value={data.image} onChange={handleChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Twitter Handle</label>
              <input type="text" className="input-glass" name="twitterHandle" value={data.twitterHandle} onChange={handleChange} />
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0 }}>Generated HTML</h3>
              <button className="btn-primary" onClick={handleCopy} style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border)' }}>
                <Copy size={16} /> Copy HTML
              </button>
            </div>
            
            <textarea 
              className="textarea-glass"
              value={generateTags()}
              readOnly
              style={{ flex: 1, minHeight: '400px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--secondary)', background: 'rgba(0,0,0,0.3)' }}
            />
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default MetaTagGenerator;
