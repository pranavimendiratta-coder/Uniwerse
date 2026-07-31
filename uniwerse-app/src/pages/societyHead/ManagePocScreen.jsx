import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const API_URL = `${import.meta.env.VITE_API_URL}/api/users`;

export default function ManagePocScreen() {
  const { token } = useAuth();
  const showToast = useToast();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function callEndpoint(path, successVerb) {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Please enter a student email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Something went wrong');

      showToast(data.message || `${successVerb} successfully`);
      setEmail('');
    } catch (error) {
      showToast(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Manage POCs</h1>
          <p className="shd-subtitle">Grant or remove Point-of-Contact access for a student.</p>
        </div>
      </div>

      <div className="notice" style={{ maxWidth: 480, marginBottom: 20 }}>
        Enter a student's <b>@igdtuw.ac.in</b> email to give them POC access for your society, or to remove it.
        The student must already have a UniWerse account.
      </div>

      <div className="field" style={{ maxWidth: 420 }}>
        <label>Student Email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="rollno@igdtuw.ac.in"
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          className="btn"
          disabled={isSubmitting}
          onClick={() => callEndpoint('add-poc', 'Added')}
        >
          + Add as POC
        </button>
        <button
          className="btn outline"
          disabled={isSubmitting}
          onClick={() => callEndpoint('remove-poc', 'Removed')}
        >
          Remove POC access
        </button>
      </div>
    </div>
  );
}