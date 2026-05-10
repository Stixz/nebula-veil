(function() {
  const textarea = document.getElementById('note-text');
  const charCount = document.getElementById('char-count');
  const clearBtn = document.getElementById('clear-note');
  const posLabel = document.getElementById('position-label');
  const contextMenu = document.getElementById('notes-context-menu');

  if (!textarea) return;

  const saved = localStorage.getItem('nebulaNote') || '';
  textarea.value = saved;

  let timeout;

  function getCaretPosition() {
    const pos = textarea.selectionStart;
    const lines = textarea.value.substring(0, pos).split('\n');

    return {
      x: lines[lines.length - 1].length + 1,
      y: lines.length
    };
  }

  function updateCharCount() {
    if (charCount) charCount.textContent = `${textarea.value.length} characters`;
  }

  function updatePosition() {
    const { x, y } = getCaretPosition();
    if (posLabel) posLabel.textContent = `Pos. ${x} : ${y}`;
  }

  function hideNotesContextMenu() {
    if (contextMenu) contextMenu.style.display = 'none';
  }

  function showNotesContextMenu(e) {
    if (!contextMenu) return;
    e.preventDefault();

    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
    contextMenu.style.display = 'block';
  }

  function saveNotes() {
    localStorage.setItem('nebulaNote', textarea.value);
    updateCharCount();
    hideNotesContextMenu();
  }

  function clearNotes() {
    if (confirm('Clear all notes?')) {
      textarea.value = '';
      localStorage.removeItem('nebulaNote');
      updateCharCount();
      updatePosition();
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

  function exportNotes() {
    const notes = textarea.value.trim();
    if (!notes) {
      alert('No notes to export');
      hideNotesContextMenu();
      return;
    }

    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    link.href = url;
    link.download = `nebula-notes-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    hideNotesContextMenu();
  }

  function importNotes() {
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
        const shouldReplace = !textarea.value.trim() ||
          confirm('Replace current notes or append to them?\nOK = Replace, Cancel = Append');

        textarea.value = shouldReplace
          ? content
          : `${textarea.value}\n\n--- Imported from ${file.name} ---\n\n${content}`;

        saveNotes();
        updatePosition();
        textarea.focus();
      };
      reader.onerror = () => alert('Failed to read file');
      reader.readAsText(file);
      hideNotesContextMenu();
    };

    input.click();
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseNotesForEvent(notes) {
    const parsedData = {
      title: '',
      date: '',
      start: '',
      end: '',
      location: '',
      notes
    };

    const datePatterns = [
      /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/g,
      /(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/g,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s*\d{2,4}/gi,
      /(today|tomorrow|yesterday)/gi,
      /(next\s+week|next\s+month|next\s+year)/gi
    ];
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm)?/gi,
      /(\d{1,2})\s*(am|pm)/gi
    ];
    const locationPatterns = [
      /(?:at|in|@)\s+([a-zA-Z0-9\s,#-.]+)/gi,
      /([a-zA-Z0-9\s,#-.]+)\s+(?:office|room|building)/gi
    ];

    datePatterns.forEach((pattern) => {
      const matches = notes.match(pattern);
      if (!matches?.length) return;

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
        const dateObj = new Date(match);
        if (!Number.isNaN(dateObj.getTime())) parsedData.date = formatDate(dateObj);
      }
    });

    timePatterns.forEach((pattern) => {
      const matches = notes.match(pattern);
      if (!matches?.length) return;

      const timeMatch = matches[0].match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
      if (!timeMatch) return;

      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const period = timeMatch[3]?.toLowerCase();

      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      parsedData.start = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    });

    locationPatterns.forEach((pattern) => {
      const matches = notes.match(pattern);
      if (matches?.length) {
        parsedData.location = matches[0].replace(/(?:at|in|@)\s+/gi, '').trim();
      }
    });

    let cleanTitle = notes.split('\n')[0].trim();
    [...datePatterns, ...timePatterns, ...locationPatterns].forEach((pattern) => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });

    parsedData.title = cleanTitle.replace(/[^\w\s]/g, '').trim() || 'New Event';
    return parsedData;
  }

  function createEventFromNotes() {
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim();
    const notes = selectedText || textarea.value.trim();

    if (!notes) {
      alert('Please type some text in the notes first');
      hideNotesContextMenu();
      return;
    }

    localStorage.setItem('nebulaPendingEvent', JSON.stringify(parseNotesForEvent(notes)));

    if (typeof window.loadModule === 'function') {
      window.loadModule('calendar');
    } else {
      document.querySelector('[data-module="calendar"]')?.click();
    }

    hideNotesContextMenu();
  }

  textarea.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(saveNotes, 300);
    updateCharCount();
    updatePosition();
  });
  textarea.addEventListener('click', updatePosition);
  textarea.addEventListener('keyup', updatePosition);

  if (clearBtn) clearBtn.addEventListener('click', clearNotes);
  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) hideNotesContextMenu();
  });

  updateCharCount();
  updatePosition();
  textarea.focus();

  window.showNotesContextMenu = showNotesContextMenu;
  window.clearNotes = clearNotes;
  window.copyAllNotes = copyAllNotes;
  window.pasteNotes = pasteNotes;
  window.saveNotes = saveNotes;
  window.createEventFromNotes = createEventFromNotes;
  window.exportNotes = exportNotes;
  window.importNotes = importNotes;
})();
