'use client';

import { useState, useEffect, useRef } from 'react';
import './BannerSlideshow_mobile.css';

export default function BannerSlideshow_mobile() {
  const banners = [
    { 
      id: 1, 
      title: 'CREATORS COLLECTIVE', 
      subtitle: 'Join our next meetup', 
      bgClass: 'banner-bg-cyan' 
    },
    { 
      id: 2, 
      title: 'FILM SCREENING', 
      subtitle: 'This Friday at 8PM', 
      bgClass: 'banner-bg-magenta' 
    },
    { 
      id: 3, 
      title: 'WORKSHOP', 
      subtitle: 'Learn cinematography', 
      bgClass: 'banner-bg-yellow' 
    }
  ];

  return (
    <div className="banner-slideshow-mobile-container">
      <div className="banner-slideshow-mobile-track">
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className={`banner-slideshow-mobile-slide ${banner.bgClass}`}
          >
            <div className="banner-slide-content">
              <h2>{banner.title}</h2>
              <p>{banner.subtitle}</p>
            </div>
            <div className="banner-slide-deco-star"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
