(function() {
  const taskList = document.getElementById('task-list');
  const newTaskInput = document.getElementById('new-task-input');
  const searchInput = document.getElementById('task-search');
  const categorySelect = document.getElementById('task-category');
  const prioritySelect = document.getElementById('task-priority');
  const dueDateInput = document.getElementById('task-due-date');
  const addBtn = document.getElementById('add-task-confirm');
  const addTaskBtn = document.getElementById('add-task-btn');
  const editModal = document.getElementById('edit-task-modal');
  const editTaskInput = document.getElementById('edit-task-text');
  const editCategorySelect = document.getElementById('edit-task-category');
  const editPrioritySelect = document.getElementById('edit-task-priority');
  const editDueDateInput = document.getElementById('edit-task-due-date');
  const editCompletedCheckbox = document.getElementById('edit-task-completed');

  if (!taskList || !newTaskInput) return;

  let tasks = JSON.parse(localStorage.getItem('nebulaTasks') || '[]');
  let currentFilter = 'all';
  let searchTerm = '';
  let editingTaskIndex = null;
  let notifiedTasks = new Set(); // Track tasks that have been notified

  // Migrate old tasks to new format with priority, due date, and category
  tasks = tasks.map(task => ({
    text: task.text,
    done: task.done,
    priority: task.priority || 'medium',
    dueDate: task.dueDate || null,
    category: task.category || 'personal'
  }));

  function renderTasks() {
    taskList.innerHTML = '';

    // Filter tasks by category and search term
    let filteredTasks = currentFilter === 'all' 
      ? tasks 
      : tasks.filter(task => task.category === currentFilter);

    // Apply search filter
    if (searchTerm.trim()) {
      filteredTasks = filteredTasks.filter(task => 
        task.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filteredTasks.length === 0) {
      let emptyMessage;
      if (searchTerm.trim()) {
        emptyMessage = `No tasks found for "${searchTerm}"<br><small>Try a different search term</small>`;
      } else if (currentFilter === 'all') {
        emptyMessage = 'No tasks yet.<br><small>Add one above to get started</small>';
      } else {
        emptyMessage = `No ${currentFilter} tasks.<br><small>Try "All" or add a ${currentFilter} task</small>`;
      }
      
      taskList.innerHTML = `
        <div style="text-align:center; padding:60px 20px; opacity:0.6;">
          ${emptyMessage}
        </div>`;
      return;
    }

    filteredTasks.forEach((task, index) => {
      const originalIndex = tasks.indexOf(task);
      const item = document.createElement('div');
      const priorityClass = `priority-${task.priority}`;
      const priorityIndicator = getPriorityIndicator(task.priority);
      const dueDateDisplay = task.dueDate ? formatDueDate(task.dueDate) : '';
      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.done;
      const categoryDisplay = getCategoryDisplay(task.category);
      
      item.className = `task-item ${task.done ? 'done' : ''} ${priorityClass} ${isOverdue ? 'overdue' : ''}`;
      item.innerHTML = `
        <div class="priority-indicator">${priorityIndicator}</div>
        <input type="checkbox" ${task.done ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <span class="category-tag">${categoryDisplay}</span>
        ${dueDateDisplay ? `<span class="due-date">${dueDateDisplay}</span>` : ''}
        <button class="delete-task">×</button>
      `;

      const checkbox = item.querySelector('input');
      const taskText = item.querySelector('.task-text');
      const deleteBtn = item.querySelector('.delete-task');

      checkbox.addEventListener('change', () => {
        tasks[originalIndex].done = !tasks[originalIndex].done;
        saveAndRender();
      });

      deleteBtn.addEventListener('click', () => {
        tasks.splice(originalIndex, 1);
        saveAndRender();
      });

      // Modal edit functionality
      taskText.addEventListener('click', () => {
        openEditModal(originalIndex);
      });

      taskList.appendChild(item);
    });
  }

  function openEditModal(index) {
    editingTaskIndex = index;
    const task = tasks[index];
    editTaskInput.value = task.text;
    editCategorySelect.value = task.category;
    editPrioritySelect.value = task.priority;
    editDueDateInput.value = task.dueDate || '';
    editCompletedCheckbox.checked = task.done;
    editModal.style.display = 'block';
  }

  function saveEdit() {
    const newText = editTaskInput.value.trim();
    const newCategory = editCategorySelect.value;
    const newPriority = editPrioritySelect.value;
    const newDueDate = editDueDateInput.value || null;
    const newCompleted = editCompletedCheckbox.checked;
    
    if (newText && newText !== tasks[editingTaskIndex].text) {
      tasks[editingTaskIndex].text = newText;
    }
    tasks[editingTaskIndex].category = newCategory;
    tasks[editingTaskIndex].priority = newPriority;
    tasks[editingTaskIndex].dueDate = newDueDate;
    tasks[editingTaskIndex].done = newCompleted;
    saveAndRender();
    editModal.style.display = 'none';
  }

  function closeEditModal() {
    editModal.style.display = 'none';
    editingTaskIndex = null;
  }

  // Notification system
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }

  function checkTaskNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    
    tasks.forEach((task, index) => {
      if (task.done) return;

      // Check for tasks due within the next hour
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const timeUntilDue = dueDate - now;
        const taskKey = `${index}-${task.text}-${task.dueDate}`;
        
        // Task due in the next hour (but not overdue)
        if (timeUntilDue > 0 && timeUntilDue <= 60 * 60 * 1000) {
          // Only notify if we haven't notified this task before
          if (!notifiedTasks.has(taskKey)) {
            const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60));
            showNotification(
              `Task Due Soon!`,
              `"${task.text}" is due in ${minutesUntilDue} minutes`,
              task.priority
            );
            notifiedTasks.add(taskKey);
          }
        }
        
        // Overdue tasks - notify once per day for overdue tasks
        if (dueDate < now) {
          const today = new Date().toDateString();
          const overdueKey = `${taskKey}-overdue-${today}`;
          
          if (!notifiedTasks.has(overdueKey)) {
            const hoursOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60));
            showNotification(
              `Task Overdue!`,
              `"${task.text}" is ${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''} overdue`,
              'high'
            );
            notifiedTasks.add(overdueKey);
          }
        }
      }
    });
  }

  function showNotification(title, body, priority = 'medium') {
    // Simple text-based notification without complex SVG icons
    const notification = new Notification(title, {
      body: body,
      tag: 'task-reminder',
      requireInteraction: priority === 'high'
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds for non-high priority
    if (priority !== 'high') {
      setTimeout(() => notification.close(), 5000);
    }
  }

  // Initialize notifications and set up periodic checking
  requestNotificationPermission();
  
  // Check notifications every minute
  setInterval(checkTaskNotifications, 60000);
  
  // Check immediately on load
  setTimeout(checkTaskNotifications, 2000);

  // Expose functions to global scope for HTML onclick handlers
  window.openEditModal = openEditModal;
  window.saveTaskEdit = saveEdit;
  window.closeEditModal = closeEditModal;

  function getCategoryDisplay(category) {
    const categoryIcons = {
      'personal': 'home',
      'work': 'briefcase',
      'shopping': 'cart',
      'health': 'heart',
      'other': 'folder'
    };
    return categoryIcons[category] || 'folder';
  }

  function formatDueDate(dueDate) {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue`;
    if (diffDays === 0) return `Today`;
    if (diffDays === 1) return `Tomorrow`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getPriorityIndicator(priority) {
    switch(priority) {
      case 'high': return '!';
      case 'medium': return '·';
      case 'low': return '°';
      default: return '·';
    }
  }

  function saveAndRender() {
    localStorage.setItem('nebulaTasks', JSON.stringify(tasks));
    renderTasks();
  }

  function addTask() {
    const text = newTaskInput.value.trim();
    if (text === '') return;

    const category = categorySelect ? categorySelect.value : 'personal';
    const priority = prioritySelect ? prioritySelect.value : 'medium';
    const dueDate = dueDateInput && dueDateInput.value ? dueDateInput.value : null;
    
    tasks.unshift({ text: text, done: false, category: category, priority: priority, dueDate: dueDate });
    newTaskInput.value = '';
    if (categorySelect) categorySelect.value = 'personal'; // Reset to default
    if (prioritySelect) prioritySelect.value = 'medium'; // Reset to default
    if (dueDateInput) dueDateInput.value = ''; // Reset due date
    saveAndRender();
    newTaskInput.focus();
  }

  function setCategoryFilter(category) {
    currentFilter = category;
    
    // Update active filter button
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    renderTasks();
  }

  if (addBtn) addBtn.addEventListener('click', addTask);
  if (newTaskInput) newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
  if (addTaskBtn) addTaskBtn.addEventListener('click', () => newTaskInput.focus());

  // Search event listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      renderTasks();
    });
  }

  // Category filter event listeners
  document.querySelectorAll('.category-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      setCategoryFilter(btn.dataset.category);
    });
  });

  renderTasks();
})();