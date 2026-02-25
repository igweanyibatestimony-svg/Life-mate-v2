// ====================== DATA (localStorage) ======================
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let journalEntries = JSON.parse(localStorage.getItem('journalEntries')) || [];
let nutritionLog = JSON.parse(localStorage.getItem('nutritionLog')) || [];
let fitnessLog = JSON.parse(localStorage.getItem('fitnessLog')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || { theme: 'dark', aiPersonality: 'motivational' };

// ====================== ROUTER ======================
const appEl = document.getElementById('app');
const navLinks = document.querySelectorAll('.nav-link');

function renderPage(pageId) {
  // Update active nav
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Render the selected page
  switch (pageId) {
    case 'dashboard': return renderDashboard();
    case 'habits': return renderHabitsPage();
    case 'money': return renderMoneyPage();
    case 'goals': return renderGoalsPage();
    case 'ai': return renderAIPage();
    case 'journal': return renderJournalPage();
    case 'analytics': return renderAnalyticsPage();
    case 'calendar': return renderCalendarPage();
    case 'nutrition': return renderNutritionPage();
    case 'fitness': return renderFitnessPage();
    case 'settings': return renderSettingsPage();
    case 'help': return renderHelpPage();
    default: return renderDashboard();
  }
}

// Handle hash changes
window.addEventListener('hashchange', () => {
  const page = location.hash.slice(1) || 'dashboard';
  renderPage(page);
});

// Initial load
if (!location.hash) location.hash = 'dashboard';
else renderPage(location.hash.slice(1));

// ====================== PAGE RENDERERS ======================

function renderDashboard() {
  const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  appEl.innerHTML = `
    <div class="page">
      <header class="glass" style="padding: 20px; margin-bottom: 25px;">
        <h1>Welcome back, <span style="color:#ffd966;">LifeMate</span></h1>
        <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>
      <div class="dashboard-grid">
        <div class="card">
          <h2>🧘 Habits</h2>
          <div style="font-size:3rem;">🔥 ${totalStreak}</div>
          <p>Total streak days</p>
          <button onclick="location.hash='habits'">Manage Habits →</button>
        </div>
        <div class="card">
          <h2>💰 Money</h2>
          <div style="font-size:2rem;">$${balance.toFixed(2)}</div>
          <p>Income: $${income} · Expense: $${expense}</p>
          <button onclick="location.hash='money'">Details →</button>
        </div>
        <div class="card">
          <h2>🎯 Goals</h2>
          <div>${goals.length} active goals</div>
          <div>Average progress: ${Math.round(goals.reduce((a, g) => a + g.progress, 0) / (goals.length || 1))}%</div>
          <button onclick="location.hash='goals'">View →</button>
        </div>
        <div class="card">
          <h2>📓 Journal</h2>
          <div>${journalEntries.length} entries</div>
          <button onclick="location.hash='journal'">Write →</button>
        </div>
      </div>
    </div>
  `;
}

function renderHabitsPage() {
  let html = `
    <div class="page">
      <h2 style="margin-bottom:20px;">🧘 Habits Tracker</h2>
      <div class="card">
        <div id="habit-list"></div>
        <div class="add-habit" style="display:flex; gap:10px;">
          <input type="text" id="new-habit-name" placeholder="New habit...">
          <button id="add-habit-btn">Add</button>
        </div>
        <button id="ai-habit-tip" class="ai-tip-btn" data-topic="habits">💡 AI Encouragement</button>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  renderHabitList();
  document.getElementById('add-habit-btn').addEventListener('click', addHabit);
  document.getElementById('ai-habit-tip').addEventListener('click', () => fetchAIMessage('habits'));
}

function renderHabitList() {
  const container = document.getElementById('habit-list');
  if (!container) return;
  container.innerHTML = habits.map((h, i) => `
    <div class="habit-item">
      <input type="checkbox" data-index="${i}" ${h.completedToday ? 'checked' : ''}>
      <span style="flex:1;">${h.name}</span>
      <span class="streak">🔥 ${h.streak || 0}</span>
      <button class="delete-habit" data-index="${i}">✖</button>
    </div>
  `).join('');
  // Attach events
  document.querySelectorAll('.habit-item input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', toggleHabit);
  });
  document.querySelectorAll('.delete-habit').forEach(btn => {
    btn.addEventListener('click', deleteHabit);
  });
}

function toggleHabit(e) {
  const index = e.target.dataset.index;
  const habit = habits[index];
  if (e.target.checked && !habit.completedToday) {
    habit.completedToday = true;
    habit.streak = (habit.streak || 0) + 1;
    if (habit.streak % 7 === 0) confetti({ particleCount: 100, spread: 70 });
  } else if (!e.target.checked && habit.completedToday) {
    // Prevent unchecking to keep streak honest (optional)
    e.target.checked = true;
    return;
  }
  localStorage.setItem('habits', JSON.stringify(habits));
  renderHabitList();
}

function deleteHabit(e) {
  const index = e.target.dataset.index;
  habits.splice(index, 1);
  localStorage.setItem('habits', JSON.stringify(habits));
  renderHabitList();
}

function addHabit() {
  const input = document.getElementById('new-habit-name');
  const name = input.value.trim();
  if (name) {
    habits.push({ name, streak: 0, completedToday: false });
    localStorage.setItem('habits', JSON.stringify(habits));
    input.value = '';
    renderHabitList();
  }
}

function renderMoneyPage() {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  let html = `
    <div class="page">
      <h2>💰 Money Tracker</h2>
      <div class="card">
        <div style="font-size:2.5rem;">$${balance.toFixed(2)}</div>
        <p>Income: $${income} | Expense: $${expense}</p>
        <canvas id="money-chart" width="400" height="200"></canvas>
        <div class="add-transaction" style="display:grid; gap:10px; margin-top:20px;">
          <input type="text" id="trans-desc" placeholder="Description">
          <input type="number" id="trans-amount" placeholder="Amount">
          <select id="trans-type">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button id="add-trans-btn">Add Transaction</button>
        </div>
        <button id="ai-money-tip" class="ai-tip-btn" data-topic="money">💡 AI Spending Tip</button>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  document.getElementById('add-trans-btn').addEventListener('click', addTransaction);
  document.getElementById('ai-money-tip').addEventListener('click', () => fetchAIMessage('money'));
  renderMoneyChart(income, expense);
}

function addTransaction() {
  const desc = document.getElementById('trans-desc').value.trim();
  const amount = parseFloat(document.getElementById('trans-amount').value);
  const type = document.getElementById('trans-type').value;
  if (desc && !isNaN(amount) && amount > 0) {
    transactions.push({ description: desc, amount, type, date: new Date().toISOString() });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    renderMoneyPage(); // re-render to update chart & balance
  }
}

function renderMoneyChart(income, expense) {
  const ctx = document.getElementById('money-chart')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#4fd1c5', '#f687b3'],
        borderColor: 'transparent',
      }]
    },
    options: { plugins: { legend: { labels: { color: '#e0d0ff' } } } }
  });
}

