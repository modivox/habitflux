// script.js (commit 3) — persistence and improved UI
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'habitflux.data.v1';
  const form = document.getElementById('addHabitForm');
  const nameInput = document.getElementById('habitName');
  const colorInput = document.getElementById('habitColor');
  const habitsEl = document.getElementById('habits');
  const summaryEl = document.getElementById('summary');
  const clearBtn = document.getElementById('clearBtn');
  const exportBtn = document.getElementById('exportBtn');

  let habits = load();

  // Utility helpers
  const todayStr = () => new Date().toISOString().slice(0, 10);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.error('Failed to load habits', e);
      return [];
    }
  }

  function ensureHistoryUnique(habit) {
    if (!Array.isArray(habit.history)) habit.history = [];
    habit.history = Array.from(new Set(habit.history)).sort().reverse();
  }

  function isCompletedOn(habit, dateStr) {
    return habit.history && habit.history.includes(dateStr);
  }

  function calculateStreak(habit) {
    ensureHistoryUnique(habit);
    if (!habit.history.length) return 0;
    let streak = 0;
    const histSet = new Set(habit.history);
    let cursor = new Date();
    while (true) {
      const ds = cursor.toISOString().slice(0, 10);
      if (histSet.has(ds)) streak++;
      else break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function lastCompleted(habit) {
    if (!habit.history || habit.history.length === 0) return null;
    // history stored sorted descending
    const sorted = habit.history.slice().sort().reverse();
    return sorted[0];
  }

  function render() {
    habitsEl.innerHTML = '';
    if (habits.length === 0) {
      habitsEl.innerHTML = '<div class="muted">No habits yet — add one above.</div>';
      summaryEl.textContent = '0 habits • 0 completions today';
      return;
    }

    let completionsToday = 0;

    habits.forEach(habit => {
      ensureHistoryUnique(habit);
      const card = document.createElement('div');
      card.className = 'card habit';
      card.style.borderLeft = `6px solid ${habit.color || '#6366f1'}`;

      const completedToday = isCompletedOn(habit, todayStr());
      if (completedToday) completionsToday++;

      const last = lastCompleted(habit);
      card.innerHTML = `
        <div>
          <div style="font-weight:600">${escapeHtml(habit.name)}</div>
          <div class="muted">Streak: ${calculateStreak(habit)} days · ${last ? 'Last: ' + last : 'No completions yet'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button data-id="${habit.id}" class="toggleBtn">${completedToday ? 'Completed ✅' : 'Mark today'}</button>
          <button data-id="${habit.id}" class="deleteBtn small">Delete</button>
        </div>`;

      habitsEl.appendChild(card);
    });

    summaryEl.textContent = `${habits.length} habits • ${completionsToday} completions today`;

    // attach handlers
    document.querySelectorAll('.toggleBtn').forEach(btn => {
      btn.addEventListener('click', e => {
        toggleToday(e.currentTarget.dataset.id);
      });
    });

    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Delete this habit?')) {
          habits = habits.filter(h => h.id !== id);
          save();
          render();
        }
      });
    });
  }

  function addHabit(name, color) {
    const habit = {
      id: Date.now().toString(36),
      name: name.trim(),
      color: color || '#6366f1',
      history: []
    };
    habits.unshift(habit);
    save();
    render();
  }

  function toggleToday(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    const t = todayStr();
    if (!Array.isArray(h.history)) h.history = [];
    const idx = h.history.indexOf(t);
    if (idx === -1) {
      h.history.push(t);
    } else {
      h.history.splice(idx, 1);
    }
    ensureHistoryUnique(h);
    save();
    render();
  }

  // Simple export
  exportBtn.addEventListener('click', () => {
    const data = JSON.stringify(habits, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habitflux-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Clear storage
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear ALL habits and data?')) return;
    habits = [];
    save();
    render();
  });

  // Form handling
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const color = colorInput.value || '#6366f1';
    if (name) {
      addHabit(name, color);
      nameInput.value = '';
      nameInput.focus();
    }
  });

  // small safety: HTML escaping
  function escapeHtml(str = '') {
    return str.replace(/[&<>"'`]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',"`":'&#96;'}[s]));
  }

  render();
});
