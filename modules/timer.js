(function() {
  let timeLeft = 25 * 60;
  let timerInterval = null;
  let isRunning = false;
  let activeModeName = 'Pomodoro';

  const countdownEl = document.getElementById('timer-countdown');
  const statusEl = document.getElementById('timer-status');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const modeBtns = document.querySelectorAll('.mode-btn');

  const saved = localStorage.getItem('nebulaTimer');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      timeLeft = state.timeLeft ?? (25 * 60);
      activeModeName = state.activeModeName || 'Pomodoro';
      const targetMode = Array.from(modeBtns).find(b => b.textContent.trim() === activeModeName);
      if (targetMode) {
        modeBtns.forEach(b => b.classList.remove('active'));
        targetMode.classList.add('active');
      }
      statusEl.textContent = activeModeName.includes('Break') ? "Break Time" : "Focus Time";
    } catch (e) {}
  }

  function saveState() {
    localStorage.setItem('nebulaTimer', JSON.stringify({
      timeLeft,
      activeModeName,
      savedAt: Date.now()
    }));
  }

  function updateDisplay() {
    if (!countdownEl) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function startTimer() {
    if (isRunning || timeLeft <= 0) return;
    isRunning = true;
    startBtn.textContent = 'Running...';
    startBtn.disabled = true;

    timerInterval = setInterval(() => {
      timeLeft--;
      saveState();
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Start';
        startBtn.disabled = false;
        statusEl.textContent = "Time's Up! 🎉";
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = 'Start';
    startBtn.disabled = false;
    saveState();
  }

  function resetTimer() {
    pauseTimer();
    const activeMode = document.querySelector('.mode-btn.active');
    const minutes = activeMode ? parseInt(activeMode.dataset.min) : 25;
    timeLeft = minutes * 60;
    activeModeName = activeMode ? activeMode.textContent.trim() : 'Pomodoro';
    statusEl.textContent = activeModeName.includes('Break') ? "Break Time" : "Focus Time";
    saveState();
    updateDisplay();
  }

  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pauseTimer();
      timeLeft = parseInt(btn.dataset.min) * 60;
      activeModeName = btn.textContent.trim();
      statusEl.textContent = activeModeName.includes('Break') ? "Break Time" : "Focus Time";
      saveState();
      updateDisplay();
    });
  });

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName?.toUpperCase();
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    
    if (e.key === ' ' && !isEditable) {
      e.preventDefault();
      isRunning ? pauseTimer() : startTimer();
    }
    if (e.key.toLowerCase() === 'r' && !isEditable) resetTimer();
  });

  updateDisplay();
})();