function renderGoalsPage() {
  let html = `
    <div class="page">
      <h2>🎯 Goals</h2>
      <div class="card">
        <div id="goals-list"></div>
        <div style="display:flex; gap:10px; margin:20px 0;">
          <input type="text" id="goal-name" placeholder="Goal name">
          <input type="number" id="goal-progress" placeholder="%" min="0" max="100">
          <button id="add-goal-btn">Add Goal</button>
        </div>
        <button id="ai-goal-tip" class="ai-tip-btn" data-topic="goals">💡 AI Motivation</button>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  renderGoalsList();
  document.getElementById('add-goal-btn').addEventListener('click', addGoal);
  document.getElementById('ai-goal-tip').addEventListener('click', () => fetchAIMessage('goals'));
}

function renderGoalsList() {
  const container = document.getElementById('goals-list');
  if (!container) return;
  container.innerHTML = goals.map((g, i) => `
    <div class="goal-item">
      <div style="display:flex; justify-content:space-between;">
        <strong>${g.name}</strong> <span>${g.progress}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%;"></div></div>
      <div style="display:flex; gap:10px;">
        <button class="update-goal" data-index="${i}" data-inc="10">+10%</button>
        <button class="update-goal" data-index="${i}" data-inc="-10">-10%</button>
        <button class="delete-goal" data-index="${i}">🗑️</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.update-goal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.dataset.index;
      const inc = parseInt(e.target.dataset.inc);
      const goal = goals[index];
      goal.progress = Math.min(100, Math.max(0, (goal.progress || 0) + inc));
      if (goal.progress === 100) confetti({ particleCount: 150, spread: 100 });
      localStorage.setItem('goals', JSON.stringify(goals));
      renderGoalsList();
    });
  });
  document.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      goals.splice(e.target.dataset.index, 1);
      localStorage.setItem('goals', JSON.stringify(goals));
      renderGoalsList();
    });
  });
}

