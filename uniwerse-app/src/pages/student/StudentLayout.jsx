import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BackButton from "../../components/common/BackButton";
import ThemeToggle from '../../components/common/ThemeToggle';
import { getInitials } from '../../utils/getInitials';
import logo from '../../Assets/logo.jpeg';
import './student.css';

export default function StudentLayout() {
  const navigate = useNavigate();
  const { email, logout, accessType, pocOf, name } = useAuth();
  const isGuest = accessType === 'guest';

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="page-shell top">
      <div className="device student">
        <div className="navbar">
          <BackButton to="/" />
          <div className="nav-logo"><img src={logo} alt="UniWerse logo" className="mark" />UniWerse</div>
          <div className="navlinks">
            <NavLink to="/student" end className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>Home</NavLink>
            <NavLink to="/student/societies" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>Societies</NavLink>
            <NavLink to="/student/calendar" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>Calendar</NavLink>
            <NavLink to="/student/notifications" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>Notifications</NavLink>
            <NavLink to="/student/chat" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>Chatbot</NavLink>
            {pocOf && pocOf.length > 0 && (
              <NavLink to="/society" className={({ isActive }) => `navlink${isActive ? ' active' : ''}`}>
                Manage {pocOf[0]}{pocOf.length > 1 ? ` +${pocOf.length - 1}` : ''}
              </NavLink>
            )}
          </div>
          <div className="nav-right">
            <div className="role-pill">{isGuest ? 'Guest' : 'Student'} · {email || 'IGDTUW'}</div>
            <div className="avatar">{isGuest ? 'G' : getInitials(name, email)}</div>
            <ThemeToggle />
            <button className="logout-link" onClick={handleLogout}>Log out</button>
          </div>
        </div>

        <div className="stage">
          <Outlet />
        </div>
      </div>
    </div>
  );
}