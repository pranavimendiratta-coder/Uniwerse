import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from "../../components/common/BackButton";
import ThemeToggle from '../../components/common/ThemeToggle';
import { getInitials } from '../../utils/getInitials';
import logo from '../../Assets/logo.jpeg';
import './society.css';

const NAV_ITEMS = [
  { to: '/society', label: 'Dashboard', end: true },
  { to: '/society/create', label: 'Create Event' },
  { to: '/society/attendees', label: 'Attendee List' },
  { to: '/society/qr', label: 'QR Check-in' },
  { to: '/society/tasks', label: 'Task Board' },
  { to: '/society/updates-to-head', label: 'Updates to Society Head' },
];

export default function SocietyLayout() {
  const navigate = useNavigate();
  const { email, logout, name } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="page-shell top">
      <div className="device wide" style={{ display: 'flex', alignItems: 'stretch' }}>
        <div className="admin-sidebar">
          <div className="as-top-row">
            <BackButton to="/student" />
            <ThemeToggle />
          </div>
          <div className="as-logo"><img src={logo} alt="UniWerse logo" className="mark" />UniWerse</div>
          <div className="as-role">Society POC</div>
          <div className="as-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `as-item${isActive ? ' active' : ''}`}
              >
                <span className="ic" />{item.label}
              </NavLink>
            ))}
          </div>
          <div className="as-user">
            <div className="av">{getInitials(name, email)}</div>
            <div><b>{name || 'POC User'}</b><span>{email || 'Society POC'}</span></div>
          </div>
          
          <button className="as-logout" onClick={handleLogout}>Log out</button>
        </div>

        <div className="main-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}