function addGoal() {
  const name = document.getElementById('goal-name').value.trim();
  const progress = parseInt(document.getElementById('goal-progress').value) || 0;
  if (name) {
    goals.push({ name, progress: Math.min(100, Math.max(0, progress)) });
    localStorage.setItem('goals', JSON.stringify(goals));
    renderGoalsList();
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-progress').value = '';
  }
}

function renderAIPage() {
  appEl.innerHTML = `
    <div class="page">
      <h2>🤖 AI Companion Chat</h2>
      <div class="card">
        <div class="chat-messages" id="chat-messages">
          <div>Hello! I'm your AI companion. Ask me anything about your habits, finances, or goals.</div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Type your message...">
          <button id="send-chat">Send</button>
        </div>
        <div style="margin-top:15px;">
          <button id="quick-habits">💬 Habit tip</button>
          <button id="quick-money">💬 Money tip</button>
          <button id="quick-goals">💬 Goal motivation</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('send-chat').addEventListener('click', sendChatMessage);
  document.getElementById('quick-habits').addEventListener('click', () => fetchAIMessage('habits', true));
  document.getElementById('quick-money').addEventListener('click', () => fetchAIMessage('money', true));
  document.getElementById('quick-goals').addEventListener('click', () => fetchAIMessage('goals', true));
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  addChatMessage('user', msg);
  input.value = '';
  // Call AI with custom prompt
  const context = buildContextString();
  const prompt = `You are a helpful AI companion. The user says: "${msg}". Based on their data: ${context}. Respond in a friendly, concise way (max 3 sentences).`;
  const aiResponse = await callOpenAI(prompt);
  addChatMessage('ai', aiResponse);
}

function addChatMessage(sender, text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.style.margin = '10px 0';
  div.style.padding = '8px 12px';
  div.style.background = sender === 'user' ? 'rgba(159,122,234,0.2)' : 'rgba(255,255,255,0.05)';
  div.style.borderRadius = '20px';
  div.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
  div.innerHTML = `<strong>${sender === 'user' ? 'You' : 'AI'}:</strong> ${text}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function buildContextString() {
  return `Habits: ${habits.map(h => `${h.name} (streak ${h.streak})`).join(', ')}. Finances: income $${transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)}, expense $${transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)}. Goals: ${goals.map(g=>`${g.name} ${g.progress}%`).join(', ')}.`;
}

async function callOpenAI(prompt) {
  try {
    const res = await fetch('/api/ai-companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customPrompt: prompt, habits, transactions, goals, journalEntries })
    });
    const data = await res.json();
    return data.message || 'Sorry, I could not respond.';
  } catch {
    return 'Error connecting to AI.';
  }
}

async function fetchAIMessage(type, showInChat = false) {
  const promptMap = {
    habits: 'Give a short encouraging message about habit consistency.',
    money: 'Give one practical money-saving tip.',
    goals: 'Give motivational message about goals.'
  };
  const prompt = promptMap[type] || '';
  const response = await callOpenAI(prompt);
  if (showInChat) {
    addChatMessage('ai', response);
  } else {
    alert(`AI: ${response}`); // simple feedback
  }
}

