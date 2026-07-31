import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

const COLORS = ['blue', 'purple', 'green', 'amber', 'pink'];

const EMPTY_FORM = {
  name: '',
  role: '',
  responsibilities: '',
  assignment: '',
  contact: '',
  linkedin: '',
  color: 'blue',
};

const TIER_RULES = [
  { label: 'President', match: (r) => /president/i.test(r) && !/vice/i.test(r) },
  { label: 'Vice President', match: (r) => /vice president/i.test(r) },
  { label: 'Secretaries', match: (r) => /secretary/i.test(r) },
  { label: 'POCs', match: (r) => /poc/i.test(r) },
];

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function groupIntoTiers(members) {
  const tiers = TIER_RULES.map((rule) => ({ label: rule.label, members: [] }));
  const other = { label: 'Other', members: [] };

  members.forEach((m) => {
    const tier = TIER_RULES.find((rule) => rule.match(m.role));
    if (tier) {
      tiers.find((t) => t.label === tier.label).members.push(m);
    } else {
      other.members.push(m);
    }
  });

  return [...tiers, other].filter((t) => t.members.length > 0);
}

export default function TeamScreen() {
  const { token } = useAuth();
  const showToast = useToast();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await fetch(`${SOCIETIES_API}/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMembers(data.execTeam || []);
      } catch (err) {
        console.error('Failed to load team', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTeam();
  }, [token]);

  async function persistTeam(nextMembers) {
    setMembers(nextMembers);
    try {
      const res = await fetch(`${SOCIETIES_API}/mine`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ execTeam: nextMembers }),
      });
      if (!res.ok) throw new Error('Failed to save team');
    } catch (err) {
      showToast(err.message);
    }
  }

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (m) => {
    setEditingId(m.name);
    setForm({
      name: m.name,
      role: m.role,
      responsibilities: m.responsibilities || '',
      assignment: m.assignment || '',
      contact: m.contact || '',
      linkedin: m.linkedin || '',
      color: m.color || 'blue',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;

    const memberData = { ...form, initials: getInitials(form.name) };

    if (editingId) {
      persistTeam(members.map((m) => (m.name === editingId ? { ...m, ...memberData } : m)));
    } else {
      persistTeam([...members, memberData]);
    }
    closeForm();
  };

  const handleDelete = () => {
    if (!editingId) return;
    persistTeam(members.filter((m) => m.name !== editingId));
    closeForm();
  };

  const tiers = groupIntoTiers(members);

  if (isLoading) {
    return <div className="shd-page"><p>Loading team…</p></div>;
  }

  return (
    <div className="shd-page">
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Executive Team</h1>
          <p className="shd-subtitle">Your society's leadership directory.</p>
        </div>
        <button type="button" className="add-member-btn" onClick={openAddForm}>
          + Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No team members added yet.</p>
      ) : (
        <div className="exec-tree">
          {tiers.map((tier, i) => (
            <div className="exec-tier" key={tier.label}>
              {i > 0 && <div className="exec-tier-connector" />}
              <div className="exec-tier-row">
                {tier.members.map((m) => (
                  <div
                    className="exec-row exec-row--editable"
                    key={m.name}
                    onClick={() => openEditForm(m)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openEditForm(m)}
                  >
                    <div className={`exec-avatar c-${m.color}`}>{m.initials}</div>
                    <div className="exec-info">
                      <span className="exec-name">{m.name}</span>
                      <span className="exec-role">{m.role}</span>
                      <span className="exec-meta">{m.responsibilities}</span>
                      <span className="exec-meta">Currently on: {m.assignment}</span>
                      <span className="exec-meta">{m.contact}</span>
                     {m.linkedin ? (
                      <a
  
    href={m.linkedin}
    target="_blank"
    rel="noopener noreferrer"
    className="exec-linkedin"
    onClick={(e) => e.stopPropagation()}
  >
    LinkedIn Profile
  </a>
) : (
                        <span className="exec-linkedin exec-linkedin--empty">
                          No LinkedIn added
                        </span>
                      )}
                    </div>
                    <span className="exec-edit-hint">Click to edit</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="exec-modal-overlay" onClick={closeForm}>
          <div className="exec-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="exec-modal-title">
              {editingId ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="exec-form">
              <label>
                Name
                <input value={form.name} onChange={handleChange('name')} required />
              </label>
              <label>
                Role
                <input value={form.role} onChange={handleChange('role')} required />
              </label>
              <label>
                Responsibilities
                <input
                  value={form.responsibilities}
                  onChange={handleChange('responsibilities')}
                />
              </label>
              <label>
                Currently on
                <input value={form.assignment} onChange={handleChange('assignment')} />
              </label>
              <label>
                Contact
                <input value={form.contact} onChange={handleChange('contact')} />
              </label>
              <label>
                LinkedIn URL
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedin}
                  onChange={handleChange('linkedin')}
                />
              </label>
              <label>
                Avatar color
                <select value={form.color} onChange={handleChange('color')}>
                  {COLORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div className="exec-form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="exec-form-delete"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                )}
                <button type="button" className="exec-form-cancel" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="exec-form-submit">
                  {editingId ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}