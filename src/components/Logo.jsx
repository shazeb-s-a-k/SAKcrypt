import React from 'react';

const Logo = ({ className = '', size = 24 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    className={className}
    fill="none"
  >
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a88bff" />
        <stop offset="50%" stopColor="#ff8bca" />
        <stop offset="100%" stopColor="#5e6ad2" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Outer Hexagon Shield */}
    <path 
      d="M50 8 L90 30 V70 L50 92 L10 70 V30 Z" 
      stroke="url(#logo-grad)" 
      strokeWidth="8" 
      strokeLinejoin="round"
      filter="url(#glow)"
    />
    
    {/* Inner 'S' Geometry */}
    <path 
      d="M70 38 L30 38 L30 50 L70 50 L70 62 L30 62" 
      stroke="url(#logo-grad)" 
      strokeWidth="8" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
