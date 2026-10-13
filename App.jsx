import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, CheckCircle2, Circle, Clock3, Plus, Search, Bell,
  CalendarDays, MoreHorizontal, Pencil, Trash2, X, ListTodo, Zap,
  ChevronDown, ArrowUpRight, Check, Filter, Menu, Sparkles
} from 'lucide-react';

const API = 'http://localhost:5000/api';
const blank = { title: '', description: '', priority: 'Medium', dueDate: '' };

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All tasks');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [menuId, setMenuId] = useState(null);

  async function request(url, options = {}) {
    const response = await fetch(`${API}${url}`, {
      headers: { 'Content-Type': 'application/json' }, ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
  async function loadTasks() {
    try { setTasks(await request('/tasks')); }
    catch { setError('Could not connect to the backend. Start the server using npm run dev.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadTasks(); }, []);

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;
  const progress = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const visible = useMemo(() => tasks.filter(t => {
    const matches = `${t.title} ${t.description}`.toLowerCase().includes(query.toLowerCase());
    const status = filter === 'All tasks' || (filter === 'In progress' && !t.completed) || (filter === 'Completed' && t.completed);
    return matches && status;
  }), [tasks, query, filter]);

  function openCreate() { setEditing(null); setForm(blank); setError(''); setModal(true); }
  function openEdit(task) {
    setEditing(task); setForm({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate || '' }); setError(''); setModal(true); setMenuId(null);
  }
  async function saveTask(e) {
    e.preventDefault(); setError('');
    if (!form.title.trim()) { setError('Please enter a task title.'); return; }
    try {
      if (editing) await request(`/tasks/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await request('/tasks', { method: 'POST', body: JSON.stringify(form) });
      setModal(false); setNotice(editing ? 'Task updated successfully' : 'New task created'); await loadTasks();
      setTimeout(() => setNotice(''), 2600);
    } catch (err) { setError(err.message); }
  }
  async function toggleTask(task) {
    try { await request(`/tasks/${task.id}/toggle`, { method: 'PATCH' }); await loadTasks(); }
    catch (err) { setError(err.message); }
  }
  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try { await request(`/tasks/${task.id}`, { method: 'DELETE' }); setMenuId(null); await loadTasks(); setNotice('Task deleted'); setTimeout(() => setNotice(''), 2200); }
    catch (err) { setError(err.message); }
  }
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><CheckCircle2 size={23}/></div><span>taskflow<span className="brand-dot">.</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Overview</button>
      <button className={`nav-item ${filter === 'In progress' ? 'selected' : ''}`} onClick={() => setFilter('In progress')}><Clock3 size={18}/> In progress <span className="nav-count">{pending}</span></button>
      <button className={`nav-item ${filter === 'Completed' ? 'selected' : ''}`} onClick={() => setFilter('Completed')}><CheckCircle2 size={18}/> Completed</button>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Make room for focus.</strong><p>Small steps add up to big progress.</p><div className="mini-progress"><span style={{width:`${progress}%`}}/></div><small>{progress}% of tasks completed</small></div>
        <div className="profile"><div className="avatar">TF</div><div className="profile-copy"><strong>My Workspace</strong><span>Personal plan</span></div><MoreHorizontal size={19} className="muted-icon"/></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="slash">/</span><strong>Overview</strong></div><div className="top-actions"><div className="date-pill"><CalendarDays size={15}/>{dateLabel}</div><button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button><div className="avatar top-avatar">TF</div></div></header>
      <div className="content">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR PRODUCTIVITY SPACE</div><h1>Make today <span>count.</span></h1><p className="subtitle">A little progress each day adds up to big results.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={18}/> Add new task</button></section>

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total tasks</span><span className="stat-icon purple"><ListTodo size={18}/></span></div><div className="stat-number">{tasks.length}<span className="stat-caption"> in your list</span></div><div className="stat-bottom"><span className="tiny-dot purple-dot"/>All tasks in one place</div></div>
          <div className="stat-card"><div className="stat-top"><span>In progress</span><span className="stat-icon orange"><Clock3 size={18}/></span></div><div className="stat-number">{pending}<span className="stat-caption"> to do</span></div><div className="stat-bottom"><span className="tiny-dot orange-dot"/>Keep the momentum going</div></div>
          <div className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green"><CheckCircle2 size={18}/></span></div><div className="stat-number">{completed}<span className="stat-caption"> finished</span></div><div className="stat-bottom"><span className="tiny-dot green-dot"/>Every win matters</div></div>
          <div className="stat-card progress-card"><div className="stat-top"><span>Completion rate</span><span className="stat-icon blue"><Zap size={18}/></span></div><div className="stat-number">{progress}<span className="percent">%</span></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div><div className="progress-foot"><span>Overall progress</span><span>{completed}/{tasks.length}</span></div></div>
        </section>

        <section className="tasks-section">
          <div className="section-heading"><div><h2>Your tasks <span className="task-total">{visible.length}</span></h2><p>Stay organized, one task at a time.</p></div><button className="filter-button" onClick={() => setFilter(filter === 'All tasks' ? 'In progress' : filter === 'In progress' ? 'Completed' : 'All tasks')}><Filter size={15}/>{filter}<ChevronDown size={15}/></button></div>
          <div className="toolbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks..." aria-label="Search tasks"/><kbd>⌘ K</kbd></div><div className="toolbar-note"><span className="online-dot"/> Synced with your workspace</div></div>
          {error && !modal && <div className="error-banner">{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
          {notice && <div className="notice"><Check size={16}/>{notice}</div>}
          <div className="task-list">
            {loading ? <div className="empty-state"><div className="loader"/><strong>Loading your tasks...</strong></div> :
             visible.length === 0 ? <div className="empty-state"><div className="empty-icon"><ListTodo size={24}/></div><strong>{query ? 'No matching tasks' : 'Your list is clear'}</strong><p>{query ? 'Try a different search term.' : 'Add a task to get your day moving.'}</p>{!query && <button className="primary-btn small" onClick={openCreate}><Plus size={16}/> Create your first task</button>}</div> :
             visible.map(task => <article className={`task-row ${task.completed ? 'task-done' : ''}`} key={task.id}>
               <button className={`check-button ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task)} aria-label={task.completed ? 'Mark as pending' : 'Mark as completed'}>{task.completed && <Check size={15}/>}</button>
               <div className="task-main"><div className="task-title-line"><h3>{task.title}</h3><span className={`priority priority-${task.priority.toLowerCase()}`}><span/>{task.priority}</span></div><p>{task.description || 'No description added.'}</p><div className="task-meta"><span className={`status ${task.completed ? 'status-done' : 'status-progress'}`}><span/>{task.completed ? 'Completed' : 'In progress'}</span>{task.dueDate && <span className="due-date"><CalendarDays size={13}/>{task.dueDate}</span>}</div></div>
               <div className="task-actions"><button className="icon-btn edit-btn" onClick={() => openEdit(task)} aria-label="Edit task"><Pencil size={16}/></button><div className="menu-wrap"><button className="icon-btn" onClick={() => setMenuId(menuId === task.id ? null : task.id)} aria-label="More options"><MoreHorizontal size={19}/></button>{menuId === task.id && <div className="dropdown"><button onClick={() => openEdit(task)}><Pencil size={14}/> Edit task</button><button className="danger" onClick={() => deleteTask(task)}><Trash2 size={14}/> Delete task</button></div>}</div></div>
             </article>)}
          </div>
          <div className="list-footer"><span>Showing <strong>{visible.length}</strong> of <strong>{tasks.length}</strong> tasks</span><span className="footer-tip"><Sparkles size={14}/> Focus on what matters most</span></div>
        </section>
        <footer>Made for better days <span>·</span> TaskFlow <span className="footer-heart">♥</span></footer>
      </div>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setModal(false); }}><div className="modal"><div className="modal-head"><div><div className="modal-icon"><ListTodo size={19}/></div><h2>{editing ? 'Edit task' : 'Create a task'}</h2><p>{editing ? 'Make changes to your task.' : 'Add something meaningful to your list.'}</p></div><button className="icon-btn" onClick={() => setModal(false)}><X size={19}/></button></div><form onSubmit={saveTask}><label>Task title <span>*</span><input autoFocus maxLength="100" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. Finish project report" required/></label><label>Description <small>Optional</small><textarea maxLength="500" value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="What does this task involve?" rows="3"/></label><div className="form-row"><label>Priority<select value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Due date <small>Optional</small><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})}/></label></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn" type="submit"><Plus size={17}/>{editing ? 'Save changes' : 'Create task'}</button></div></form></div></div>}
  </div>;
}
export default App;
