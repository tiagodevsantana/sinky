/**
 * Minimal mock API server for local E2E test runs without Docker.
 * Simulates the NestJS backend (http://localhost:3001).
 * Uses an in-memory store — no database needed.
 */
const http = require('http');
const crypto = require('crypto');

let tasks = [];

function uuidv4() {
  return crypto.randomUUID();
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3001');
  const parts = url.pathname.split('/').filter(Boolean); // ['tasks'] or ['tasks', ':id'] or ['ai', 'generate']

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
    return res.end();
  }

  // GET /tasks
  if (req.method === 'GET' && parts[0] === 'tasks' && !parts[1]) {
    return json(res, 200, tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  }

  // GET /tasks/:id
  if (req.method === 'GET' && parts[0] === 'tasks' && parts[1]) {
    const task = tasks.find((t) => t.id === parts[1]);
    if (!task) return json(res, 404, { error: 'Task not found' });
    return json(res, 200, task);
  }

  // POST /tasks
  if (req.method === 'POST' && parts[0] === 'tasks' && !parts[1]) {
    const body = await readBody(req);
    if (!body.title || typeof body.title !== 'string') {
      return json(res, 400, { message: ['title should not be empty'], statusCode: 400 });
    }
    const task = {
      id: uuidv4(),
      title: body.title,
      isCompleted: false,
      isAiGenerated: body.isAiGenerated ?? false,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    return json(res, 201, task);
  }

  // PATCH /tasks/:id
  if (req.method === 'PATCH' && parts[0] === 'tasks' && parts[1]) {
    const task = tasks.find((t) => t.id === parts[1]);
    if (!task) return json(res, 404, { error: 'Task not found' });
    const body = await readBody(req);
    if (body.title !== undefined) task.title = body.title;
    if (body.isCompleted !== undefined) task.isCompleted = Boolean(body.isCompleted);
    return json(res, 200, task);
  }

  // DELETE /tasks/:id
  if (req.method === 'DELETE' && parts[0] === 'tasks' && parts[1]) {
    const idx = tasks.findIndex((t) => t.id === parts[1]);
    if (idx === -1) return json(res, 404, { error: 'Task not found' });
    tasks.splice(idx, 1);
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    return res.end();
  }

  // POST /ai/generate
  if (req.method === 'POST' && parts[0] === 'ai' && parts[1] === 'generate') {
    const body = await readBody(req);
    if (!body.objective || !body.apiKey) {
      return json(res, 400, { message: ['objective should not be empty', 'apiKey should not be empty'], statusCode: 400 });
    }
    const subtasks = ['Subtarefa 1', 'Subtarefa 2', 'Subtarefa 3', 'Subtarefa 4'].map((t) => {
      const task = { id: uuidv4(), title: t, isCompleted: false, isAiGenerated: true, createdAt: new Date().toISOString() };
      tasks.push(task);
      return task;
    });
    return json(res, 201, subtasks);
  }

  json(res, 404, { message: 'Not Found', statusCode: 404 });
});

server.listen(3001, () => {
  console.log('Mock API server running at http://localhost:3001');
});
