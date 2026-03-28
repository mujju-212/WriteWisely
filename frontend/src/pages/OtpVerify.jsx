import React, { useState } from 'react';

function OtpVerify() {
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);

  const handleOtpChange = (e) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleVerify = () => {
    if (otp.length === 6) {
      setVerified(true);
      alert('OTP Verified Successfully!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="bg-slate-800 border border-slate-700 p-12 max-w-md w-full text-center space-y-8 rounded-3xl shadow-2xl">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600/30 rounded-full flex items-center justify-center border border-indigo-500/50">
            <i className="fa-solid fa-shield-check text-3xl text-indigo-400"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-100">Verify OTP</h1>
          <p className="text-slate-400 mt-2">We've sent a verification code to your registered email</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">Enter 6-Digit Code</label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="000000"
              maxLength="6"
              inputMode="numeric"
              className="w-full p-4 text-center text-2xl tracking-widest border-2 border-slate-600 bg-slate-700 text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none font-bold"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={otp.length !== 6}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Code
          </button>

          {verified && (
            <div className="p-4 bg-emerald-600/30 border border-emerald-500/50 rounded-xl text-emerald-300 font-bold">
              ✓ OTP Verified Successfully!
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-slate-400">Didn't receive the code?</p>
            <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm hover:underline">
              Resend OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpVerify;
