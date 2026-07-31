import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const TASKS_API = `${import.meta.env.VITE_API_URL}/api/tasks`;
const POCS_API = `${import.meta.env.VITE_API_URL}/api/users/pocs`;

const COLUMNS = [
  { key: 'pending', label: 'Pending', dot: 'var(--muted)' },
  { key: 'inProgress', label: 'In Progress', dot: 'var(--blue)' },
  { key: 'done', label: 'Done', dot: 'var(--green)' },
];

export default function TaskBoardScreen() {
  const { token, pocOf } = useAuth();
  const showToast = useToast();
  const managedSociety = pocOf && pocOf[0];

  const [tasks, setTasks] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newColumn, setNewColumn] = useState('pending');
  const [newAssignee, setNewAssignee] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!managedSociety) { setIsLoading(false); return; }
      try {
        const [tasksRes, pocsRes] = await Promise.all([
          fetch(`${TASKS_API}?society=${encodeURIComponent(managedSociety)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${POCS_API}?society=${encodeURIComponent(managedSociety)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const tasksData = await tasksRes.json();
        const pocsData = await pocsRes.json();
        if (tasksRes.ok) setTasks(tasksData);
        if (pocsRes.ok) setPocs(pocsData);
      } catch (err) {
        console.error('Failed to load task board', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [managedSociety, token]);

  function tasksInColumn(colKey) {
    return tasks.filter((t) => t.status === colKey);
  }

  function openAddModal(columnKey) {
    setNewColumn(columnKey);
    setNewText('');
    setNewTags('');
    setNewAssignee('');
    setShowAddModal(true);
  }

  async function handleAddTask() {
    const text = newText.trim();
    if (!text) return;
    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      const res = await fetch(TASKS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          society: managedSociety,
          text,
          tags,
          assigneeName: newAssignee || null,
          status: newColumn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add task');

      setTasks((prev) => [...prev, data]);
      setShowAddModal(false);
    } catch (err) {
      showToast(err.message);
    }
  }

  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, colKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) setDragOverCol(colKey);
  }

  function handleDragLeave(colKey) {
    if (dragOverCol === colKey) setDragOverCol(null);
  }

  async function handleDrop(e, toCol) {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTask || draggedTask.status === toCol) { setDraggedTask(null); return; }

    const taskId = draggedTask._id;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: toCol } : t)));
    setDraggedTask(null);

    try {
      const res = await fetch(`${TASKS_API}/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: toCol }),
      });
      if (!res.ok) throw new Error('Failed to move task');
    } catch (err) {
      showToast(err.message);
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: draggedTask.status } : t)));
    }
  }

  async function handleAssignChange(taskId, assigneeName) {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, assigneeName: assigneeName || null } : t)));
    try {
      const res = await fetch(`${TASKS_API}/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigneeName: assigneeName || null }),
      });
      if (!res.ok) throw new Error('Failed to update assignee');
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      const res = await fetch(`${TASKS_API}/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      showToast(err.message);
      setTasks(prevTasks);
    }
  }

  function initialsOf(name) {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  if (!managedSociety) {
    return <div className="page-pad"><p>You are not a POC for any society.</p></div>;
  }

  return (
    <div className="page-pad">
      <div className="page-head">
        <div>
          <label className="tb-event-lbl">Task board for</label>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{managedSociety}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => openAddModal('pending')}>+ Add Task</button>
          <button className="btn outline" onClick={() => setShowAssignModal(true)}>Assign Members</button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading tasks…</p>
      ) : (
        <div className="kanban">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className={`kb-col${dragOverCol === col.key ? ' drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={() => handleDragLeave(col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="kb-col-head">
                <span className="kb-dot" style={{ background: col.dot }} />
                {col.label} <span className="kb-count">{tasksInColumn(col.key).length}</span>
              </div>

              {tasksInColumn(col.key).map((task) => (
                <div
                  className="card kb-card"
                  key={task._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                    style={{
                      position: 'absolute', top: 8, right: 8, border: 'none', background: 'none',
                      cursor: 'pointer', color: 'var(--muted)', fontSize: 13, lineHeight: 1, padding: 4,
                    }}
                    aria-label="Delete task"
                    title="Delete task"
                  >
                    ✕
                  </button>
                  <p style={{ paddingRight: 18 }}>{task.text}</p>
                  <div className="kb-card-foot">
                    <div className="kb-tags">
                      {(task.tags || []).map((t) => <span className="tag soft" key={t}>{t}</span>)}
                    </div>
                    <div className="kb-assignee">
                      <div className="kb-av">{initialsOf(task.assigneeName)}</div>
                      <span className="kb-assignee-name">{task.assigneeName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="kb-add" onClick={() => openAddModal(col.key)}>+ Add card</div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="tb-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tb-modal-head">
              <h3>Add Task</h3>
              <button className="tb-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="tb-modal-body">
              <label className="tb-input-lbl">
                Task description
                <textarea
                  className="tb-input"
                  rows={3}
                  placeholder="e.g. Finalize sponsorship deck"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                />
              </label>
              <label className="tb-input-lbl">
                Column
                <select className="tb-input" value={newColumn} onChange={(e) => setNewColumn(e.target.value)}>
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </label>
              <label className="tb-input-lbl">
                Tags (comma separated)
                <input
                  className="tb-input"
                  placeholder="e.g. Design, Urgent"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </label>
              <label className="tb-input-lbl">
                Assign to
                <select className="tb-input" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {pocs.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
              </label>
              <div className="tb-modal-actions">
                <button className="btn outline sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn sm" onClick={handleAddTask}>Add Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="tb-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="tb-modal tb-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="tb-modal-head">
              <h3>Assign Members</h3>
              <button className="tb-modal-close" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <div className="tb-modal-body">
              <p className="tb-modal-hint">Society POCs available:</p>
              <div className="tb-member-list">
                {pocs.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>No other POCs yet for this society.</p>
                ) : (
                  pocs.map((p) => (
                    <div className="tb-member-row" key={p._id}>
                      <div className="kb-av">{initialsOf(p.name)}</div>
                      <div className="tb-member-info">
                        <b>{p.name}</b>
                        <span>{p.email}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="tb-modal-hint" style={{ marginTop: 18 }}>Assign each task:</p>
              <div className="tb-task-assign-list">
                {tasks.map((task) => (
                  <div className="tb-task-assign-row" key={task._id}>
                    <div className="tb-task-assign-text">
                      <span className="tb-task-assign-col">{COLUMNS.find((c) => c.key === task.status)?.label}</span>
                      {task.text}
                    </div>
                    <select
                      className="tb-input tb-task-assign-select"
                      value={task.assigneeName || ''}
                      onChange={(e) => handleAssignChange(task._id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {pocs.map((p) => <option key={p._id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="tb-modal-actions">
                <button className="btn sm" onClick={() => setShowAssignModal(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}