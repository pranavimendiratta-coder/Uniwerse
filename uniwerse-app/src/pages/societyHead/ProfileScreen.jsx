import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;
const API_ORIGIN = `${import.meta.env.VITE_API_URL}`;

const ACCENT_PALETTE = [
  { name: 'Navy (default)', value: '#16294F' },
  { name: 'Orange', value: '#C97A2C' },
  { name: 'Blue', value: '#3E6FA6' },
  { name: 'Purple', value: '#7C5CBF' },
  { name: 'Pink', value: '#C74E63' },
  { name: 'Green', value: '#4B8B6B' },
];

function EditableField({ label, value, onChange, textarea }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      {textarea ? (
        <textarea
          className="profile-edit-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          className="profile-edit-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function ProfileScreen() {
  const { token } = useAuth();
  const showToast = useToast();

  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: '',
    category: '',
    activeSince: '',
    description: '',
    logoInitials: '',
    accentColor: ACCENT_PALETTE[0].value,
    mission: '',
    vision: '',
    objectives: [],
    team: { president: '', vicePresident: '', generalSecretary: '' },
    facultyCoordinator: '',
    email: '',
    contactPerson: '',
    instagram: '',
    linkedin: '',
    discord: '',
    website: '',
    recruitmentStatus: 'Open',
    resourcesLink: '',
  });

  const [stats, setStats] = useState({ workshops: 0, hackathons: 0, competitions: 0 });
  const [newObjective, setNewObjective] = useState('');

  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState('');
   const [gallery, setGallery] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${SOCIETIES_API}/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load society profile');

        setProfile({
          name: data.name || '',
          category: data.category || '',
          activeSince: data.activeSince || '',
          description: data.description || '',
          logoInitials: data.logoInitials || '',
          accentColor: data.accentColor || ACCENT_PALETTE[0].value,
          mission: data.mission || '',
          vision: data.vision || '',
          objectives: data.objectives || [],
          team: {
            president: data.team?.president || '',
            vicePresident: data.team?.vicePresident || '',
            generalSecretary: data.team?.generalSecretary || '',
          },
          facultyCoordinator: data.facultyCoordinator || '',
          email: data.email || '',
          contactPerson: data.contactPerson || '',
          instagram: data.instagram || '',
          linkedin: data.linkedin || '',
          discord: data.discord || '',
          website: data.website || '',
          recruitmentStatus: data.recruitmentStatus || 'Open',
          resourcesLink: data.resourcesLink || '',
        });
        setStats({
          workshops: data.stats?.workshops || 0,
          hackathons: data.stats?.hackathons || 0,
          competitions: data.stats?.competitions || 0,
        });
        setAchievements(data.achievements || []);
        setGallery(data.gallery || []);
      } catch (err) {
        showToast(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [token]);
  function handleAddImageClick() {
    galleryInputRef.current?.click();
  }

  async function handleGalleryFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image is too large — max size is 8MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploadingImage(true);
    try {
      const res = await fetch(`${SOCIETIES_API}/mine/gallery`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setGallery(data.gallery);
      showToast('Image added to gallery');
    } catch (err) {
      showToast(err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleDeleteImage(url) {
    if (!window.confirm('Remove this image from the gallery?')) return;

    try {
      const res = await fetch(`${SOCIETIES_API}/mine/gallery`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      setGallery(data.gallery);
      showToast('Image removed');
    } catch (err) {
      showToast(err.message || 'Failed to remove image');
    }
  }

  const field = (key) => (val) => setProfile((p) => ({ ...p, [key]: val }));
  const teamField = (key) => (val) => setProfile((p) => ({ ...p, team: { ...p.team, [key]: val } }));

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoUrl(URL.createObjectURL(file)); // preview only — not persisted, no file storage yet
  };
  const handleBannerFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setBannerUrl(URL.createObjectURL(file));
  };

  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setAchievements((prev) => [...prev, newAchievement.trim()]);
    setNewAchievement('');
  };
  const removeAchievement = (i) => {
    setAchievements((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setProfile((p) => ({ ...p, objectives: [...p.objectives, newObjective.trim()] }));
    setNewObjective('');
  };
  const removeObjective = (i) => {
    setProfile((p) => ({ ...p, objectives: p.objectives.filter((_, idx) => idx !== i) }));
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch(`${SOCIETIES_API}/mine`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          category: profile.category,
          activeSince: profile.activeSince,
          description: profile.description,
          logoInitials: profile.logoInitials,
          accentColor: profile.accentColor,
          mission: profile.mission,
          vision: profile.vision,
          objectives: profile.objectives,
          team: profile.team,
          facultyCoordinator: profile.facultyCoordinator,
          email: profile.email,
          contactPerson: profile.contactPerson,
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          discord: profile.discord,
          website: profile.website,
          recruitmentStatus: profile.recruitmentStatus,
          resourcesLink: profile.resourcesLink,
          achievements,
          stats,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      showToast('Profile saved!');
      setEditMode(false);
    } catch (err) {
      showToast(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="shd-page"><p>Loading profile…</p></div>;
  }

  return (
    <div className="shd-page" style={{ '--accent': profile.accentColor }}>
      <div className="shd-page-head">
        <div>
          <h1 className="shd-title">Society Profile</h1>
          <p className="shd-subtitle">
            This is what students see when they view your society. Customize it below.
          </p>
        </div>
        <button
          type="button"
          className="profile-edit-toggle"
          onClick={() => {
            if (editMode) handleSave();
            else setEditMode(true);
          }}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : editMode ? 'Done Editing' : 'Edit Profile'}
        </button>
      </div>

      {editMode && (
        <section className="shd-card" style={{ marginBottom: 18 }}>
          <h2 className="shd-card-title">Accent Theme Color</h2>
          <p className="shd-hint">
            Applies only to buttons, headers, badges, and highlights on your public profile.
          </p>
          <div className="accent-swatch-row">
            {ACCENT_PALETTE.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`accent-swatch${profile.accentColor === c.value ? ' active' : ''}`}
                style={{ background: c.value }}
                title={c.name}
                onClick={() => field('accentColor')(c.value)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="shd-card profile-hero-card" style={{ marginBottom: 18 }}>
        <div
          className="profile-banner"
          style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
        >
          {editMode && (
            <>
              <button
                type="button"
                className="profile-banner-edit-btn"
                onClick={() => bannerInputRef.current?.click()}
              >
                Change Banner
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="add-report-input-hidden"
                onChange={handleBannerFile}
              />
            </>
          )}
        </div>

        <div className="profile-header">
          <div
            className="profile-logo"
            style={logoUrl ? { backgroundImage: `url(${logoUrl})`, backgroundSize: 'cover' } : undefined}
            onClick={() => editMode && logoInputRef.current?.click()}
          >
            {!logoUrl && profile.logoInitials}
          </div>
          {editMode && (
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="add-report-input-hidden"
              onChange={handleLogoFile}
            />
          )}

          {editMode ? (
            <div style={{ flex: 1 }}>
              <input
                className="profile-edit-input profile-edit-title"
                value={profile.name}
                onChange={(e) => field('name')(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <input
                  className="profile-edit-input"
                  value={profile.category}
                  onChange={(e) => field('category')(e.target.value)}
                  placeholder="Category"
                />
                <input
                  className="profile-edit-input"
                  value={profile.activeSince}
                  onChange={(e) => field('activeSince')(e.target.value)}
                  placeholder="Founded year"
                />
                <input
                  className="profile-edit-input"
                  value={profile.logoInitials}
                  onChange={(e) => field('logoInitials')(e.target.value)}
                  placeholder="Logo initials e.g. CS"
                  maxLength={3}
                />
              </div>
            </div>
          ) : (
            <div>
              <h1>{profile.name}</h1>
              <p>{profile.category} · Founded {profile.activeSince}</p>
            </div>
          )}
        </div>

        {editMode ? (
          <textarea
            className="profile-edit-input"
            style={{ marginTop: 14 }}
            rows={3}
            value={profile.description}
            onChange={(e) => field('description')(e.target.value)}
          />
        ) : (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 14 }}>{profile.description}</p>
        )}

        <div className="profile-cta-row">
          <button type="button" className="profile-cta primary">Explore Events</button>
          <button type="button" className="profile-cta">Join Community</button>
        </div>
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Contact & Community Links</h2>
        <div className="profile-fields">
          {editMode ? (
            <>
              <EditableField label="President" value={profile.team.president} onChange={teamField('president')} />
              <EditableField label="Vice President" value={profile.team.vicePresident} onChange={teamField('vicePresident')} />
              <EditableField label="Faculty Coordinator" value={profile.facultyCoordinator} onChange={field('facultyCoordinator')} />
              <EditableField label="Official Email" value={profile.email} onChange={field('email')} />
              <EditableField label="Contact Person" value={profile.contactPerson} onChange={field('contactPerson')} />
              <EditableField label="Instagram" value={profile.instagram} onChange={field('instagram')} />
              <EditableField label="LinkedIn" value={profile.linkedin} onChange={field('linkedin')} />
              <EditableField label="Discord / Community Link" value={profile.discord} onChange={field('discord')} />
              <EditableField label="Website" value={profile.website} onChange={field('website')} />
              <EditableField label="Resources Link" value={profile.resourcesLink} onChange={field('resourcesLink')} />
            </>
          ) : (
            <>
              <div className="profile-field">
                <span className="profile-field-label">President</span>
                <span className="profile-field-value">{profile.team.president}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Vice President</span>
                <span className="profile-field-value">{profile.team.vicePresident}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Faculty Coordinator</span>
                <span className="profile-field-value">{profile.facultyCoordinator}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Official Email</span>
                <span className="profile-field-value">{profile.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Contact Person</span>
                <span className="profile-field-value">{profile.contactPerson}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">Instagram</span>
                <span className="profile-field-value">{profile.instagram}</span>
              </div>
              <div className="profile-field">
                <span className="profile-field-label">LinkedIn</span>
                <span className="profile-field-value">{profile.linkedin}</span>
              </div>
              {profile.discord && (
                <div className="profile-field">
                  <span className="profile-field-label">Community</span>
                  <span className="profile-field-value">{profile.discord}</span>
                </div>
              )}
              {profile.website && (
                <div className="profile-field">
                  <span className="profile-field-label">Website</span>
                  <span className="profile-field-value">{profile.website}</span>
                </div>
              )}
              {profile.resourcesLink && (
                <div className="profile-field">
                  <span className="profile-field-label">Resources</span>
                  <span className="profile-field-value">{profile.resourcesLink}</span>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Mission & Vision</h2>
        {editMode ? (
          <>
            <EditableField label="Mission" value={profile.mission} onChange={field('mission')} textarea />
            <EditableField label="Vision" value={profile.vision} onChange={field('vision')} textarea />
            <EditableField label="General Secretary" value={profile.team.generalSecretary} onChange={teamField('generalSecretary')} />
          </>
        ) : (
          <>
            <div className="profile-field">
              <span className="profile-field-label">Mission</span>
              <span className="profile-field-value">{profile.mission}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Vision</span>
              <span className="profile-field-value">{profile.vision}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">General Secretary</span>
              <span className="profile-field-value">{profile.team.generalSecretary}</span>
            </div>
          </>
        )}
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Objectives</h2>
        <div className="achievement-list">
          {profile.objectives.map((o, i) => (
            <div className="achievement-row" key={i}>
              • {o}
              {editMode && (
                <button type="button" className="achievement-remove" onClick={() => removeObjective(i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <div className="profile-add-row">
            <input
              className="profile-edit-input"
              placeholder="Add an objective..."
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addObjective()}
            />
            <button type="button" className="shd-btn small" onClick={addObjective}>Add</button>
          </div>
        )}
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Activity Stats</h2>
        {editMode ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="profile-field">
              <span className="profile-field-label">Workshops</span>
              <input
                type="number" min="0" className="profile-edit-input"
                value={stats.workshops}
                onChange={(e) => setStats((s) => ({ ...s, workshops: Number(e.target.value) }))}
              />
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Hackathons</span>
              <input
                type="number" min="0" className="profile-edit-input"
                value={stats.hackathons}
                onChange={(e) => setStats((s) => ({ ...s, hackathons: Number(e.target.value) }))}
              />
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Competitions</span>
              <input
                type="number" min="0" className="profile-edit-input"
                value={stats.competitions}
                onChange={(e) => setStats((s) => ({ ...s, competitions: Number(e.target.value) }))}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24 }}>
            <div className="profile-field"><span className="profile-field-label">Workshops</span><span className="profile-field-value">{stats.workshops}</span></div>
            <div className="profile-field"><span className="profile-field-label">Hackathons</span><span className="profile-field-value">{stats.hackathons}</span></div>
            <div className="profile-field"><span className="profile-field-label">Competitions</span><span className="profile-field-value">{stats.competitions}</span></div>
          </div>
        )}
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Recruitment Status</h2>
        {editMode ? (
          <select
            className="profile-edit-input"
            style={{ maxWidth: 220 }}
            value={profile.recruitmentStatus}
            onChange={(e) => field('recruitmentStatus')(e.target.value)}
          >
            <option>Open</option>
            <option>Closed</option>
            <option>Opening Soon</option>
          </select>
        ) : (
          <span className="profile-recruitment-badge">{profile.recruitmentStatus}</span>
        )}
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Achievements</h2>
        <div className="achievement-list">
          {achievements.map((a, i) => (
            <div className="achievement-row" key={i}>
              🏆 {a}
              {editMode && (
                <button
                  type="button"
                  className="achievement-remove"
                  onClick={() => removeAchievement(i)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <div className="profile-add-row">
            <input
              className="profile-edit-input"
              placeholder="Add an achievement..."
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
            />
            <button type="button" className="shd-btn small" onClick={addAchievement}>
              Add
            </button>
          </div>
        )}
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Executive Team</h2>
        <p className="shd-hint">
          This pulls automatically from Team Management — edit members there.
        </p>
      </section>

      <section className="shd-card" style={{ marginBottom: 18 }}>
        <h2 className="shd-card-title">Upcoming & Past Events</h2>
        <p className="shd-hint">
          This section will pull automatically from your Events page once connected.
        </p>
      </section>

     <section className="shd-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 className="shd-card-title" style={{ marginBottom: 0 }}>Gallery</h2>
          <button
            type="button"
            className="shd-btn small"
            onClick={handleAddImageClick}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? 'Uploading…' : '+ Add Photo'}
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleGalleryFileSelected}
          />
        </div>

        {gallery.length === 0 ? (
          <p className="shd-hint">No photos yet — click "+ Add Photo" to build your gallery.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {gallery.map((url) => (
              <div key={url} style={{ position: 'relative' }}>
                <img
                  src={`${API_ORIGIN}${url}`}
                  alt=""
                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(url)}
                  style={{
                    position: 'absolute', top: 6, right: 6, border: 'none', borderRadius: 6,
                    background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', fontSize: 12, padding: '3px 7px',
                  }}
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}