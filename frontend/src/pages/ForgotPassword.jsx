import React, { useState } from 'react';

function ForgotPassword() {
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'reset'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card p-12 max-w-md w-full">
        <h1 className="text-3xl font-black text-slate-100 mb-2">Reset Password</h1>
        <p className="text-slate-400 mb-8">
          {step === 'phone' && 'Enter your phone number to receive an OTP'}
          {step === 'otp' && 'Enter the 6-digit OTP sent to your phone'}
          {step === 'reset' && 'Create a new password'}
        </p>

        <div className="space-y-4">
          {step === 'phone' && (
            <>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => setStep('otp')}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                Send OTP
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => setStep('reset')}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                Verify OTP
              </button>
              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 bg-slate-700 text-slate-200 font-bold rounded-xl hover:bg-slate-600 transition"
              >
                Back
              </button>
            </>
          )}

          {step === 'reset' && (
            <>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full p-3 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-700 text-slate-100 placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => alert('Password reset successfully!')}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
              >
                Reset Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
