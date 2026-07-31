
import { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const AUDIENCE_OPTIONS = [
  { key: 'igdtuw', label: 'IGDTUW Only', pillClass: 'pill igdtuw', gradient: 'grad-navy', desc: 'Only IGDTUW students, POCs, and faculty can register and see this event.' },
  { key: 'open', label: 'Open for All', pillClass: 'pill open', gradient: 'grad-green', desc: 'Both IGDTUW members and outside participants can register.' },
];

const REG_TYPES = ['In-app Form', 'QR Registration', 'Both'];

const EVENTS_API = `${import.meta.env.VITE_API_URL}/api/events`;
const SOCIETIES_API = `${import.meta.env.VITE_API_URL}/api/societies`;

const DEFAULT_CHECKLIST = [
  
];

// simple deterministic-looking fake QR grid, regenerated each time "Generate QR" is clicked
function buildQrPattern() {
  const cells = [];
  for (let i = 0; i < 100; i++) {
    cells.push(Math.random() > 0.55);
  }
  return cells;
}

export default function CreateEventScreen() {
  const showToast = useToast();
  const bannerInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');

  const [audience, setAudience] = useState('igdtuw');
  const [regType, setRegType] = useState('In-app Form');
  const [formLink, setFormLink] = useState('');
  const [qrPattern, setQrPattern] = useState(null);

  const [tags, setTags] = useState(['Technology', 'Workshop', 'Open to All']);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const [bannerImage, setBannerImage] = useState(null); // data URL

  const [checklistExtras, setChecklistExtras] = useState([]); // user-added items
  const [checklistDone, setChecklistDone] = useState({}); // { [id]: bool } for manual toggles on auto items
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [addingChecklistItem, setAddingChecklistItem] = useState(false);
  const { token, pocOf } = useAuth();
const [societyId, setSocietyId] = useState(null);
const [isPublishing, setIsPublishing] = useState(false);
const managedSociety = pocOf && pocOf[0];
console.log('pocOf:', pocOf, 'managedSociety:', managedSociety);

useEffect(() => {
  async function findSocietyId() {
    if (!managedSociety) return;
    try {
      const res = await fetch(SOCIETIES_API);
      const societies = await res.json();
      const match = societies.find((s) => s.name === managedSociety);
      if (match) setSocietyId(match._id);
    } catch (err) {
      console.error('Failed to load society', err);
    }
  }
  findSocietyId();
}, [managedSociety]);

  const selectedAudience = AUDIENCE_OPTIONS.find((o) => o.key === audience);

 const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

async function handleGenerateDescription() {
  setIsGeneratingDesc(true);
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/generate-description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, category: tags[0] || '', venue, audience }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to generate description');

    setDescription(data.description);
  } catch (err) {
    showToast(err.message);
  } finally {
    setIsGeneratingDesc(false);
  }
}

  function handleAddTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
    setAddingTag(false);
  }

  function handleRemoveTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleBannerFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBannerImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeBanner() {
    setBannerImage(null);
  }

  function handleGenerateQr() {
    setQrPattern(buildQrPattern());
  }

  async function handlePublish() {
  if (!title.trim()) { showToast('Please add an event title'); return; }
  if (!date) { showToast('Please set an event date'); return; }
  if (!societyId) { showToast('Could not determine your society — try refreshing'); return; }

  setIsPublishing(true);
  try {
    const res = await fetch(EVENTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    body: JSON.stringify({
        title: title.trim(),
        societyId,
        category: tags[0] || '',
        about: description,
        date,
        time: startTime && endTime ? `${startTime} - ${endTime}` : startTime,
        venue,
        capacity: capacity ? Number(capacity) : 0,
        audience,
        registrationDeadline: date,
        checklist: checklistExtras.map((item) => ({ label: item.label, done: item.done })),
      }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Failed to publish event');

    showToast('Event published!');
  } catch (error) {
    showToast(error.message);
  } finally {
    setIsPublishing(false);
  }
}
  function toggleAutoChecklistItem(id) {
    setChecklistDone((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleExtraChecklistItem(id) {
    setChecklistExtras((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  function handleAddChecklistItem() {
    const label = newChecklistItem.trim();
    if (label) {
      setChecklistExtras((prev) => [...prev, { id: `extra-${Date.now()}`, label, done: false }]);
    }
    setNewChecklistItem('');
    setAddingChecklistItem(false);
  }

  function removeChecklistItem(id) {
    setChecklistExtras((prev) => prev.filter((item) => item.id !== id));
  }

  // auto-derived completion state for the built-in checklist items,
  // but overridable by manual click (checklistDone)
  const autoStatus = {
    title: Boolean(title),
    desc: Boolean(description),
    datetime: Boolean(date && startTime && endTime),
    venue: Boolean(venue),
    audience: Boolean(audience),
    banner: Boolean(bannerImage),
  };

  function isAutoItemDone(id) {
    if (id in checklistDone) return checklistDone[id];
    return autoStatus[id];
  }

  return (
    <div className="page-pad">
      <div className="page-head">
        <h1>Create New Event</h1>
        <div className="actions">
          <button className="btn outline" onClick={() => showToast('Draft saved!')}>Save Draft</button>
          <button className="btn" disabled={isPublishing} onClick={handlePublish}>
  {isPublishing ? 'Publishing…' : 'Publish Event'}
</button>
        </div>
      </div>

      <div className="ce-layout">
        <div className="ce-main">
          <div className="field">
            <label>Event Title</label>
            <input type="text" placeholder="e.g. Annual Tech Symposium 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field">
            <div className="desc-row">
              <label>Description</label>
              <button className="btn outline sm" disabled={isGeneratingDesc} onClick={handleGenerateDescription}>
  {isGeneratingDesc ? 'Generating…' : '✦ AI Generate Description'}
</button>
            </div>
            <textarea
              placeholder="Describe event — agenda, speakers, prerequisites, prizes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="row3" style={{ marginBottom: 20 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Event Date</label>
              <input type="text" placeholder="Jul 25, 2025" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Start Time</label>
              <input type="text" placeholder="10:00 AM" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>End Time</label>
              <input type="text" placeholder="5:00 PM" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="row2" style={{ marginBottom: 24 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Venue / Location</label>
              <input type="text" placeholder="Main Auditorium, Block A" value={venue} onChange={(e) => setVenue(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Capacity (seats)</label>
              <input type="text" placeholder="e.g. 200" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 15, fontWeight: 700, marginBottom: 5 }}>Event Audience</label>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
            Determines who can see and register for this event. Applies to the Home Feed and registration page.
          </p>
          <div className="radio-card-group">
            {AUDIENCE_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className={`radio-card${audience === opt.key ? ' selected' : ''}`}
                onClick={() => setAudience(opt.key)}
              >
                <div className="radio"><div className="fill" /></div>
                <div className="rc-body">
                  <div className="rc-head">{opt.label} <span className={opt.pillClass}>{opt.label}</span></div>
                  <p>{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Registration Type</label>
          <div className="reg-type-row">
            {REG_TYPES.map((rt) => (
              <div key={rt} className={`reg-type-opt${regType === rt ? ' selected' : ''}`} onClick={() => setRegType(rt)}>
                <div className="radio"><div className="fill" /></div>{rt}
              </div>
            ))}
          </div>

          {/* ---------- registration-type specific controls ---------- */}
          {(regType === 'In-app Form' || regType === 'Both') && (
            <div className="field" style={{ marginBottom: regType === 'Both' ? 20 : 24 }}>
              <label>Registration Form Link</label>
              <input
                type="text"
                placeholder="https://forms.gle/..."
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
              />
            </div>
          )}

          {(regType === 'QR Registration' || regType === 'Both') && (
            <div className="card qr-card" style={{ marginBottom: 24, maxWidth: 260 }}>
              <h4>Registration QR Code</h4>
              {qrPattern ? (
                <div className="qr-visual">
                  {qrPattern.map((on, i) => (
                    <div key={i} className={`px${on ? '' : ' off'}`} />
                  ))}
                </div>
              ) : (
                <p className="qr-caption" style={{ margin: '10px 0 14px' }}>No QR code generated yet.</p>
              )}
              <button className="btn outline sm block" onClick={handleGenerateQr}>
                {qrPattern ? 'Regenerate QR' : 'Generate QR Code'}
              </button>
            </div>
          )}

          <label style={{ display: 'block', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Category Tags</label>
          <div className="tag-row">
            {tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{ marginLeft: 6, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                  aria-label={`Remove ${tag}`}
                >
                  ✕
                </button>
              </span>
            ))}
            {addingTag ? (
              <input
                autoFocus
                type="text"
                className="tag-add-input"
                placeholder="Tag name"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') { setAddingTag(false); setTagInput(''); }
                }}
                onBlur={handleAddTag}
                style={{
                  fontSize: 11.5, fontWeight: 600, padding: '4px 12px',
                  border: '1.5px solid var(--ink)', borderRadius: 999,
                  minWidth: 90,
                }}
              />
            ) : (
              <button className="tag-add" onClick={() => setAddingTag(true)}>+ Add Tag</button>
            )}
          </div>

          <label style={{ display: 'block', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Event Banner</label>
          {bannerImage ? (
            <div className="dropzone" style={{ padding: 0, overflow: 'hidden', position: 'relative', textAlign: 'left' }}>
              <img
                src={bannerImage}
                alt="Event banner preview"
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
              />
              <div style={{ display: 'flex', gap: 8, padding: 12 }}>
                <button className="btn outline sm" onClick={() => bannerInputRef.current?.click()}>Replace</button>
                <button className="btn outline sm" onClick={removeBanner}>Remove</button>
              </div>
            </div>
          ) : (
            <div className="dropzone" onClick={() => bannerInputRef.current?.click()}>
              <b>Drop image here or click to upload</b>
              Recommended size 1200 × 480px · PNG or JPG, up to 5MB
            </div>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/png, image/jpeg"
            style={{ display: 'none' }}
            onChange={handleBannerFile}
          />
        </div>

        <div className="ce-side">
          <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 0', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Card Preview
            </div>
            <div
              className={`preview-banner ${bannerImage ? '' : selectedAudience.gradient}`}
              style={bannerImage ? { backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
            >
              {!bannerImage && <div className="dotgrid" />}
              <span className={`preview-corner ${selectedAudience.pillClass}`}>{selectedAudience.label}</span>
            </div>
            <div className="preview-body">
              <h4>{title || 'Event Title Placeholder'}</h4>
              <div className="soc">Society · {date || 'Jul 25, 2025'} · {venue || 'Venue'}</div>
              <button className="btn block">Register</button>
            </div>
          </div>

          <div className="card checklist">
            <h4>Publish Checklist</h4>
            {DEFAULT_CHECKLIST.map((item) => {
              const done = isAutoItemDone(item.id);
              return (
                <div
                  key={item.id}
                  className={`chk-item${done ? ' done' : ''}`}
                  onClick={() => toggleAutoChecklistItem(item.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="bx">{done ? '✓' : ''}</span>{item.label}
                </div>
              );
            })}
            {checklistExtras.map((item) => (
              <div
                key={item.id}
                className={`chk-item${item.done ? ' done' : ''}`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span className="bx" onClick={() => toggleExtraChecklistItem(item.id)}>{item.done ? '✓' : ''}</span>
                <span onClick={() => toggleExtraChecklistItem(item.id)} style={{ flex: 1 }}>{item.label}</span>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(item.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11 }}
                  aria-label={`Remove ${item.label}`}
                >
                  ✕
                </button>
              </div>
            ))}

            {addingChecklistItem ? (
              <input
                autoFocus
                type="text"
                placeholder="New checklist item"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddChecklistItem();
                  if (e.key === 'Escape') { setAddingChecklistItem(false); setNewChecklistItem(''); }
                }}
                onBlur={handleAddChecklistItem}
                style={{
                  width: '100%', fontSize: 13, padding: '7px 10px', marginTop: 6,
                  border: '1.5px solid var(--ink)', borderRadius: 8,
                }}
              />
            ) : (
              <button
                type="button"
                className="tag-add"
                style={{ marginTop: 8 }}
                onClick={() => setAddingChecklistItem(true)}
              >
                + Add Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}