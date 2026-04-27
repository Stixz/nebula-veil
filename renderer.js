// renderer.js - Simple & Reliable

// ── Theme System ───────────────────────────────────────────────
const THEMES = {
  nebula: {
    name: 'Nebula',
    desc: 'Deep purple cosmos',
    bg: '#0a0a0f',
    accent: '#a78bfa',
    accentGlow: '#67e8f9',
    text: '#e0e0ff',
    textMuted: '#a0a0cc'
  },
  ember: {
    name: 'Ember',
    desc: 'Smoky charcoal with ember orange',
    bg: '#0b0b0d',
    accent: '#fb923c',
    accentGlow: '#f97316',
    text: '#fff7ed',
    textMuted: '#cbd5e1'
  },
  frost: {
    name: 'Frost',
    desc: 'Icy slate with cool cyan highlights',
    bg: '#070b12',
    accent: '#22d3ee',
    accentGlow: '#a5f3fc',
    text: '#e6f6ff',
    textMuted: '#8fb3c9'
  },
  aurora: {
    name: 'Aurora',
    desc: 'Northern lights green',
    bg: '#0a0f0c',
    accent: '#34d399',
    accentGlow: '#6ee7b7',
    text: '#e0ffe8',
    textMuted: '#86ccaa'
  },
  crimson: {
    name: 'Crimson',
    desc: 'Bold red energy',
    bg: '#0f0a0a',
    accent: '#f87171',
    accentGlow: '#fca5a5',
    text: '#ffe0e0',
    textMuted: '#cc8686'
  },
  solar: {
    name: 'Solar',
    desc: 'Warm amber glow',
    bg: '#0f0d08',
    accent: '#fbbf24',
    accentGlow: '#fcd34d',
    text: '#fff8e0',
    textMuted: '#cca86e'
  },
  ocean: {
    name: 'Ocean',
    desc: 'Deep blue depths',
    bg: '#080b0f',
    accent: '#38bdf8',
    accentGlow: '#7dd3fc',
    text: '#e0f0ff',
    textMuted: '#7aa8cc'
  },
  sakura: {
    name: 'Sakura',
    desc: 'Soft cherry blossom',
    bg: '#0f0a0e',
    accent: '#f9a8d4',
    accentGlow: '#fbcfe8',
    text: '#ffe8f5',
    textMuted: '#cc86aa'
  },
  mono: {
    name: 'Mono',
    desc: 'Clean monochrome',
    bg: '#0a0a0a',
    accent: '#d1d5db',
    accentGlow: '#f3f4f6',
    text: '#f0f0f0',
    textMuted: '#9ca3af'
  }
};

function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--text', theme.text);
  root.style.setProperty('--text-muted', theme.textMuted);
  // Also update the app background to match --bg
  document.querySelector('.app').style.background =
    `rgba(${hexToRgb(theme.bg)}, 0.92)`;
  localStorage.setItem('nebulaTheme', themeKey);
  // Update active state in the grid if it's open
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.toggle('active', card.dataset.theme === themeKey);
    card.style.borderColor = card.dataset.theme === themeKey ? theme.accent : '';
  });
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r}, ${g}, ${b}`;
}

function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  const currentTheme = localStorage.getItem('nebulaTheme') || 'nebula';
  grid.innerHTML = Object.entries(THEMES).map(([key, t]) => `
    <div class="theme-card ${key === currentTheme ? 'active' : ''}" data-theme="${key}"
         style="${key === currentTheme ? `border-color: ${t.accent};` : ''}">
      <div class="theme-swatch">
        <span style="background:${t.bg}; border: 1px solid rgba(255,255,255,0.15);"></span>
        <span style="background:${t.accent};"></span>
        <span style="background:${t.accentGlow};"></span>
      </div>
      <div class="theme-name">${t.name}</div>
      <div class="theme-desc">${t.desc}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => applyTheme(card.dataset.theme));
  });
}

const themeModal = document.getElementById('theme-modal');
const themeBtn = document.getElementById('theme-btn');

function openThemeModal() {
  buildThemeGrid();
  if (themeModal) themeModal.style.display = 'flex';
}

function closeThemeModal() {
  if (themeModal) themeModal.style.display = 'none';
}

window.openThemeModal = openThemeModal;
window.closeThemeModal = closeThemeModal;

if (themeBtn) themeBtn.addEventListener('click', openThemeModal);

