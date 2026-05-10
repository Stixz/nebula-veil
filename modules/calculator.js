(function() {
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldReset = false;

  const saved = localStorage.getItem('nebulaCalc');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      currentInput = state.currentInput || '0';
      previousInput = state.previousInput || '';
      operator = state.operator || null;
      shouldReset = state.shouldReset || false;
    } catch (e) {}
  }

  function saveState() {
    localStorage.setItem('nebulaCalc', JSON.stringify({
      currentInput, previousInput, operator, shouldReset
    }));
  }

  function updateDisplay() {
    if (!resultEl) return;
    resultEl.textContent = currentInput;
    if (expressionEl) {
      expressionEl.textContent = previousInput + (operator || '') + (shouldReset ? '' : currentInput);
    }
  }

  document.querySelectorAll('.key').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const action = btn.dataset.action;

      if (value !== undefined) {
        if (shouldReset) {
          currentInput = value;
          shouldReset = false;
        } else {
          currentInput = currentInput === '0' ? value : currentInput + value;
        }
      } 
      else if (action) {
        switch(action) {
          case 'clear':
            currentInput = '0';
            previousInput = '';
            operator = null;
            shouldReset = false;
            localStorage.removeItem('nebulaCalc');
            break;
          case 'sign':
            currentInput = (parseFloat(currentInput) * -1).toString();
            break;
          case 'percent':
            currentInput = (parseFloat(currentInput) / 100).toString();
            break;
          case 'add':
          case 'subtract':
          case 'multiply':
          case 'divide':
            if (operator && !shouldReset) calculate();
            previousInput = currentInput;
            operator = { add: '+', subtract: '−', multiply: '×', divide: '÷' }[action];
            shouldReset = true;
            break;
          case 'equals':
            if (operator) calculate();
            shouldReset = true;
            break;
        }
      }
      saveState();
      updateDisplay();
    });
  });

  function calculate() {
    if (!operator) return;
    let prev = parseFloat(previousInput);
    let curr = parseFloat(currentInput);
    let res = 0;
    switch(operator) {
      case '+': res = prev + curr; break;
      case '−': res = prev - curr; break;
      case '×': res = prev * curr; break;
      case '÷': res = curr !== 0 ? prev / curr : 'Error'; break;
    }
    currentInput = res.toString();
    operator = null;
    previousInput = '';
  }

  document.addEventListener('keydown', (e) => {
    if (['0','1','2','3','4','5','6','7','8','9','.'].includes(e.key)) {
      const btn = document.querySelector(`.key[data-value="${e.key}"]`);
      if (btn) btn.click();
    }
    if (e.key === 'Enter' || e.key === '=') {
      const equalsBtn = document.querySelector('.key[data-action="equals"]');
      if (equalsBtn) equalsBtn.click();
    }
    if (e.key === 'Escape') {
      const clearBtn = document.querySelector('.key[data-action="clear"]');
      if (clearBtn) clearBtn.click();
    }
  });

  updateDisplay();
})();