function renderJournalPage() {
  let html = `
    <div class="page">
      <h2>📓 Journal</h2>
      <div class="card">
        <textarea id="journal-text" placeholder="Write your thoughts..." rows="5"></textarea>
        <button id="save-journal">Save Entry</button>
        <button id="ai-reflection-prompt">🔮 AI Reflection Prompt</button>
        <h3>Past Entries</h3>
        <div id="journal-entries-list"></div>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  renderJournalEntries();
  document.getElementById('save-journal').addEventListener('click', saveJournalEntry);
  document.getElementById('ai-reflection-prompt').addEventListener('click', () => fetchAIMessage('reflectionPrompt'));
}

function saveJournalEntry() {
  const text = document.getElementById('journal-text').value.trim();
  if (text) {
    journalEntries.push({ text, date: new Date().toISOString() });
    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    document.getElementById('journal-text').value = '';
    renderJournalEntries();
  }
}

function renderJournalEntries() {
  const container = document.getElementById('journal-entries-list');
  if (!container) return;
  container.innerHTML = journalEntries.slice().reverse().map(e => `
    <div class="card" style="margin-top:10px; padding:15px;">
      <small>${new Date(e.date).toLocaleDateString()}</small>
      <p>${e.text}</p>
    </div>
  `).join('');
}

function renderAnalyticsPage() {
  appEl.innerHTML = `
    <div class="page">
      <h2>📊 Analytics</h2>
      <div class="dashboard-grid">
        <div class="card">
          <h3>Habit Completion (last 7 days)</h3>
          <canvas id="habit-chart"></canvas>
        </div>
        <div class="card">
          <h3>Income vs Expense</h3>
          <canvas id="money-chart-analytics"></canvas>
        </div>
        <div class="card">
          <h3>Goal Progress</h3>
          <canvas id="goal-chart"></canvas>
        </div>
      </div>
    </div>
  `;
  // Simple mock charts (in real app, compute from history)
  new Chart(document.getElementById('habit-chart'), {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label: 'Habits done',
        data: [3,5,4,6,2,7,4],
        backgroundColor: '#b794f4'
      }]
    }
  });
  const income = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  new Chart(document.getElementById('money-chart-analytics'), {
    type: 'pie',
    data: {
      labels: ['Income','Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#4fd1c5','#f687b3']
      }]
    }
  });
  new Chart(document.getElementById('goal-chart'), {
    type: 'doughnut',
    data: {
      labels: goals.map(g=>g.name),
      datasets: [{
        data: goals.map(g=>g.progress),
        backgroundColor: ['#fbbf24','#f472b6','#a78bfa','#60a5fa']
      }]
    }
  });
}

function renderCalendarPage() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let days = [];
  for (let i = 0; i < firstDay; i++) days.push('<div class="calendar-day"></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate();
    days.push(`<div class="calendar-day ${isToday ? 'today' : ''}">${d}</div>`);
  }

  appEl.innerHTML = `
    <div class="page">
      <h2>📅 ${today.toLocaleString('default', { month: 'long' })} ${year}</h2>
      <div class="card">
        <div class="calendar-grid">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          ${days.join('')}
        </div>
      </div>
    </div>
  `;
}

function renderNutritionPage() {
  let html = `
    <div class="page">
      <h2>🥗 Nutrition Log</h2>
      <div class="card">
        <div id="food-list"></div>
        <div style="display:flex; gap:10px;">
          <input type="text" id="food-name" placeholder="Food">
          <input type="number" id="food-calories" placeholder="Calories">
          <button id="add-food">Add</button>
        </div>
        <button id="ai-nutrition-tip">💡 AI Nutrition Tip</button>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  renderFoodList();
  document.getElementById('add-food').addEventListener('click', addFood);
  document.getElementById('ai-nutrition-tip').addEventListener('click', () => fetchAIMessage('nutrition'));
}

function renderFoodList() {
  const container = document.getElementById('food-list');
  if (!container) return;
  container.innerHTML = nutritionLog.map((f, i) => `
    <div class="food-item">
      <span>${f.name} - ${f.calories} cal</span>
      <button class="delete-food" data-index="${i}">✖</button>
    </div>
  `).join('');
  document.querySelectorAll('.delete-food').forEach(btn => {
    btn.addEventListener('click', (e) => {
      nutritionLog.splice(e.target.dataset.index, 1);
      localStorage.setItem('nutritionLog', JSON.stringify(nutritionLog));
      renderFoodList();
    });
  });
}

function addFood() {
  const name = document.getElementById('food-name').value.trim();
  const cal = parseInt(document.getElementById('food-calories').value);
  if (name && !isNaN(cal)) {
    nutritionLog.push({ name, calories: cal, date: new Date().toISOString() });
    localStorage.setItem('nutritionLog', JSON.stringify(nutritionLog));
    renderFoodList();
    document.getElementById('food-name').value = '';
    document.getElementById('food-calories').value = '';
  }
}