if (themeModal) {
  themeModal.addEventListener('click', (e) => {
    if (e.target === themeModal || e.target.classList.contains('modal-backdrop')) {
      closeThemeModal();
    }
  });
}

// Apply saved theme on startup
applyTheme(localStorage.getItem('nebulaTheme') || 'nebula');

const maxBtn = document.getElementById('max-btn');

function updateMaxButton(isMaximized) {
  if (maxBtn) {
    maxBtn.textContent = isMaximized ? '❐' : '□';
    maxBtn.title = isMaximized ? 'Restore' : 'Maximize';
  }
}

document.getElementById('min-btn').addEventListener('click', () => window.electronAPI?.minimize());
maxBtn.addEventListener('click', () => window.electronAPI?.maximize());
document.getElementById('close-btn').addEventListener('click', () => window.electronAPI?.close());
document.getElementById('quit-btn').addEventListener('click', () => window.electronAPI?.quit());

// Listen for window state changes
if (window.electronAPI?.onWindowMaximize) {
  window.electronAPI.onWindowMaximize(() => updateMaxButton(true));
}
if (window.electronAPI?.onWindowUnmaximize) {
  window.electronAPI.onWindowUnmaximize(() => updateMaxButton(false));
}

// Check initial state
if (window.electronAPI?.isMaximized) {
  window.electronAPI.isMaximized().then(updateMaxButton);
}

// About modal functionality
const aboutModal = document.getElementById('about-modal');
const aboutBtn = document.getElementById('about-btn');

function openAboutModal() {
  if (aboutModal) {
    aboutModal.style.display = 'flex';
  }
}

function closeAboutModal() {
  if (aboutModal) {
    aboutModal.style.display = 'none';
  }
}

// Expose functions globally for HTML onclick handlers
window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;

if (aboutBtn) {
  aboutBtn.addEventListener('click', openAboutModal);
}

// Close modal when clicking backdrop
if (aboutModal) {
  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal || e.target.classList.contains('modal-backdrop')) {
      closeAboutModal();
    }
  });
}

const content = document.getElementById('content');

async function loadModule(moduleName) {
  content.style.opacity = '0';

  try {
    const response = await fetch(`modules/${moduleName}.html`);
    if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

    const html = await response.text();
    
    const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    const scripts = [];
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      scripts.push({
        src: match[1].match(/src=["']([^"']+)["']/)?.[1] || null,
        content: match[2].trim()
      });
    }
    
    const htmlWithoutScripts = html.replace(scriptRegex, '');
    content.innerHTML = htmlWithoutScripts;

    for (const script of scripts) {
      try {
        if (script.src) {
          const res = await fetch(`modules/${script.src}`);
          if (res.ok) {
            const code = await res.text();
            // Safer alternative to eval - create function in current scope
            const scriptFunction = new Function(code);
            scriptFunction();
          }
        } else if (script.content) {
          // Safer alternative to eval for inline scripts
          const scriptFunction = new Function(script.content);
          scriptFunction();
        }
      } catch (e) {
        console.error(`Failed to execute script: ${script.src || 'inline'}`, e);
        // Continue loading other scripts even if one fails
      }
    }

    localStorage.setItem('nebulaLastModule', moduleName);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.module === moduleName);
    });

    setTimeout(() => {
      content.style.transition = 'opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
      content.style.opacity = '1';
    }, 50);

  } catch (err) {
    console.error(err);
    content.innerHTML = `<div style="color:#ff6b6b; padding:60px; text-align:center;">
      Could not load ${moduleName} module.<br>
      <small style="opacity:0.7;">${err.message}</small>
    </div>`;
  }
}

function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn[data-module]');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      try {
        const moduleName = btn.dataset.module;
        if (!moduleName) return;
        loadModule(moduleName);
      } catch (e) {
        console.error('Navigation error:', e);
        content.innerHTML = `<div style="color:#ff6b6b; padding:60px; text-align:center;">
          Navigation error occurred.<br>
          <small style="opacity:0.7;">${e.message}</small>
        </div>`;
      }
    });
  });

  const lastModule = localStorage.getItem('nebulaLastModule') || 'notepad';
  loadModule(lastModule);
  
  if (window.electronAPI?.onSwitchModule) {
    window.electronAPI.onSwitchModule((module) => {
      loadModule(module);
    });
  }
}

document.addEventListener('DOMContentLoaded', initNavigation);