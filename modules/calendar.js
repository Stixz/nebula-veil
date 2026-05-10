(function() {
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let currentDate = new Date();
  let selectedDate = new Date();
  let currentView = 'month';
  let events = [];

  const titleEl = document.getElementById('cal-title');
  const daysEl = document.getElementById('calendar-days');
  const modal = document.getElementById('event-modal');
  const form = document.getElementById('event-form');
  const dayDetail = document.getElementById('day-detail');
  const dayEventsList = document.getElementById('day-events-list');
  const contextMenu = document.getElementById('context-menu');
  const notesContextMenu = document.getElementById('notes-context-menu');
  let contextMenuDate = null;

  function loadEvents() {
    const saved = localStorage.getItem('nebulaCalendarEvents');
    if (saved) {
      try {
        events = JSON.parse(saved);
      } catch (e) {
        events = [];
      }
    }
  }

  function saveEvents() {
    localStorage.setItem('nebulaCalendarEvents', JSON.stringify(events));
  }

  function getEventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr);
  }

  function renderCalendar() {
    if (currentView === 'week') {
      renderWeekView();
    } else {
      renderMonthView();
    }
  }

  function renderMonthView() {
    loadEvents();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    titleEl.textContent = `${MONTH_NAMES[month]} ${year}`;

    // Show month grid header for month view
    document.querySelector('.calendar-grid-header').style.display = 'grid';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let html = '';

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      html += createDayCell(d, true);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      html += createDayCell(d, false);
    }

    const totalCells = 42;
    const remaining = totalCells - (firstDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      html += createDayCell(d, true);
    }

    daysEl.innerHTML = html;

    document.querySelectorAll('.cal-day').forEach(day => {
      day.addEventListener('click', () => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          selectedDate = new Date(dateStr);
          showDayDetail(dateStr);
        }
      });
      
      day.addEventListener('contextmenu', (e) => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          showContextMenu(e, dateStr);
        }
      });
    });
  }

  function renderWeekView() {
    loadEvents();
    
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Format title for week view
    const startStr = startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const endStr = endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    titleEl.textContent = `${startStr} - ${endStr}`;
    
    // Hide month grid header since week view has different layout
    document.querySelector('.calendar-grid-header').style.display = 'none';
    
    let html = '<div class="week-view">';
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      
      const dateStr = formatDate(currentDay);
      const isToday = currentDay.toDateString() === new Date().toDateString();
      const isSelected = currentDay.toDateString() === selectedDate.toDateString();
      const dayEvents = getEventsForDate(dateStr);
      const dayName = DAY_NAMES[i];
      
      html += `
        <div class="week-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
          <div class="week-day-header">
            <span class="week-day-name">${dayName}</span>
            <span class="week-day-num">${currentDay.getDate()}</span>
          </div>
          <div class="week-day-events">
      `;
      
      if (dayEvents.length > 0) {
        dayEvents.forEach(ev => {
          html += `
            <div class="week-event ${ev.completed ? 'completed' : ''}" data-id="${ev.id}">
              <span class="week-event-time">${ev.start || ''}</span>
              <span class="week-event-title">${ev.title}</span>
            </div>
          `;
        });
      } else {
        html += '<div class="no-events">No events</div>';
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    daysEl.innerHTML = html;
    
    // Add click handlers for week view
    document.querySelectorAll('.week-day').forEach(day => {
      day.addEventListener('click', () => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          selectedDate = new Date(dateStr);
          showDayDetail(dateStr);
        }
      });
      
      day.addEventListener('contextmenu', (e) => {
        const dateStr = day.dataset.date;
        if (dateStr) {
          showContextMenu(e, dateStr);
        }
      });
    });
    
    document.querySelectorAll('.week-event').forEach(event => {
      event.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = event.dataset.id;
        const ev = events.find(e => e.id === id);
        if (ev) openEditModal(ev);
      });
    });
  }

  function createDayCell(date, isOtherMonth) {
    const today = new Date();
    const dateStr = formatDate(date);
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const dayEvents = getEventsForDate(dateStr);

    let eventsHtml = '';
    if (!isOtherMonth && dayEvents.length > 0) {
      const displayEvents = dayEvents.slice(0, 3);
      eventsHtml = displayEvents.map(ev => `
        <div class="cal-event ${ev.completed ? 'completed' : ''}" data-id="${ev.id}">
          <span class="cal-event-time">${ev.start || ''}</span> ${ev.title}
        </div>
      `).join('');
      if (dayEvents.length > 3) {
        eventsHtml += `<div class="cal-more">+${dayEvents.length - 3} more</div>`;
      }
    }

    return `
      <div class="cal-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
        <span class="cal-day-num">${date.getDate()}</span>
        <div class="cal-day-events">${eventsHtml}</div>
      </div>
    `;
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function showDayDetail(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    document.getElementById('day-detail-title').textContent = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const dayEvents = getEventsForDate(dateStr);
    if (dayEvents.length === 0) {
      dayEventsList.innerHTML = '<p style="opacity: 0.5; text-align: center;">No events. Click + Event to add.</p>';
    } else {
      dayEventsList.innerHTML = dayEvents.map(ev => `
        <div class="day-event-item ${ev.completed ? 'completed' : ''}" data-id="${ev.id}">
          <div class="day-event-time">${ev.start || ''} - ${ev.end || ''}</div>
          <div class="day-event-title">${ev.completed ? '✓ ' : ''}${ev.title}</div>
          ${ev.location ? `<div class="day-event-location">📍 ${ev.location}</div>` : ''}
          ${ev.notes ? `<div class="day-event-notes">${ev.notes}</div>` : ''}
        </div>
      `).join('');

      dayEventsList.querySelectorAll('.day-event-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          const event = events.find(e => e.id === id);
          if (event) openEditModal(event);
        });
      });
    }

    document.getElementById('event-date').value = dateStr;
    dayDetail.style.display = 'block';
  }

  function openNewModal(date = null) {
    console.log('openNewModal called with date:', date);
    const eventDate = date || selectedDate;
    console.log('Using eventDate:', eventDate);
    
    // Check for pending event data from Notes module
    const pendingEventData = localStorage.getItem('nebulaPendingEvent');
    if (pendingEventData) {
      try {
        const eventData = JSON.parse(pendingEventData);
        console.log('Found pending event data:', eventData);
        
        // Fill the form with parsed data
        document.getElementById('modal-title').textContent = 'New Event from Notes';
        document.getElementById('event-id').value = '';
        document.getElementById('event-title').value = eventData.title || '';
        document.getElementById('event-date').value = eventData.date || formatDate(eventDate);
        document.getElementById('event-start').value = eventData.start || '';
        document.getElementById('event-end').value = eventData.end || '';
        document.getElementById('event-location').value = eventData.location || '';
        document.getElementById('event-notes').value = eventData.notes || '';
        document.getElementById('event-delete').style.display = 'none';
        
        // Clear the pending event data
        localStorage.removeItem('nebulaPendingEvent');
      } catch (e) {
        console.error('Failed to parse pending event data:', e);
        // Fallback to normal behavior
        document.getElementById('modal-title').textContent = 'New Event';
        document.getElementById('event-id').value = '';
        document.getElementById('event-title').value = '';
        document.getElementById('event-date').value = formatDate(eventDate);
        document.getElementById('event-start').value = '';
        document.getElementById('event-end').value = '';
        document.getElementById('event-location').value = '';
        document.getElementById('event-notes').value = '';
        document.getElementById('event-delete').style.display = 'none';
      }
    } else {
      // Normal behavior - no pending event data
      document.getElementById('modal-title').textContent = 'New Event';
      document.getElementById('event-id').value = '';
      document.getElementById('event-title').value = '';
      document.getElementById('event-date').value = formatDate(eventDate);
      document.getElementById('event-start').value = '';
      document.getElementById('event-end').value = '';
      document.getElementById('event-location').value = '';
      document.getElementById('event-notes').value = '';
      document.getElementById('event-delete').style.display = 'none';
    }
    
    modal.style.display = 'flex';
    console.log('Modal should now be visible');
  }

  function showContextMenu(e, dateStr) {
    e.preventDefault();
    contextMenuDate = dateStr;
    
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.display = 'block';
  }

  function hideContextMenu() {
    contextMenu.style.display = 'none';
    contextMenuDate = null;
  }

  function showNotesContextMenu(e) {
    e.preventDefault();
    console.log('Notes context menu triggered');
    
    notesContextMenu.style.left = `${e.pageX}px`;
    notesContextMenu.style.top = `${e.pageY}px`;
    notesContextMenu.style.display = 'block';
    console.log('Notes context menu should be visible');
  }

  function hideNotesContextMenu() {
    notesContextMenu.style.display = 'none';
  }

  function createEventFromNotes() {
    console.log('createEventFromNotes called');
    const notesField = document.getElementById('event-notes');
    const notes = notesField.value.trim();
    
    alert('Notes context menu works! Notes: ' + notes);
    hideNotesContextMenu();
  }

  function clearAllFields() {
    document.getElementById('event-title').value = '';
    document.getElementById('event-date').value = formatDate(selectedDate);
    document.getElementById('event-start').value = '';
    document.getElementById('event-end').value = '';
    document.getElementById('event-location').value = '';
    document.getElementById('event-notes').value = '';
    hideNotesContextMenu();
  }

  function openEditModal(event) {
    dayDetail.style.display = 'none';
    document.getElementById('modal-title').textContent = 'Edit Event';
    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-start').value = event.start || '';
    document.getElementById('event-end').value = event.end || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-notes').value = event.notes || '';
    document.getElementById('event-delete').style.display = 'block';
    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  function parseSmartNotes(notes) {
    const parsedData = {
      title: '',
      date: '',
      start: '',
      end: '',
      location: ''
    };

    // Parse dates (various formats)
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // MM/DD/YYYY or MM-DD-YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g, // YYYY/MM/DD or YYYY-MM-DD
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s*\d{2,4}/gi, // Month DD, YYYY
      /(today|tomorrow|yesterday)/gi, // Relative dates
      /(next\s+week|next\s+month|next\s+year)/gi // Future dates
    ];

    // Parse times
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)?/gi, // 12-hour format
      /(\d{1,2}):(\d{2})/g, // 24-hour format
      /(\d{1,2})\s*(am|pm)/gi // Simple 12-hour
    ];

    // Parse locations (common patterns)
    const locationPatterns = [
      /(?:at|in|@)\s+([a-zA-Z0-9\s,#\-\.]+)/gi,
      /([a-zA-Z0-9\s,#\-\.]+)\s+(?:office|room|building)/gi
    ];

    // Extract dates
    datePatterns.forEach(pattern => {
      const matches = notes.match(pattern);
      if (matches && matches.length > 0) {
        const match = matches[0];
        if (match.toLowerCase() === 'today') {
          parsedData.date = formatDate(new Date());
        } else if (match.toLowerCase() === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          parsedData.date = formatDate(tomorrow);
        } else if (match.toLowerCase() === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          parsedData.date = formatDate(yesterday);
        } else {
          // Try to parse the date string
          const dateObj = new Date(match);
          if (!isNaN(dateObj.getTime())) {
            parsedData.date = formatDate(dateObj);
          }
        }
      }
    });

    // Extract times
    timePatterns.forEach(pattern => {
      const matches = notes.match(pattern);
      if (matches && matches.length > 0) {
        const timeMatch = matches[0].match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
          
          if (period === 'pm' && hours < 12) hours += 12;
          if (period === 'am' && hours === 12) hours = 0;
          
          parsedData.start = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
      }
    });

    // Extract locations
    locationPatterns.forEach(pattern => {
      const matches = notes.match(pattern);
      if (matches && matches.length > 0) {
        parsedData.location = matches[0].replace(/(?:at|in|@)\s+/gi, '').trim();
      }
    });

    // Extract title (first line or first sentence)
    const lines = notes.split('\n');
    const firstLine = lines[0].trim();
    
    // Remove parsed patterns from title
    let cleanTitle = firstLine;
    datePatterns.forEach(pattern => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });
    timePatterns.forEach(pattern => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });
    locationPatterns.forEach(pattern => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });
    
    parsedData.title = cleanTitle.replace(/[^\w\s]/g, '').trim() || 'New Event';
    
    return parsedData;
  }

  function autoFillFromNotes() {
    const notesField = document.getElementById('event-notes');
    const notes = notesField.value;
    
    if (!notes.trim()) return;
    
    const parsed = parseSmartNotes(notes);
    
    // Only auto-fill if fields are empty
    if (!document.getElementById('event-title').value && parsed.title) {
      document.getElementById('event-title').value = parsed.title;
    }
    
    if (!document.getElementById('event-date').value && parsed.date) {
      document.getElementById('event-date').value = parsed.date;
    }
    
    if (!document.getElementById('event-start').value && parsed.start) {
      document.getElementById('event-start').value = parsed.start;
    }
    
    if (!document.getElementById('event-location').value && parsed.location) {
      document.getElementById('event-location').value = parsed.location;
    }
  }

  function saveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('event-id').value;
    const eventData = {
      id: id || Date.now().toString(),
      title: document.getElementById('event-title').value,
      date: document.getElementById('event-date').value,
      start: document.getElementById('event-start').value,
      end: document.getElementById('event-end').value,
      location: document.getElementById('event-location').value,
      notes: document.getElementById('event-notes').value,
      completed: false
    };

    if (id) {
      const index = events.findIndex(ev => ev.id === id);
      if (index !== -1) {
        events[index] = { ...events[index], ...eventData };
      }
    } else {
      events.push(eventData);
    }

    saveEvents();
    closeModal();
    renderCalendar();
    if (selectedDate.toISOString().split('T')[0] === eventData.date) {
      showDayDetail(eventData.date);
    }
  }

  function deleteEvent() {
    const id = document.getElementById('event-id').value;
    if (id && confirm('Delete this event?')) {
      events = events.filter(ev => ev.id !== id);
      saveEvents();
      closeModal();
      renderCalendar();
    }
  }

  // Wait for DOM to be ready before setting up event listeners
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEventListeners);
  } else {
    setupEventListeners();
  }

  function setupEventListeners() {
    console.log('Setting up calendar event listeners...');
    document.getElementById('cal-prev').addEventListener('click', () => {
      if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      } else {
        currentDate.setDate(currentDate.getDate() - 7);
      }
      renderCalendar();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
      if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7);
      }
      renderCalendar();
    });

    document.getElementById('cal-today').addEventListener('click', () => {
      currentDate = new Date();
      selectedDate = new Date();
      renderCalendar();
    });

    document.querySelectorAll('.cal-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderCalendar();
      });
    });

    const newEventBtn = document.getElementById('cal-new-event');
    if (newEventBtn) {
      console.log('Found +Event button, adding listener');
      newEventBtn.addEventListener('click', (e) => {
        console.log('Event button clicked!');
        openNewModal();
      });
    } else {
      console.error('Could not find +Event button');
    }

    document.getElementById('modal-close').addEventListener('click', closeModal);

    document.getElementById('day-detail-close').addEventListener('click', () => {
      dayDetail.style.display = 'none';
    });

    form.addEventListener('submit', saveEvent);

    document.getElementById('event-delete').addEventListener('click', deleteEvent);

    // Add auto-fill functionality to notes field
    document.getElementById('event-notes').addEventListener('input', autoFillFromNotes);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Context menu event listeners
    document.getElementById('ctx-new-event').addEventListener('click', () => {
      if (contextMenuDate) {
        selectedDate = new Date(contextMenuDate);
        openNewModal(selectedDate);
        hideContextMenu();
      }
    });

    document.getElementById('ctx-view-events').addEventListener('click', () => {
      if (contextMenuDate) {
        selectedDate = new Date(contextMenuDate);
        showDayDetail(contextMenuDate);
        hideContextMenu();
      }
    });

    // Hide context menu when clicking elsewhere (but not on form inputs)
    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target) && 
          !e.target.closest('#event-modal') && 
          !e.target.closest('#day-detail')) {
        hideContextMenu();
      }
      
      if (!notesContextMenu.contains(e.target) && 
          e.target.id !== 'event-notes') {
        hideNotesContextMenu();
      }
    });

    // Notes context menu event listeners
    const notesField = document.getElementById('event-notes');
    if (notesField) {
      console.log('Found notes field, adding context menu listener');
      notesField.addEventListener('contextmenu', showNotesContextMenu);
    } else {
      console.error('Could not find notes field');
    }

    document.getElementById('notes-parse-event').addEventListener('click', createEventFromNotes);

    document.getElementById('notes-clear-fields').addEventListener('click', clearAllFields);
  }

  renderCalendar();
  
  // Check for pending event data from Notes module and auto-open modal
  const pendingEventData = localStorage.getItem('nebulaPendingEvent');
  if (pendingEventData) {
    console.log('Found pending event data on Calendar load, opening modal');
    setTimeout(() => {
      openNewModal(); // This will use the pending event data
    }, 500); // Small delay to ensure Calendar is fully loaded
  }
  
  // Expose functions to global scope for onclick handlers
  window.openNewModal = openNewModal;
  window.showNotesContextMenu = showNotesContextMenu;
  window.createEventFromNotes = createEventFromNotes;
  window.clearAllFields = clearAllFields;
})();