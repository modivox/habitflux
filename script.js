// script.js (commit 2) — core functionality (in-memory)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addHabitForm');
  const nameInput = document.getElementById('habitName');
  const colorInput = document.getElementById('habitColor');
  const habitsEl = document.getElementById('habits');

  // In-memory data model
  let habits = [];

  // Utilities
  const today = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  function isCompletedOn(habit, dateStr) {
    return habit.history && habit.history.includes(dateStr);
  }

  function calculateStreak(habit) {
    // Count consecutive days up to today
    if (!habit.history || habit.history.length === 0) return 0;
    let streak = 0;
    const hist = new Set(habit.history);
    let cursor = new Date();
    while (true) {
      const ds = cursor.toISOString().slice(0, 10);
      if (hist.has(ds)) streak++;
      else break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function render() {
    habitsEl.innerHTML = '';
    if (habits.length === 0) {
      habitsEl.innerHTML = '<div class="muted">No habits yet — add one above.</div>';
      return;
    }
    habits.forEach(habit => {
      const card = document.createElement('div');
      card.className = 'card habit';
      card.style.borderLeft = `6px solid ${habit.color || '#6366f1'}`;
      card.innerHTML = `
        <div>
          <div style="font-weight:600">${habit.name}</div>
          <div class="muted">Streak: ${calculateStreak(habit)} days</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button data-id="${habit.id}" class="toggleBtn">
            ${isCompletedOn(habit, today()) ? 'Completed ✅' : 'Mark today'}
          </button>
        </div>`;
      habitsEl.appendChild(card);
    });

    // attach toggle handlers
    document.querySelectorAll('.toggleBtn').forEach(btn => {
      btn.addEventListener('click', e => {
        const id = e.currentTarget.dataset.id;
        toggleToday(id);
      });
    });
  }

  function addHabit(name, color) {
    const habit = {
      id: Date.now().toString(36),
      name,
      color,
      history: [] // date strings: YYYY-MM-DD
    };
    habits.unshift(habit);
    render();
  }

  function toggleToday(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    const t = today();
    if (!h.history) h.history = [];
    const idx = h.history.indexOf(t);
    if (idx === -1) {
      h.history.push(t);
    } else {
      h.history.splice(idx, 1);
    }
    render();
  }

  // Form handling
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const color = colorInput.value || '#6366f1';
    if (name) {
      addHabit(name, color);
      nameInput.value = '';
    }
  });

  render();
});
