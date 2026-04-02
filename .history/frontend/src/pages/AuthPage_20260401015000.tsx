import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2,
  Gift,
  Shield,
  Zap,
  Trophy,
  Users,
  DollarSign,
  Chrome,
  Github
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'

type AuthMode = 'login' | 'signup'

interface LoginFormData {
  username_or_email: string
  password: string
  rememberMe: boolean
}

interface SignupFormData {
  username: string
  email: string
  phone_number: string
  password: string
  confirmPassword: string
  ageConfirmation: boolean
  termsAccepted: boolean
}

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #9333ea 0%, transparent 70%)',
          top: '-10%',
          left: '-10%'
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
          top: '50%',
          right: '-10%'
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [90, 0, 90],
          opacity: [0.5, 0.3, 0.5]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
          bottom: '-10%',
          left: '30%'
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -90, 0],
          opacity: [0.3, 0.45, 0.3]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4
        }}
      />

      {/* Floating Game Icons */}
      {['🎰', '🎲', '🃏', '🎯', '🎱', '🏆'].map((icon, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl opacity-20"
          style={{
            left: `${15 + (index * 15)}%`,
            top: `${20 + (index * 10)}%`
          }}
          animate={{
            y: [-20, -120, -20],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 10 + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 1.5
          }}
        >
          {icon}
        </motion.div>
      ))}
    </div>
  )
}

