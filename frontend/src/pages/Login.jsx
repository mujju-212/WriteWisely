import React, { useState } from 'react';
import './Login.css';

function Login({ onNavigateToSignup, onNavigateToDashboard }) {
  const [view, setView] = useState('login'); // 'login' or 'forgot-password'
  const [fpStep, setFpStep] = useState('phone'); // 'phone', 'otp', 'reset'
  const [passwordVisible, setPasswordVisible] = useState({});
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  const [forgotData, setForgotData] = useState({
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showForgotPassword = (e) => {
    e.preventDefault();
    setView('forgot-password');
    setFpStep('phone');
  };

  const backToLogin = (e) => {
    e.preventDefault();
    setView('login');
  };

  const sendOtp = () => {
    setFpStep('otp');
  };

  const verifyOtp = () => {
    setFpStep('reset');
  };

  const savePassword = () => {
    alert("Password updated successfully!");
    setView('login');
  };

  const togglePassword = (field) => {
    setPasswordVisible(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLoginInputChange = (e) => {
    const { id, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleForgotInputChange = (e) => {
    const { id, value } = e.target;
    setForgotData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const renderEyeIcon = (isVisible) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {isVisible ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </>
      )}
    </svg>
  );

  const handleLogin = () => {
    // Simulate login - in real app, validate username and password
    onNavigateToDashboard?.();
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-section">
          <div className="logo">
          <div className="logo-icon">
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #5B5FDE 0%, #6366F1 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(91, 95, 222, 0.3)'
            }}>
              W
            </div>
          </div>
          <div>
            <div className="logo-text">Write<span style={{color: '#5B5FDE'}}>Wisely</span></div>
          </div>
        </div>

          {view === 'login' && (
            <div id="login-container">
            <div className="login-header">
              <h1>Login to Dashboard</h1>
              <p>Fill the below form to login</p>
            </div>

            <form>
              <div className="form-group">
                <label htmlFor="identifier">Username/Phone no.</label>
                <input type="text" id="identifier" className="form-control" placeholder="Enter username or phone number" value={loginData.identifier} onChange={handleLoginInputChange} />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input type={passwordVisible.password ? 'text' : 'password'} id="password" className="form-control" placeholder="Enter Password" value={loginData.password} onChange={handleLoginInputChange} />
                  <div className="eye-icon" onClick={() => togglePassword('password')}>
                    {renderEyeIcon(passwordVisible.password)}
                  </div>
                </div>
              </div>

              <a href="#" className="forgot-password" onClick={showForgotPassword}>Forget Password?</a>

              <button type="button" className="btn-primary" onClick={handleLogin}>Login</button>

              <div className="signup-prompt">
                Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignup?.(); }}>Sign up</a>
              </div>
            </form>
            </div>
          )}

          {view === 'forgot-password' && (
            <div id="forgot-password-container">
            <div className="login-header">
              <h1>{fpStep === 'phone' ? 'Reset Password' : fpStep === 'otp' ? 'Verify OTP' : 'Create New Password'}</h1>
              <p>{fpStep === 'phone' ? 'Enter your phone number to receive an OTP.' : fpStep === 'otp' ? 'Enter the 6-digit OTP sent to your phone.' : 'Please enter and confirm your new password.'}</p>
            </div>

            <form>
              {fpStep === 'phone' && (
                <div id="step-phone">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" className="form-control" placeholder="Enter your phone number" value={forgotData.phone} onChange={handleForgotInputChange} />
                  </div>
                  <button type="button" className="btn-primary" onClick={sendOtp}>Send OTP</button>
                </div>
              )}

              {fpStep === 'otp' && (
                <div id="step-otp">
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <input type="text" id="otp" className="form-control" placeholder="Enter 6-digit OTP" maxLength="6" value={forgotData.otp} onChange={handleForgotInputChange} />
                  </div>
                  <button type="button" className="btn-primary" onClick={verifyOtp}>Verify OTP</button>
                </div>
              )}

              {fpStep === 'reset' && (
                <div id="step-reset">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-wrapper">
                      <input type={passwordVisible.newPassword ? 'text' : 'password'} id="newPassword" className="form-control" placeholder="Enter New Password" value={forgotData.newPassword} onChange={handleForgotInputChange} />
                      <div className="eye-icon" onClick={() => togglePassword('newPassword')}>
                        {renderEyeIcon(passwordVisible.newPassword)}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-wrapper">
                      <input type={passwordVisible.confirmPassword ? 'text' : 'password'} id="confirmPassword" className="form-control" placeholder="Confirm New Password" value={forgotData.confirmPassword} onChange={handleForgotInputChange} />
                      <div className="eye-icon" onClick={() => togglePassword('confirmPassword')}>
                        {renderEyeIcon(passwordVisible.confirmPassword)}
                      </div>
                    </div>
                  </div>
                  <button type="button" className="btn-primary" onClick={savePassword}>Save New Password</button>
                </div>
              )}

              <div className="signup-prompt">
                Remember your password? <a href="#" onClick={backToLogin}>Back to Login</a>
              </div>
            </form>
            </div>
          )}
        </div>

        <div className="preview-section">
          <svg width="100%" height="100%" viewBox="0 0 600 700" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-soft" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#4B3A9B" floodOpacity="0.15"/>
            </filter>
            <filter id="shadow-strong" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#2E2265" floodOpacity="0.3"/>
            </filter>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="30" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="body-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6046C4" />
              <stop offset="100%" stopColor="#31227A" />
            </linearGradient>
            <linearGradient id="screen-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C7D2FE" />
              <stop offset="100%" stopColor="#DDD6FE" />
            </linearGradient>
          </defs>

          <g fill="#C7D2FE" opacity="0.5">
            <circle cx="120" cy="150" r="2.5"/>
            <circle cx="480" cy="120" r="3"/>
            <circle cx="530" cy="380" r="1.5"/>
            <circle cx="160" cy="480" r="2"/>
            <circle cx="380" cy="80" r="2.5"/>
            <path d="M 520 220 Q 525 230 535 235 Q 525 240 520 250 Q 515 240 505 235 Q 515 230 520 220 Z" opacity="0.8"/>
            <path d="M 100 320 Q 103 326 110 329 Q 103 332 100 338 Q 97 332 90 329 Q 97 326 100 320 Z" opacity="0.5"/>
          </g>

          <circle cx="400" cy="380" r="180" fill="#A78BFA" filter="url(#glow)" opacity="0.15"/>

          <g transform="translate(0, 480)">
            <path d="M 50 20 L 450 -80 L 650 0 L 250 100 Z" fill="#DDD6FE" opacity="0.85"/>
            <path d="M 50 20 L 250 100 L 250 130 L 50 50 Z" fill="#C7D2FE"/>
            <path d="M 250 100 L 650 0 L 650 30 L 250 130 Z" fill="#A78BFA"/>
            <rect x="230" y="-10" width="40" height="20" rx="8" fill="#A78BFA" opacity="0.9" transform="rotate(-14 230 -10)"/>
          </g>

          <path d="M 440 400 L 480 380 L 510 580 L 470 600 Z" fill="#4B3A9B" filter="url(#shadow-strong)"/>
          <path d="M 430 550 L 500 525 L 500 550 L 430 575 Z" fill="#31227A"/>

          <g id="character">
            <path d="M 400 310 C 430 310, 460 340, 470 390 L 440 580 L 320 580 L 290 440 C 280 370, 330 310, 400 310 Z" fill="url(#body-gradient)"/>
            
            <path d="M 360 360 C 330 420, 270 430, 230 450 L 250 470 C 290 450, 360 450, 400 380 Z" fill="#7E5FFA"/>
            
            <path d="M 370 310 L 395 310 L 390 340 L 360 340 Z" fill="#FDBA74"/>

            <circle cx="380" cy="275" r="35" fill="#FDBA74"/>
            <path d="M 380 275 L 345 285 L 345 315 C 345 325, 355 330, 365 325 L 395 295 Z" fill="#FDBA74"/>
            <path d="M 345 285 C 335 285, 335 300, 345 300 Z" fill="#FDBA74"/>
            <circle cx="390" cy="290" r="8" fill="#F4A460"/>

            <path d="M 390 240 C 350 240, 340 265, 340 265 C 360 260, 380 255, 400 275 C 410 245, 400 240, 390 240 Z" fill="#111827"/>
            <circle cx="395" cy="270" r="28" fill="#111827"/>
            
            <path d="M 355 280 C 360 278, 365 278, 370 280" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M 345 310 C 350 312, 353 310, 355 308" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </g>

          <ellipse cx="230" cy="460" rx="15" ry="10" fill="#FDBA74" transform="rotate(-20 230 460)"/>

          <g transform="translate(180, 360)" filter="url(#shadow-strong)">
            <path d="M 10 70 L 140 20 L 160 100 L 20 150 Z" fill="#2E2265"/>
            <path d="M 15 75 L 135 28 L 152 98 L 26 145 Z" fill="url(#screen-grad)"/>
            
            <g transform="rotate(-20 80 80)">
              <rect x="35" y="80" width="80" height="4" rx="2" fill="#9CA3AF"/>
              <rect x="35" y="95" width="100" height="4" rx="2" fill="#D1D5DB"/>
              <rect x="35" y="110" width="90" height="4" rx="2" fill="#D1D5DB"/>
              <rect x="35" y="125" width="60" height="4" rx="2" fill="#D1D5DB"/>
              <circle cx="125" cy="65" r="8" fill="#6C5CE7"/>
            </g>
            
            <path d="M 20 150 L 160 100 L 250 130 L 90 195 Z" fill="#1E1B4B"/>
            <path d="M 30 155 L 155 110 L 220 132 L 90 180 Z" fill="#31227A"/>
          </g>

          <polygon points="195,435 315,388 380,260 370,320 200,505" fill="#E0E7FF" opacity="0.1" filter="url(#glow)"/>

          <g className="anim-float-1" transform="translate(120, 110)">
            <rect x="0" y="0" width="160" height="70" rx="10" fill="white" filter="url(#shadow-soft)"/>
            <path d="M0 0 h160 v 20 q 0 0 0 0 h-160 q 0 0 0 0 v-20" fill="#A08CFF" clipPath="inset(0px round 10px 10px 0 0)"/>
            <rect x="15" y="35" width="20" height="6" rx="3" fill="#34D399"/>
            <rect x="40" y="35" width="80" height="6" rx="3" fill="#E5E7EB"/>
            <rect x="15" y="48" width="40" height="6" rx="3" fill="#E5E7EB"/>
            <circle cx="15" cy="10" r="3" fill="white" opacity="0.8"/>
            <circle cx="25" cy="10" r="3" fill="white" opacity="0.8"/>
          </g>

          <g className="anim-float-3" transform="translate(80, 200)">
            <rect x="40" y="0" width="180" height="80" rx="10" fill="white" filter="url(#shadow-soft)"/>
            <path d="M40 0 h180 v 20 q 0 0 0 0 h-180 q 0 0 0 0 v-20" fill="#8C71FF" clipPath="inset(0px round 10px 10px 0 0)"/>
            <rect x="60" y="35" width="30" height="6" rx="3" fill="#7E5FFA"/>
            <rect x="95" y="35" width="60" height="6" rx="3" fill="#FBBF24"/>
            <rect x="60" y="55" width="100" height="6" rx="3" fill="#E5E7EB"/>
            
            <circle cx="25" cy="40" r="38" fill="white" filter="url(#shadow-soft)"/>
            <circle cx="25" cy="40" r="32" fill="#6C5CE7"/>
            <circle cx="12" cy="35" r="5" fill="white"/>
            <circle cx="38" cy="35" r="5" fill="white"/>
            <path d="M 15 48 Q 25 58 35 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M 25 8 L 25 -8" stroke="#6C5CE7" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="25" cy="-10" r="5" fill="#FBBF24"/>
          </g>

          <g className="anim-float-2" transform="translate(320, 130)">
            <rect x="0" y="0" width="220" height="65" rx="10" fill="white" filter="url(#shadow-soft)"/>
            <circle cx="25" cy="32" r="12" fill="#A08CFF"/>
            <path d="M25 25 L25 28 M25 31 L25 38" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <text x="48" y="30" fontFamily="sans-serif" fontSize="11.5" fill="#374151" fontWeight="600">Adjusted to past tense</text>
            <text x="48" y="46" fontFamily="sans-serif" fontSize="11.5" fill="#6B7280" fontWeight="500">because you said <tspan fill="#6C5CE7" fontWeight="700">"Yesterday"</tspan></text>
          </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Login;
