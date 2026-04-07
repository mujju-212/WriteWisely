import React, { useState } from 'react';
import './Signup.css';
import { authService } from '../services/authService';

function Signup({ onNavigateToLogin, onNavigateToDashboard }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    createPassword: '',
    confirmPassword: '',
    professional: '',
    otherProfessional: '',
    phone: '',
    otp: '',
    interestedIn: ''
  });

  const [passwordVisible, setPasswordVisible] = useState({
    createPassword: false,
    confirmPassword: false
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const togglePassword = (field) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form before sending OTP
    if (!formData.name || !formData.email || !formData.createPassword) {
      setError('Name, email, and password are required');
      return;
    }

    if (formData.createPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.createPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Generate OTP for signup (user doesn't exist yet)
      const response = await authService.generateOtp(formData.phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Phone may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter valid 6-digit OTP from terminal');
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP
      await authService.verifyOtp(formData.phone, formData.otp);
      setOtpVerified(true);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Check terminal and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);
    try {
      // Create account in database
      await authService.signup(
        formData.email,
        formData.createPassword,
        formData.name,
        formData.professional || 'student',
        formData.phone
      );
      
      // Account created successfully! Redirect to login page
      onNavigateToLogin?.();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="container">
        <div className="login-section">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div>
              <div className="logo-text">Learning Field</div>
            </div>
          </div>

          <div className="login-header">
            <h1>Create an Account</h1>
            <p>Fill the below form to sign up</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #fca5a5'
            }}>
              ❌ {error}
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" className="form-control" placeholder="John Doe" value={formData.name} onChange={handleInputChange} disabled={otpSent} />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" className="form-control" placeholder="john@example.com" value={formData.email} onChange={handleInputChange} disabled={otpSent} />
              </div>

              <div className="form-group">
                <label htmlFor="createPassword">Password</label>
                <div className="input-wrapper">
                  <input type={passwordVisible.createPassword ? 'text' : 'password'} id="createPassword" className="form-control" placeholder="Min 6 characters" value={formData.createPassword} onChange={handleInputChange} disabled={otpSent} />
                  <div className="eye-icon" onClick={() => togglePassword('createPassword')}>
                    {renderEyeIcon(passwordVisible.createPassword)}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <input type={passwordVisible.confirmPassword ? 'text' : 'password'} id="confirmPassword" className="form-control" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleInputChange} disabled={otpSent} />
                  <div className="eye-icon" onClick={() => togglePassword('confirmPassword')}>
                    {renderEyeIcon(passwordVisible.confirmPassword)}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="professional">Professional</label>
                <select id="professional" className="form-control" value={formData.professional} onChange={handleInputChange} disabled={otpSent}>
                  <option value="">Select option...</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="employee">Employee</option>
                  <option value="professional">Professional</option>
                  <option value="writer">Writer</option>
                </select>
              </div>
            </div>

            {/* Phone Number with Send OTP Button */}
            <div style={{marginBottom: '20px'}}>
              <label htmlFor="phone" style={{marginBottom: '8px', display: 'block', fontWeight: '600'}}>Phone Number</label>
              <div style={{display: 'flex', gap: '8px'}}>
                <input 
                  type="tel" 
                  id="phone" 
                  className="form-control" 
                  placeholder="9999999999" 
                  value={formData.phone} 
                  onChange={handleInputChange}
                  disabled={otpSent}
                  style={{flex: 1}}
                />
                <button 
                  type="button" 
                  onClick={handleSendOtp}
                  disabled={isLoading || otpSent}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: otpSent ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isLoading || otpSent ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isLoading ? '...' : otpSent ? '✅ Sent' : 'Send OTP'}
                </button>
              </div>
            </div>

            {/* OTP Input - Only shows after Send OTP clicked */}
            {otpSent && !otpVerified && (
              <div style={{marginBottom: '20px'}}>
                <div style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  border: '1px solid #fde68a',
                  fontWeight: '600'
                }}>
                  ✅ OTP sent to terminal logs! Check your terminal window for 6-digit code.
                </div>
                
                <label htmlFor="otp" style={{marginBottom: '8px', display: 'block', fontWeight: '600'}}>Enter OTP from Terminal</label>
                <div style={{display: 'flex', gap: '8px'}}>
                  <input 
                    type="text" 
                    id="otp" 
                    className="form-control" 
                    placeholder="000000" 
                    value={formData.otp} 
                    onChange={handleInputChange}
                    maxLength="6"
                    disabled={isLoading}
                    style={{flex: 1, fontSize: '18px', letterSpacing: '4px', textAlign: 'center'}}
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyOtp}
                    disabled={isLoading || formData.otp.length !== 6}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: formData.otp.length !== 6 ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: formData.otp.length !== 6 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isLoading ? '...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Create Account Button - Only shows after OTP verified */}
            {otpVerified && (
              <div style={{marginBottom: '20px'}}>
                <div style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  border: '1px solid #86efac',
                  fontWeight: '600'
                }}>
                  ✅ OTP verified! Click below to create account.
                </div>
                <button 
                  type="button" 
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="btn-primary"
                  style={{width: '100%'}}
                >
                  {isLoading ? '⏳ Creating Account...' : '📝 Create Account'}
                </button>
              </div>
            )}
            
            <div className="signup-prompt">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin?.(); }}>Login</a>
            </div>
          </form>
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
                <stop offset="0%" stopColor="#5B5FDE" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>

            <g fill="#5B5FDE" opacity="0.5">
              <circle cx="120" cy="150" r="2.5"/>
              <circle cx="480" cy="120" r="3"/>
              <circle cx="530" cy="380" r="1.5"/>
              <circle cx="160" cy="480" r="2"/>
              <circle cx="380" cy="80" r="2.5"/>
              <path d="M 520 220 Q 525 230 535 235 Q 525 240 520 250 Q 515 240 505 235 Q 515 230 520 220 Z" opacity="0.8"/>
              <path d="M 100 320 Q 103 326 110 329 Q 103 332 100 338 Q 97 332 90 329 Q 97 326 100 320 Z" opacity="0.5"/>
            </g>

            <circle cx="400" cy="380" r="180" fill="#5B5FDE" filter="url(#glow)" opacity="0.15"/>

            <g transform="translate(0, 480)">
              <path d="M 50 20 L 450 -80 L 650 0 L 250 100 Z" fill="#EEF2FF" opacity="0.85"/>
              <path d="M 50 20 L 250 100 L 250 130 L 50 50 Z" fill="#E0E7FF"/>
              <path d="M 250 100 L 650 0 L 650 30 L 250 130 Z" fill="#C7D2FE"/>
              <rect x="230" y="-10" width="40" height="20" rx="8" fill="#5B5FDE" opacity="0.9" transform="rotate(-14 230 -10)"/>
            </g>

            <path d="M 440 400 L 480 380 L 510 580 L 470 600 Z" fill="#9CA3AF" filter="url(#shadow-strong)"/>
            <path d="M 430 550 L 500 525 L 500 550 L 430 575 Z" fill="#D1D5DB"/>

            <g id="character">
              <path d="M 400 310 C 430 310, 460 340, 470 390 L 440 580 L 320 580 L 290 440 C 280 370, 330 310, 400 310 Z" fill="url(#body-gradient)"/>
              <path d="M 360 360 C 330 420, 270 430, 230 450 L 250 470 C 290 450, 360 450, 400 380 Z" fill="#7E5FFA"/>
              <path d="M 370 310 L 395 310 L 390 340 L 360 340 Z" fill="#FDBA74"/>

              <circle cx="380" cy="275" r="35" fill="#FDBA74"/>
              <path d="M 380 275 L 345 285 L 345 315 C 345 325, 355 330, 365 325 L 395 295 Z" fill="#FDBA74"/>
              <path d="M 345 285 C 335 285, 335 300, 345 300 Z" fill="#FDBA74"/>
              <circle cx="390" cy="290" r="8" fill="#F4A460"/>

              <path d="M 390 240 C 350 240, 340 265, 340 265 C 360 260, 380 255, 400 275 C 410 245, 400 240, 390 240 Z" fill="#1F2937"/>
              <circle cx="395" cy="270" r="28" fill="#1F2937"/>
              
              <path d="M 355 280 C 360 278, 365 278, 370 280" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M 345 310 C 350 312, 353 310, 355 308" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </g>

            <ellipse cx="230" cy="460" rx="15" ry="10" fill="#FDBA74" transform="rotate(-20 230 460)"/>

            <g transform="translate(180, 360)" filter="url(#shadow-strong)">
              <path d="M 10 70 L 140 20 L 160 100 L 20 150 Z" fill="#C7D2FE"/>
              <path d="M 15 75 L 135 28 L 152 98 L 26 145 Z" fill="url(#screen-grad)"/>
              <g transform="rotate(-20 80 80)">
                <rect x="35" y="80" width="80" height="4" rx="2" fill="#9CA3AF"/>
                <rect x="35" y="95" width="100" height="4" rx="2" fill="#D1D5DB"/>
                <rect x="35" y="110" width="90" height="4" rx="2" fill="#D1D5DB"/>
                <rect x="35" y="125" width="60" height="4" rx="2" fill="#D1D5DB"/>
                <circle cx="125" cy="65" r="8" fill="#5B5FDE"/>
              </g>
              <path d="M 20 150 L 160 100 L 250 130 L 90 195 Z" fill="#E0E7FF"/>
              <path d="M 30 155 L 155 110 L 220 132 L 90 180 Z" fill="#EEF2FF"/>
            </g>

            <polygon points="195,435 315,388 380,260 370,320 200,505" fill="#E0E7FF" opacity="0.1" filter="url(#glow)"/>

            <g className="anim-float-1" transform="translate(120, 110)">
              <rect x="0" y="0" width="160" height="70" rx="10" fill="white" filter="url(#shadow-soft)"/>
              <path d="M0 0 h160 v 20 q 0 0 0 0 h-160 q 0 0 0 0 v-20" fill="#5B5FDE" clipPath="inset(0px round 10px 10px 0 0)"/>
              <rect x="15" y="35" width="20" height="6" rx="3" fill="#34D399"/>
              <rect x="40" y="35" width="80" height="6" rx="3" fill="#E5E7EB"/>
              <rect x="15" y="48" width="40" height="6" rx="3" fill="#E5E7EB"/>
              <circle cx="15" cy="10" r="3" fill="white" opacity="0.8"/>
              <circle cx="25" cy="10" r="3" fill="white" opacity="0.8"/>
            </g>

            <g className="anim-float-3" transform="translate(80, 200)">
              <rect x="40" y="0" width="180" height="80" rx="10" fill="white" filter="url(#shadow-soft)"/>
              <path d="M40 0 h180 v 20 q 0 0 0 0 h-180 q 0 0 0 0 v-20" fill="#5B5FDE" clipPath="inset(0px round 10px 10px 0 0)"/>
              <rect x="60" y="35" width="30" height="6" rx="3" fill="#5B5FDE"/>
              <rect x="95" y="35" width="60" height="6" rx="3" fill="#F59E0B"/>
              <rect x="60" y="55" width="100" height="6" rx="3" fill="#E5E7EB"/>
              
              <circle cx="25" cy="40" r="38" fill="white" filter="url(#shadow-soft)"/>
              <circle cx="25" cy="40" r="32" fill="#5B5FDE"/>
              <circle cx="12" cy="35" r="5" fill="white"/>
              <circle cx="38" cy="35" r="5" fill="white"/>
              <path d="M 15 48 Q 25 58 35 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
              <path d="M 25 8 L 25 -8" stroke="#5B5FDE" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="25" cy="-10" r="5" fill="#F59E0B"/>
            </g>

            <g className="anim-float-2" transform="translate(320, 130)">
              <rect x="0" y="0" width="220" height="65" rx="10" fill="white" filter="url(#shadow-soft)"/>
              <circle cx="25" cy="32" r="12" fill="#5B5FDE"/>
              <path d="M25 25 L25 28 M25 31 L25 38" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <text x="48" y="30" fontFamily="sans-serif" fontSize="11.5" fill="#374151" fontWeight="600">Adjusted to past tense</text>
              <text x="48" y="46" fontFamily="sans-serif" fontSize="11.5" fill="#6B7280" fontWeight="500">because you said <tspan fill="#5B5FDE" fontWeight="700">"Yesterday"</tspan></text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Signup;
