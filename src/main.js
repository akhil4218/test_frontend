import './style.css';

document.querySelector('#app').innerHTML = `
  <main class="wrap">
    <div class="eyebrow">🍓 RASPBERRY PI • FASTAPI</div>
    <h1>My Task Board</h1>
    <p class="subtitle">A real full-stack CRUD app, running on your own server.</p>
    <section class="panel">
      <form id="add-form">
        <input id="title" placeholder="What needs to be done?" maxlength="200" required autocomplete="off" />
        <button class="add" type="submit">+ Add task</button>
      </form>
      <div id="tasks"></div>
      <p class="summary" id="summary"></p>
    </section>
    <p class="status" id="status" role="status">Connecting...</p>
  </main>
`;

const tasksEl = document.querySelector('#tasks');
const statusEl = document.querySelector('#status');
const summaryEl = document.querySelector('#summary');

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}
function jsonOptions(method, data) {
  return {method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)};
}
async function refresh() {
  try {
    const tasks = await request('/api/tasks');
    tasksEl.replaceChildren();
    for (const task of tasks) {
      const row = document.createElement('div'); row.className = 'task';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark completed');
      checkbox.addEventListener('change', () => act(() => request(`/api/tasks/${task.id}`, jsonOptions('PATCH', {done: checkbox.checked}))));
      const title = document.createElement('span'); title.textContent = task.title; title.className = task.done ? 'done' : '';
      const edit = document.createElement('button'); edit.textContent = 'Edit'; edit.className = 'muted';
      edit.addEventListener('click', () => {
        const newTitle = prompt('Edit task', task.title);
        if (newTitle !== null && newTitle.trim()) act(() => request(`/api/tasks/${task.id}`, jsonOptions('PATCH', {title: newTitle.trim()})));
      });
      const del = document.createElement('button'); del.textContent = 'Delete'; del.className = 'danger';
      del.addEventListener('click', () => {
        if (confirm('Delete this task?')) act(() => request(`/api/tasks/${task.id}`, {method: 'DELETE'}));
      });
      row.append(checkbox, title, edit, del); tasksEl.append(row);
    }
    summaryEl.textContent = `${tasks.filter(t => t.done).length} completed / ${tasks.length} total`;
    statusEl.textContent = '● Connected to FastAPI';
  } catch (e) { statusEl.textContent = `API error: ${e.message}`; }
}
async function act(fn) {
  try { await fn(); await refresh(); }
  catch(e) {statusEl.textContent = `Error: ${e.message}`;}
}
document.querySelector('#add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.querySelector('#title');
  const value = input.value.trim(); if (!value) return;
  await act(async () => { await request('/api/tasks', jsonOptions('POST', {title:value})); input.value = ''; });
});
refresh();
