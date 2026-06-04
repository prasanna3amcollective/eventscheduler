import { useState, useEffect } from 'react';
import { logoFiles } from '../lib/logos';

export default function MarqueeBanner() {
  const [logoSrc, setLogoSrc] = useState<string>('');
  useEffect(() => {
    const randomLogo = logoFiles[Math.floor(Math.random() * logoFiles.length)];
    setLogoSrc(randomLogo);
  }, []);

  return (
    <div className="marquee-banner">
      <div className="banner-content">
        {logoSrc && <img src={logoSrc} alt="" className="center-fist" aria-hidden="true" style={{ width: "82px", height: "82px" }} />}
        <span className="banner-text text-white font-['Space_Mono'] font-bold">3AM</span>
        <span className="banner-text text-white font-['Space_Mono'] font-bold">COLLECTIVE</span>
        <span className="banner-text text-white font-['Space_Mono'] font-bold">MOVEMENT</span>
      </div>
    </div>
  );
}
