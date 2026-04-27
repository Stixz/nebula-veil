const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

let mainWindow;
let tray;

function createTray() {
  // Create a simple 16x16 icon using a basic approach
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4); // RGBA
  
  // Fill with transparent background
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 0;     // R
    buffer[i + 1] = 0; // G  
    buffer[i + 2] = 0; // B
    buffer[i + 3] = 0; // A (transparent)
  }
  
  // Draw a purple circle in the center
  const centerX = 8;
  const centerY = 8;
  const radius = 6;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        const index = (y * size + x) * 4;
        buffer[index] = 167;     // R (a78bfa)
        buffer[index + 1] = 139; // G
        buffer[index + 2] = 250; // B
        buffer[index + 3] = 255; // A (opaque)
      }
    }
  }
  
  const icon = nativeImage.createFromBuffer(buffer, { width: size, height: size });
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Nebula Veil', enabled: false },
    { type: 'separator' },
    { label: 'Notepad', click: () => { mainWindow?.webContents.send('switch-module', 'notepad'); mainWindow?.show(); } },
    { label: 'Calculator', click: () => { mainWindow?.webContents.send('switch-module', 'calculator'); mainWindow?.show(); } },
    { label: 'Tasks', click: () => { mainWindow?.webContents.send('switch-module', 'tasks'); mainWindow?.show(); } },
    { label: 'Calendar', click: () => { mainWindow?.webContents.send('switch-module', 'calendar'); mainWindow?.show(); } },
    { label: 'Timer', click: () => { mainWindow?.webContents.send('switch-module', 'timer'); mainWindow?.show(); } },
    { label: 'System Stats', click: () => { mainWindow?.webContents.send('switch-module', 'system-stats'); mainWindow?.show(); } },
    { label: 'Focus Music', click: () => { mainWindow?.webContents.send('switch-module', 'focus-music'); mainWindow?.show(); } },
    { type: 'separator' },
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Minimize to Tray', click: () => mainWindow?.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('Nebula Veil');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow?.show());
}

function getSystemStats() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  let totalIdle = 0, totalTick = 0;
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const cpuUsage = 100 - (100 * totalIdle / totalTick);
  
  const uptime = os.uptime();
  
  let diskTotal = 0;
  let diskUsed = 0;
  
  if (process.platform === 'win32') {
    // Get real disk space from Windows using PowerShell (synchronous)
    try {
      const stdout = execSync('powershell "Get-CimInstance -ClassName Win32_LogicalDisk | Select-Object Size,FreeSpace | ConvertTo-Json"', { encoding: 'utf8' });
      if (stdout) {
        try {
          const disks = JSON.parse(stdout);
          let totalSize = 0;
          let totalFree = 0;
          
          if (Array.isArray(disks)) {
            disks.forEach(disk => {
              if (disk.Size && disk.FreeSpace) {
                totalSize += disk.Size;
                totalFree += disk.FreeSpace;
              }
            });
          } else if (disks.Size && disks.FreeSpace) {
            totalSize = disks.Size;
            totalFree = disks.FreeSpace;
          }
          
          if (totalSize > 0) {
            diskTotal = totalSize;
            diskUsed = totalSize - totalFree;
          }
        } catch (parseError) {
          console.error('Failed to parse disk info:', parseError);
        }
      }
    } catch (e) {
      console.error('Failed to get disk info:', e);
    }
    
    // Fallback if we couldn't get real data
    if (diskTotal === 0) {
      diskTotal = 2 * 1024 * 1024 * 1024 * 1024; // 2TB fallback for dual drives
      diskUsed = diskTotal * 0.5; // 50% usage estimate
    }
  } else {
    // For Unix-like systems, use df command (synchronous)
    try {
      const stdout = execSync('df -k /', { encoding: 'utf8' });
      if (stdout) {
        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          if (parts.length >= 4) {
            diskTotal = parseInt(parts[1]) * 1024; // Convert KB to bytes
            const used = parseInt(parts[2]) * 1024;
            diskUsed = used;
          }
        }
      }
    } catch (e) {
      console.error('Failed to get disk info:', e);
    }
    
    // Fallback for Unix
    if (diskTotal === 0) {
      diskTotal = 500 * 1024 * 1024 * 1024;
      diskUsed = diskTotal * 0.6;
    }
  }
  
  const processes = cpus.slice(0, 1).map((cpu, i) => ({
    name: 'System',
    cpu: cpuUsage / cpus.length,
    mem: usedMem / cpus.length
  }));
  
  return {
    cpu: cpuUsage,
    memUsed: usedMem,
    memTotal: totalMem,
    diskUsed,
    diskTotal,
    uptime: Math.floor(uptime),
    processes
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 1100,
    minHeight: 900,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  ipcMain.on('window-maximize', () => {
    const bounds = mainWindow.getBounds();
    const screen = require('electron').screen.getPrimaryDisplay().workAreaSize;
    const tolerance = 10;
    const fillsScreen = bounds.x <= tolerance && bounds.y <= tolerance &&
                        Math.abs(bounds.width - screen.width) <= tolerance &&
                        Math.abs(bounds.height - screen.height) <= tolerance;
    
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
    } else if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else if (fillsScreen) {
      mainWindow.setSize(1100, 700);
      mainWindow.center();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-minimize', () => mainWindow.minimize());
  ipcMain.on('window-close', () => mainWindow.hide());
  ipcMain.on('window-quit', () => { app.isQuitting = true; app.quit(); });
  
  ipcMain.handle('get-stats', () => getSystemStats());
  ipcMain.handle('window-is-maximized', () => mainWindow.isMaximized() || mainWindow.isFullScreen());

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('window-unmaximized');
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});