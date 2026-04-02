import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-body">
      <div className="container">
        
        {/* Left Side: Dynamic Forms (Login/ForgotPassword) render here via Outlet */}
        <div className="login-section">
          <div className="logo">
            <div className="logo-icon">WW</div>
            <div className="logo-text">WriteWisely</div>
          </div>
          <Outlet />
        </div>

        {/* Right Side: Enhanced Premium Illustration Panel */}
        <div className="preview-section">
          {/* Decorative floating blur circles in background */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '150px', height: '150px', background: 'rgba(255,192,203,0.3)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '200px', height: '200px', background: 'rgba(108,92,231,0.2)', borderRadius: '50%', filter: 'blur(50px)' }}></div>
          <div style={{ position: 'absolute', top: '40%', right: '5%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', filter: 'blur(30px)' }}></div>

          {/* Central Illustration Container */}
          <div style={{ position: 'relative', width: '80%', height: '80%', zIndex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              {/* Definitions for Gradients and Shadows */}
              <defs>
                <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8C7DFF" />
                  <stop offset="100%" stopColor="#5A4BCC" />
                </linearGradient>
                <linearGradient id="secondary-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FEA4B0" />
                  <stop offset="100%" stopColor="#FFC8CD" />
                </linearGradient>
                <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
                </linearGradient>
                <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="8" stdDeviation="15" floodOpacity="0.15" />
                </filter>
                <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="12" stdDeviation="20" floodColor="#6C5CE7" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Background Geometric Shapes (Floating) */}
              <g className="anim-float-3" opacity="0.6">
                <circle cx="90" cy="120" r="35" fill="url(#secondary-grad)" filter="url(#soft-shadow)" />
              </g>
              <g className="anim-float-2" opacity="0.5">
                <rect x="360" y="80" width="60" height="60" rx="15" fill="url(#primary-grad)" transform="rotate(25 390 110)" filter="url(#soft-shadow)" />
              </g>
              <g className="anim-float-1" opacity="0.8">
                <polygon points="400,380 430,440 370,440" fill="url(#secondary-grad)" transform="rotate(-15 400 410)" filter="url(#soft-shadow)" />
              </g>

              {/* Main Background Card (Glassmorphism effect) */}
              <rect x="70" y="100" width="360" height="300" rx="28" fill="url(#glass-grad)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" filter="url(#soft-shadow)" backdrop-filter="blur(10px)" />
              
              {/* Back Card Element */}
              <rect x="90" y="80" width="320" height="280" rx="24" fill="#ffffff" opacity="0.4" filter="url(#soft-shadow)" />

              {/* Foreground Main Element - Dashboard/App Window */}
              <g filter="url(#glow-shadow)" className="anim-float-1">
                <rect x="110" y="130" width="280" height="220" rx="16" fill="#ffffff" />
                <rect x="110" y="130" width="280" height="40" rx="16" fill="#F8F9FA" />
                
                {/* Window Controls */}
                <circle cx="130" cy="150" r="4" fill="#FF5F56" />
                <circle cx="145" cy="150" r="4" fill="#FFBD2E" />
                <circle cx="160" cy="150" r="4" fill="#27C93F" />

                {/* Main Content Area in Window */}
                <rect x="130" y="190" width="100" height="12" rx="4" fill="#E5E7EB" />
                <rect x="130" y="215" width="240" height="8" rx="4" fill="#F3F4F6" />
                <rect x="130" y="235" width="210" height="8" rx="4" fill="#F3F4F6" />
                
                {/* Abstract Data Visualization elements */}
                <g transform="translate(130, 270)">
                  <rect x="0" y="30" width="25" height="40" rx="4" fill="url(#primary-grad)" />
                  <rect x="35" y="10" width="25" height="60" rx="4" fill="url(#secondary-grad)" />
                  <rect x="70" y="45" width="25" height="25" rx="4" fill="#C7D2FE" />
                  <rect x="105" y="20" width="25" height="50" rx="4" fill="url(#primary-grad)" />
                  
                  {/* Overlay Line Chart */}
                  <path d="M 0,30 L 35,5 L 70,35 L 105,10" fill="none" stroke="#6C5CE7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="35" cy="5" r="4" fill="#ffffff" stroke="#6C5CE7" strokeWidth="2" />
                  <circle cx="105" cy="10" r="4" fill="#ffffff" stroke="#6C5CE7" strokeWidth="2" />
                </g>
              </g>

              {/* Floating UI Elements (Cards/Notifications) */}
              
              {/* Top Right Floating Card */}
              <g transform="translate(320, 160)" className="anim-float-2" filter="url(#soft-shadow)">
                <rect x="0" y="0" width="120" height="50" rx="12" fill="#ffffff" />
                <circle cx="20" cy="25" r="10" fill="url(#secondary-grad)" />
                <rect x="40" y="18" width="50" height="6" rx="3" fill="#E5E7EB" />
                <rect x="40" y="30" width="30" height="4" rx="2" fill="#9CA3AF" />
              </g>

              {/* Bottom Left Floating Card */}
              <g transform="translate(60, 280)" className="anim-float-3" filter="url(#soft-shadow)">
                <rect x="0" y="0" width="140" height="60" rx="12" fill="#ffffff" />
                {/* Icon inside card */}
                <rect x="12" y="12" width="36" height="36" rx="8" fill="url(#primary-grad)" opacity="0.1" />
                <circle cx="30" cy="30" r="10" fill="url(#primary-grad)" />
                <path d="M26,30 L29,33 L35,27" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                {/* Text lines */}
                <rect x="58" y="20" width="60" height="6" rx="3" fill="#374151" />
                <rect x="58" y="34" width="40" height="4" rx="2" fill="#9CA3AF" />
              </g>
              
              {/* Little sparkle/star decorations */}
              <g fill="#A08CFF" opacity="0.6">
                <path d="M120,70 L123,80 L133,83 L123,86 L120,96 L117,86 L107,83 L117,80 Z" className="anim-float-2" />
                <path d="M420,280 L422,286 L428,288 L422,290 L420,296 L418,290 L412,288 L418,286 Z" className="anim-float-1" />
              </g>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
