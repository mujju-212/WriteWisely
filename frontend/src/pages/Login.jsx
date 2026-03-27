import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login success, then redirect to dashboard or home
    navigate('/');
  };

  return (
    <div className="form-box login">
      <form onSubmit={handleLogin}>
        <h2>Sign In</h2>
        
        <div className="input-group">
          <i className="bx bxs-user"></i>
          <input type="text" placeholder="Username or Email" required />
        </div>
        
        <div className="input-group">
          <i className="bx bxs-lock-alt"></i>
          <input 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            required 
          />
          <i 
            className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} show-hide-icon`}
            onClick={() => setShowPassword(!showPassword)}
            style={{ cursor: 'pointer', position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}
          ></i>
        </div>
        
        <button type="submit" className="btn">Sign In</button>
        
        <p>
          <Link to="/forgot-password" className="pointer">Forgot password?</Link>
        </p>
        <p>
          <span>Don't have an account? </span>
          <Link to="/signup" className="pointer">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;