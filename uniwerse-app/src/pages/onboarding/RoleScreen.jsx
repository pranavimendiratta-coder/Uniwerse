import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SmallHex } from '../../components/common/HexDeco';
import campusImg from '../../Assets/campus.jpeg';
import logo from '../../Assets/logo.jpeg';
import ThemeToggle from '../../components/common/ThemeToggle';
import './onboarding.css';

const ROLES = [
  {
    key: 'Student',
    badge: 'STU',
    badgeBg: 'var(--pink-soft)',
    desc: 'Enrolled student at IGDTUW. Browse events, register, check in, and track your calendar.',
    perks: ['View all IGDTUW events', 'Register for events', 'QR check-in', 'Calendar & notifications'],
  },
  
  {
    key: 'Society Head',
    badge: 'SH',
    badgeBg: 'var(--purple-soft)',
    desc: 'Oversees one IGDTUW society. Monitor health, growth, and reports without managing day-to-day events.',
    perks: ['Society health & analytics', 'Executive team overview', 'Download reports', 'Recruitment tracking'],
  },
];

export default function RoleScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { setPendingRole } = useAuth();
  const [selected, setSelected] = useState('Student');

  function pickRole(role) {
    setSelected(role);
    setPendingRole(role);
    showToast('Role selected: ' + role);
    setTimeout(() => navigate('/login?mode=signup'), 500);
  }

  return (
    <div className="page-shell">
      <div className="device">
        <div className="stage">
          <div className="pane-left">
            <SmallHex stroke="#3E6FA6" />
            <div className="as-top-row">
              <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
              <ThemeToggle />
            </div>
            <div style={{ marginTop: 24 }}>
              <img src={logo} alt="UniWerse logo" className="logo-mark sm" />
            </div>
            <div className="brand-name sm">UniWerse</div>
            <p style={{ fontSize: 12.5, color: '#C9C6BA', marginBottom: 22 }}>
              <b style={{ color: '#F4EFE1' }}>IGDTUW Member</b> · Select your role
            </p>
            <div className="hr-line" />
            <p className="brand-tag">within IGDTUW to continue to the right dashboard and event feed.</p>
            <p className="brand-tag" style={{ fontWeight: 700, color: '#F4EFE1' }}>
              IGDTUW — Indira Gandhi Delhi Technical University for Women
            </p>

            <div style={{ border: '2px solid #F4EFE1', borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 260, marginTop: 24, marginBottom: 24, boxShadow: '4px 4px 0 rgba(0,0,0,0.25)' }}>
              <img src={campusImg} alt="IGDTUW campus" style={{ display: 'block', width: '100%', height: 'auto' }} />
            </div>

            <div className="side-note">
              Role determines what you can see and do.<br />
              You can request a role change from <b>settings</b> later.
            </div>
          </div>

          <div className="pane-right top">
            <div className="eyebrow">Step 2 of 3</div>
            <h1 className="title">Select your role</h1>
            <p className="sub">Each role has a tailored view. Choose what best describes your position at IGDTUW.</p>

            {ROLES.map((r) => (
              <div
                key={r.key}
                className={`role-row${selected === r.key ? ' selected' : ''}`}
                onClick={() => setSelected(r.key)}
              >
                <div className="radio"><div className="fill" /></div>
                <div className="role-badge" style={{ background: r.badgeBg }}>{r.badge}</div>
                <div className="role-body">
                  <h3>{r.key}</h3>
                  <p>{r.desc}</p>
                  <div className="role-perks">
                    {r.perks.map((p) => (
                      <span className="perk" key={p}>✓ {p}</span>
                    ))}
                  </div>
                </div>
                <button
                  className="role-select-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    pickRole(r.key);
                  }}
                >
                  Select →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}