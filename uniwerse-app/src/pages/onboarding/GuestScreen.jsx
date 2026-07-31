import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GuestDeco } from '../../components/common/HexDeco';
import ThemeToggle from '../../components/common/ThemeToggle';
import logo from '../../Assets/logo.jpeg';
import './onboarding.css';

export default function GuestScreen() {
  const navigate = useNavigate();
  const { setPendingAccessType, setPendingRole } = useAuth();

  function continueAsGuest() {
    setPendingAccessType('guest');
    setPendingRole('Guest');
    navigate('/login');
  }

  return (
    <div className="page-shell">
      <div className="device">
        <div className="stage">
          <div className="pane-left narrow">
            <GuestDeco />
            <div className="as-top-row">
              <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
              <ThemeToggle />
            </div>
            <div style={{ marginTop: 24 }}>
              <img src={logo} alt="UniWerse logo" className="logo-mark sm" />
            </div>
            <div className="brand-name sm">UniWerse</div>
            <p style={{ fontSize: 12.5, color: '#C9C6BA', marginBottom: 10 }}>
              <b style={{ color: '#F4EFE1' }}>Guest / Outsider</b>
            </p>
            <p className="brand-tag">
              As a guest, you can browse and register for events that are open to participants outside IGDTUW.
            </p>
            <div className="side-note" style={{ marginTop: 24 }}>
              <b>WHAT YOU CAN ACCESS</b><br /><br />
              ✓ Events marked 'Open for All'<br />
              ✓ Events marked 'Outsiders Welcome'<br />
              ✗ IGDTUW-only events (hidden)<br />
              ✗ Internal society dashboards
            </div>
          </div>

          <div className="pane-right">
            <div className="guest-wrap">
              <h1 className="title">Continue as Guest</h1>
              <p className="sub">
                You will only see events open to outside participants. IGDTUW-internal events will not be visible to you.
              </p>

              <div className="guest-card">
                <div className="guest-head">
                  <div className="guest-avatar">G</div>
                  <div className="who"><b>Guest Participant</b><span>Other college / External participant</span></div>
                  <div className="pill-badge">Outsiders Welcome</div>
                </div>
                <div className="perm-grid">
                  <div className="perm"><span className="ck yes">✓</span> Browse open events</div>
                  <div className="perm"><span className="ck yes">✓</span> Register for events</div>
                  <div className="perm"><span className="ck yes">✓</span> QR check-in</div>
                  <div className="perm dim"><span className="ck no">✕</span> View IGDTUW-only events</div>
                  <div className="perm dim"><span className="ck no">✕</span> Society dashboard</div>
                  <div className="perm dim"><span className="ck no">✕</span> Admin tools</div>
                </div>
              </div>

              <button className="btn" style={{ maxWidth: 340, width: '100%' }} onClick={continueAsGuest}>
                Continue as Guest / Outsider →
              </button>
              <p className="btn-note">
                Your access is read-only for internal data. Registration data is handled per event organiser's policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
