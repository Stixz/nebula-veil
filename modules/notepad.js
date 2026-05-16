(function() {
  const textarea = document.getElementById('note-text');
  const charCount = document.getElementById('char-count');
  const clearBtn = document.getElementById('clear-note');
  const posLabel = document.getElementById("position-label");

  if (!textarea) return;

  const saved = localStorage.getItem('nebulaNote') || '';
  textarea.value = saved;
  updateCharCount();

  let timeout;
  textarea.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      localStorage.setItem('nebulaNote', textarea.value);
      updateCharCount();
    }, 300);
  });

textarea.addEventListener('input', updatePosition);
textarea.addEventListener('click', updatePosition);
textarea.addEventListener('keyup', updatePosition);

function getCaretPosition(textarea) {
  const pos = textarea.selectionStart;
  const text = textarea.value;

  const lines = text.substr(0, pos).split("\n");
  const y = lines.length;
  const x = lines[lines.length - 1].length + 1;

  return { x, y };
}

  function updateCharCount() {
    if (charCount) charCount.textContent = `${textarea.value.length} characters`;
  }

function updatePosition() {
  const { x, y } = getCaretPosition(textarea);
  if (posLabel) posLabel.textContent = `Pos. ${x} : ${y}`;
}

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear everything?')) {
        textarea.value = '';
        localStorage.removeItem('nebulaNote');
        updateCharCount();
        textarea.focus();
      }
    });
  }

  textarea.focus();

function getCaretPosition(textarea) {
    const pos = textarea.selectionStart;
    const text = textarea.value;

    const lines = text.substr(0, pos).split("\n");
    const y = lines.length;
    const x = lines[lines.length - 1].length + 1;

    return { x, y };
}

  // Context menu functionality
  const contextMenu = document.getElementById('notes-context-menu');
  
  function showNotesContextMenu(e) {
    e.preventDefault();
    
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.display = 'block';
  }

  function hideNotesContextMenu() {
    contextMenu.style.display = 'none';
  }

  function clearNotes() {
    if (confirm('Clear all notes?')) {
      textarea.value = '';
      localStorage.removeItem('nebulaNote');
      updateCharCount();
      textarea.focus();
    }
    hideNotesContextMenu();
  }

  function copyAllNotes() {
    textarea.select();
    document.execCommand('copy');
    hideNotesContextMenu();
  }

  function pasteNotes() {
    textarea.focus();
    document.execCommand('paste');
    hideNotesContextMenu();
  }

  function saveNotes() {
    localStorage.setItem('nebulaNote', textarea.value);
    updateCharCount();
    hideNotesContextMenu();
  }

  function exportNotes() {
    const notes = textarea.value.trim();
    if (!notes) {
      alert('No notes to export');
      hideNotesContextMenu();
      return;
    }

    // Create a blob with the notes content
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.href = url;
    link.download = `nebula-notes-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
    
    hideNotesContextMenu();
  }

  function importNotes() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        hideNotesContextMenu();
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        
        // Ask user if they want to replace or append
        const action = textarea.value.trim() ? 'append' : 'replace';
        let userChoice = action;
        
        if (textarea.value.trim()) {
          userChoice = confirm('Replace current notes or append to them?\nOK = Replace, Cancel = Append') ? 'replace' : 'append';
        }
        
        if (userChoice === 'replace') {
          textarea.value = content;
        } else {
          textarea.value += '\n\n--- Imported from ' + file.name + ' ---\n\n' + content;
        }
        
        // Trigger auto-save
        localStorage.setItem('nebulaNote', textarea.value);
        updateCharCount();
        textarea.focus();
      };
      
      reader.onerror = () => {
        alert('Failed to read file');
      };
      
      reader.readAsText(file);
      hideNotesContextMenu();
    };
    
    input.click();
  }

  function parseNotesForEvent(notes) {
    const parsedData = {
      title: '',
      date: '',
      start: '',
      end: '',
      location: '',
      notes: ''
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
    parsedData.notes = notes;
    
    return parsedData;
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function createEventFromNotes() {
    console.log('createEventFromNotes called');
    
    // Check if there's selected text first
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
    const notes = selectedText || textarea.value.trim();
    
    console.log('Using text:', notes);
    console.log('Was selected text used:', !!selectedText);
    
    if (!notes) {
      alert('Please type some text in the notes first');
      hideNotesContextMenu();
      return;
    }
    
    // Parse the notes for event data
    const eventData = parseNotesForEvent(notes);
    console.log('Parsed event data:', eventData);
    
    // Store the event data for the Calendar module
    localStorage.setItem('nebulaPendingEvent', JSON.stringify(eventData));
    console.log('Stored pending event data in localStorage');
    
    // Switch to Calendar module
    console.log('Attempting to switch to Calendar module');
    if (window.electronAPI && window.electronAPI.onSwitchModule) {
      console.log('Using electronAPI to switch modules');
      // Call the loadModule function directly
      if (typeof loadModule === 'function') {
        loadModule('calendar');
      } else {
        // Try to access loadModule from parent scope
        window.loadModule && window.loadModule('calendar');
      }
    } else {
      console.log('Using fallback method - direct navigation click');
      // Fallback - trigger the calendar navigation button
      const calendarBtn = document.querySelector('[data-module="calendar"]');
      if (calendarBtn) {
        calendarBtn.click();
      } else {
        console.error('Could not find calendar navigation button');
      }
    }

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
  parsedData.notes = notes;
  
  return parsedData;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEventFromNotes() {
  console.log('createEventFromNotes called');
  
  // Check if there's selected text first
  const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
  const notes = selectedText || textarea.value.trim();
  
  console.log('Using text:', notes);
  console.log('Was selected text used:', !!selectedText);
  
  if (!notes) {
    alert('Please type some text in the notes first');
    hideNotesContextMenu();
    return;
  }
  
  // Parse the notes for event data
  const eventData = parseNotesForEvent(notes);
  console.log('Parsed event data:', eventData);
  
  // Store the event data for the Calendar module
  localStorage.setItem('nebulaPendingEvent', JSON.stringify(eventData));
  console.log('Stored pending event data in localStorage');
  
  // Switch to Calendar module
  console.log('Attempting to switch to Calendar module');
  if (window.electronAPI && window.electronAPI.onSwitchModule) {
    console.log('Using electronAPI to switch modules');
    // Call the loadModule function directly
    if (typeof loadModule === 'function') {
      loadModule('calendar');
    } else {
      // Try to access loadModule from parent scope
      window.loadModule && window.loadModule('calendar');
    }
  } else {
    console.log('Using fallback method - direct navigation click');
    // Fallback - trigger the calendar navigation button
    const calendarBtn = document.querySelector('[data-module="calendar"]');
    if (calendarBtn) {
      calendarBtn.click();
    } else {
      console.error('Could not find calendar navigation button');
    }
  }
  
  hideNotesContextMenu();
  console.log('createEventFromNotes completed');
}

// Hide context menu when clicking anywhere outside the menu
document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    hideNotesContextMenu();
  }
});

// Expose functions to global scope
window.showNotesContextMenu = showNotesContextMenu;
window.clearNotes = clearNotes;
window.copyAllNotes = copyAllNotes;
window.pasteNotes = pasteNotes;
window.saveNotes = saveNotes;
window.createEventFromNotes = createEventFromNotes;
window.exportNotes = exportNotes;
window.importNotes = importNotes;
})();
