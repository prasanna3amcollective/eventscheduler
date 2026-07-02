import React from 'react';

// Faces
export const FaceRed = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} width="100%" height="100%">
        <path d="M10,50 C10,20 30,10 60,15 C85,20 95,45 85,75 C75,95 30,95 15,80 C5,65 10,50 10,50 Z" fill="#e63946" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="35" cy="45" r="8" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="35" cy="45" r="3" fill="#1a1a1a" />
        <circle cx="65" cy="40" r="10" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="65" cy="40" r="4" fill="#1a1a1a" />
        <path d="M40,70 Q50,85 65,70" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M50,45 Q45,60 55,60" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const FaceBlue = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className} width="100%" height="100%">
        <path d="M25,10 C50,-5 80,10 85,40 C90,80 70,110 40,115 C10,120 5,80 10,40 C15,10 25,10 25,10 Z" fill="#457b9d" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="35" cy="55" rx="8" ry="16" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="35" cy="60" r="4" fill="#1a1a1a" />
        <ellipse cx="65" cy="55" rx="8" ry="16" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="65" cy="60" r="4" fill="#1a1a1a" />
        <path d="M40,90 Q50,85 60,90" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M50,55 L50,80" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <path d="M30,30 Q35,20 45,25" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M60,25 Q70,20 75,30" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const FaceYellow = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 90" className={className} width="100%" height="100%">
        <path d="M10,45 C10,15 40,5 80,10 C110,15 115,50 100,75 C80,100 20,95 10,65 Z" fill="#f4a261" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="40" cy="40" r="14" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M35,40 L45,40 M40,35 L40,45" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="40" r="14" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M75,40 L85,40 M80,35 L80,45" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M50,70 C55,85 65,85 70,70 Z" fill="#1a1a1a" />
    </svg>
);

export const FaceGreen = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 110 80" className={className} width="100%" height="100%">
        <path d="M15,40 C5,15 30,10 60,10 C90,10 105,25 100,55 C95,85 30,85 15,65 C5,55 15,40 15,40 Z" fill="#8bc34a" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <line x1="30" y1="35" x2="50" y2="35" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="42" r="3" fill="#1a1a1a" />
        <line x1="70" y1="35" x2="90" y2="35" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="80" cy="42" r="3" fill="#1a1a1a" />
        <line x1="45" y1="65" x2="75" y2="65" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const FacePurple = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 90 110" className={className} width="100%" height="100%">
        <path d="M20,10 C60,-10 85,20 80,60 C75,90 40,115 15,90 C-10,65 10,20 20,10 Z" fill="#9c27b0" stroke="#1a1a1a" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="35" cy="40" r="12" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="35" cy="40" r="4" fill="#1a1a1a" />
        <circle cx="65" cy="55" r="10" fill="#fdf8eb" stroke="#1a1a1a" strokeWidth="2" />
        <circle cx="65" cy="55" r="3" fill="#1a1a1a" />
        <path d="M45,75 Q55,85 65,70" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M45,50 L55,60" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// People
export const PersonOrange = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className} width="100%" height="100%">
        <circle cx="50" cy="20" r="12" fill="#f25f5c" stroke="#1a1a1a" strokeWidth="3" />
        <path d="M50,32 C45,50 35,60 25,65 L10,60 M50,32 C65,40 85,35 90,45 L85,60" fill="none" stroke="#f25f5c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,32 C45,50 35,60 25,65 L10,60 M50,32 C65,40 85,35 90,45 L85,60" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45,60 L35,100 L20,105 M55,60 L65,100 L80,105" fill="none" stroke="#f25f5c" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45,60 L35,100 L20,105 M55,60 L65,100 L80,105" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,32 L45,60 L55,60 Z" fill="#f25f5c" />
    </svg>
);

export const PersonBlue = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 120" className={className} width="100%" height="100%">
        <circle cx="60" cy="20" r="12" fill="#2a9d8f" stroke="#1a1a1a" strokeWidth="3" />
        <path d="M60,32 L40,50 L20,40 M60,32 L80,50 L100,40" fill="none" stroke="#2a9d8f" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60,32 L40,50 L20,40 M60,32 L80,50 L100,40" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60,60 L60,90 L40,110 M60,60 L60,90 L80,110" fill="none" stroke="#2a9d8f" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M60,60 L60,90 L40,110 M60,60 L60,90 L80,110" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M55,32 L55,65 L65,65 L65,32 Z" fill="#2a9d8f" />
    </svg>
);

export const PersonYellow = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className} width="100%" height="100%">
        <circle cx="50" cy="95" r="12" fill="#e9c46a" stroke="#1a1a1a" strokeWidth="3" />
        <path d="M50,83 L30,50 L15,60 M50,83 L70,50 L85,60" fill="none" stroke="#e9c46a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,83 L30,50 L15,60 M50,83 L70,50 L85,60" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,60 L50,30 L30,15 M50,60 L50,30 L70,15" fill="none" stroke="#e9c46a" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,60 L50,30 L30,15 M50,60 L50,30 L70,15" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M45,85 L45,55 L55,55 L55,85 Z" fill="#e9c46a" />
    </svg>
);

export const PersonPurple = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 120 100" className={className} width="100%" height="100%">
        <circle cx="85" cy="30" r="12" fill="#9c27b0" stroke="#1a1a1a" strokeWidth="3" />
        <path d="M73,35 C50,45 40,55 30,70 L15,65 M73,35 C80,55 95,65 105,75" fill="none" stroke="#9c27b0" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M73,35 C50,45 40,55 30,70 L15,65 M73,35 C80,55 95,65 105,75" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,65 L30,90 M70,55 L80,95 L95,90" fill="none" stroke="#9c27b0" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50,65 L30,90 M70,55 L80,95 L95,90" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M73,35 L45,65 L60,65 Z" fill="#9c27b0" />
    </svg>
);
