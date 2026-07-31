import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Guards a route so it's only reachable by a logged-in IGDTUW member
 * with the matching role, or (when allowGuest is true) a logged-in guest.
 *
 * Special case: a Student who is a POC for at least one society is also
 * allowed into "Society POC" routes, since POC isn't its own account role.
 */
export default function ProtectedRoute({ role, allowGuest = false, children }) {
  const { accessType, role: currentRole, pocOf } = useAuth();

  const isAllowedMember = accessType === 'member' && currentRole === role;
  const isAllowedGuest = allowGuest && accessType === 'guest';
  const isAllowedPoc =
    role === 'Society POC' &&
    accessType === 'member' &&
    currentRole === 'Student' &&
    pocOf.length > 0;

  if (!isAllowedMember && !isAllowedGuest && !isAllowedPoc) {
    return <Navigate to="/" replace />;
  }

  return children;
}