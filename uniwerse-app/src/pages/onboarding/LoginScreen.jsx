import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoginDeco, LoginRightDeco } from '../../components/common/HexDeco';
import ThemeToggle from '../../components/common/ThemeToggle';
import campusImg from '../../Assets/campus.jpeg';
import logo from '../../Assets/logo.jpeg';
import './onboarding.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';

  const { pendingAccessType, pendingRole, setPendingAccessType, setPendingRole, login, loginAsGuest, register } = useAuth();

  const [activeTab, setActiveTab] = useState(pendingAccessType === 'guest' ? 'guest' : 'member');
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [societyValue, setSocietyValue] = useState('');

  const isMember = activeTab === 'member';
  const signupRole = pendingRole || 'Student';
  const needsSociety = isSignup && signupRole === 'Society Head';

  function goToDashboard(role) {
    if (role === 'Society Head') navigate('/society-head');
    else navigate('/student');
  }

  async function attemptSubmit() {
    const name = nameValue.trim();
    const email = emailValue.trim();
    const password = passwordValue.trim();
    const society = societyValue.trim();

    if (!email || !password) {
      showToast('Please enter your email and password');
      return;
    }
   if (isSignup && signupRole === 'Student' && !email.toLowerCase().endsWith('@igdtuw.ac.in')) {
  showToast('Students must sign up with their @igdtuw.ac.in email');
  return;
}

   // Guest flow — creates/reuses a lightweight guest account on the backend
    if (!isMember) {
      showToast('Logging in as Guest…');
      try {
        await loginAsGuest(email);
        setTimeout(() => navigate('/student'), 700);
      } catch (error) {
        showToast(error.message || 'Could not continue as guest');
      }
      return;
    }

    // --- Signup mode ---
    if (isSignup) {
      if (!name) {
        showToast('Please enter your name');
        return;
      }
      if (needsSociety && !society) {
        showToast('Please enter your society name');
        return;
      }

      showToast('Creating your account…');
      try {
        const user = await register({
          name,
          email,
          password,
          role: signupRole,
          society: needsSociety ? society : null,
        });
        showToast('Welcome, ' + user.name + '!');
        setTimeout(() => goToDashboard(user.role), 700);
      } catch (error) {
        showToast(error.message || 'Signup failed. Please try again.');
      }
      return;
    }

    // --- Login mode ---
    showToast('Logging in…');
    try {
      const user = await login({ email, password });
      showToast('Logging in as ' + user.role + '…');
      setTimeout(() => goToDashboard(user.role), 700);
    } catch (error) {
      showToast(error.message || 'Login failed. Please check your credentials.');
    }
  }

  return (
    <div className="page-shell">
      <div className="device">
        <div className="stage">
          <div className="pane-left">
            <LoginDeco />
            <div className="as-top-row">
              <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
              <ThemeToggle />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <img src={logo} alt="UniWerse logo" className="logo-mark" style={{ margin: '0 auto 22px' }} />
              <div className="brand-name">UniWerse</div>
              <p className="brand-tag" style={{ margin: '8px auto 0', textAlign: 'center' }}>
                IGDTUW College Event Management System
              </p>
              <div className="hr-line" style={{ margin: '24px auto' }} />
              <div style={{ border: '2px solid #F4EFE1', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 300, boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
                <img src={campusImg} alt="IGDTUW campus" style={{ display: 'block', width: '100%', height: 'auto' }} />
              </div>
              <div className="tags" style={{ justifyContent: 'center', marginTop: 22 }}>
                <span className="tag" style={{ color: '#F4EFE1', borderColor: '#4b4a55', background: 'transparent' }}>Student Events</span>
                <span className="tag" style={{ color: '#F4EFE1', borderColor: '#4b4a55', background: 'transparent' }}>Society Dashboard</span>
              </div>
            </div>
          </div>

          <div className="pane-right end">
            <LoginRightDeco />
            <div className="login-wrap">
              <h1 className="title" style={{ fontSize: 26 }}>
                {isSignup ? 'Create your UniWerse account' : 'Log in to UniWerse'}
              </h1>
              <p className="sub" style={{ marginBottom: 22, fontSize: 13.5 }}>
                {isSignup ? 'Set up your credentials to get started.' : 'Use your official credentials based on your role.'}
              </p>

              <div className="notice locked">
                ✓ {isSignup ? 'Signing up as' : 'Continuing as'} <b>{isMember ? (isSignup ? signupRole : (pendingRole || 'IGDTUW Member')) : 'Guest / Outsider'}</b>
              </div>

              {isMember ? (
  <div className="notice">
    {isSignup && signupRole === 'Society Head' ? (
      <>Sign up using your <b>society's official email</b> (Gmail or otherwise) — it doesn't need to be an IGDTUW address.</>
    ) : (
      <><b>IGDTUW members</b> must use their official <b>@igdtuw.ac.in</b> email address. Other emails will not be accepted.</>
    )}
  </div>
) : (
                <div className="notice">
                  Guests can use any personal or institutional email. You will only see events open to external participants.
                </div>
              )}

              {isSignup && isMember && (
                <div className="field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
              )}

              <div className="field">
                <label>{isMember ? 'Official IGDTUW Email' : 'Email Address'}</label>
                <input
                  type="text"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder={isMember ? 'rollno@igdtuw.ac.in' : 'you@college.edu'}
                />
                {isMember && !(isSignup && signupRole === 'Society Head') && (
  <div className="hint">Must be your @igdtuw.ac.in address</div>
)}
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>

              {needsSociety && (
                <div className="field">
                  <label>Society Name</label>
                  <input
                    type="text"
                    value={societyValue}
                    onChange={(e) => setSocietyValue(e.target.value)}
                    placeholder="e.g. Cultural Society"
                  />
                </div>
              )}

              {!isSignup && (
                <div className="row-between">
                  <label className="checkbox-line"><input type="checkbox" style={{ accentColor: 'var(--ink)' }} /> Remember me</label>
                  <a>Forgot password?</a>
                </div>
              )}

              <button className="btn" onClick={attemptSubmit}>
                {isSignup
                  ? (isMember ? `Create ${signupRole} Account` : 'Continue as Guest')
                  : (isMember ? 'Log In as IGDTUW Member' : 'Log In as Guest')}
              </button>

              {!isSignup && (
                <>
                  <div className="or-divider">or</div>
                  <button className="btn outline" onClick={() => showToast('Redirecting to Google…')}>Continue with Google</button>
                </>
              )}

              <div className="footer-line" style={{ marginTop: 18 }}>
                {isSignup ? (
                  <>Already have an account? <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Log in →</a></>
                ) : isMember ? (
                  <>New member? <a onClick={() => navigate('/role')} style={{ cursor: 'pointer' }}>Request account →</a></>
                ) : (
                  <>No account? <a>Sign up as Guest →</a></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}