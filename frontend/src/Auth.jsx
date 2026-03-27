import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ChevronDown,
  ArrowLeft,
  CheckCircle,
  Circle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  Send,
  Sparkles,
  BookOpen,
  Layers,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  SkipForward,
  Rocket,
  BarChart2,
  Check,
} from 'lucide-react'

const API_BASE = '/api/auth'

async function postJson(path, payload, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed')
  }
  return data
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-5" style={{ background: '#F8F7FF' }}>
      {/* Left Branded Panel */}
      <div
        className="hidden md:flex md:col-span-2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #4F46E5 0%, #5B5FDE 40%, #7C3AED 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">WriteWisely</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Write Better.<br />Every Single Day.
          </h1>
          <p className="text-indigo-200 text-base mb-8">
            AI-powered grammar coaching that adapts to your level and helps you build real writing skills.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: Layers, text: '30-level structured curriculum' },
              { icon: TrendingUp, text: 'Real-time AI writing feedback' },
              { icon: Award, text: 'Earn credits & badges as you grow' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: '1.25rem', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p className="text-white text-sm italic mb-3 leading-relaxed">
            "WriteWisely helped me write professional emails confidently. My manager noticed the improvement immediately!"
          </p>
          <div className="flex items-center gap-3">
            <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>SM</div>
            <div>
              <p className="text-white text-sm font-semibold">Sarah M.</p>
              <p className="text-indigo-200 text-xs">Marketing Professional</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="md:col-span-3 flex items-start md:items-center justify-center min-h-screen p-6 overflow-y-auto" style={{ background: '#F8F7FF' }}>
        <div className="max-w-md w-full mx-auto py-4 md:py-6">{children}</div>
      </div>
    </div>
  )
}

const WW_PRIMARY = '#5B5FDE'
const WW_PRIMARY_LIGHT = '#EEF0FF'

function StepIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: 'Details', icon: User },
    { number: 2, label: 'Verify', icon: ShieldCheck },
    { number: 3, label: 'Assessment', icon: BarChart2 },
    { number: 4, label: 'Result', icon: Award },
  ]

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => {
        const completed = step.number < currentStep
        const current = step.number === currentStep
        const Icon = step.icon
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center">
              <div
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: completed || current ? WW_PRIMARY : '#E5E7EB',
                  color: completed || current ? '#fff' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: current ? `0 0 0 4px ${WW_PRIMARY_LIGHT}` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span style={{ fontSize: '0.7rem', marginTop: 4, fontWeight: current ? 700 : 500, color: completed || current ? WW_PRIMARY : '#9CA3AF' }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ width: 40, height: 2, background: step.number < currentStep ? WW_PRIMARY : '#E5E7EB', marginBottom: 20, transition: 'background 0.3s ease', flexShrink: 0 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function OtpInput({ value, setValue, disabled }) {
  const inputRefs = useRef([])

  const setDigit = (index, char) => {
    const next = [...value]
    next[index] = char
    setValue(next)
  }

  const handleChange = (index, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, digit)
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      setDigit(index - 1, '')
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    const next = ['', '', '', '', '', '']
    digits.split('').forEach((d, idx) => {
      next[idx] = d
    })
    setValue(next)
    const lastIndex = Math.min(digits.length - 1, 5)
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          style={{
            width: 48, height: 52, textAlign: 'center', fontSize: '1.4rem',
            fontWeight: 700, color: '#1F2937',
            border: `2px solid ${digit ? WW_PRIMARY : '#D1D5DB'}`,
            borderRadius: 12, background: digit ? '#EEF0FF' : '#fff',
            outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit',
          }}
          onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${WW_PRIMARY_LIGHT}`; e.target.style.borderColor = WW_PRIMARY; }}
          onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = digit ? WW_PRIMARY : '#D1D5DB'; }}
        />
      ))}
    </div>
  )
}

export function LoginPage({ setCurrentPage, onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const validateLogin = () => {
    const nextErrors = {}
    if (!email || !validateEmail(email)) {
      nextErrors.email = 'Please enter a valid email'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!validateLogin()) return

    setIsLoading(true)
    try {
      const data = await postJson('/login', { email, password })
      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response')
      }
      if ((data.user.email || '').toLowerCase() !== email.toLowerCase()) {
        throw new Error('Session mismatch detected')
      }

      localStorage.setItem('ww_token', data.token)
      localStorage.setItem('ww_user', JSON.stringify(data.user))
      onAuthenticated?.()
    } catch (error) {
      setLoginError(error.message || 'Incorrect email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2 mb-8">
        <div style={{ width: 34, height: 34, background: WW_PRIMARY, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: '#1F2937' }}>WriteWisely</span>
      </div>

      <div className="mb-8">
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>Welcome back 👋</h2>
        <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>Sign in to continue your learning journey</p>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            <Mail className="inline w-3.5 h-3.5 mr-1.5" style={{ color: WW_PRIMARY }} />
            Email address
          </label>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })) }}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem',
              border: `1.5px solid ${errors.email ? '#FCA5A5' : '#D1D5DB'}`,
              background: errors.email ? '#FFF5F5' : '#fff', color: '#111827', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => { e.target.style.borderColor = WW_PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${WW_PRIMARY_LIGHT}`; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = errors.email ? '#FCA5A5' : '#D1D5DB'; }}
          />
          {errors.email && <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle className="w-3 h-3" />{errors.email}</span>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
              <Lock className="inline w-3.5 h-3.5 mr-1.5" style={{ color: WW_PRIMARY }} />
              Password
            </label>
            <button type="button" style={{ fontSize: '0.82rem', color: WW_PRIMARY, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setCurrentPage('forgot-email')}>
              Forgot password?
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: '' })) }}
              style={{
                width: '100%', padding: '12px 48px 12px 16px', borderRadius: 12, fontSize: '0.9rem',
                border: `1.5px solid ${errors.password ? '#FCA5A5' : '#D1D5DB'}`,
                background: errors.password ? '#FFF5F5' : '#fff', color: '#111827', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = WW_PRIMARY; e.target.style.boxShadow = `0 0 0 3px ${WW_PRIMARY_LIGHT}`; }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = errors.password ? '#FCA5A5' : '#D1D5DB'; }}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle className="w-3 h-3" />{errors.password}</span>}
        </div>

        {loginError && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle className="w-4 h-4" style={{ color: '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: '0.85rem', color: '#DC2626' }}>{loginError}</span>
          </div>
        )}

        <button type="submit" disabled={isLoading}
          style={{ width: '100%', padding: '13px', background: WW_PRIMARY, color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.75 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', fontFamily: 'inherit' }}
          onMouseEnter={(e) => { if (!isLoading) e.target.style.background = '#4B4FCC'; }}
          onMouseLeave={(e) => { e.target.style.background = WW_PRIMARY; }}
        >
          {isLoading ? (<><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Signing in...</>) : (<>Sign In <LogIn className="w-4 h-4" /></>)}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>or</span>
        <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280' }}>
        Don't have an account?{' '}
        <button type="button" style={{ color: WW_PRIMARY, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }} onClick={() => setCurrentPage('signup-details')}>
          Create one now
        </button>
      </p>
    </AuthLayout>
  )
}

export function ForgotEmailPage({ setCurrentPage, authData, setAuthData }) {
  const [email, setEmail] = useState(authData.email || '')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    setError('')
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      await postJson('/forgot-password', { email })
      setAuthData((prev) => ({ ...prev, email }))
      setCurrentPage('forgot-otp')
    } catch (e) {
      setError(e.message || 'Unable to send reset code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <button
        type="button"
        className="flex items-center gap-2 mb-8 cursor-pointer text-slate-500 hover:text-slate-700 transition-all duration-200"
        onClick={() => setCurrentPage('login')}
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span className="text-sm">Back to Login</span>
      </button>

      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Mail className="w-7 h-7 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Forgot your password?</h2>
      <p className="text-center text-slate-500 text-sm mb-8">
        No worries! Enter your email address and we'll send you a reset code.
      </p>

      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email address</label>
      <input
        type="email"
        placeholder="Enter your registered email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
      />

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <button
        type="button"
        disabled={isLoading}
        onClick={handleSend}
        className="w-full mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Sending...
          </>
        ) : (
          <>
            Send Reset Code
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </AuthLayout>
  )
}

function OtpPageBase({
  title,
  subtitle,
  email,
  backTarget,
  verifyLabel,
  onVerify,
  onResend,
  setCurrentPage,
  currentStep,
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  useEffect(() => {
    if (canResend) return undefined
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [canResend])

  const submit = async () => {
    const joined = otp.join('')
    setError('')

    if (joined.length < 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    try {
      await onVerify(joined)
    } catch (e) {
      setError(e.message || 'Invalid code')
    } finally {
      setIsLoading(false)
    }
  }

  const resend = async () => {
    if (!canResend || resendCount >= 3) return
    setError('')
    try {
      await onResend()
      setCountdown(30)
      setCanResend(false)
      setResendCount((prev) => prev + 1)
    } catch (e) {
      setError(e.message || 'Failed to resend code')
    }
  }

  return (
    <AuthLayout>
      {currentStep ? <StepIndicator currentStep={currentStep} /> : null}

      <button
        type="button"
        className="flex items-center gap-2 mb-8 cursor-pointer text-slate-500 hover:text-slate-700 transition-all duration-200"
        onClick={() => setCurrentPage(backTarget)}
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span className="text-sm">Back</span>
      </button>

      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Mail className="w-7 h-7 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">{title}</h2>
      <p className="text-center text-slate-500 text-sm mb-2">{subtitle}</p>
      <p className="text-center text-sm text-slate-500 mb-6">
        <span className="font-semibold text-slate-800">{email}</span>
      </p>

      <OtpInput value={otp} setValue={setOtp} disabled={isLoading} />

      <div className="text-center text-sm mb-6">
        {!canResend && (
          <p className="text-slate-400">
            Resend code in <span className="text-slate-600 font-medium">{countdown}s</span>
          </p>
        )}
        {canResend && resendCount < 3 && (
          <p className="text-slate-500">
            Didn't receive it?{' '}
            <button
              type="button"
              className="text-blue-600 font-semibold hover:text-blue-700 transition-all duration-200"
              onClick={resend}
            >
              Resend Code
            </button>
          </p>
        )}
        {resendCount >= 3 && (
          <p className="text-red-500 text-xs">Too many attempts. Please try again in 10 minutes.</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={isLoading || otp.join('').length < 6}
        onClick={submit}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Verifying...
          </>
        ) : (
          <>
            {verifyLabel}
            <ShieldCheck className="w-4 h-4" />
          </>
        )}
      </button>
    </AuthLayout>
  )
}

export function ForgotOtpPage({ setCurrentPage, authData, setAuthData }) {
  return (
    <OtpPageBase
      title="Check your email"
      subtitle="We sent a 6-digit code to"
      email={authData.email}
      backTarget="forgot-email"
      verifyLabel="Verify Code"
      setCurrentPage={setCurrentPage}
      onVerify={async (otp) => {
        await postJson('/verify-reset-otp', { email: authData.email, otp })
        setAuthData((prev) => ({ ...prev, otp }))
        setCurrentPage('forgot-password')
      }}
      onResend={async () => {
        await postJson('/forgot-password', { email: authData.email })
      }}
    />
  )
}

export function ForgotNewPasswordPage({ setCurrentPage, authData }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const rules = {
    length: password.length >= 8,
    number: /\d/.test(password),
    capital: /[A-Z]/.test(password),
  }

  const reset = async () => {
    const nextErrors = {}
    if (!rules.length || !rules.number || !rules.capital) {
      nextErrors.password = 'Password does not meet all requirements'
    }
    if (password !== confirm) {
      nextErrors.confirm = 'Passwords do not match'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsLoading(true)
    try {
      await postJson('/reset-password', {
        email: authData.email,
        otp: authData.otp,
        new_password: password,
      })
      setCurrentPage('forgot-success')
    } catch (e) {
      setErrors({ password: e.message || 'Unable to reset password' })
    } finally {
      setIsLoading(false)
    }
  }

  const Rule = ({ active, text }) => (
    <div className="flex items-center gap-2">
      {active ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-slate-300" />
      )}
      <span className={`text-xs ${active ? 'text-green-600' : 'text-slate-400'}`}>{text}</span>
    </div>
  )

  return (
    <AuthLayout>
      <button
        type="button"
        className="flex items-center gap-2 mb-8 cursor-pointer text-slate-500 hover:text-slate-700 transition-all duration-200"
        onClick={() => setCurrentPage('forgot-otp')}
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span className="text-sm">Back</span>
      </button>

      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-7 h-7 text-blue-600" />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Create new password</h2>
      <p className="text-center text-slate-500 text-sm mb-8">
        Your new password must be different from your previous password
      </p>

      <label className="text-sm font-medium text-slate-700 mb-1.5 block">New Password</label>
      <div className="relative">
        <input
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <button
          type="button"
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-all duration-200"
          onClick={() => setShowPass((p) => !p)}
        >
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-col gap-1.5 mt-2 mb-3">
        <Rule active={rules.length} text="At least 8 characters" />
        <Rule active={rules.number} text="At least one number" />
        <Rule active={rules.capital} text="At least one capital letter" />
      </div>

      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Confirm Password</label>
      <div className="relative">
        <input
          type={showConfirm ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <button
          type="button"
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-all duration-200"
          onClick={() => setShowConfirm((p) => !p)}
        >
          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

      <button
        type="button"
        disabled={isLoading || !rules.length || !rules.number || !rules.capital || password !== confirm}
        onClick={reset}
        className="w-full mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            Resetting...
          </>
        ) : (
          <>
            Reset Password
            <KeyRound className="w-4 h-4" />
          </>
        )}
      </button>
    </AuthLayout>
  )
}

export function ForgotSuccessPage({ setCurrentPage }) {
  return (
    <AuthLayout>
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 text-center mb-3">Password Reset Successfully!</h2>
      <p className="text-center text-slate-500 text-sm mb-8">
        Your password has been updated. You can now sign in with your new password.
      </p>
      <button
        type="button"
        onClick={() => setCurrentPage('login')}
        className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        Go to Login
        <LogIn className="w-4 h-4" />
      </button>
    </AuthLayout>
  )
}

function SignupTextInput({ label, value, onValue, icon: Icon, type = 'text', placeholder, error, right }) {
  return (
    <div>
      {label ? <label className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</label> : null}
      <div className="relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        <input
          type={type}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 ${right ? 'pr-12' : 'pr-4'} py-3 rounded-xl border bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
        />
        {right}
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function SignupDetailsPage({ setCurrentPage, setAuthData }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    role: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const rules = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    capital: /[A-Z]/.test(formData.password),
  }

  const validateDetails = () => {
    const newErrors = {}

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Please enter your full name'
    }

    if (!formData.email || !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && formData.phone.length < 8) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one capital letter'
    }

    if (formData.password !== formData.confirm) {
      newErrors.confirm = 'Passwords do not match'
    }

    if (!formData.role) {
      newErrors.role = 'Please select your role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validateDetails()) return

    setIsLoading(true)
    try {
      await postJson('/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      })

      setAuthData((prev) => ({
        ...prev,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      }))
      setCurrentPage('signup-otp')
    } catch (e) {
      setErrors((prev) => ({ ...prev, submit: e.message || 'Unable to create account' }))
    } finally {
      setIsLoading(false)
    }
  }

  const onChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }))
    }
  }

  return (
    <AuthLayout>
      <StepIndicator currentStep={1} />
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Create your account</h2>
      <p className="text-sm text-slate-500 mb-6">Start your grammar learning journey</p>

      <div className="flex flex-col gap-4">
        <SignupTextInput
          label="Full Name"
          value={formData.name}
          onValue={(v) => onChange('name', v)}
          icon={User}
          placeholder="Enter your full name"
          error={errors.name}
        />

        <SignupTextInput
          label="Email Address"
          value={formData.email}
          onValue={(v) => onChange('email', v)}
          icon={Mail}
          placeholder="Enter your email address"
          error={errors.email}
        />

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Phone Number <span className="text-slate-400 text-xs">(optional)</span>
          </label>
          <SignupTextInput
            label=""
            value={formData.phone}
            onValue={(v) => onChange('phone', v)}
            icon={Phone}
            placeholder="+1 234 567 8900"
            error={errors.phone}
          />
        </div>

        <SignupTextInput
          label="Password"
          value={formData.password}
          onValue={(v) => onChange('password', v)}
          icon={Lock}
          type={showPass ? 'text' : 'password'}
          placeholder="Create a strong password"
          error={errors.password}
          right={
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-all duration-200"
              onClick={() => setShowPass((p) => !p)}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex flex-col gap-1.5 mt-[-4px] mb-1">
          <div className="flex items-center gap-2">
            {rules.length ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
            <span className={`text-xs ${rules.length ? 'text-green-600' : 'text-slate-400'}`}>At least 8 characters</span>
          </div>
          <div className="flex items-center gap-2">
            {rules.number ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
            <span className={`text-xs ${rules.number ? 'text-green-600' : 'text-slate-400'}`}>At least one number</span>
          </div>
          <div className="flex items-center gap-2">
            {rules.capital ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />}
            <span className={`text-xs ${rules.capital ? 'text-green-600' : 'text-slate-400'}`}>At least one capital letter</span>
          </div>
        </div>

        <SignupTextInput
          label="Confirm Password"
          value={formData.confirm}
          onValue={(v) => onChange('confirm', v)}
          icon={Lock}
          type={showConfirm ? 'text' : 'password'}
          placeholder="Confirm your password"
          error={errors.confirm}
          right={
            <button
              type="button"
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-all duration-200"
              onClick={() => setShowConfirm((p) => !p)}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role / Occupation</label>
          <div className="relative">
            <select
              value={formData.role}
              onChange={(e) => onChange('role', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                formData.role ? 'text-slate-800 border-slate-200' : 'text-slate-400 border-slate-200'
              } ${errors.role ? 'border-red-400 bg-red-50' : ''}`}
            >
              <option value="" disabled>
                What describes you best?
              </option>
              <option value="student">🎓 Student</option>
              <option value="professional">💼 Professional</option>
              <option value="writer">✍️ Writer</option>
              <option value="teacher">👨‍🏫 Teacher</option>
              <option value="other">👤 Other</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
          {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
        </div>

        {errors.submit && <p className="text-red-500 text-xs">{errors.submit}</p>}

        <button
          type="button"
          disabled={isLoading}
          onClick={submit}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              Create Account
              <UserPlus className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            className="text-blue-600 font-semibold hover:text-blue-700 transition-all duration-200"
            onClick={() => setCurrentPage('login')}
          >
            Sign in here
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}

export function SignupOtpPage({ setCurrentPage, authData, setAuthData }) {
  return (
    <OtpPageBase
      title="Verify your email"
      subtitle="We sent a 6-digit code to"
      email={authData.email}
      backTarget="signup-details"
      verifyLabel="Verify & Continue"
      setCurrentPage={setCurrentPage}
      currentStep={2}
      onVerify={async (otp) => {
        const data = await postJson('/verify-otp', { email: authData.email, otp })
        if (data?.token) {
          localStorage.setItem('ww_token', data.token)
        }
        if (data?.user) {
          localStorage.setItem('ww_user', JSON.stringify(data.user))
        }
        setAuthData((prev) => ({ ...prev, otp }))
        setCurrentPage('signup-quiz')
      }}
      onResend={async () => {
        await postJson('/resend-otp', { email: authData.email })
      }}
    />
  )
}

export function AssessmentQuizPage({ setCurrentPage, setAuthData }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const questions = useMemo(
    () => [
      { id: 1, difficulty: 'easy', category: 'spelling', question: 'Which word is spelled correctly?', options: ['recieve', 'receive', 'receve', 'recive'], correct: 1, weakness: 'spelling' },
      { id: 2, difficulty: 'easy', category: 'grammar', question: 'Choose the correct sentence:', options: ["She don't like coffee", "She doesn't likes coffee", "She doesn't like coffee", 'She not like coffee'], correct: 2, weakness: 'subject_verb' },
      { id: 3, difficulty: 'easy', category: 'punctuation', question: 'Which is correctly punctuated?', options: ['I love cats, dogs and birds.', 'I love cats, dogs, and birds.', 'I love cats dogs, and birds.', 'I love, cats, dogs, and birds.'], correct: 1, weakness: 'punctuation' },
      { id: 4, difficulty: 'easy', category: 'apostrophe', question: "The book belongs to Sarah. Choose the correct form:", options: ["Sarahs book", "Sarah's book", "Sarahs' book", "Sarahs's book"], correct: 1, weakness: 'punctuation' },
      { id: 5, difficulty: 'medium', category: 'homophones', question: "Fill in the blank: '___ going to ___ house over there.'", options: ['Their, they\'re', "They're, their", 'There, their', 'Their, there'], correct: 1, weakness: 'homophones' },
      { id: 6, difficulty: 'medium', category: 'subject_verb', question: 'Which sentence is grammatically correct?', options: ['The team of players are ready.', 'The team of players is ready.', 'The team of players were ready.', 'The team of players am ready.'], correct: 1, weakness: 'subject_verb' },
      { id: 7, difficulty: 'medium', category: 'sentence_structure', question: 'Which is a complete sentence?', options: ['Running through the park every day.', 'Because it was raining outside.', 'She runs through the park daily.', 'The big old park near the school.'], correct: 2, weakness: 'sentence_structure' },
      { id: 8, difficulty: 'medium', category: 'tense', question: "Choose the correct tense: 'Yesterday I ___ to the market and ___ fresh vegetables.'", options: ['go, buy', 'went, bought', 'gone, buyed', 'go, bought'], correct: 1, weakness: 'tenses' },
      { id: 9, difficulty: 'hard', category: 'formal_writing', question: 'Which is the correct opening for a formal email to your manager?', options: ["Hey boss! Can't make it tmrw 😷", "Hi, I won't be coming tomorrow.", 'I am writing to inform you that I will be unable to attend tomorrow.', "Just letting you know I'm sick."], correct: 2, weakness: 'formal_writing' },
      { id: 10, difficulty: 'hard', category: 'advanced_grammar', question: "Identify the error: 'Neither of the students have submitted their assignment.'", options: ['"students" should be "student"', '"have" should be "has"', '"their" should be "his"', 'No error in the sentence'], correct: 1, weakness: 'advanced_grammar' },
    ],
    []
  )

  const levelMessages = {
    1: "Let's start from the foundations! You'll be surprised how fast you improve.",
    2: "Good start! You know the basics. Let's strengthen your grammar and punctuation.",
    3: 'Solid foundation! Time to tackle the trickier grammar rules.',
    4: "Impressive! Let's polish your writing to a professional level.",
    5: 'Excellent! You have strong grammar skills. Let\'s perfect your writing style.',
  }

  const current = questions[currentQuestion]

  const categoryLabel = (category) => {
    const map = {
      spelling: 'SPELLING',
      grammar: 'GRAMMAR',
      subject_verb: 'GRAMMAR',
      punctuation: 'PUNCTUATION',
      apostrophe: 'PUNCTUATION',
      homophones: 'WORD USAGE',
      sentence_structure: 'SENTENCE STRUCTURE',
      tense: 'VERB TENSES',
      formal_writing: 'FORMAL WRITING',
      advanced_grammar: 'ADVANCED GRAMMAR',
    }
    return map[category] || String(category || '').toUpperCase()
  }

  const calculateResult = (finalAnswers) => {
    const score = finalAnswers.filter((a) => a.correct).length

    const wrongCategories = finalAnswers.filter((a) => !a.correct).map((a) => a.weakness)
    const weaknesses = [...new Set(wrongCategories)]

    const correctCategories = finalAnswers
      .filter((a) => a.correct)
      .map((a) => questions.find((q) => q.id === a.questionId)?.category)
      .filter(Boolean)

    const strengths = [...new Set(correctCategories)].filter((s) => !weaknesses.includes(s))

    let level = 1
    let levelLabel = 'Beginner'
    if (score <= 3) {
      level = 1
      levelLabel = 'Beginner'
    } else if (score <= 5) {
      level = 2
      levelLabel = 'Elementary'
    } else if (score <= 7) {
      level = 3
      levelLabel = 'Intermediate'
    } else if (score <= 9) {
      level = 4
      levelLabel = 'Upper Intermediate'
    } else {
      level = 5
      levelLabel = 'Advanced'
    }

    setAuthData((prev) => ({
      ...prev,
      score,
      level,
      levelLabel,
      strengths,
      weaknesses,
      quizAnswers: finalAnswers,
      levelMessage: levelMessages[level],
    }))

    setCurrentPage('signup-result')
  }

  const selectOption = (index) => {
    if (selected !== null || isAnimating) return

    setSelected(index)
    setTimeout(() => {
      const picked = {
        questionId: current.id,
        selected: index,
        correct: index === current.correct,
        weakness: current.weakness,
      }
      const nextAnswers = [...answers, picked]

      setAnswers(nextAnswers)
      setSelected(null)
      setIsAnimating(true)

      setTimeout(() => {
        if (currentQuestion < 9) {
          setCurrentQuestion((prev) => prev + 1)
          setIsAnimating(false)
        } else {
          calculateResult(nextAnswers)
        }
      }, 300)
    }, 600)
  }

  const progress = `${((currentQuestion + 1) / 10) * 100}%`
  const letters = ['A', 'B', 'C', 'D']

  return (
    <AuthLayout>
      <StepIndicator currentStep={3} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 }}>Writing Assessment</h2>
          <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '2px 0 0' }}>Help us personalise your learning path</p>
        </div>
        <button type="button"
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => { setAuthData((prev) => ({ ...prev, level: 1, levelLabel: 'Beginner', score: 0, strengths: [], weaknesses: [] })); setCurrentPage('signup-result'); }}
        >
          Skip <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      <div style={{ opacity: isAnimating ? 0 : 1, transition: 'opacity 0.3s ease', background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '1.75rem', boxShadow: '0 2px 12px rgba(91,95,222,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: '0.82rem', color: '#6B7280' }}>
            Question <strong style={{ color: WW_PRIMARY }}>{currentQuestion + 1}</strong> / 10
          </p>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize',
            background: current.difficulty === 'easy' ? '#F0FDF4' : current.difficulty === 'medium' ? '#FFF7ED' : '#FFF1F2',
            color: current.difficulty === 'easy' ? '#16A34A' : current.difficulty === 'medium' ? '#EA580C' : '#DC2626',
          }}>{current.difficulty}</span>
        </div>

        <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 999, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress, background: WW_PRIMARY, borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>

        <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: WW_PRIMARY, textTransform: 'uppercase', marginBottom: 8 }}>{categoryLabel(current.category)}</p>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', lineHeight: 1.5, marginBottom: 20 }}>{current.question}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.options.map((option, index) => {
            const active = selected === index
            return (
              <button key={option} type="button" onClick={() => selectOption(index)}
                style={{
                  width: '100%', textAlign: 'left', padding: '13px 18px', borderRadius: 12,
                  border: `2px solid ${active ? WW_PRIMARY : '#E5E7EB'}`,
                  background: active ? WW_PRIMARY_LIGHT : '#fff',
                  color: active ? WW_PRIMARY : '#374151',
                  fontWeight: active ? 600 : 400, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.18s ease', fontFamily: 'inherit', fontSize: '0.9rem',
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = WW_PRIMARY; e.currentTarget.style.background = WW_PRIMARY_LIGHT; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#fff'; } }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: active ? WW_PRIMARY : '#F3F4F6', color: active ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                  {letters[index]}
                </div>
                <span style={{ flex: 1 }}>{option}</span>
              </button>
            )
          })}
        </div>
      </div>
    </AuthLayout>
  )
}

export function SignupResultPage({ authData, setAuthData, onAuthenticated }) {
  const levelMessages = {
    1: "Let's start from the foundations! You'll be surprised how fast you improve.",
    2: "Good start! You know the basics. Let's strengthen your grammar and punctuation.",
    3: 'Solid foundation! Time to tackle the trickier grammar rules.',
    4: "Impressive! Let's polish your writing to a professional level.",
    5: 'Excellent! You have strong grammar skills. Let\'s perfect your writing style.',
  }

  const levelIcon = {
    1: BookOpen,
    2: BookOpen,
    3: Layers,
    4: TrendingUp,
    5: Award,
  }[authData.level || 1]

  const score = authData.score || 0

  const complete = () => {
    onAuthenticated?.()
  }

  const ListBlock = ({ title, icon: Icon, items, empty, tone }) => (
    <div className={tone === 'green' ? 'bg-green-50 rounded-xl p-4' : 'bg-orange-50 rounded-xl p-4'}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${tone === 'green' ? 'text-green-600' : 'text-orange-500'}`} />
        <p className={`text-sm font-semibold ${tone === 'green' ? 'text-green-600' : 'text-orange-500'}`}>{title}</p>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${tone === 'green' ? 'bg-green-600' : 'bg-orange-500'}`} />
              <span className={`text-xs capitalize ${tone === 'green' ? 'text-green-600' : 'text-orange-500'}`}>
                {String(item).replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-xs ${tone === 'green' ? 'text-green-600' : 'text-orange-500'}`}>{empty}</p>
      )}
    </div>
  )

  return (
    <AuthLayout>
      <div style={{ overflowY: 'auto', maxHeight: '80vh', paddingRight: 4 }}>
      <StepIndicator currentStep={4} />

      <div style={{ width: 56, height: 56, background: WW_PRIMARY_LIGHT, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Sparkles className="w-7 h-7" style={{ color: WW_PRIMARY }} />
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 6 }}>Your Learning Profile is Ready!</h2>
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6B7280', marginBottom: 24 }}>
        We've personalised your learning path based on your answers
      </p>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
          <div className="flex gap-2 justify-center mb-4 flex-wrap">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${idx < score ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <p className="text-center mb-4 text-base text-slate-500">
            You scored <span className="text-2xl font-bold text-blue-600">{score}</span> out of 10
          </p>

          <div className="h-px bg-slate-200" />

          <div className="mt-4 text-center">
            <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">YOUR STARTING LEVEL</p>
            <div className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl mx-auto">
              {React.createElement(levelIcon, { className: 'w-6 h-6 text-white' })}
              <div>
                <p className="text-xl font-bold">LEVEL {authData.level}</p>
                <p className="text-sm font-medium text-blue-200">{authData.levelLabel}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <ListBlock
              title="Your Strengths"
              icon={CheckCircle}
              items={authData.strengths || []}
              empty="Complete more lessons to discover your strengths!"
              tone="green"
            />
            <ListBlock
              title="Focus Areas"
              icon={AlertTriangle}
              items={authData.weaknesses || []}
              empty="Amazing! No major weak areas found."
              tone="orange"
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mt-4 flex items-start gap-3">
            <Lightbulb className="w-4.5 h-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-600 leading-relaxed">{levelMessages[authData.level || 1]}</p>
          </div>

          <div className="mt-6 mb-6">
            <p className="text-sm font-semibold text-slate-800 mb-3">What happens next:</p>
            <div className="flex flex-col gap-2">
              {[
                `We'll start you at Level ${authData.levelLabel}`,
                'Focus lessons target your weak areas first',
                'Track your improvement with detailed analytics',
              ].map((text, idx) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={complete}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <Rocket className="w-5 h-5" />
            Start Learning Now
          </button>

          <div className="text-center mt-3">
            <button
            type="button"
            style={{ fontSize: '0.75rem', color: '#9CA3AF', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => { setAuthData((prev) => ({ ...prev, level: 1, levelLabel: 'Beginner' })); complete(); }}
          >
            Prefer to start from Level 1 instead?
          </button>
        </div>
        </div>
      </div>
    </AuthLayout>
  )
}

export function AuthApp({ onAuthenticated }) {
  const [currentPage, setCurrentPage] = useState('login')
  const [animKey, setAnimKey] = useState(0)
  const [authData, setAuthData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    otp: '',
    quizAnswers: [],
    score: 0,
    level: 1,
    levelLabel: 'Beginner',
    strengths: [],
    weaknesses: [],
  })

  const navigate = (page) => {
    setAnimKey((k) => k + 1)
    setCurrentPage(page)
  }

  const props = { setCurrentPage: navigate, authData, setAuthData, onAuthenticated }

  const renderPage = () => {
    switch (currentPage) {
      case 'login': return <LoginPage {...props} />
      case 'forgot-email': return <ForgotEmailPage {...props} />
      case 'forgot-otp': return <ForgotOtpPage {...props} />
      case 'forgot-password': return <ForgotNewPasswordPage {...props} />
      case 'forgot-success': return <ForgotSuccessPage {...props} />
      case 'signup-details': return <SignupDetailsPage {...props} />
      case 'signup-otp': return <SignupOtpPage {...props} />
      case 'signup-quiz': return <AssessmentQuizPage {...props} />
      case 'signup-result': return <SignupResultPage {...props} />
      default: return <LoginPage {...props} />
    }
  }

  return (
    <div key={animKey} className="ww-page-enter" style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      {renderPage()}
    </div>
  )
}

export default AuthApp
