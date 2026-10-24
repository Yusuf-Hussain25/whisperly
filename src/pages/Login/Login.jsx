import { useState } from 'react'
import './Login.css'
import { AtSign, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Zap, ImageIcon, ArrowRight } from 'lucide-react';
import { signup, login, resetPass } from '../../config/firebase';
import Logo from '../../components/ui/Logo';
import Avatar from '../../components/ui/Avatar';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;

const FEATURES = [
  { icon: Zap, title: 'Real-time', text: 'Messages land the instant they are sent.' },
  { icon: ShieldCheck, title: 'Private by design', text: 'Only the two of you can read a conversation.' },
  { icon: ImageIcon, title: 'Share moments', text: 'Send photos and browse shared media.' },
];

const Login = () => {

  const [currState, setCurrState] = useState("Sign up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignup = currState === "Sign up";

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    if (isSignup) {
      await signup(userName, email, password);
    } else {
      await login(email, password);
    }
    setLoading(false);
  }

  const tryDemo = async () => {
    setLoading(true);
    await login(DEMO_EMAIL, DEMO_PASSWORD);
    setLoading(false);
  }

  return (
    <div className='auth'>
      <section className='auth-hero'>
        <Logo size={36} />
        <div className='auth-hero-copy'>
          <span className='auth-badge'><Sparkles size={14} /> Private, real-time chat</span>
          <h1>Conversations that feel <span className='gradient-text'>close</span>, wherever you are.</h1>
          <p>A fast, private messenger for the people who matter. Pick up any conversation right where you left it.</p>
        </div>

        <div className='auth-preview' aria-hidden="true">
          <div className='preview-row in' style={{ animationDelay: '.1s' }}>
            <Avatar name="Aisha Khan" size={30} />
            <p>Did you see the launch? 🚀</p>
          </div>
          <div className='preview-row out' style={{ animationDelay: '.5s' }}>
            <p>Watching it right now, it looks unreal</p>
          </div>
          <div className='preview-row in' style={{ animationDelay: '.9s' }}>
            <Avatar name="Aisha Khan" size={30} />
            <p className='typing'><span /><span /><span /></p>
          </div>
        </div>

        <ul className='auth-features'>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className='feature-icon'><Icon size={18} /></span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className='auth-panel'>
        <form onSubmit={onSubmitHandler} className='auth-card glass'>
          <div className='auth-card-logo'><Logo size={30} /></div>
          <div className='auth-card-head'>
            <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
            <p>{isSignup ? 'Join Whisperly in less than a minute.' : 'Log in to continue your conversations.'}</p>
          </div>

          <div className='segmented' role="tablist">
            <span className='segmented-thumb' style={{ transform: `translateX(${isSignup ? 0 : 100}%)` }} />
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'active' : ''} onClick={() => setCurrState("Sign up")}>Sign up</button>
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'active' : ''} onClick={() => setCurrState("Login")}>Log in</button>
          </div>

          {isSignup &&
            <div className='field'>
              <label htmlFor='username'>Username</label>
              <div className='input-wrap'>
                <AtSign size={17} />
                <input id='username' onChange={(e) => setUserName(e.target.value.replace(/\s/g, ''))} value={userName} className='input' type="text" placeholder='yourname' autoComplete='username' pattern="[A-Za-z0-9_.]{3,20}" title="3-20 letters, numbers, dots or underscores" required />
              </div>
            </div>}

          <div className='field'>
            <label htmlFor='email'>Email</label>
            <div className='input-wrap'>
              <Mail size={17} />
              <input id='email' onChange={(e) => setEmail(e.target.value)} value={email} className='input' type="email" placeholder='you@example.com' autoComplete='email' required />
            </div>
          </div>

          <div className='field'>
            <div className='field-row'>
              <label htmlFor='password'>Password</label>
              {!isSignup && <button type="button" className='link-btn' onClick={() => resetPass(email)}>Forgot password?</button>}
            </div>
            <div className='input-wrap'>
              <Lock size={17} />
              <input id='password' onChange={(e) => setPassword(e.target.value)} value={password} className='input' type={showPassword ? "text" : "password"} placeholder={isSignup ? 'At least 6 characters' : 'Your password'} autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={6} required />
              <button type="button" className='icon-btn input-action' onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {isSignup &&
            <label className='check'>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
              <span className='check-box' />
              <span>I agree to the <a href="#" onClick={(e) => e.preventDefault()}>terms of use</a> and <a href="#" onClick={(e) => e.preventDefault()}>privacy policy</a>.</span>
            </label>}

          <button type='submit' className='btn btn-primary btn-block' disabled={loading}>
            {loading ? <span className='spinner' /> : <>{isSignup ? "Create account" : "Log in"} <ArrowRight size={17} /></>}
          </button>

          {DEMO_EMAIL && DEMO_PASSWORD &&
            <>
              <div className='divider'><span>or</span></div>
              <button type="button" className='btn btn-ghost btn-block' onClick={tryDemo} disabled={loading}>
                <Sparkles size={16} /> Explore with a demo account
              </button>
            </>}

          <p className='auth-switch'>
            {isSignup ? 'Already have an account?' : 'New to Whisperly?'}{' '}
            <button type="button" className='link-btn' onClick={() => setCurrState(isSignup ? "Login" : "Sign up")}>
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}

export default Login