function renderFitnessPage() {
  let html = `
    <div class="page">
      <h2>💪 Fitness Log</h2>
      <div class="card">
        <div id="workout-list"></div>
        <div style="display:flex; gap:10px;">
          <input type="text" id="workout-name" placeholder="Exercise">
          <input type="number" id="workout-duration" placeholder="Minutes">
          <button id="add-workout">Add</button>
        </div>
        <button id="ai-fitness-tip">💡 AI Fitness Tip</button>
      </div>
    </div>
  `;
  appEl.innerHTML = html;
  renderWorkoutList();
  document.getElementById('add-workout').addEventListener('click', addWorkout);
  document.getElementById('ai-fitness-tip').addEventListener('click', () => fetchAIMessage('fitness'));
}

function renderWorkoutList() {
  const container = document.getElementById('workout-list');
  if (!container) return;
  container.innerHTML = fitnessLog.map((w, i) => `
    <div class="workout-item">
      <span>${w.name} - ${w.duration} min</span>
      <button class="delete-workout" data-index="${i}">✖</button>
    </div>
  `).join('');
  document.querySelectorAll('.delete-workout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      fitnessLog.splice(e.target.dataset.index, 1);
      localStorage.setItem('fitnessLog', JSON.stringify(fitnessLog));
      renderWorkoutList();
    });
  });
}

function addWorkout() {
  const name = document.getElementById('workout-name').value.trim();
  const dur = parseInt(document.getElementById('workout-duration').value);
  if (name && !isNaN(dur)) {
    fitnessLog.push({ name, duration: dur, date: new Date().toISOString() });
    localStorage.setItem('fitnessLog', JSON.stringify(fitnessLog));
    renderWorkoutList();
    document.getElementById('workout-name').value = '';
    document.getElementById('workout-duration').value = '';
  }
}

function renderSettingsPage() {
  appEl.innerHTML = `
    <div class="page">
      <h2>⚙️ Settings</h2>
      <div class="card">
        <label>AI Personality</label>
        <select id="ai-personality">
          <option value="motivational" ${settings.aiPersonality==='motivational'?'selected':''}>Motivational</option>
          <option value="funny" ${settings.aiPersonality==='funny'?'selected':''}>Funny</option>
          <option value="serious" ${settings.aiPersonality==='serious'?'selected':''}>Serious</option>
        </select>
        <button id="save-settings">Save</button>
        <button id="export-data">📤 Export All Data (CSV)</button>
        <button id="clear-data" style="background:#c53030;">⚠️ Clear All Data</button>
      </div>
    </div>
  `;
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('export-data').addEventListener('click', exportData);
  document.getElementById('clear-data').addEventListener('click', clearAllData);
}

function saveSettings() {
  settings.aiPersonality = document.getElementById('ai-personality').value;
  localStorage.setItem('settings', JSON.stringify(settings));
  alert('Settings saved!');
}

function exportData() {
  const data = {
    habits, transactions, goals, journalEntries, nutritionLog, fitnessLog, settings
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lifemate_backup.json';
  a.click();
}

function clearAllData() {
  if (confirm('Delete ALL your data? This cannot be undone.')) {
    localStorage.clear();
    habits = []; transactions = []; goals = []; journalEntries = []; nutritionLog = []; fitnessLog = []; settings = { theme: 'dark', aiPersonality: 'motivational' };
    location.reload();
  }
}

function renderHelpPage() {
  appEl.innerHTML = `
    <div class="page">
      <h2>❓ Help & About</h2>
      <div class="card">
        <h3>LifeMate v3.0</h3>
        <p>Your 12‑in‑1 AI companion dashboard.</p>
        <p>Features: Habits, Money, Goals, AI Chat, Journal, Analytics, Calendar, Nutrition, Fitness, Settings, Export, and more.</p>
        <p>All data is stored in your browser's local storage.</p>
        <p>To use AI, set your OpenAI key in Vercel environment variables.</p>
        <hr>
        <p>Made with ❤️ for a smarter life.</p>
      </div>
    </div>
  `;
}