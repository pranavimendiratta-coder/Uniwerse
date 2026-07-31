import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './onboarding.css';

export default function RoleChooserScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();
  const { activateRole } = useAuth();

  const { token, user } = location.state || {};

  if (!token || !user) {
    // Someone landed here directly without logging in first — bounce them back
    navigate('/login');
    return null;
  }

  function pick(role) {
    activateRole({ user, token, chosenRole: role });
    showToast('Continuing as ' + role + '…');
    setTimeout(() => {
      if (role === 'Society POC') navigate('/society');
      else if (role === 'Society Head') navigate('/society-head');
      else navigate('/student');
    }, 500);
  }

  return (
    <div className="page-shell">
      <div className="device">
        <div className="stage">
          <div className="pane-right top" style={{ margin: '0 auto' }}>
            <h2>Choose how to continue</h2>
            <p className="side-note">
              This account has multiple roles. Pick one for this session — you can log back in and choose a different one anytime.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
              {user.roles.map((role) => (
                <button key={role} className="btn block" onClick={() => pick(role)}>
                  Continue as {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}