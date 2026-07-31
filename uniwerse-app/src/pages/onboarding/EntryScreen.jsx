import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EntryLeftDeco, EntryRightDeco } from '../../components/common/HexDeco';
import logo from '../../Assets/logo.jpeg';

import './onboarding.css';

export default function EntryScreen() {
  const navigate = useNavigate();
  const { setPendingAccessType, setPendingRole } = useAuth();

  function chooseAccess(type) {
    setPendingAccessType(type);
    if (type === 'member') {
      navigate('/role');
    } else {
      setPendingRole('Guest');
      navigate('/guest');
    }
  }

  return (
    <div className="page-shell">
      <div className="device">
        <div className="stage">
          <div className="pane-left">
            <EntryLeftDeco />
            <button className="back-btn hidden">← Back</button>
            <img src={logo} alt="UniWerse logo" className="logo-mark" />
            <div className="brand-name">UniWerse</div>
            <p className="brand-tag">
              College event management for IGDTUW — discover, register, and manage campus events in one place.
            </p>
            <div className="hr-line" />
            <ul className="stat-list">
              <li><span className="dot g" />500+ Events per year</li>
              <li><span className="dot b" />28 Active societies</li>
              <li><span className="dot p" />Faculty-verified events</li>
              <li><span className="dot g" />Open events for all colleges</li>
            </ul>
          </div>

          <div className="pane-right">
            <EntryRightDeco />
            <div style={{ textAlign: 'center' }}>
              <h1 className="title">Who are you?</h1>
              <p className="sub" style={{ textAlign: 'center', margin: '0 auto 30px' }}>
                Select your role to continue. This helps us show you the right events and features.
              </p>
            </div>
            <div className="card-grid">
              <div className="entry-card" onClick={() => chooseAccess('member')}>
                <div className="icon-sq pink">🎓</div>
                <h3>IGDTUW Member</h3>
                <p className="desc">
                  Students  &amp; Society POCs of Indira Gandhi Delhi Technical University for Women
                </p>
                <div className="tags">
                  <span className="tag">Student</span>
                  <span className="tag">Society POC</span>
                  <span className="tag">Society Head</span>
                </div>
                <div className="divider" style={{ marginBottom: 16 }} />
                <button className="btn">Continue as IGDTUW Member →</button>
                <div className="btn-note">Requires official @igdtuw.ac.in email</div>
              </div>

              <div className="entry-card" onClick={() => chooseAccess('guest')}>
                <div className="icon-sq blue">🌐</div>
                <h3>Guest / Outsider</h3>
                <p className="desc">
                  Participants from other colleges or institutions attending open events hosted by IGDTUW societies
                </p>
                <div className="tags">
                  <span className="tag">Event Participant</span>
                </div>
                <div className="divider" style={{ marginBottom: 16 }} />
                <button className="btn">Continue as Guest →</button>
                <div className="btn-note">Personal or institutional email accepted</div>
              </div>
            </div>
            <div className="footer-line">
              Already have an account?{' '}
              <a
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingAccessType(null);
                  setPendingRole(null);
                  navigate('/login');
                }}
              >
                Log in directly →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