const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all duration-300 cursor-default"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-white/60 text-xs">{description}</p>
    </motion.div>
  )
}

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const getStrength = (): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: 'bg-gray-600' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    if (strength <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
    if (strength <= 3) return { level: 2, label: 'Fair', color: 'bg-yellow-500' }
    if (strength <= 4) return { level: 3, label: 'Good', color: 'bg-blue-500' }
    return { level: 4, label: 'Strong', color: 'bg-green-500' }
  }

  const { level, label, color } = getStrength()

  if (!password) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2"
    >
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= level ? color : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${level <= 1 ? 'text-red-400' : level <= 2 ? 'text-yellow-400' : level <= 3 ? 'text-blue-400' : 'text-green-400'}`}>
        Password strength: {label}
      </p>
    </motion.div>
  )
}

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { state, login, register } = useAuth()
  const navigate = useNavigate()

  const loginForm = useForm<LoginFormData>({
    defaultValues: {
      username_or_email: '',
      password: '',
      rememberMe: false
    },
    mode: 'onBlur'
  })

  const signupForm = useForm<SignupFormData>({
    defaultValues: {
      username: '',
      email: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      ageConfirmation: false,
      termsAccepted: false
    },
    mode: 'onBlur'
  })

  const watchedPassword = signupForm.watch('password')

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard')
    }
  }, [state.isAuthenticated, navigate])

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      await login({
        username_or_email: data.username_or_email,
        password: data.password
      })
      toast.success('Welcome back!')
    } catch (error) {
      toast.error('Login failed. Please check your credentials.')
    }
  }

  const onSignupSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      signupForm.setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }

    try {
      await register({
        username: data.username,
        email: data.email || undefined,
        phone_number: data.phone_number,
        password: data.password
      })
      toast.success('Account created successfully!')
    } catch (error) {
      toast.error('Registration failed. Please try again.')
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    loginForm.reset()
    signupForm.reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Branding (Desktop Only) */}
        <motion.div
          className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-4xl font-bold text-white">G</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl font-bold mb-4 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Play. Bet. Win.
            </span>
          </motion.h1>
          
          <motion.p
            className="text-white/60 text-lg mb-10 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Join thousands of players in the ultimate peer-to-peer gaming and betting experience.
          </motion.p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <FeatureCard
              icon={<Shield className="w-5 h-5 text-white" />}
              title="Secure & Fair"
              description="Provably fair gaming with transparent outcomes"
              delay={0.4}
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-white" />}
              title="Instant Payouts"
              description="Withdraw your winnings in seconds"
              delay={0.5}
            />
            <FeatureCard
              icon={<Trophy className="w-5 h-5 text-white" />}
              title="Tournaments"
              description="Compete in daily and weekly tournaments"
              delay={0.6}
            />
            <FeatureCard
              icon={<Gift className="w-5 h-5 text-white" />}
              title="Welcome Bonus"
              description="Get $10 free credit on signup"
              delay={0.7}
            />
          </div>

          {/* Social Proof */}
          <motion.div
            className="flex gap-8 pt-6 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold">10,000+</p>
                <p className="text-white/50 text-xs">Active Players</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">$500K+</p>
                <p className="text-white/50 text-xs">Paid Out</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Panel - Auth Forms */}
        <motion.div
          className="w-full lg:w-1/2 flex items-center justify-center p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <motion.div
              className="lg:hidden flex justify-center mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-3xl font-bold text-white">G</span>
              </div>
            </motion.div>

            {/* Glass Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
              {/* Tab Switcher */}
              <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                <button
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    mode === 'login'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  aria-selected={mode === 'login'}
                  role="tab"
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                    mode === 'signup'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  aria-selected={mode === 'signup'}
                  role="tab"
                >
                  Sign Up
                </button>
              </div>

              {/* Error Display */}
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                  role="alert"
                >
                  {state.error}
                </motion.div>
              )}

              {/* Welcome Bonus Banner (Signup Only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 text-sm font-medium">
                        Welcome bonus: <span className="text-white">$10 free credit</span> on signup!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <AnimatePresence mode="wait">
                {mode === 'login' && (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Email/Username Input */}
                    <div>
                      <label htmlFor="login-username" className="block text-sm font-medium text-white/80 mb-1.5">
                        Email or Username
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="login-username"
                          type="text"
                          autoComplete="username"
                          placeholder="you@example.com"
                          className={`w-full h-10 pl-10 pr-4 bg-white/5 border ${
                            loginForm.formState.errors.username_or_email ? 'border-red-500' : 'border-white/10'
                          } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                          {...loginForm.register('username_or_email', {
                            required: 'Email or username is required'
                          })}
                        />
                      </div>
                      {loginForm.formState.errors.username_or_email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-400"
                          role="alert"
                        >
                          {loginForm.formState.errors.username_or_email.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="login-password" className="block text-sm font-medium text-white/80">
                          Password
                        </label>
                        <button
                          type="button"
                          className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                          onClick={() => toast.info('Password reset functionality coming soon!')}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className={`w-full h-10 pl-10 pr-12 bg-white/5 border ${
                            loginForm.formState.errors.password ? 'border-red-500' : 'border-white/10'
                          } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                          {...loginForm.register('password', {
                            required: 'Password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                          })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-400"
                          role="alert"
                        >
                          {loginForm.formState.errors.password.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-2">
                      <input
                        id="remember-me"
                        type="checkbox"
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/20 cursor-pointer"
                        {...loginForm.register('rememberMe')}
                      />
                      <label htmlFor="remember-me" className="text-sm text-white/60 cursor-pointer">
                        Remember me for 30 days
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={state.isLoading}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {state.isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Signup Form */}
                {mode === 'signup' && (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                    className="space-y-4"
                    noValidate
                  >
                    {/* Username Input */}
                    <div>
                      <label htmlFor="signup-username" className="block text-sm font-medium text-white/80 mb-1.5">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="signup-username"
                          type="text"
                          autoComplete="username"
                          placeholder="coolplayer123"
                          className={`w-full h-10 pl-10 pr-4 bg-white/5 border ${
                            signupForm.formState.errors.username ? 'border-red-500' : 'border-white/10'
                          } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                          {...signupForm.register('username', {
                            required: 'Username is required',
                            minLength: { value: 3, message: 'Username must be at least 3 characters' },
                            maxLength: { value: 20, message: 'Username must be less than 20 characters' },
                            pattern: { value: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers, and underscores' }
                          })}
                        />
                      </div>
                      {signupForm.formState.errors.username && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-400"
                          role="alert"
                        >
                          {signupForm.formState.errors.username.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Email Input */}
                    <div>
                      <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-1.5">
                        Email <span className="text-white/40">(optional)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          className={`w-full h-10 pl-10 pr-4 bg-white/5 border ${
                            signupForm.formState.errors.email ? 'border-red-500' : 'border-white/10'
                          } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                          {...signupForm.register('email', {
                            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                          })}
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-400"
                          role="alert"
                        >
                          {signupForm.formState.errors.email.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label htmlFor="signup-phone" className="block text-sm font-medium text-white/80 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          id="signup-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="1234567890"
                          className={`w-full h-10 pl-10 pr-4 bg-white/5 border ${
                            signupForm.formState.errors.phone_number ? 'border-red-500' : 'border-white/10'
                          } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                          {...signupForm.register('phone_number', {
                            required: 'Phone number is required',
                            pattern: { value: /^[0-9]{10,15}$/, message: 'Phone number must be 10-15 digits' }
                          })}
                        />
                      </div>
                      {signupForm.formState.errors.phone_number && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-400"
                          role="alert"
                        >
                          {signupForm.formState.errors.phone_number.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Password Fields (Side by Side) */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Password */}
                      <div>
                        <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={`w-full h-10 pl-10 pr-10 bg-white/5 border ${
                              signupForm.formState.errors.password ? 'border-red-500' : 'border-white/10'
                            } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                            {...signupForm.register('password', {
                              required: 'Password is required',
                              minLength: { value: 6, message: 'Min 6 characters' },
                              maxLength: { value: 128, message: 'Max 128 characters' }
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {signupForm.formState.errors.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-xs text-red-400"
                            role="alert"
                          >
                            {signupForm.formState.errors.password.message}
                          </motion.p>
                        )}
                        <PasswordStrengthMeter password={watchedPassword} />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-white/80 mb-1.5">
                          Confirm
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                          <input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            className={`w-full h-10 pl-10 pr-10 bg-white/5 border ${
                              signupForm.formState.errors.confirmPassword ? 'border-red-500' : 'border-white/10'
                            } rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
                            {...signupForm.register('confirmPassword', {
                              required: 'Please confirm password',
                              validate: value => value === watchedPassword || 'Passwords do not match'
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {signupForm.formState.errors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-xs text-red-400"
                            role="alert"
                          >
                            {signupForm.formState.errors.confirmPassword.message}
                          </motion.p>
                        )}
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <input
                          id="age-confirmation"
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/20 cursor-pointer"
                          {...signupForm.register('ageConfirmation', {
                            required: 'You must be 18+ to register'
                          })}
                        />
                        <label htmlFor="age-confirmation" className="text-sm text-white/60 cursor-pointer">
                          I am 18+ years old
                        </label>
                      </div>
                      {signupForm.formState.errors.ageConfirmation && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-400"
                          role="alert"
                        >
                          {signupForm.formState.errors.ageConfirmation.message}
                        </motion.p>
                      )}

                      <div className="flex items-start gap-2">
                        <input
                          id="terms-accepted"
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/20 cursor-pointer"
                          {...signupForm.register('termsAccepted', {
                            required: 'You must accept the terms and privacy policy'
                          })}
                        />
                        <label htmlFor="terms-accepted" className="text-sm text-white/60 cursor-pointer">
                          I agree to{' '}
                          <a href="/terms" target="_blank" className="text-purple-300 hover:text-purple-200 underline">
                            Terms
                          </a>{' '}
                          &{' '}
                          <a href="/privacy" target="_blank" className="text-purple-300 hover:text-purple-200 underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {signupForm.formState.errors.termsAccepted && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-red-400"
                          role="alert"
                        >
                          {signupForm.formState.errors.termsAccepted.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={state.isLoading}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {state.isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-transparent text-white/40">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  onClick={() => toast.info('Google login coming soon!')}
                  aria-label="Sign in with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 h-10 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                  onClick={() => toast.info('GitHub login coming soon!')}
                  aria-label="Sign in with GitHub"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>

              {/* Demo Credentials Banner */}
              <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs font-medium mb-1">Demo Credentials:</p>
                <p className="text-white/60 text-xs">Username: <span className="text-white">demo</span> | Password: <span className="text-white">demo123</span></p>
              </div>

              {/* Footer Links */}
              <div className="mt-6 text-center text-xs text-white/40">
                <Link to="/terms" className="text-purple-300 hover:text-purple-200 underline" target="_blank">
                  Terms of Service
                </Link>
                {' • '}
                <Link to="/privacy" className="text-purple-300 hover:text-purple-200 underline" target="_blank">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthPage