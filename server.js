const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
function readInitialDataIsEmpty() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')).length === 0; }
  catch { return true; }
}
if (!fs.existsSync(DATA_FILE) || readInitialDataIsEmpty()) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { id: crypto.randomUUID(), title: 'Plan the project', description: 'Review the requirements and plan the next steps.', priority: 'High', dueDate: '', completed: false, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Build the dashboard', description: 'Create a clean task overview with useful statistics.', priority: 'Medium', dueDate: '', completed: true, createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), title: 'Prepare for submission', description: 'Check the project and get ready for the demo.', priority: 'Low', dueDate: '', completed: false, createdAt: new Date().toISOString() }
  ], null, 2));
}

function readTasks() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}
function cleanText(value, max = 180) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'TaskFlow API is running' }));

app.get('/api/tasks', (req, res) => {
  const tasks = readTasks().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(tasks);
});

app.get('/api/tasks/:id', (req, res) => {
  const task = readTasks().find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', (req, res) => {
  const title = cleanText(req.body.title, 100);
  if (!title) return res.status(400).json({ message: 'Task title is required' });
  const tasks = readTasks();
  const task = {
    id: crypto.randomUUID(),
    title,
    description: cleanText(req.body.description, 500),
    priority: ['Low', 'Medium', 'High'].includes(req.body.priority) ? req.body.priority : 'Medium',
    dueDate: cleanText(req.body.dueDate, 20),
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(task);
  writeTasks(tasks);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Task not found' });
  const title = cleanText(req.body.title, 100);
  if (!title) return res.status(400).json({ message: 'Task title is required' });
  tasks[index] = {
    ...tasks[index],
    title,
    description: cleanText(req.body.description, 500),
    priority: ['Low', 'Medium', 'High'].includes(req.body.priority) ? req.body.priority : 'Medium',
    dueDate: cleanText(req.body.dueDate, 20)
  };
  writeTasks(tasks);
  res.json(tasks[index]);
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  task.completed = !task.completed;
  writeTasks(tasks);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const filtered = tasks.filter(t => t.id !== req.params.id);
  if (filtered.length === tasks.length) return res.status(404).json({ message: 'Task not found' });
  writeTasks(filtered);
  res.json({ message: 'Task deleted successfully' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
});

app.listen(PORT, () => console.log(`TaskFlow API running at http://localhost:${PORT}`));
