import React, { useEffect } from 'react';
import Script from 'next/script';

interface InstagramEmbedProps {
  /**
   * Full URL of the Instagram post, e.g. https://www.instagram.com/p/POST_ID/
   */
  postUrl: string;
}

/**
 * InstagramEmbed renders the official Instagram embed for a public post.
 * It uses the <blockquote className="instagram-media"> snippet and loads the
 * Instagram embed script via Next.js <Script>.
 *
 * The component ensures the script is only added once per page.
 */
const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ postUrl }) => {
  useEffect(() => {
    // Ensure the Instagram embed script is present.
    const existingScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    const ensureProcessEmbeds = () => {
      if ((window as any).instgrm && (window as any).instgrm.Embeds && typeof (window as any).instgrm.Embeds.process === 'function') {
        (window as any).instgrm.Embeds.process();
      }
    };
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
      script.addEventListener('load', ensureProcessEmbeds);
      return () => script.removeEventListener('load', ensureProcessEmbeds);
    } else {
      // Script already present, process immediately
      ensureProcessEmbeds();
    }
  }, []);

  useEffect(() => {
    if ((window as any).instgrm && (window as any).instgrm.Embeds && typeof (window as any).instgrm.Embeds.process === 'function') {
      (window as any).instgrm.Embeds.process();
    }
  }, [postUrl]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={postUrl}
      data-instgrm-version="14"
      style={{
        background: '#FFF',
        border: 0,
        margin: '1rem 0',
        maxWidth: '540px',
        minWidth: '326px',
        padding: 0,
        width: '99.375%',
      }}
    ></blockquote>
  );
};

export default InstagramEmbed;
