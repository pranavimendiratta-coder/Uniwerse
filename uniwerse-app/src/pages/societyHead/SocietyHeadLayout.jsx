import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SOCIETY, HEAD_PROFILE } from './societyHeadData';
import ThemeToggle from '../../components/common/ThemeToggle';
import { getInitials } from '../../utils/getInitials';
import logo from '../../Assets/logo.jpeg';
import './societyHeadLayout.css';
import './societyHead.css';

const NAV_ITEMS = [
  { to: '/society-head', label: 'Dashboard', end: true },
  { to: '/society-head/analytics', label: 'Analytics' },
  { to: '/society-head/events', label: 'Events' },
  { to: '/society-head/team', label: 'Team Management' },
  { to: '/society-head/manage-poc', label: 'Manage POCs' },
  { to: '/society-head/recruitment', label: 'Recruitment' },
  { to: '/society-head/reports', label: 'Reports' },
  { to: '/society-head/poc-updates', label: 'POC Updates' },
  { to: '/society-head/profile', label: 'Profile' },
  
];

export default function SocietyHeadLayout() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { logout, email, name, society } = useAuth();

  function handleLogout() {
    logout();
    showToast('Logged out');
    navigate('/');
  }

  const headInitials = getInitials(name, email);

  return (
    <div className="shl-shell">
      <aside className="shl-sidebar">
       <div className="as-top-row">
         <button className="shl-back-btn" onClick={() => navigate('/')}>← Back</button>
         <ThemeToggle />
       </div>
        <div className="shl-brand">
          <img src={logo} alt="UniWerse logo" className="shl-logo-mark" />
          <span>UniWerse</span>
        </div>

        <span className="shl-role-pill">Society Head</span>

        <div className="shl-society-card">
          <div className="shl-society-logo">{society ? getInitials(society) : SOCIETY.logoInitials}</div>
          <div className="shl-society-info">
            <span className="shl-society-name">{society || SOCIETY.name}</span>
            <span className="shl-head-name">{name || HEAD_PROFILE.name} · {HEAD_PROFILE.designation}</span>
          </div>
        </div>

        <nav className="shl-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'shl-nav-item' + (isActive ? ' active' : '')}
            >
              <span className="shl-nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shl-user-row">
          <div className="shl-user-avatar">{headInitials}</div>
          <div className="shl-user-info">
            <span className="shl-user-name">{name || HEAD_PROFILE.name}</span>
            <span className="shl-user-email">{email || 'head@igdtuw.ac.in'}</span>
          </div>
        </div>
       
        <button className="shl-logout-link" onClick={handleLogout}>Log out</button>
      </aside>

      <main className="shl-main">
        <Outlet />
      </main>
    </div>
  );
}